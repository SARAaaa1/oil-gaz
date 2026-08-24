import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { BreadcrumbService }     from '../../../../core/services/breadcrumb.service';
import { NotificationService }   from '../../../../core/services/notification.service';
import { UserManagementService } from '../../../../core/services/user-management.service';
import { AuthService }           from '../../../../core/services/auth.service';
import { EmptyStateComponent }   from '../../../../shared/components/empty-state/empty-state.component';

import {
  ManagedUser, CreateUserDto, UpdateUserDto,
  ResetPasswordDto, ChangeStatusDto, UsersFilter, UserStatus
} from '../../../../shared/interfaces/user-management.interface';
import { UserRole } from '../../../../shared/interfaces/auth.interface';

type ModalMode = 'create' | 'edit' | 'status' | 'reset-password' | 'delete' | 'details' | null;

@Component({
  selector: 'app-hr-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, EmptyStateComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrAdminUsersComponent implements OnInit {

  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notif      = inject(NotificationService);
  private readonly userSvc    = inject(UserManagementService);
  readonly authService        = inject(AuthService);
  private readonly fb         = inject(FormBuilder);

  // ── Data ──────────────────────────────────────────────────────────────────

  readonly allUsers    = this.userSvc.users;
  readonly departments = this.userSvc.departments;

  readonly ALL_ROLES: UserRole[] = [
    'Super Admin','General Manager','Finance Manager','Procurement Manager',
    'Operations Manager','Store Keeper','Project Manager','Employee','Safety Officer','Vendor'
  ];

  readonly ALL_STATUSES: UserStatus[] = ['Active','Inactive','Suspended','Pending'];

  // ── Filter / Search ───────────────────────────────────────────────────────

  readonly filter = signal<UsersFilter>({ search: '', role: '', departmentId: '', status: '' });

  readonly filteredUsers = computed(() => {
    const f = this.filter();
    const q = f.search.toLowerCase().trim();
    return this.allUsers().filter(u => {
      const matchSearch = !q || u.fullName.toLowerCase().includes(q)
                               || u.username.toLowerCase().includes(q)
                               || u.email.toLowerCase().includes(q);
      const matchRole   = !f.role   || u.role === f.role;
      const matchDept   = !f.departmentId || u.departmentId === f.departmentId;
      const matchStatus = !f.status || u.status === f.status;
      return matchSearch && matchRole && matchDept && matchStatus;
    });
  });

  // ── KPI computed ──────────────────────────────────────────────────────────

  readonly totalCount   = this.userSvc.totalCount;
  readonly activeCount  = this.userSvc.activeCount;
  readonly inactiveCount = this.userSvc.inactiveCount;

  // ── Modal State ───────────────────────────────────────────────────────────

  readonly modalMode     = signal<ModalMode>(null);
  readonly selectedUser  = signal<ManagedUser | null>(null);
  readonly isSubmitting  = signal<boolean>(false);
  readonly isLoading     = signal<boolean>(false);
  readonly deleteConfirmText = signal<string>('');

  // ── Forms ─────────────────────────────────────────────────────────────────

  createForm!: FormGroup;
  editForm!: FormGroup;
  statusForm!: FormGroup;
  resetForm!: FormGroup;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'إدارة المستخدمين' }
    ]);
    this._buildForms();
    this.isLoading.set(true);

    // ✅ TASK 1: تحميل الإحصائيات + المستخدمين + الأدوار + الأقسام
    this.userSvc.getUserStats().subscribe();
    this.userSvc.getRoles().subscribe();
    this.userSvc.getDepartments().subscribe();
    this.userSvc.getUsers().subscribe(() => this.isLoading.set(false));
  }

  // ── Form builders ─────────────────────────────────────────────────────────

  private _buildForms(): void {
    this.createForm = this.fb.group({
      fullName:          ['', [Validators.required, Validators.minLength(2)]],
      fullNameAr:        [''],
      username:          ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-z0-9._]+$/)]],
      email:             ['', [Validators.required, Validators.email]],
      role:              ['', Validators.required],
      departmentId:      [''],
      employeeId:        [''],
      temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword:   ['', Validators.required],
      preferredLanguage: ['ar'],
      sendWelcomeEmail:  [true]
    }, { validators: this._passwordsMatch('temporaryPassword', 'confirmPassword') });

    this.editForm = this.fb.group({
      fullName:     ['', [Validators.required, Validators.minLength(2)]],
      fullNameAr:   [''],
      email:        ['', [Validators.required, Validators.email]],
      role:         ['', Validators.required],
      departmentId: [''],
      employeeId:   [''],
      preferredLanguage: ['ar'],
      emailNotifications: [true]
    });

    this.statusForm = this.fb.group({
      status:       ['', Validators.required],
      reason:       ['', Validators.required],
      suspendUntil: ['']
    });

    this.resetForm = this.fb.group({
      newPassword:      ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword:  ['', Validators.required],
      mustChangeOnLogin: [true]
    }, { validators: this._passwordsMatch('newPassword', 'confirmPassword') });
  }

  private _passwordsMatch(p1: string, p2: string) {
    return (group: any) => {
      const ctrl1 = group.get(p1);
      const ctrl2 = group.get(p2);
      if (ctrl1 && ctrl2 && ctrl1.value !== ctrl2.value) {
        ctrl2.setErrors({ mismatch: true });
      } else {
        if (ctrl2?.hasError('mismatch')) ctrl2.setErrors(null);
      }
      return null;
    };
  }

  // ── Filter actions ────────────────────────────────────────────────────────

  onSearch(v: string)        { this.filter.update(f => ({ ...f, search: v })); }
  onRoleFilter(v: string)    { this.filter.update(f => ({ ...f, role: v })); }
  onDeptFilter(v: string)    { this.filter.update(f => ({ ...f, departmentId: v })); }
  onStatusFilter(v: string)  { this.filter.update(f => ({ ...f, status: v })); }
  clearFilters()             { this.filter.set({ search: '', role: '', departmentId: '', status: '' }); }

  // ── Modal open ────────────────────────────────────────────────────────────

  openCreate(): void {
    this.createForm.reset({ preferredLanguage: 'ar', sendWelcomeEmail: true });
    this.selectedUser.set(null);
    this.modalMode.set('create');
  }

  openEdit(user: ManagedUser): void {
    this.selectedUser.set(user);
    this.editForm.patchValue({
      fullName:          user.fullName,
      fullNameAr:        user.fullNameAr ?? '',
      email:             user.email,
      role:              user.role,
      departmentId:      user.departmentId ?? '',
      employeeId:        user.employeeId ?? '',
      preferredLanguage: user.preferredLanguage ?? 'ar',
      emailNotifications: user.emailNotifications ?? true
    });
    this.modalMode.set('edit');
  }

  openDetails(user: ManagedUser): void {
    this.selectedUser.set(user);
    this.modalMode.set('details');
  }

  openStatus(user: ManagedUser): void {
    this.selectedUser.set(user);
    this.statusForm.reset({ status: user.status, reason: '' });
    this.modalMode.set('status');
  }

  openReset(user: ManagedUser): void {
    this.selectedUser.set(user);
    this.resetForm.reset({ mustChangeOnLogin: true });
    this.modalMode.set('reset-password');
  }

  openDelete(user: ManagedUser): void {
    this.selectedUser.set(user);
    this.deleteConfirmText.set('');
    this.modalMode.set('delete');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selectedUser.set(null);
    this.isSubmitting.set(false);
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  submitCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    const v = this.createForm.value;
    const dto: CreateUserDto = {
      username: v.username,
      email: v.email,
      fullName: v.fullName,
      fullNameAr: v.fullNameAr,
      role: v.role,
      departmentId: v.departmentId,
      employeeId: v.employeeId,
      temporaryPassword: v.temporaryPassword,
      confirmPassword: v.confirmPassword,
      preferredLanguage: v.preferredLanguage,
      sendWelcomeEmail: v.sendWelcomeEmail
    };
    // Resolve roleId from loaded roles list (backend requires ObjectId, not role name)
    const matchedRole = this.userSvc.roles().find(r => r.name === v.role);
    const roleId = matchedRole?.id ?? v.role; // fallback to name if roles not loaded

    this.userSvc.createUser(dto, roleId).subscribe({
      next: (user) => {
        this.isSubmitting.set(false);
        this.notif.success('تم الإنشاء', `تم إنشاء المستخدم ${user.fullName} بنجاح`);
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notif.danger('خطأ', err.message);
      }
    });
  }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const user = this.selectedUser();
    if (!user) return;
    this.isSubmitting.set(true);
    const dto: UpdateUserDto = this.editForm.value;
    this.userSvc.updateUser(user.id, dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notif.success('تم التحديث', 'تم تحديث بيانات المستخدم بنجاح');
        this.closeModal();
      },
      error: (err) => { this.isSubmitting.set(false); this.notif.danger('خطأ', err.message); }
    });
  }

  submitStatus(): void {
    if (this.statusForm.invalid) { this.statusForm.markAllAsTouched(); return; }
    const user = this.selectedUser();
    if (!user) return;
    this.isSubmitting.set(true);
    const dto: ChangeStatusDto = this.statusForm.value;
    this.userSvc.changeUserStatus(user.id, dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notif.success('تم التحديث', `تم تغيير حالة المستخدم إلى ${dto.status}`);
        this.closeModal();
      },
      error: () => { this.isSubmitting.set(false); this.notif.danger('خطأ', 'تعذر تغيير الحالة'); }
    });
  }

  submitReset(): void {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    const user = this.selectedUser();
    if (!user) return;
    this.isSubmitting.set(true);
    const dto: ResetPasswordDto = this.resetForm.value;
    this.userSvc.resetPassword(user.id, dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notif.success('تم الإعادة', 'تم إعادة تعيين كلمة المرور بنجاح');
        this.closeModal();
      },
      error: () => { this.isSubmitting.set(false); this.notif.danger('خطأ', 'تعذر إعادة التعيين'); }
    });
  }

  confirmDelete(): void {
    const user = this.selectedUser();
    if (!user || this.deleteConfirmText() !== user.username) return;
    this.isSubmitting.set(true);
    this.userSvc.deleteUser(user.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notif.success('تم الحذف', `تم حذف المستخدم ${user.fullName}`);
        this.closeModal();
      },
      error: () => { this.isSubmitting.set(false); this.notif.danger('خطأ', 'تعذر حذف المستخدم'); }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatusClass(status: UserStatus): string {
    const map: Record<UserStatus, string> = {
      'Active':    'status-active',
      'Inactive':  'status-inactive',
      'Suspended': 'status-suspended',
      'Pending':   'status-pending'
    };
    return map[status] ?? '';
  }

  getStatusLabel(status: UserStatus): string {
    const map: Record<UserStatus, string> = {
      'Active': 'نشط', 'Inactive': 'غير نشط', 'Suspended': 'موقوف', 'Pending': 'معلق'
    };
    return map[status] ?? status;
  }

  getRoleClass(role: UserRole): string {
    const map: Record<string, string> = {
      'Super Admin': 'role-admin',
      'General Manager': 'role-gm',
      'Finance Manager': 'role-finance',
      'Procurement Manager': 'role-procurement',
      'Operations Manager': 'role-operations',
      'Store Keeper': 'role-store',
      'Project Manager': 'role-project',
      'Employee': 'role-employee',
      'Safety Officer': 'role-safety',
      'Vendor': 'role-vendor'
    };
    return map[role] ?? 'role-employee';
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  canManageUsers(): boolean {
    return this.authService.hasAnyRole(['Super Admin']);
  }

  trackById(_: number, u: ManagedUser) { return u.id; }
}
