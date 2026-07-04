import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { JobGrade } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.org.grades.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.org.grades.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 self-start md:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.org.grades.btn_add' | translate }}
      </button>
    </div>

    <!-- Grade Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      @for (g of hr.jobGrades(); track g.id) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm" [style.background]="gradeColor(g.promotionLevel)">
              {{ g.promotionLevel }}
            </div>
            <span [class]="g.status === 'Active' ? 'text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full' : 'text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full'">{{ g.status }}</span>
          </div>
          <div>
            <p class="font-black text-slate-800 text-sm">{{ g.name }}</p>
            <p class="text-[11px] text-slate-500 font-semibold mt-0.5">{{ g.arabicName }}</p>
            <p class="text-[10px] text-slate-400 font-bold mt-0.5">{{ g.code }}</p>
          </div>
          <div class="pt-2 border-t border-slate-100">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.grades.salary_range' | translate }}</p>
            <p class="font-black text-primary text-sm mt-0.5">{{ g.minSalary | number }} — {{ g.maxSalary | number }} SAR</p>
          </div>
          <div class="flex gap-2 pt-1">
            <button (click)="openEdit(g)" class="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.edit' | translate }}</button>
            <button (click)="hr.deleteJobGrade(g.id)" class="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.delete' | translate }}</button>
          </div>
        </div>
      }
    </div>

    <!-- Salary Scale Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100">
        <h3 class="font-black text-slate-800 text-sm">{{ 'hr.org.grades.table_title' | translate }}</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.grades.col_level' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.grades.col_code' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_name_en' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_name_ar' | translate }}</th>
              <th class="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.grades.col_min' | translate }}</th>
              <th class="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.grades.col_max' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_status' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (g of hr.jobGrades(); track g.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[11px]" [style.background]="gradeColor(g.promotionLevel)">{{ g.promotionLevel }}</div>
                </td>
                <td class="px-4 py-3 font-black text-slate-800">{{ g.code }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ g.name }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ g.arabicName }}</td>
                <td class="px-4 py-3 text-right font-semibold text-slate-700">{{ g.minSalary | number }} SAR</td>
                <td class="px-4 py-3 text-right font-black text-primary">{{ g.maxSalary | number }} SAR</td>
                <td class="px-4 py-3 text-center">
                  <span [class]="g.status === 'Active' ? 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100' : 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500'">{{ g.status }}</span>
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
            <h3 class="font-black text-slate-800 text-sm">{{ isEdit() ? ('hr.org.grades.title_edit' | translate) : ('hr.org.grades.title_add' | translate) }}</h3>
            <button (click)="closeForm()" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.grades.col_code' | translate }} *</label>
                <input [(ngModel)]="form.code" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.grades.col_level' | translate }}</label>
                <input [(ngModel)]="form.promotionLevel" type="number" min="1" max="20" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_name_en' | translate }} *</label>
                <input [(ngModel)]="form.name" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_name_ar' | translate }} *</label>
                <input [(ngModel)]="form.arabicName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800" dir="rtl">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.grades.col_min' | translate }} (SAR)</label>
                <input [(ngModel)]="form.minSalary" type="number" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.grades.col_max' | translate }} (SAR)</label>
                <input [(ngModel)]="form.maxSalary" type="number" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_status' | translate }}</label>
              <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
export class HrGradesComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  showForm = signal(false);
  isEdit = signal(false);
  editId = signal('');
  form: Partial<JobGrade> = {};

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.org.grades.title' }
    ]);
  }

  gradeColor(level: number): string {
    const colors = ['#64748b','#3b82f6','#06b6d4','#10b981','#f59e0b','#f97316','#ef4444','#8b5cf6','#ec4899','#0ea5e9'];
    return colors[(level - 1) % colors.length];
  }

  openAdd() { this.isEdit.set(false); this.form = { status: 'Active', promotionLevel: 1 }; this.showForm.set(true); }
  openEdit(g: JobGrade) { this.isEdit.set(true); this.editId.set(g.id); this.form = { ...g }; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }
  submit() {
    if (this.isEdit()) this.hr.updateJobGrade(this.editId(), this.form);
    else this.hr.addJobGrade(this.form);
    this.closeForm();
  }
}
