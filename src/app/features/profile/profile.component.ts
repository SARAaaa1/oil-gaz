import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService }           from '../../core/services/auth.service';
import { NotificationService }   from '../../core/services/notification.service';
import { BreadcrumbService }     from '../../core/services/breadcrumb.service';
import { UserManagementService } from '../../core/services/user-management.service';
import { AuditService }          from '../../core/services/audit.service';

type ProfileTab = 'info' | 'password' | 'permissions';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {

  readonly authService  = inject(AuthService);
  private readonly notif       = inject(NotificationService);
  private readonly breadcrumb  = inject(BreadcrumbService);
  private readonly userSvc     = inject(UserManagementService);
  private readonly audit       = inject(AuditService);
  private readonly fb          = inject(FormBuilder);

  readonly currentUser    = this.authService.currentUser;
  readonly activeTab      = signal<ProfileTab>('info');
  readonly isEditingInfo  = signal<boolean>(false);
  readonly isSubmitting   = signal<boolean>(false);
  readonly showOldPw      = signal<boolean>(false);
  readonly showNewPw      = signal<boolean>(false);
  readonly showConfirmPw  = signal<boolean>(false);
  readonly saveSuccess    = signal<boolean>(false);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  readonly timezones = [
    { value: 'UTC+3', label: 'توقيت الرياض (UTC+3)' },
    { value: 'UTC+0', label: 'توقيت غرينتش (UTC+0)' },
    { value: 'UTC+1', label: 'توقيت وسط أوروبا (UTC+1)' },
    { value: 'UTC+2', label: 'توقيت شرق أوروبا (UTC+2)' },
    { value: 'UTC+4', label: 'توقيت أبوظبي (UTC+4)' },
    { value: 'UTC+5:30', label: 'توقيت مومباي (UTC+5:30)' },
    { value: 'UTC-5', label: 'توقيت نيويورك (UTC-5)' },
    { value: 'UTC-8', label: 'توقيت لوس أنجلوس (UTC-8)' }
  ];

  ngOnInit(): void {
    this.breadcrumb.setBreadcrumbs([{ label: 'الملف الشخصي' }]);
    this._buildForms();
  }

  private _buildForms(): void {
    const user = this.currentUser();

    this.profileForm = this.fb.group({
      fullName:           [user?.fullName ?? '', [Validators.required, Validators.minLength(2)]],
      companyName:        [user?.companyName ?? ''],
      preferredLanguage:  [user?.preferredLanguage ?? 'ar'],
      timezone:           [user?.timezone ?? 'UTC+3'],
      emailNotifications: [user?.emailNotifications ?? true]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this._passwordsMatch });

    // Disable form by default
    this.profileForm.disable();
  }

  private _passwordsMatch(group: AbstractControl) {
    const g = group as FormGroup;
    const np = g.get('newPassword')?.value;
    const cp = g.get('confirmPassword')?.value;
    if (np && cp && np !== cp) {
      g.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      const errs = g.get('confirmPassword')?.errors;
      if (errs?.['mismatch']) {
        g.get('confirmPassword')?.setErrors(null);
      }
    }
    return null;
  }

  startEdit(): void {
    this.profileForm.enable();
    this.isEditingInfo.set(true);
    // patch latest values
    const user = this.currentUser();
    this.profileForm.patchValue({
      fullName:           user?.fullName ?? '',
      companyName:        user?.companyName ?? '',
      preferredLanguage:  user?.preferredLanguage ?? 'ar',
      timezone:           user?.timezone ?? 'UTC+3',
      emailNotifications: user?.emailNotifications ?? true
    });
  }

  cancelEdit(): void {
    this.profileForm.disable();
    this.isEditingInfo.set(false);
    this._buildForms();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    const v = this.profileForm.value;

    // PATCH /auth/me/profile  (companyName is ignored by backend)
    this.authService.updateProfile({
      fullName:           v.fullName,
      fullNameAr:         undefined,
      preferredLanguage:  v.preferredLanguage,
      timezone:           v.timezone,
      emailNotifications: v.emailNotifications
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isEditingInfo.set(false);
        this.profileForm.disable();
        this.saveSuccess.set(true);
        this.notif.success('تم الحفظ', 'تم تحديث الملف الشخصي بنجاح');
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.notif.danger('خطأ', err.message ?? 'تعذّر تحديث الملف الشخصي');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    const v = this.passwordForm.value;

    // PATCH /auth/me/password
    this.authService.changePassword(
      v.currentPassword,
      v.newPassword,
      v.confirmPassword
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.passwordForm.reset();
        this.notif.success('تم التغيير', 'تم تغيير كلمة المرور بنجاح — سيتم تسجيل الخروج تلقائياً');
        this.audit.log('Update', 'Auth', 'Password', this.currentUser()?.id ?? '', 'Old', 'New', 'Password changed from profile');
        // Backend invalidates all refresh tokens after password change
        setTimeout(() => this.authService.logout(), 1500);
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.notif.danger('خطأ', err.message ?? 'تعذّر تغيير كلمة المرور');
      }
    });
  }

  toggleOldPw()     { this.showOldPw.update(v => !v); }
  toggleNewPw()     { this.showNewPw.update(v => !v); }
  toggleConfirmPw() { this.showConfirmPw.update(v => !v); }

  getUserInitials(): string {
    const name = this.currentUser()?.fullName ?? '';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleBadgeClass(): string {
    const role = this.currentUser()?.role;
    const map: Record<string, string> = {
      'Super Admin': 'badge--admin',
      'General Manager': 'badge--gm',
      'Finance Manager': 'badge--finance',
      'Procurement Manager': 'badge--procurement',
      'Operations Manager': 'badge--operations',
      'Store Keeper': 'badge--store',
      'Project Manager': 'badge--project',
      'Employee': 'badge--employee',
      'Safety Officer': 'badge--safety',
      'Vendor': 'badge--vendor'
    };
    return map[role ?? ''] ?? 'badge--employee';
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
