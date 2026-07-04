import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { Department } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.org.dept.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.org.dept.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 self-start md:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.org.dept.btn_add' | translate }}
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.stat_total' | translate }}</p>
        <p class="text-3xl font-black text-slate-800">{{ total() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.stat_active' | translate }}</p>
        <p class="text-3xl font-black text-green-600">{{ active() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.stat_with_manager' | translate }}</p>
        <p class="text-3xl font-black text-primary">{{ withManager() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.stat_no_manager' | translate }}</p>
        <p class="text-3xl font-black text-amber-500">{{ noManager() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.stat_employees' | translate }}</p>
        <p class="text-3xl font-black text-slate-800">{{ totalEmployees() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.stat_budget_centers' | translate }}</p>
        <p class="text-3xl font-black text-purple-600">{{ budgetCenters() }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" [placeholder]="'hr.common.search_placeholder' | translate" class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary/50">
      </div>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none">
        <option value="">{{ 'hr.common.all_statuses' | translate }}</option>
        <option value="Active">{{ 'hr.common.status_active' | translate }}</option>
        <option value="Inactive">{{ 'hr.common.status_inactive' | translate }}</option>
        <option value="Archived">{{ 'hr.common.status_archived' | translate }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_code' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_name_ar' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_name_en' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_manager' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_location' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_employees' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.org.dept.col_status' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.common.actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (dept of filtered(); track dept.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-black text-slate-800">{{ dept.code }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ dept.arabicName || '—' }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ dept.name }}</td>
                <td class="px-4 py-3 text-slate-600">{{ dept.managerName || '—' }}</td>
                <td class="px-4 py-3 text-slate-500">{{ dept.location || '—' }}</td>
                <td class="px-4 py-3 text-center font-black text-slate-800">{{ dept.employeeCount ?? 0 }}</td>
                <td class="px-4 py-3 text-center">
                  <span [class]="statusBadge(dept.status)">{{ dept.status }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1.5">
                    <button (click)="openView(dept)" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all">{{ 'hr.common.view' | translate }}</button>
                    <button (click)="openEdit(dept)" class="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all">{{ 'hr.common.edit' | translate }}</button>
                    <button (click)="deleteDept(dept.id)" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold transition-all">{{ 'hr.common.delete' | translate }}</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="px-4 py-12 text-center text-slate-400 text-xs font-semibold">{{ 'hr.common.no_data' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- View Modal -->
    @if (showView()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeView()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="font-black text-slate-800 text-sm">{{ selected()?.name }}</h3>
            <button (click)="closeView()" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_code' | translate }}</p><p class="font-black text-slate-800 mt-0.5">{{ selected()?.code }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_status' | translate }}</p><span [class]="statusBadge(selected()?.status || 'Active')" class="mt-0.5 inline-block">{{ selected()?.status }}</span></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_manager' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selected()?.managerName || '—' }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_cost_center' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selected()?.costCenter || '—' }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_location' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selected()?.location || '—' }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_employees' | translate }}</p><p class="font-black text-primary mt-0.5">{{ selected()?.employeeCount ?? 0 }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_phone' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selected()?.phone || '—' }}</p></div>
              <div><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_email' | translate }}</p><p class="font-semibold text-slate-700 mt-0.5">{{ selected()?.email || '—' }}</p></div>
            </div>
            @if (selected()?.description) {
              <div class="pt-2 border-t"><p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_description' | translate }}</p><p class="text-slate-600 mt-1 leading-relaxed">{{ selected()?.description }}</p></div>
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
            <h3 class="font-black text-slate-800 text-sm">{{ isEdit() ? ('hr.org.dept.title_edit' | translate) : ('hr.org.dept.title_add' | translate) }}</h3>
            <button (click)="closeForm()" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.col_code' | translate }} *</label>
                <input [(ngModel)]="form.code" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.col_status' | translate }}</label>
                <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.col_name_en' | translate }} *</label>
                <input [(ngModel)]="form.name" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.col_name_ar' | translate }} *</label>
                <input [(ngModel)]="form.arabicName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold" dir="rtl">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.lbl_manager' | translate }}</label>
                <input [(ngModel)]="form.managerName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.lbl_cost_center' | translate }}</label>
                <input [(ngModel)]="form.costCenter" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.lbl_location' | translate }}</label>
                <input [(ngModel)]="form.location" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.lbl_phone' | translate }}</label>
                <input [(ngModel)]="form.phone" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.lbl_email' | translate }}</label>
                <input [(ngModel)]="form.email" type="email" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold">
              </div>
              <div class="flex items-center gap-2 mt-2">
                <input [(ngModel)]="form.isBudgetCenter" type="checkbox" id="isBudget" class="w-4 h-4 accent-primary">
                <label for="isBudget" class="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{{ 'hr.org.dept.lbl_budget_center' | translate }}</label>
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.dept.lbl_description' | translate }}</label>
              <textarea [(ngModel)]="form.description" rows="2" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 text-slate-800 font-semibold resize-none"></textarea>
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
export class HrDepartmentsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = '';
  filterStatus = '';
  showView = signal(false);
  showForm = signal(false);
  isEdit = signal(false);
  selected = signal<Department | null>(null);
  editId = signal('');

  form: Partial<Department> = {};

  readonly filtered = computed(() => {
    const s = this.search.toLowerCase();
    return this.hr.departments().filter(d =>
      (!s || d.name.toLowerCase().includes(s) || d.arabicName?.toLowerCase().includes(s) || d.code.toLowerCase().includes(s) || d.managerName?.toLowerCase().includes(s)) &&
      (!this.filterStatus || d.status === this.filterStatus)
    );
  });

  readonly total = computed(() => this.hr.departments().length);
  readonly active = computed(() => this.hr.departments().filter(d => d.status === 'Active').length);
  readonly withManager = computed(() => this.hr.departments().filter(d => !!d.managerName).length);
  readonly noManager = computed(() => this.hr.departments().filter(d => !d.managerName).length);
  readonly totalEmployees = computed(() => this.hr.departments().reduce((s, d) => s + (d.employeeCount ?? 0), 0));
  readonly budgetCenters = computed(() => this.hr.departments().filter(d => d.isBudgetCenter).length);

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.org.dept.title' }
    ]);
  }

  statusBadge(s?: string) {
    if (s === 'Active') return 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100';
    if (s === 'Inactive') return 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500';
    return 'inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100';
  }

  openView(d: Department) { this.selected.set(d); this.showView.set(true); }
  closeView() { this.showView.set(false); }

  openAdd() {
    this.isEdit.set(false);
    this.form = { status: 'Active', isBudgetCenter: false };
    this.showForm.set(true);
  }

  openEdit(d: Department) {
    this.isEdit.set(true);
    this.editId.set(d.id);
    this.form = { ...d };
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  submit() {
    if (this.isEdit()) {
      this.hr.updateDepartment(this.editId(), this.form);
    } else {
      this.hr.addDepartment(this.form);
    }
    this.closeForm();
  }

  deleteDept(id: string) { this.hr.deleteDepartment(id); }
}
