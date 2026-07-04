import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { JobTitle } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.org.jobs.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.org.jobs.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 self-start md:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.org.jobs.btn_add' | translate }}
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.jobs.stat_total' | translate }}</p>
        <p class="text-3xl font-black text-slate-800 mt-1">{{ total() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.jobs.stat_vacant' | translate }}</p>
        <p class="text-3xl font-black text-amber-500 mt-1">{{ totalVacant() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.jobs.stat_filled' | translate }}</p>
        <p class="text-3xl font-black text-green-600 mt-1">{{ totalFilled() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.jobs.stat_active' | translate }}</p>
        <p class="text-3xl font-black text-primary mt-1">{{ activeJobs() }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" [placeholder]="'hr.common.search_placeholder' | translate" class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary/50">
      </div>
      <select [(ngModel)]="filterDept" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none">
        <option value="">{{ 'hr.common.all_departments' | translate }}</option>
        @for (d of hr.departments(); track d.id) {
          <option [value]="d.id">{{ d.name }}</option>
        }
      </select>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none">
        <option value="">{{ 'hr.common.all_statuses' | translate }}</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Draft">Draft</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_code' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_name_ar' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_name_en' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_dept' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_grade' | translate }}</th>
              <th class="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_salary' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.jobs.col_vacant' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_status' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (j of filtered(); track j.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-black text-slate-800">{{ j.code }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ j.arabicName }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ j.name }}</td>
                <td class="px-4 py-3 text-slate-600">{{ j.departmentName || '—' }}</td>
                <td class="px-4 py-3 text-slate-500">{{ j.gradeName || '—' }}</td>
                <td class="px-4 py-3 text-right font-semibold text-slate-700">{{ j.defaultSalary ? (j.defaultSalary | number) + ' SAR' : '—' }}</td>
                <td class="px-4 py-3 text-center">
                  @if ((j.vacantCount ?? 0) > 0) {
                    <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">{{ j.vacantCount }} {{ 'hr.org.jobs.vacant' | translate }}</span>
                  } @else {
                    <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">{{ 'hr.org.jobs.filled' | translate }}</span>
                  }
                </td>
                <td class="px-4 py-3 text-center">
                  <span [class]="statusBadge(j.status)">{{ j.status }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1.5">
                    <button (click)="openView(j)" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all">{{ 'hr.common.view' | translate }}</button>
                    <button (click)="openEdit(j)" class="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all">{{ 'hr.common.edit' | translate }}</button>
                    <button (click)="hr.deleteJobTitle(j.id)" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold transition-all">{{ 'hr.common.delete' | translate }}</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="px-4 py-12 text-center text-slate-400 text-xs font-semibold">{{ 'hr.common.no_data' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- View Modal -->
    @if (showView()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeView()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
            <h3 class="font-black text-slate-800 text-sm">{{ selJob()?.name }}</h3>
            <button (click)="closeView()" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_code' | translate }}</p><p class="font-black text-slate-800 mt-0.5">{{ selJob()?.code }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_dept' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selJob()?.departmentName }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_grade' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selJob()?.gradeName || '—' }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_salary' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selJob()?.defaultSalary ? (selJob()!.defaultSalary! | number) + ' SAR' : '—' }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_exp' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selJob()?.minExperienceYears }} {{ 'hr.common.years' | translate }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_qualification' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selJob()?.minQualification || '—' }}</p></div>
            </div>
            @if (selJob()?.requiredSkills?.length) {
              <div class="pt-2 border-t">
                <p class="text-[10px] font-bold text-slate-400 uppercase mb-1.5">{{ 'hr.org.jobs.col_skills' | translate }}</p>
                <div class="flex flex-wrap gap-1.5">
                  @for (sk of selJob()?.requiredSkills; track sk) {
                    <span class="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">{{ sk }}</span>
                  }
                </div>
              </div>
            }
            @if (selJob()?.description) {
              <div class="pt-2 border-t"><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_description' | translate }}</p><p class="text-slate-600 mt-1 leading-relaxed">{{ selJob()?.description }}</p></div>
            }
          </div>
          <div class="flex justify-end p-4 border-t">
            <button (click)="closeView()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all">{{ 'hr.common.close' | translate }}</button>
          </div>
        </div>
      </div>
    }

    <!-- Add/Edit Modal -->
    @if (showForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeForm()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
            <h3 class="font-black text-slate-800 text-sm">{{ isEdit() ? ('hr.org.jobs.title_edit' | translate) : ('hr.org.jobs.title_add' | translate) }}</h3>
            <button (click)="closeForm()" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_code' | translate }} *</label>
                <input [(ngModel)]="form.code" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_status' | translate }}</label>
                <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
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
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_dept' | translate }}</label>
                <select [(ngModel)]="form.departmentId" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold">
                  @for (d of hr.departments(); track d.id) {
                    <option [value]="d.id">{{ d.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_grade' | translate }}</label>
                <select [(ngModel)]="form.gradeId" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold">
                  <option value="">—</option>
                  @for (g of hr.jobGrades(); track g.id) {
                    <option [value]="g.id">{{ g.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_salary' | translate }} (SAR)</label>
                <input [(ngModel)]="form.defaultSalary" type="number" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_exp' | translate }}</label>
                <input [(ngModel)]="form.minExperienceYears" type="number" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_qualification' | translate }}</label>
              <input [(ngModel)]="form.minQualification" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_description' | translate }}</label>
              <textarea [(ngModel)]="form.description" rows="2" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800 resize-none"></textarea>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 p-4 border-t sticky bottom-0 bg-white">
            <button (click)="closeForm()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submit()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.common.save' | translate }}</button>
          </div>
        </div>
      </div>
    }

  </div>
  `
})
export class HrJobsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = '';
  filterDept = '';
  filterStatus = '';
  showView = signal(false);
  showForm = signal(false);
  isEdit = signal(false);
  selJob = signal<JobTitle | null>(null);
  editId = signal('');
  form: Partial<JobTitle> = {};

  readonly filtered = computed(() => {
    const s = this.search.toLowerCase();
    return this.hr.jobTitles().filter(j =>
      (!s || j.name.toLowerCase().includes(s) || j.arabicName.toLowerCase().includes(s) || j.code.toLowerCase().includes(s)) &&
      (!this.filterDept || j.departmentId === this.filterDept) &&
      (!this.filterStatus || j.status === this.filterStatus)
    );
  });

  readonly total = computed(() => this.hr.jobTitles().length);
  readonly totalVacant = computed(() => this.hr.jobTitles().reduce((s, j) => s + (j.vacantCount ?? 0), 0));
  readonly totalFilled = computed(() => this.hr.jobTitles().reduce((s, j) => s + (j.filledCount ?? 0), 0));
  readonly activeJobs = computed(() => this.hr.jobTitles().filter(j => j.status === 'Active').length);

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.org.jobs.title' }
    ]);
  }

  statusBadge(s: string) {
    if (s === 'Active') return 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100';
    if (s === 'Draft') return 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100';
    return 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500';
  }

  openView(j: JobTitle) { this.selJob.set(j); this.showView.set(true); }
  closeView() { this.showView.set(false); }
  openAdd() { this.isEdit.set(false); this.form = { status: 'Active' }; this.showForm.set(true); }
  openEdit(j: JobTitle) { this.isEdit.set(true); this.editId.set(j.id); this.form = { ...j }; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }
  submit() {
    if (this.isEdit()) this.hr.updateJobTitle(this.editId(), this.form);
    else this.hr.addJobTitle(this.form);
    this.closeForm();
  }
}
