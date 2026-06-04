import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, UserRole, Permission } from '../../shared/interfaces/auth.interface';
import { AuditService } from './audit.service';

// Mapping roles to their allowed permissions
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Super Admin': [
    'view:dashboard',
    'view:procurement',
    'edit:procurement',
    'approve:po',
    'view:inventory',
    'edit:inventory',
    'view:vendors',
    'edit:vendors',
    'view:rigs',
    'edit:rigs',
    'view:timesheets',
    'edit:timesheets',
    'view:reports',
    'view:settings',
    'edit:settings'
  ],
  'General Manager': [
    'view:dashboard',
    'view:procurement',
    'edit:procurement',
    'approve:po',
    'view:inventory',
    'edit:inventory',
    'view:vendors',
    'edit:vendors',
    'view:rigs',
    'edit:rigs',
    'view:timesheets',
    'edit:timesheets',
    'view:reports',
    'view:settings'
  ],
  'Finance Manager': [
    'view:dashboard',
    'view:procurement',
    'approve:po',
    'view:reports',
    'view:settings'
  ],
  'Procurement Manager': [
    'view:dashboard',
    'view:procurement',
    'edit:procurement',
    'view:vendors',
    'edit:vendors',
    'view:reports'
  ],
  'Operations Manager': [
    'view:dashboard',
    'view:rigs',
    'edit:rigs',
    'view:timesheets',
    'edit:timesheets',
    'view:reports'
  ],
  'Store Keeper': [
    'view:dashboard',
    'view:inventory',
    'edit:inventory'
  ],
  'Project Manager': [
    'view:dashboard',
    'view:rigs',
    'view:timesheets',
    'edit:timesheets'
  ],
  'Employee': [
    'view:dashboard',
    'view:timesheets'
  ]
};

// Simulated mock database of users
const MOCK_USERS: Record<string, Omit<User, 'token'>> = {
  admin: {
    id: 'u-1',
    username: 'admin',
    email: 'admin.super@petroflow.com',
    fullName: 'Alex Davidson',
    role: 'Super Admin',
    permissions: ROLE_PERMISSIONS['Super Admin'],
    lastLogin: '2026-06-03T18:45:00Z',
    avatar: 'AD',
    companyName: 'PetroFlow Global Services',
    preferredLanguage: 'en',
    timezone: 'UTC-5',
    emailNotifications: true
  },
  gm: {
    id: 'u-2',
    username: 'gm',
    email: 'gm.management@petroflow.com',
    fullName: 'Marcus Aurelius',
    role: 'General Manager',
    permissions: ROLE_PERMISSIONS['General Manager'],
    lastLogin: '2026-06-03T20:10:00Z',
    avatar: 'MA',
    companyName: 'PetroFlow Global Services',
    preferredLanguage: 'en',
    timezone: 'UTC-6',
    emailNotifications: true
  },
  finance: {
    id: 'u-3',
    username: 'finance',
    email: 'finance.lead@petroflow.com',
    fullName: 'Sophia Sterling',
    role: 'Finance Manager',
    permissions: ROLE_PERMISSIONS['Finance Manager'],
    lastLogin: '2026-06-03T15:30:00Z',
    avatar: 'SS',
    companyName: 'PetroFlow Global Services',
    preferredLanguage: 'en',
    timezone: 'UTC-5',
    emailNotifications: true
  },
  procurement: {
    id: 'u-4',
    username: 'procurement',
    email: 'procurement.manager@petroflow.com',
    fullName: 'Frank Jones',
    role: 'Procurement Manager',
    permissions: ROLE_PERMISSIONS['Procurement Manager'],
    lastLogin: '2026-06-03T21:12:00Z',
    avatar: 'FJ',
    companyName: 'PetroFlow Global Services',
    preferredLanguage: 'en',
    timezone: 'UTC-5',
    emailNotifications: true
  },
  operations: {
    id: 'u-5',
    username: 'operations',
    email: 'ops.lead@petroflow.com',
    fullName: 'Robert Vance',
    role: 'Operations Manager',
    permissions: ROLE_PERMISSIONS['Operations Manager'],
    lastLogin: '2026-06-03T19:20:00Z',
    avatar: 'RV',
    companyName: 'PetroFlow Global Services',
    preferredLanguage: 'en',
    timezone: 'UTC-6',
    emailNotifications: false
  },
  store: {
    id: 'u-6',
    username: 'store',
    email: 'storekeeper@petroflow.com',
    fullName: 'Jim Halpert',
    role: 'Store Keeper',
    permissions: ROLE_PERMISSIONS['Store Keeper'],
    lastLogin: '2026-06-02T08:00:00Z',
    avatar: 'JH',
    companyName: 'PetroFlow Global Services',
    preferredLanguage: 'en',
    timezone: 'UTC-5',
    emailNotifications: true
  },
  project: {
    id: 'u-7',
    username: 'project',
    email: 'pm.rigs@petroflow.com',
    fullName: 'Sarah Jenkins',
    role: 'Project Manager',
    permissions: ROLE_PERMISSIONS['Project Manager'],
    lastLogin: '2026-06-03T11:00:00Z',
    avatar: 'SJ',
    companyName: 'PetroFlow Global Services',
    preferredLanguage: 'en',
    timezone: 'UTC-6',
    emailNotifications: true
  },
  employee: {
    id: 'u-8',
    username: 'employee',
    email: 'crew.member@petroflow.com',
    fullName: 'Sven Larson',
    role: 'Employee',
    permissions: ROLE_PERMISSIONS['Employee'],
    lastLogin: '2026-06-03T07:15:00Z',
    avatar: 'SL',
    companyName: 'PetroFlow Global Services',
    preferredLanguage: 'en',
    timezone: 'UTC-6',
    emailNotifications: false
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // --- SIGNALS FOR REACTIVE AUTH STATE ---
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userRole = computed(() => this.currentUser()?.role || null);
  readonly userPermissions = computed(() => this.currentUser()?.permissions || []);

  private readonly AUTH_TOKEN_KEY = 'petroflow_auth_token';
  private readonly REMEMBERED_USER_KEY = 'petroflow_remembered_username';
  private readonly injector = inject(Injector);

  constructor(private router: Router) {
    this.checkSession();
  }

  // --- MOCK AUTHENTICATION ACTION ---
  login(username: string, password: string, rememberMe: boolean): Observable<User> {
    const sanitizedUsername = username.trim().toLowerCase();
    const matchedUser = MOCK_USERS[sanitizedUsername];

    // Standard mock credentials validation (username = role key, password = key + '123' or 'admin123' etc.)
    const expectedPassword = sanitizedUsername === 'procurement' ? 'procure123' 
                           : sanitizedUsername === 'operations' ? 'ops123' 
                           : sanitizedUsername === 'employee' ? 'emp123'
                           : `${sanitizedUsername}123`;

    if (!matchedUser || password !== expectedPassword) {
      return throwError(() => new Error('Invalid username or password. Try: admin/admin123, procurement/procure123, etc.'));
    }

    // Generate a JWT-like Token (Header.Payload.Signature)
    const tokenPayload = {
      sub: matchedUser.id,
      username: matchedUser.username,
      role: matchedUser.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
    };
    
    // Simulating token encoding
    const encodedHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = btoa(JSON.stringify(tokenPayload));
    const mockToken = `${encodedHeader}.${encodedPayload}.mock_signature_sec`;

    const userWithToken: User = {
      ...matchedUser,
      token: mockToken,
      lastLogin: new Date().toISOString()
    };

    return of(userWithToken).pipe(
      delay(800), // Simulate API Latency
      tap(user => {
        this.currentUser.set(user);
        
        // Save to appropriate storage
        if (rememberMe) {
          localStorage.setItem(this.AUTH_TOKEN_KEY, mockToken);
          localStorage.setItem(this.REMEMBERED_USER_KEY, user.username);
        } else {
          sessionStorage.setItem(this.AUTH_TOKEN_KEY, mockToken);
          localStorage.removeItem(this.REMEMBERED_USER_KEY);
        }

        // Log action in audit trail
        try {
          this.injector.get(AuditService).log(
            'Login',
            'Auth',
            'Session',
            user.id,
            'Logged Out',
            'Logged In',
            `User authenticated successfully from workplace IP.`
          );
        } catch (e) {
          console.error(e);
        }
      })
    );
  }

  // --- LOGOUT ACTION ---
  logout(): void {
    const current = this.currentUser();
    if (current) {
      try {
        this.injector.get(AuditService).log(
          'Logout',
          'Auth',
          'Session',
          current.id,
          'Session Active',
          'Logged Out',
          `Session terminated securely by user signout.`
        );
      } catch (e) {
        console.error(e);
      }
    }

    this.currentUser.set(null);
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    sessionStorage.removeItem(this.AUTH_TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  // --- FORGOT PASSWORD UI ACTION ---
  forgotPassword(email: string): Observable<boolean> {
    // Validate if the email exists in mock DB
    const emailExists = Object.values(MOCK_USERS).some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!emailExists) {
      return throwError(() => new Error('This email address is not registered in our system.'));
    }
    return of(true).pipe(
      delay(1000),
      tap(() => {
        try {
          this.injector.get(AuditService).log(
            'Status Change',
            'Auth',
            'Session',
            'forgot-pass',
            'Active Password',
            'Reset Token Dispatched',
            `Password recovery link triggered for email: ${email}`
          );
        } catch (e) {}
      })
    );
  }

  // --- PROFILE UPDATE ACTION ---
  updateProfile(updatedFields: Partial<User>): void {
    const current = this.currentUser();
    if (current) {
      const updatedUser = { ...current, ...updatedFields };
      
      try {
        this.injector.get(AuditService).log(
          'Update',
          'Settings',
          'Profile',
          current.id,
          JSON.stringify({ fullName: current.fullName, companyName: current.companyName, timezone: current.timezone }),
          JSON.stringify({ fullName: updatedUser.fullName, companyName: updatedUser.companyName, timezone: updatedUser.timezone }),
          `Account information updated for user profile.`
        );
      } catch (e) {
        console.error(e);
      }

      this.currentUser.set(updatedUser);
      
      // Update our Mock User DB to persist configuration changes across routing
      if (MOCK_USERS[current.username]) {
        MOCK_USERS[current.username] = {
          ...MOCK_USERS[current.username],
          ...updatedFields
        };
      }
    }
  }

  // --- RBAC & PERMISSION CHECKS ---
  hasPermission(permission: Permission): boolean {
    const permissions = this.userPermissions();
    return permissions.includes(permission);
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const role = this.userRole();
    if (!role) return false;
    return roles.includes(role);
  }

  getRememberedUsername(): string | null {
    return localStorage.getItem(this.REMEMBERED_USER_KEY);
  }

  // --- SESSION CHECK ON INITIATION ---
  private checkSession(): void {
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY) || sessionStorage.getItem(this.AUTH_TOKEN_KEY);
    if (!token) return;

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decodedPayload = JSON.parse(atob(parts[1]));
        
        // Expiration check
        if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
          // Token expired
          this.logout();
          return;
        }

        // Fetch user from DB based on token sub (userId)
        const matchedUser = Object.values(MOCK_USERS).find(u => u.id === decodedPayload.sub);
        if (matchedUser) {
          this.currentUser.set({
            ...matchedUser,
            token
          });
        }
      }
    } catch (e) {
      console.error('Invalid session token format', e);
      this.logout();
    }
  }
}
