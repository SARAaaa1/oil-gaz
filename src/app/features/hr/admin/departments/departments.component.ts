import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { BreadcrumbService }     from '../../../../core/services/breadcrumb.service';
import { NotificationService }   from '../../../../core/services/notification.service';
import { UserManagementService } from '../../../../core/services/user-management.service';
import { EmptyStateComponent }   from '../../../../shared/components/empty-state/empty-state.component';
import { Department }            from '../../../../shared/interfaces/user-management.interface';

type DeptModal = 'create' | 'edit' | 'delete' | null;

@Component({
  selector: 'app-hr-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, EmptyStateComponent],
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrDepartmentsComponent implements OnInit {

  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notif      = inject(NotificationService);
  private readonly userSvc    = inject(UserManagementService);
  private readonly fb         = inject(FormBuilder);

  readonly allDepts     = this.userSvc.departments;
  readonly modalMode    = signal<DeptModal>(null);
  readonly selectedDept = signal<Department | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly searchQuery  = signal<string>('');

  deptForm!: FormGroup;

  ngOnInit(): void {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'إدارة الأقسام' }
    ]);
    this._buildForm();
    this.userSvc.getDepartments().subscribe();
  }

  private _buildForm(): void {
    this.deptForm = this.fb.group({
      code:    ['', [Validators.required, Validators.pattern(/^[A-Z0-9\-]+$/)]],
      nameEn:  ['', Validators.required],
      nameAr:  ['', Validators.required]
    });
  }

  get filteredDepts(): Department[] {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.allDepts();
    return this.allDepts().filter(d =>
      d.nameAr.includes(q) || d.nameEn.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)
    );
  }

  /** ✅ TASK 3: usersCount يأتي من الـ Backend مباشرة (MongoDB Aggregation) */
  getDeptUserCount(dept: Department): number {
    return dept.usersCount ?? 0;
  }

  openCreate(): void {
    this.deptForm.reset();
    this.selectedDept.set(null);
    this.modalMode.set('create');
  }

  openEdit(dept: Department): void {
    this.selectedDept.set(dept);
    this.deptForm.patchValue({ code: dept.code, nameEn: dept.nameEn, nameAr: dept.nameAr });
    this.modalMode.set('edit');
  }

  openDelete(dept: Department): void {
    this.selectedDept.set(dept);
    this.modalMode.set('delete');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selectedDept.set(null);
    this.isSubmitting.set(false);
  }

  submitCreate(): void {
    if (this.deptForm.invalid) { this.deptForm.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    this.userSvc.createDepartment(this.deptForm.value).subscribe({
      next: () => { this.isSubmitting.set(false); this.notif.success('تم الإنشاء', 'تم إنشاء القسم بنجاح'); this.closeModal(); },
      error: () => { this.isSubmitting.set(false); this.notif.danger('خطأ', 'تعذر إنشاء القسم'); }
    });
  }

  submitEdit(): void {
    if (this.deptForm.invalid) { this.deptForm.markAllAsTouched(); return; }
    const dept = this.selectedDept();
    if (!dept) return;
    this.isSubmitting.set(true);
    this.userSvc.updateDepartment(dept.id, this.deptForm.value).subscribe({
      next: () => { this.isSubmitting.set(false); this.notif.success('تم التحديث', 'تم تحديث بيانات القسم'); this.closeModal(); },
      error: () => { this.isSubmitting.set(false); this.notif.danger('خطأ', 'تعذر تحديث القسم'); }
    });
  }

  confirmDelete(): void {
    const dept = this.selectedDept();
    if (!dept) return;
    this.isSubmitting.set(true);
    this.userSvc.deleteDepartment(dept.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notif.success('تم الحذف', `تم حذف قسم ${dept.nameAr}`);
        this.closeModal();
      },
      // ✅ TASK 7: الـ Backend يمنع الحذف إذا فيه موظفون → يرجع 400 + data.usersCount
      error: (err: Error) => {
        this.isSubmitting.set(false);
        const msg = err.message?.includes('active users')
          ? `لا يمكن حذف القسم — يحتوي على موظفين نشطين. أعد تعيينهم أولاً.`
          : (err.message ?? 'تعذر حذف القسم');
        this.notif.danger('تعذر الحذف', msg);
      }
    });
  }

  trackById(_: number, d: Department) { return d.id; }
}
