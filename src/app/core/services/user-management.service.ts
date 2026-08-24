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

function toManagedUser(u: BackendUser): ManagedUser {
  return {
    id:                  u._id,
    username:            u.username,
    email:               u.email,
    fullName:            u.fullName,
    fullNameAr:          u.fullNameAr,
    role:                (u.roleId?.name ?? 'Employee') as UserRole,
    roleName:            u.roleId?.nameAr,
    departmentId:        u.departmentId?._id,
    department:          u.departmentId ? {
      id:     u.departmentId._id,
      code:   u.departmentId.code,
      nameEn: u.departmentId.nameEn,
      nameAr: u.departmentId.nameAr
    } : undefined,
    employeeId:          u.employeeId,
    avatar:              u.avatar,
    avatarUrl:           u.avatarUrl ?? undefined,
    status:              u.status as UserStatus,
    preferredLanguage:   u.preferredLanguage as 'ar' | 'en',
    timezone:            u.timezone,
    emailNotifications:  u.emailNotifications,
    mustChangePassword:  u.mustChangePassword,
    lastLogin:           u.lastLogin,
    createdAt:           u.createdAt,
    permissions:         (u.roleId?.permissions ?? []) as Permission[]
  };
}

function toRole(r: BackendRole): Role {
  return {
    id:          r._id,
    name:        r.name as UserRole,
    nameAr:      r.nameAr ?? ROLE_ARABIC_NAMES[r.name as UserRole] ?? r.name,
    description: r.description ?? '',
    isSystem:    r.isSystem,
    usersCount:  r.usersCount ?? 0, // ✅ TASK 4 — يأتي من الـ Backend الآن
    permissions: r.permissions.map((p: BackendPermission) => p.name as Permission),
    createdAt:   r.createdAt
  };
}

function toDepartment(d: BackendDepartment): Department {
  return {
    id:          d._id,
    code:        d.code,
    nameEn:      d.nameEn,
    nameAr:      d.nameAr,
    parentId:    (d.parentId as any)?._id ?? d.parentId as any,
    managerId:   (d.managerId as any)?._id ?? d.managerId as any,
    managerName: (d.managerId as any)?.fullName,
    usersCount:  d.usersCount ?? 0  // ✅ TASK 3 — يأتي من الـ Backend الآن
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
  /** ✅ TASK 1 — إحصائيات المستخدمين من /admin/users/stats */
  readonly stats       = signal<UserStats>({ total: 0, active: 0, inactive: 0, suspended: 0, pending: 0 });

  readonly activeCount   = computed(() => this.stats().active);
  readonly inactiveCount = computed(() => this.stats().inactive + this.stats().suspended);
  readonly totalCount    = computed(() => this.stats().total);

  // ─── ✅ TASK 1: Users Stats ────────────────────────────────────────────

  /**
   * GET /admin/users/stats
   * يُرجع { total, active, inactive, suspended, pending }
   * مسجَّل قبل /:id في الـ Backend لتجنب التعارض
   */
  getUserStats(): Observable<UserStats> {
    return this.http
      .get<ApiWrapper<UserStats>>(`${BASE}/users/stats`)
      .pipe(
        map(wrapper => wrapper.data),
        tap(s => this.stats.set(s)),
        catchError(this._handleError)
      );
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  /**
   * GET /admin/users
   * الـ Response مغلّف: ApiWrapper<PaginatedData<BackendUser>>
   *   → wrapper.data.data = المصفوفة
   *   → wrapper.data.meta = { total, page, limit, totalPages }
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
      .get<ApiWrapper<PaginatedData<BackendUser>>>(`${BASE}/users`, { params })
      .pipe(
        map(wrapper => {
          const paginated = wrapper.data;           // { data: [], meta: {} }
          const items = paginated.data.map(toManagedUser);
          this.users.set(items);
          return {
            items,
            total:      paginated.meta.total,
            page:       paginated.meta.page,
            totalPages: paginated.meta.totalPages
          };
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
      .get<ApiWrapper<BackendRole[]>>(`${BASE}/roles`)
      .pipe(
        map(wrapper => wrapper.data.map(toRole)),
        tap(roles => this.roles.set(roles)),
        catchError(this._handleError)
      );
  }

  /** GET /admin/roles/permissions */
  getAllPermissions(): Observable<BackendPermission[]> {
    return this.http
      .get<ApiWrapper<BackendPermission[]>>(`${BASE}/roles/permissions`)
      .pipe(
        map(wrapper => wrapper.data),
        catchError(this._handleError)
      );
  }

  /** GET /admin/roles/:id */
  getRoleById(id: string): Observable<Role> {
    return this.http
      .get<ApiWrapper<BackendRole>>(`${BASE}/roles/${id}`)
      .pipe(
        map(wrapper => toRole(wrapper.data)),
        catchError(this._handleError)
      );
  }

  /**
   * ✅ TASK 2: GET /admin/roles/:id/users
   * يُرجع قائمة المستخدمين المعيّنين لدور معين
   */
  getRoleUsers(roleId: string): Observable<BackendRoleUser[]> {
    return this.http
      .get<ApiWrapper<BackendRoleUser[]>>(`${BASE}/roles/${roleId}/users`)
      .pipe(
        map(wrapper => wrapper.data),
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
      .get<ApiWrapper<BackendDepartment[]>>(`${BASE}/departments`)
      .pipe(
        map(wrapper => wrapper.data.map(toDepartment)),
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
