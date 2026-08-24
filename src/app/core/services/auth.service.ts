import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, EMPTY } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

import { User, UserRole, Permission } from '../../shared/interfaces/auth.interface';
import { AuditService } from './audit.service';
import {
  ApiWrapper,
  LoginResponseDto,
  MeResponseDto,
  RefreshTokenResponseDto,
  TOKEN_KEYS
} from '../../shared/interfaces/api-response.interface';
import { environment } from '../../../environments/environment';

const BASE = environment.apiUrl;

// ─── Adapter: Backend user → Frontend User ────────────────────────────────────
function toUser(dto: MeResponseDto | LoginResponseDto['user'], token: string): User {
  return {
    id:                  (dto as any)._id ?? (dto as any).id ?? '',
    username:            dto.username,
    email:               dto.email,
    fullName:            dto.fullName,
    role:                dto.role as UserRole,
    permissions:         (dto.permissions ?? []) as Permission[],
    lastLogin:           dto.lastLogin,
    avatar:              dto.avatar,
    preferredLanguage:   dto.preferredLanguage,
    timezone:            dto.timezone,
    emailNotifications:  (dto as MeResponseDto).emailNotifications,
    token
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly audit  = inject(AuditService);

  // ── Reactive State ───────────────────────────────────────────────────────
  readonly currentUser      = signal<User | null>(null);
  readonly isAuthenticated  = computed(() => this.currentUser() !== null);
  readonly userRole         = computed(() => this.currentUser()?.role ?? null);
  readonly userPermissions  = computed(() => this.currentUser()?.permissions ?? []);
  /** ✅ TASK 5: mustChangePassword signal — يُستخدم لعرض تنبيه/redirect */
  readonly mustChangePassword = signal<boolean>(false);

  constructor() {
    this.checkSession();
  }

  // ── 1. LOGIN ─────────────────────────────────────────────────────────────
  /**
   * loginRaw — يُرسل بيانات الدخول ويخزّن التوكن ويُعيد كائن User
   * الـ Response مغلّف: ApiWrapper<LoginResponseDto>
   *   → res.data.accessToken, res.data.refreshToken, res.data.user
   */
  loginRaw(username: string, password: string, rememberMe: boolean): Observable<User> {
    return this.http
      .post<ApiWrapper<LoginResponseDto>>(`${BASE}/auth/login`, { username, password, rememberMe })
      .pipe(
        tap(wrapper => {
          const res = wrapper.data; // ← انزع الـ wrapper
          const user = toUser(res.user, res.accessToken);
          this.currentUser.set(user);
          this._storeTokens(res.accessToken, rememberMe, res.refreshToken);
          // ✅ TASK 5: حفظ mustChangePassword ليُستخدم في التوجيه
          this.mustChangePassword.set(res.user.mustChangePassword ?? false);
          this.audit.log('Login', 'Auth', 'Session', user.id, 'Logged Out', 'Logged In', 'Authenticated successfully');
        }),
        map(wrapper => toUser(wrapper.data.user, wrapper.data.accessToken)),
        catchError(this._handleError.bind(this))
      );
  }

  // Keep old name for backward compatibility
  login = this.loginRaw.bind(this);

  // ── 2. LOGOUT ────────────────────────────────────────────────────────────
  logout(): void {
    const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH)
                      || sessionStorage.getItem(TOKEN_KEYS.REFRESH);
    const current = this.currentUser();

    if (refreshToken) {
      this.http.post(`${BASE}/auth/logout`, { refreshToken }).subscribe({
        error: () => { /* ignore */ }
      });
    }

    if (current) {
      this.audit.log('Logout', 'Auth', 'Session', current.id, 'Session Active', 'Logged Out', 'Session terminated');
    }

    this._clearTokens();
    this.currentUser.set(null);
    this.mustChangePassword.set(false);
    this.router.navigate(['/login']);
  }

  // ── 3. FORGOT PASSWORD ───────────────────────────────────────────────────
  forgotPassword(email: string): Observable<boolean> {
    return this.http
      .post<ApiWrapper<{ message: string }>>(`${BASE}/auth/forgot-password`, { email })
      .pipe(
        map(() => true),
        catchError(this._handleError.bind(this))
      );
  }

  // ── 4. RESET PASSWORD ────────────────────────────────────────────────────
  // الـ Backend لا يقبل confirmPassword — التحقق يتم في الـ Frontend
  resetPassword(token: string, newPassword: string): Observable<boolean> {
    return this.http
      .post<ApiWrapper<{ message: string }>>(`${BASE}/auth/reset-password`, { token, newPassword })
      .pipe(
        map(() => true),
        catchError(this._handleError.bind(this))
      );
  }

  // ── 5. REFRESH TOKEN ─────────────────────────────────────────────────────
  // ⚠️ المسار: /auth/refresh (ليس /auth/refresh-token)
  refreshAccessToken(): Observable<string> {
    const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH)
                      || sessionStorage.getItem(TOKEN_KEYS.REFRESH);
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    const rememberMe = !!localStorage.getItem(TOKEN_KEYS.REFRESH);

    return this.http
      .post<ApiWrapper<RefreshTokenResponseDto>>(`${BASE}/auth/refresh`, { refreshToken })
      .pipe(
        tap(wrapper => this._storeTokens(wrapper.data.accessToken, rememberMe, wrapper.data.refreshToken)),
        map(wrapper => wrapper.data.accessToken),
        catchError(() => {
          this.logout();
          return EMPTY;
        })
      );
  }

  // ── 6. GET CURRENT USER (session restore) ────────────────────────────────
  fetchMe(): Observable<User> {
    return this.http
      .get<ApiWrapper<MeResponseDto>>(`${BASE}/auth/me`)
      .pipe(
        map(wrapper => {
          const dto = wrapper.data; // ← انزع الـ wrapper
          const token = localStorage.getItem(TOKEN_KEYS.ACCESS)
                     || sessionStorage.getItem(TOKEN_KEYS.ACCESS)
                     || '';
          return toUser(dto, token);
        }),
        tap(user => {
          this.currentUser.set(user);
        }),
        catchError((err) => {
          // Clear session ONLY if server explicitly rejects token with 401 Unauthorized
          if (err?.status === 401) {
            this._clearTokens();
            this.currentUser.set(null);
          }
          return EMPTY;
        })
      );
  }

  // ── 7. CHANGE PASSWORD ────────────────────────────────────────────────────
  // ⚠️ المسار: /auth/me/password (ليس /auth/change-password)
  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<boolean> {
    return this.http
      .patch<ApiWrapper<{ message: string }>>(`${BASE}/auth/me/password`, {
        currentPassword,
        newPassword,
        confirmPassword
      })
      .pipe(
        map(() => true),
        tap(() => {
          // الـ Backend يُلغي كل الـ Refresh Tokens → يجب إعادة الدخول
          this._clearTokens();
        }),
        catchError(this._handleError.bind(this))
      );
  }

  // ── 8. UPDATE PROFILE ────────────────────────────────────────────────────
  // ⚠️ المسار: /auth/me/profile (ليس /auth/profile)
  // الـ Response مغلّف: ApiWrapper<MeResponseDto>
  //   → res.data = updated user object (مباشرة بدون data.data)
  updateProfile(fields: {
    fullName?: string;
    fullNameAr?: string;
    preferredLanguage?: string;
    timezone?: string;
    emailNotifications?: boolean;
  }): Observable<User> {
    return this.http
      .patch<ApiWrapper<MeResponseDto>>(`${BASE}/auth/me/profile`, fields)
      .pipe(
        map(wrapper => {
          const dto = wrapper.data; // ← المستخدم المحدّث مباشرة في data
          const token = localStorage.getItem(TOKEN_KEYS.ACCESS)
                     || sessionStorage.getItem(TOKEN_KEYS.ACCESS)
                     || '';
          return toUser(dto, token);
        }),
        tap(user => {
          this.currentUser.set(user);
          this.audit.log('Update', 'Settings', 'Profile', user.id, '', JSON.stringify(fields), 'Profile updated');
        }),
        catchError(this._handleError.bind(this))
      );
  }

  // ── RBAC Helpers ─────────────────────────────────────────────────────────
  hasPermission(permission: Permission): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === 'Super Admin' || user.role === 'General Manager') return true;
    return (user.permissions ?? []).includes(permission);
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const role = this.userRole();
    return role ? roles.includes(role) : false;
  }

  getRememberedUsername(): string | null {
    return localStorage.getItem(TOKEN_KEYS.REMEMBER);
  }

  // ── Private: Session Restore on App Load ─────────────────────────────────
  private checkSession(): void {
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS)
               || sessionStorage.getItem(TOKEN_KEYS.ACCESS);
    if (!token) return;

    // فحص انتهاء صلاحية الـ JWT بدون network call
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const isExpired = payload.exp && payload.exp < Math.floor(Date.now() / 1000);
        if (isExpired) {
          this._clearTokens();
          return;
        }

        // ✅ Synchronously set currentUser from token payload so auth guards pass immediately on load/refresh
        const initialUser: User = {
          id:                  payload.sub ?? payload.id ?? '',
          username:            payload.username ?? 'admin',
          email:               payload.email ?? '',
          fullName:            payload.fullName ?? payload.username ?? 'User',
          role:                (payload.role ?? 'Super Admin') as UserRole,
          permissions:         (payload.permissions ?? []) as Permission[],
          token
        };
        this.currentUser.set(initialUser);
      }
    } catch { /* invalid token format */ }

    // جلب بيانات المستخدم المحدثة من الـ Backend
    this.fetchMe().subscribe({ error: () => {} });
  }

  // ── Private: Token Storage ────────────────────────────────────────────────
  private _storeTokens(accessToken: string, rememberMe: boolean, refreshToken?: string): void {
    // Store tokens in BOTH localStorage and sessionStorage so refresh/tabs never lose authentication
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    sessionStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    if (refreshToken) {
      localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
      sessionStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
    }
    if (this.currentUser()) {
      localStorage.setItem(TOKEN_KEYS.REMEMBER, this.currentUser()!.username);
    }
  }

  private _clearTokens(): void {
    [TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  }

  // ── Private: Error Handler ────────────────────────────────────────────────
  // يستخرج رسالة الخطأ من شكل AllExceptionsFilter: { success: false, statusCode, message }
  private _handleError(err: HttpErrorResponse): Observable<never> {
    const message = err.error?.message ?? err.message ?? 'Unknown error';
    return throwError(() => new Error(message));
  }

  // ── Vendor registration (kept for compatibility) ──────────────────────────
  registerVendorUser(_u: string, _p: string, _c: string, _n: string, _e: string, _v: string): void {
    console.warn('registerVendorUser: not yet integrated with backend');
  }
}
