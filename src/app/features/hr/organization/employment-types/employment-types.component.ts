import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { EmploymentType } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-employment-types',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.org.emp_types.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.org.emp_types.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 self-start md:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.org.emp_types.btn_add' | translate }}
      </button>
    </div>

    <!-- Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      @for (et of hr.employmentTypes(); track et.id) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group">
          <div class="flex items-center justify-between mb-3">
            <span class="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[11px] font-black">{{ et.code }}</span>
            <span [class]="et.status === 'Active' ? 'text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full' : 'text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full'">{{ et.status }}</span>
          </div>
          <h3 class="font-black text-slate-800 text-sm">{{ et.name }}</h3>
          <p class="text-[11px] text-slate-500 font-semibold mt-0.5">{{ et.arabicName }}</p>
          @if (et.description) {
            <p class="text-[11px] text-slate-400 mt-2 leading-relaxed line-clamp-2">{{ et.description }}</p>
          }
          <div class="flex gap-2 mt-4 pt-3 border-t border-slate-100">
            <button (click)="openEdit(et)" class="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.edit' | translate }}</button>
            <button (click)="hr.deleteEmploymentType(et.id)" class="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.delete' | translate }}</button>
          </div>
        </div>
      }
    </div>

    <!-- Table View -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100">
        <h3 class="font-black text-slate-800 text-sm">{{ 'hr.org.emp_types.table_title' | translate }}</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_code' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_name_en' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_name_ar' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.lbl_description' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_status' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (et of hr.employmentTypes(); track et.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-black text-slate-800">{{ et.code }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ et.name }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ et.arabicName }}</td>
                <td class="px-4 py-3 text-slate-500 max-w-xs truncate">{{ et.description || '—' }}</td>
                <td class="px-4 py-3 text-center">
                  <span [class]="et.status === 'Active' ? 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100' : 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500'">{{ et.status }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1.5">
                    <button (click)="openEdit(et)" class="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all">{{ 'hr.common.edit' | translate }}</button>
                    <button (click)="hr.deleteEmploymentType(et.id)" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold transition-all">{{ 'hr.common.delete' | translate }}</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    @if (showForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeForm()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="font-black text-slate-800 text-sm">{{ isEdit() ? ('hr.org.emp_types.title_edit' | translate) : ('hr.org.emp_types.title_add' | translate) }}</h3>
            <button (click)="closeForm()" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_code' | translate }} *</label>
                <input [(ngModel)]="form.code" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_status' | translate }}</label>
                <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_name_en' | translate }} *</label>
                <input [(ngModel)]="form.name" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_name_ar' | translate }} *</label>
                <input [(ngModel)]="form.arabicName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800" dir="rtl">
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_description' | translate }}</label>
              <textarea [(ngModel)]="form.description" rows="3" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800 resize-none"></textarea>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 p-4 border-t">
            <button (click)="closeForm()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submit()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.common.save' | translate }}</button>
          </div>
        </div>
      </div>
    }

  </div>
  `
})
export class HrEmploymentTypesComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  showForm = signal(false);
  isEdit = signal(false);
  editId = signal('');
  form: Partial<EmploymentType> = {};

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.org.emp_types.title' }
    ]);
  }

  openAdd() { this.isEdit.set(false); this.form = { status: 'Active' }; this.showForm.set(true); }
  openEdit(et: EmploymentType) { this.isEdit.set(true); this.editId.set(et.id); this.form = { ...et }; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }
  submit() {
    if (this.isEdit()) this.hr.updateEmploymentType(this.editId(), this.form);
    else this.hr.addEmploymentType(this.form);
    this.closeForm();
  }
}
