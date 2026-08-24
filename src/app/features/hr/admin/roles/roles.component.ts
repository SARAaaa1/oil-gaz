import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { BreadcrumbService }      from '../../../../core/services/breadcrumb.service';
import { NotificationService }    from '../../../../core/services/notification.service';
import { UserManagementService, PERMISSION_GROUPS } from '../../../../core/services/user-management.service';
import { AuthService }            from '../../../../core/services/auth.service';
import { EmptyStateComponent }    from '../../../../shared/components/empty-state/empty-state.component';

import { Role }           from '../../../../shared/interfaces/user-management.interface';
import { UserRole }       from '../../../../shared/interfaces/auth.interface';
import { BackendRoleUser } from '../../../../shared/interfaces/api-response.interface';

@Component({
  selector: 'app-hr-roles',
  standalone: true,
  imports: [CommonModule, TranslateModule, EmptyStateComponent],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrAdminRolesComponent implements OnInit {

  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notif      = inject(NotificationService);
  private readonly userSvc    = inject(UserManagementService);
  readonly authService        = inject(AuthService);

  readonly allRoles    = this.userSvc.roles;
  readonly permGroups  = PERMISSION_GROUPS;

  readonly selectedRole     = signal<Role | null>(null);
  readonly isLoading        = signal<boolean>(false);
  readonly isLoadingUsers   = signal<boolean>(false);
  readonly activeTab        = signal<'permissions' | 'users'>('permissions');
  /** ✅ TASK 2: مستخدمو الدور المحمَّلون من /admin/roles/:id/users */
  readonly roleUsers        = signal<BackendRoleUser[]>([]);

  readonly roleColorMap: Record<string, string> = {
    'Super Admin': 'role-color--admin',
    'General Manager': 'role-color--gm',
    'Finance Manager': 'role-color--finance',
    'Procurement Manager': 'role-color--procurement',
    'Operations Manager': 'role-color--operations',
    'Store Keeper': 'role-color--store',
    'Project Manager': 'role-color--project',
    'Employee': 'role-color--employee',
    'Safety Officer': 'role-color--safety',
    'Vendor': 'role-color--vendor'
  };

  readonly roleIconMap: Record<string, string> = {
    'Super Admin': '⚙️',
    'General Manager': '🏢',
    'Finance Manager': '💰',
    'Procurement Manager': '📦',
    'Operations Manager': '⚡',
    'Store Keeper': '🏭',
    'Project Manager': '📋',
    'Employee': '👤',
    'Safety Officer': '🛡️',
    'Vendor': '🤝'
  };

  ngOnInit(): void {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'إدارة الأدوار والصلاحيات' }
    ]);
    this.isLoading.set(true);
    // ✅ TASK 4: getRoles يُرجع usersCount لكل دور من الـ Backend
    this.userSvc.getRoles().subscribe({
      next: roles => {
        this.isLoading.set(false);
        if (roles.length > 0) this.selectedRole.set(roles[0]);
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectRole(role: Role): void {
    this.selectedRole.set(role);
    this.activeTab.set('permissions');
    this.roleUsers.set([]); // reset عند تغيير الدور
  }

  /** ✅ TASK 2: تحميل مستخدمي الدور عند الضغط على تاب Users */
  onUsersTabClick(): void {
    this.activeTab.set('users');
    const role = this.selectedRole();
    if (!role || this.roleUsers().length > 0) return; // already loaded

    this.isLoadingUsers.set(true);
    this.userSvc.getRoleUsers(role.id).subscribe({
      next: users => {
        this.roleUsers.set(users);
        this.isLoadingUsers.set(false);
      },
      error: (err: Error) => {
        this.isLoadingUsers.set(false);
        this.notif.danger('خطأ', err.message ?? 'تعذّر تحميل مستخدمي الدور');
      }
    });
  }

  hasPermission(permission: string): boolean {
    const role = this.selectedRole();
    if (!role) return false;
    return (role.permissions as string[]).includes(permission);
  }

  getRoleColorClass(roleName: UserRole | string): string {
    return this.roleColorMap[roleName] ?? 'role-color--employee';
  }

  getRoleIcon(roleName: string): string {
    return this.roleIconMap[roleName] ?? '👤';
  }

  // ── Template helpers ─────────────────────────────────────────────────────
  /** ✅ TASK 4: يقرأ usersCount من بيانات الدور نفسه (من الـ Backend) */
  getUserCountForRole(role: Role): number {
    return role.usersCount ?? 0;
  }

  getPermGroupKeys(group: { permissions: { key: string }[] }): string[] {
    return group.permissions.map(p => p.key);
  }

  getPermGroupCount(groupPerms: string[]): number {
    const role = this.selectedRole();
    if (!role) return 0;
    return groupPerms.filter(p => (role.permissions as string[]).includes(p)).length;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  trackById(_: number, r: Role) { return r.id; }
}
