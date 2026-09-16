import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import {
  ManagedUser, Department, Role, UserStatus,
  CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangeStatusDto
} from '../../shared/interfaces/user-management.interface';
import { UserRole, Permission } from '../../shared/interfaces/auth.interface';
import {
  ApiWrapper,
  BackendUser, BackendRole, BackendDepartment, BackendPermission,
  BackendRoleUser, UserStats,
  CreateUserBackendDto, PaginatedData
} from '../../shared/interfaces/api-response.interface';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/admin`;

// ─── Permission Groups ────────────────────────────────────────────────────────

export const PERMISSION_GROUPS = [
  {
    module: 'Dashboard', moduleAr: 'لوحة التحكم',
    permissions: [
      { key: 'view:dashboard' as Permission, label: 'View Dashboard', labelAr: 'عرض لوحة التحكم' }
    ]
  },
  {
    module: 'Procurement', moduleAr: 'المشتريات',
    permissions: [
      { key: 'view:procurement' as Permission, label: 'View Procurement', labelAr: 'عرض المشتريات' },
      { key: 'edit:procurement' as Permission, label: 'Create / Edit', labelAr: 'إنشاء / تعديل' },
      { key: 'approve:po' as Permission, label: 'Approve PO', labelAr: 'اعتماد أوامر الشراء' }
    ]
  },
  {
    module: 'Inventory', moduleAr: 'المخازن',
    permissions: [
      { key: 'view:inventory' as Permission, label: 'View Inventory', labelAr: 'عرض المخزون' },
      { key: 'edit:inventory' as Permission, label: 'MRV / MIV / Transfers', labelAr: 'سندات الاستلام والصرف' }
    ]
  },
  {
    module: 'Vendors', moduleAr: 'الموردون',
    permissions: [
      { key: 'view:vendors' as Permission, label: 'View Vendors', labelAr: 'عرض الموردين' },
      { key: 'edit:vendors' as Permission, label: 'Manage Vendors', labelAr: 'إدارة الموردين' }
    ]
  },
  {
    module: 'Finance', moduleAr: 'المالية',
    permissions: [
      { key: 'view:finance' as Permission, label: 'View Finance', labelAr: 'عرض المالية' },
      { key: 'edit:finance' as Permission, label: 'Create Entries', labelAr: 'إنشاء القيود' }
    ]
  },
  {
    module: 'Projects', moduleAr: 'المشاريع',
    permissions: [
      { key: 'view:projects' as Permission, label: 'View Projects', labelAr: 'عرض المشاريع' },
      { key: 'edit:projects' as Permission, label: 'Edit Projects', labelAr: 'تعديل المشاريع' },
      { key: 'approve:projects' as Permission, label: 'Approve Projects', labelAr: 'اعتماد المشاريع' }
    ]
  },
  {
    module: 'Operations', moduleAr: 'العمليات',
    permissions: [
      { key: 'view:rigs' as Permission, label: 'View Rigs', labelAr: 'عرض الحفارات' },
      { key: 'edit:rigs' as Permission, label: 'Edit Rigs', labelAr: 'تعديل الحفارات' },
      { key: 'view:timesheets' as Permission, label: 'View Timesheets', labelAr: 'عرض سجلات الحضور' },
      { key: 'edit:timesheets' as Permission, label: 'Edit Timesheets', labelAr: 'تعديل سجلات الحضور' }
    ]
  },
  {
    module: 'Reports & Settings', moduleAr: 'التقارير والإعدادات',
    permissions: [
      { key: 'view:reports' as Permission, label: 'View Reports', labelAr: 'عرض التقارير' },
      { key: 'view:settings' as Permission, label: 'View Settings', labelAr: 'عرض الإعدادات' },
      { key: 'edit:settings' as Permission, label: 'Edit Settings', labelAr: 'تعديل الإعدادات' }
    ]
  },
  {
    module: 'Vendor Portal', moduleAr: 'بوابة الموردين',
    permissions: [
      { key: 'view:vendor_portal' as Permission, label: 'Access Portal', labelAr: 'الوصول للبوابة' },
      { key: 'submit:vendor_quotation' as Permission, label: 'Submit Quotations', labelAr: 'تقديم عروض الأسعار' }
    ]
  }
];

export const ROLE_ARABIC_NAMES: Record<UserRole, string> = {
  'Super Admin': 'مدير النظام',
  'General Manager': 'المدير العام',
  'Finance Manager': 'مدير المالية',
  'Procurement Manager': 'مدير المشتريات',
  'Operations Manager': 'مدير العمليات',
  'Store Keeper': 'أمين المخزن',
  'Project Manager': 'مدير المشروع',
  'Employee': 'موظف',
  'Safety Officer': 'ضابط السلامة',
  'Vendor': 'مورد'
};

// ─── Adapters: Backend → Frontend ────────────────────────────────────────────

function toManagedUser(u: any): ManagedUser {
  if (!u) return {} as ManagedUser;

  const roleObj = (typeof u.roleId === 'object' && u.roleId !== null) ? u.roleId : null;
  const roleName: string = roleObj?.name ?? (typeof u.role === 'string' ? u.role : (typeof u.roleId === 'string' ? u.roleId : 'Employee'));
  const roleArabicName: string = roleObj?.nameAr ?? u.roleName ?? ROLE_ARABIC_NAMES[roleName as UserRole] ?? roleName;

  const deptObj = (typeof u.departmentId === 'object' && u.departmentId !== null)
    ? u.departmentId
    : ((typeof u.department === 'object' && u.department !== null) ? u.department : null);
  const deptId = deptObj?._id ?? deptObj?.id ?? (typeof u.departmentId === 'string' ? u.departmentId : undefined);

  let perms: Permission[] = [];
  if (Array.isArray(roleObj?.permissions)) {
    perms = roleObj.permissions.map((p: any) => typeof p === 'string' ? p : (p?.name ?? p?.key ?? ''));
  } else if (Array.isArray(u.permissions)) {
    perms = u.permissions;
  }

  const fullName = u.fullName || u.username || '';

  return {
    id:                  u._id ?? u.id ?? '',
    username:            u.username ?? '',
    email:               u.email ?? '',
    fullName:            fullName,
    fullNameAr:          u.fullNameAr ?? fullName,
    role:                (roleName as UserRole) || 'Employee',
    roleName:            roleArabicName,
    departmentId:        deptId,
    department:          deptObj ? {
      id:     deptObj._id ?? deptObj.id ?? '',
      code:   deptObj.code ?? '',
      nameEn: deptObj.nameEn ?? '',
      nameAr: deptObj.nameAr ?? deptObj.nameEn ?? ''
    } : undefined,
    employeeId:          u.employeeId ?? '',
    vendorId:            u.vendorId ?? '',
    companyName:         u.companyName ?? '',
    avatar:              u.avatar || fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'U',
    avatarUrl:           u.avatarUrl ?? undefined,
    status:              (u.status ?? 'Active') as UserStatus,
    preferredLanguage:   (u.preferredLanguage ?? 'ar') as 'ar' | 'en',
    timezone:            u.timezone ?? 'Asia/Riyadh',
    emailNotifications:  u.emailNotifications ?? true,
    mustChangePassword:  u.mustChangePassword ?? false,
    lastLogin:           u.lastLogin,
    createdAt:           u.createdAt,
    permissions:         perms
  };
}

function toRole(r: any): Role {
  if (!r) return {} as Role;
  const name = r.name ?? '';
  return {
    id:          r._id ?? r.id ?? '',
    name:        name as UserRole,
    nameAr:      r.nameAr ?? ROLE_ARABIC_NAMES[name as UserRole] ?? name,
    description: r.description ?? '',
    isSystem:    r.isSystem ?? false,
    usersCount:  r.usersCount ?? 0,
    permissions: Array.isArray(r.permissions)
      ? r.permissions.map((p: any) => typeof p === 'string' ? p : (p?.name ?? p?.key ?? ''))
      : [],
    createdAt:   r.createdAt
  };
}

function toDepartment(d: any): Department {
  if (!d) return {} as Department;
  return {
    id:          d._id ?? d.id ?? '',
    code:        d.code ?? '',
    nameEn:      d.nameEn ?? '',
    nameAr:      d.nameAr ?? d.nameEn ?? '',
    parentId:    (d.parentId as any)?._id ?? (d.parentId as any)?.id ?? d.parentId,
    managerId:   (d.managerId as any)?._id ?? (d.managerId as any)?.id ?? d.managerId,
    managerName: (d.managerId as any)?.fullName ?? (d.managerId as any)?.name,
    usersCount:  d.usersCount ?? 0
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly http  = inject(HttpClient);
  private readonly notif = inject(NotificationService);
  private readonly audit = inject(AuditService);

  // ── Reactive State ───────────────────────────────────────────────────────
  readonly users       = signal<ManagedUser[]>([]);
  readonly roles       = signal<Role[]>([]);
  readonly departments = signal<Department[]>([]);
  /** إحصائيات المستخدمين من /admin/users/stats */
  readonly stats       = signal<UserStats>({ total: 0, active: 0, inactive: 0, suspended: 0, pending: 0 });

  readonly activeCount   = computed(() => {
    const fromStats = this.stats().active;
    if (fromStats > 0) return fromStats;
    return this.users().filter(u => u.status === 'Active').length;
  });

  readonly inactiveCount = computed(() => {
    const fromStats = this.stats().inactive + this.stats().suspended;
    if (fromStats > 0) return fromStats;
    return this.users().filter(u => u.status !== 'Active').length;
  });

  readonly totalCount    = computed(() => {
    const fromStats = this.stats().total;
    if (fromStats > 0) return fromStats;
    return this.users().length;
  });

  // ─── Users Stats ──────────────────────────────────────────────────────────

  /**
   * GET /admin/users/stats
   */
  getUserStats(): Observable<UserStats> {
    return this.http
      .get<any>(`${BASE}/users/stats`)
      .pipe(
        map(res => {
          const s = res?.data ?? res ?? { total: 0, active: 0, inactive: 0, suspended: 0, pending: 0 };
          return s;
        }),
        tap(s => {
          if (s && typeof s.total === 'number') {
            this.stats.set(s);
          }
        }),
        catchError(this._handleError)
      );
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  /**
   * GET /admin/users
   * يدعم كلا الحالتين:
   *   1. wrapper.data كـ مصفوفة مباشرة [BackendUser, ...]
   *   2. wrapper.data كـ كائن ترقيم { data: BackendUser[], meta: {...} }
   *   3. مصفوفة مباشرة بدون تغليف
   */
  getUsers(filter?: {
    search?: string;
    role?: string;
    departmentId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Observable<{ items: ManagedUser[]; total: number; page: number; totalPages: number }> {
    let params = new HttpParams();
    if (filter?.search)       params = params.set('search', filter.search);
    if (filter?.role)         params = params.set('roleId', filter.role);
    if (filter?.departmentId) params = params.set('departmentId', filter.departmentId);
    if (filter?.status)       params = params.set('status', filter.status);
    params = params.set('page',  String(filter?.page  ?? 1));
    params = params.set('limit', String(filter?.limit ?? 50));

    return this.http
      .get<any>(`${BASE}/users`, { params })
      .pipe(
        map(res => {
          let rawList: any[] = [];
          let total = 0;
          let page = Number(filter?.page ?? 1);
          let limit = Number(filter?.limit ?? 50);
          let totalPages = 1;

          if (Array.isArray(res)) {
            rawList = res;
            total = rawList.length;
          } else if (Array.isArray(res?.data)) {
            // الحالة الشائعة في الـ Backend: data هي المصفوفة مباشرة
            rawList = res.data;
            total = res.meta?.total ?? res.total ?? rawList.length;
            page = res.meta?.page ?? res.page ?? page;
            totalPages = res.meta?.totalPages ?? res.totalPages ?? (Math.ceil(total / limit) || 1);
          } else if (res?.data && Array.isArray(res.data.data)) {
            // PaginatedData: data.data = [], data.meta = {}
            rawList = res.data.data;
            const meta = res.data.meta || {};
            total = meta.total ?? rawList.length;
            page = meta.page ?? page;
            totalPages = meta.totalPages ?? (Math.ceil(total / limit) || 1);
          } else if (Array.isArray(res?.items)) {
            rawList = res.items;
            total = res.total ?? rawList.length;
            page = res.page ?? page;
            totalPages = res.totalPages ?? (Math.ceil(total / limit) || 1);
          }

          const items = rawList.map(toManagedUser);
          this.users.set(items);
          return { items, total, page, totalPages };
        }),
        catchError(this._handleError)
      );
  }

  /** GET /admin/users/:id */
  getUserById(id: string): Observable<ManagedUser> {
    return this.http
      .get<ApiWrapper<BackendUser>>(`${BASE}/users/${id}`)
      .pipe(
        map(wrapper => toManagedUser(wrapper.data)),
        catchError(this._handleError)
      );
  }

  /**
   * POST /admin/users
   * الـ Frontend يُرسل roleId (ObjectId) ليس اسم الدور
   * الـ Backend يولّد الباسورد تلقائياً إذا لم يُرسَل password
   */
  createUser(dto: CreateUserDto, roleId: string): Observable<ManagedUser> {
    const body: CreateUserBackendDto = {
      username:          dto.username,
      email:             dto.email,
      fullName:          dto.fullName,
      fullNameAr:        dto.fullNameAr,
      roleId,                                    // ObjectId من الـ roles signal
      departmentId:      dto.departmentId,
      employeeId:        dto.employeeId,
      password:          dto.temporaryPassword,  // اسم الحقل في الـ Backend
      preferredLanguage: dto.preferredLanguage,
      status:            'Active'
    };

    return this.http
      .post<ApiWrapper<BackendUser>>(`${BASE}/users`, body)
      .pipe(
        map(wrapper => toManagedUser(wrapper.data)),
        tap(user => {
          this.users.update(list => [user, ...list]);
          // حدّث الإحصائيات
          this.stats.update(s => ({ ...s, total: s.total + 1, active: s.active + 1 }));
          this.audit.log('Create', 'Admin', 'User', user.id, undefined, user.fullName, `Created: ${user.username}`);
        }),
        catchError(this._handleError)
      );
  }

  /** PATCH /admin/users/:id */
  updateUser(id: string, dto: UpdateUserDto): Observable<ManagedUser> {
    return this.http
      .patch<ApiWrapper<BackendUser>>(`${BASE}/users/${id}`, dto)
      .pipe(
        map(wrapper => toManagedUser(wrapper.data)),
        tap(updated => {
          this.users.update(list => list.map(u => u.id === id ? updated : u));
          this.audit.log('Update', 'Admin', 'User', id, undefined, JSON.stringify(dto), `Updated: ${updated.username}`);
        }),
        catchError(this._handleError)
      );
  }

  /** PATCH /admin/users/:id/role */
  changeUserRole(id: string, roleId: string): Observable<ManagedUser> {
    return this.http
      .patch<ApiWrapper<{ message: string; user: BackendUser }>>(`${BASE}/users/${id}/role`, { roleId })
      .pipe(
        map(wrapper => toManagedUser(wrapper.data.user)),
        tap(updated => this.users.update(list => list.map(u => u.id === id ? updated : u))),
        catchError(this._handleError)
      );
  }

  /**
   * PATCH /admin/users/:id/status
   * ✅ TASK 8: يقبل suspendUntil الآن
   * ✅ TASK 6: الـ Backend يمنع تعطيل آخر Super Admin (يرجع 400)
   */
  changeUserStatus(id: string, dto: ChangeStatusDto): Observable<ManagedUser> {
    const body: { status: string; reason?: string; suspendUntil?: string } = {
      status: dto.status,
      reason: dto.reason
    };
    // ✅ TASK 8: أضف suspendUntil إذا موجود وهناك تعليق
    if (dto.status === 'Suspended' && (dto as any).suspendUntil) {
      body['suspendUntil'] = (dto as any).suspendUntil;
    }

    return this.http
      .patch<ApiWrapper<{ message: string; user: BackendUser }>>(`${BASE}/users/${id}/status`, body)
      .pipe(
        map(wrapper => toManagedUser(wrapper.data.user)),
        tap(updated => this.users.update(list => list.map(u => u.id === id ? updated : u))),
        catchError(this._handleError)
      );
  }

  /**
   * POST /admin/users/:id/reset-password
   * ✅ الـ Body فارغ — الباسورد تُولَّد تلقائياً وتُرسَل بالبريد
   */
  resetPassword(id: string, _dto?: ResetPasswordDto): Observable<boolean> {
    return this.http
      .post<ApiWrapper<{ message: string }>>(`${BASE}/users/${id}/reset-password`, {})
      .pipe(
        map(() => true),
        tap(() => this.audit.log('Update', 'Admin', 'User', id, 'Password', 'Reset', 'Password reset by admin')),
        catchError(this._handleError)
      );
  }

  /**
   * DELETE /admin/users/:id (Soft Delete → status = Inactive)
   * ✅ TASK 6: الـ Backend يمنع حذف آخر Super Admin (يرجع 400)
   */
  deleteUser(id: string): Observable<boolean> {
    return this.http
      .delete<ApiWrapper<{ message: string }>>(`${BASE}/users/${id}`)
      .pipe(
        map(() => true),
        tap(() => {
          this.users.update(list => list.filter(u => u.id !== id));
          this.stats.update(s => ({ ...s, total: s.total - 1, active: Math.max(0, s.active - 1) }));
          this.audit.log('Delete', 'Admin', 'User', id, undefined, undefined, 'User deactivated');
        }),
        catchError(this._handleError)
      );
  }

  // ─── Roles ───────────────────────────────────────────────────────────────

  /**
   * GET /admin/roles
   * ✅ TASK 4: كل دور يحتوي على usersCount من الـ Backend
   */
  getRoles(): Observable<Role[]> {
    return this.http
      .get<any>(`${BASE}/roles`)
      .pipe(
        map(res => {
          const list: any[] = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          return list.map(toRole);
        }),
        tap(roles => this.roles.set(roles)),
        catchError(this._handleError)
      );
  }

  /** GET /admin/roles/permissions */
  getAllPermissions(): Observable<BackendPermission[]> {
    return this.http
      .get<any>(`${BASE}/roles/permissions`)
      .pipe(
        map(res => Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])),
        catchError(this._handleError)
      );
  }

  /** GET /admin/roles/:id */
  getRoleById(id: string): Observable<Role> {
    return this.http
      .get<any>(`${BASE}/roles/${id}`)
      .pipe(
        map(res => toRole(res?.data ?? res)),
        catchError(this._handleError)
      );
  }

  /**
   * ✅ TASK 2: GET /admin/roles/:id/users
   * يُرجع قائمة المستخدمين المعيّنين لدور معين
   */
  getRoleUsers(roleId: string): Observable<BackendRoleUser[]> {
    return this.http
      .get<any>(`${BASE}/roles/${roleId}/users`)
      .pipe(
        map(res => Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])),
        catchError(this._handleError)
      );
  }

  // ─── Departments ─────────────────────────────────────────────────────────

  /**
   * GET /admin/departments
   * ✅ TASK 3: كل قسم يحتوي على usersCount من الـ Backend
   */
  getDepartments(): Observable<Department[]> {
    return this.http
      .get<any>(`${BASE}/departments`)
      .pipe(
        map(res => {
          const list: any[] = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          return list.map(toDepartment);
        }),
        tap(depts => this.departments.set(depts)),
        catchError(this._handleError)
      );
  }

  /** POST /admin/departments */
  createDepartment(dept: Partial<Department>): Observable<Department> {
    const body = { code: dept.code, nameEn: dept.nameEn, nameAr: dept.nameAr, parentId: dept.parentId, managerId: dept.managerId };
    return this.http
      .post<ApiWrapper<BackendDepartment>>(`${BASE}/departments`, body)
      .pipe(
        map(wrapper => toDepartment(wrapper.data)),
        tap(d => this.departments.update(list => [...list, d])),
        catchError(this._handleError)
      );
  }

  /**
   * PATCH /admin/departments/:id
   * ⚠️ code لا يمكن تعديله — يُحذف من الـ body تلقائياً
   * ✅ TASK 7: الـ Backend يمنع الحذف إذا فيه موظفون (يرجع 400 + usersCount)
   */
  updateDepartment(id: string, dto: Partial<Department>): Observable<Department> {
    const { code: _omit, ...body } = dto as any;
    return this.http
      .patch<ApiWrapper<BackendDepartment>>(`${BASE}/departments/${id}`, body)
      .pipe(
        map(wrapper => toDepartment(wrapper.data)),
        tap(d => this.departments.update(list => list.map(dep => dep.id === id ? d : dep))),
        catchError(this._handleError)
      );
  }

  /** DELETE /admin/departments/:id */
  deleteDepartment(id: string): Observable<boolean> {
    return this.http
      .delete<ApiWrapper<{ message: string }>>(`${BASE}/departments/${id}`)
      .pipe(
        map(() => true),
        tap(() => this.departments.update(list => list.filter(d => d.id !== id))),
        catchError(this._handleError)
      );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  getPermissionGroups() { return PERMISSION_GROUPS; }
  getRoleArabicName(role: UserRole): string { return ROLE_ARABIC_NAMES[role]; }

  private _handleError(err: HttpErrorResponse): Observable<never> {
    // يستخرج الرسالة من AllExceptionsFilter: { success: false, statusCode, message }
    const message = err.error?.message ?? err.message ?? 'Server error';
    return throwError(() => new Error(message));
  }
}
