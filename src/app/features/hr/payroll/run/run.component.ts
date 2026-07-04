import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { PayrollRecord } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-payroll-run',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.payroll.run_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.payroll.run_subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button (click)="generatePayroll()" [disabled]="isGenerating()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
          @if (isGenerating()) { <span class="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full inline-block"></span> }
          @else { <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> }
          {{ 'hr.payroll.run_btn_generate' | translate }}
        </button>
        <button (click)="hr.submitPayrollForApproval(selectedMonth(), selectedYear())" class="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-sm">📋 Submit for Approval</button>
        <button (click)="hr.approveAllPayroll(selectedMonth(), selectedYear())" class="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs shadow-sm">✓ {{ 'hr.payroll.run_btn_approve' | translate }}</button>
        <button (click)="hr.cancelPayrollRun(selectedMonth(), selectedYear())" class="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs">✕ {{ 'hr.payroll.run_btn_cancel_run' | translate }}</button>
      </div>
    </div>

    <!-- Period Selector & Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <select [(ngModel)]="selectedMonth" class="px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-xs font-black text-primary outline-none">
        @for (m of months; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
      </select>
      <select [(ngModel)]="selectedYear" class="px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-xs font-black text-primary outline-none">
        @for (y of years; track y) { <option [value]="y">{{ y }}</option> }
      </select>
      <div class="relative flex-1 min-w-48">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search employee..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
      </div>
      <select [(ngModel)]="filterDept" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Departments</option>
        @for (d of depts(); track d) { <option [value]="d">{{ d }}</option> }
      </select>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Statuses</option>
        @for (s of payrollStatuses; track s) { <option [value]="s">{{ s }}</option> }
      </select>
    </div>

    <!-- Summary Cards for selected period -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-slate-700">{{ filteredRecords().length }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.payroll.summary_employees' | translate }}</p>
      </div>
      <div class="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-xl font-black text-slate-700">{{ periodGross() | number:'1.0-0' }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.payroll.col_gross' | translate }} SAR</p>
      </div>
      <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 text-center">
        <p class="text-xl font-black text-red-600">{{ periodDed() | number:'1.0-0' }}</p>
        <p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.payroll.col_deductions' | translate }} SAR</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-xl font-black text-green-700">{{ periodNet() | number:'1.0-0' }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.payroll.col_net' | translate }} SAR</p>
      </div>
    </div>

    <!-- Generating Progress Banner -->
    @if (isGenerating()) {
      <div class="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
        <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div>
          <p class="font-black text-primary text-sm">{{ 'hr.payroll.run_generating' | translate }}</p>
          <p class="text-[11px] text-slate-500 font-semibold">Processing {{ hr.salaryStructures().length }} employee records…</p>
        </div>
      </div>
    }

    <!-- Main Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_emp' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_dept' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_working_days' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_present' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_late_hrs' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_absent' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_ot' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_gross' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_deductions' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_net' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.run_col_status' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (rec of filteredRecords(); track rec.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-bold text-slate-800">{{ rec.employeeName }}</p>
                  <p class="text-[10px] text-slate-400">{{ rec.employeeNumber }}</p>
                </td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ rec.departmentName }}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">{{ rec.workingDays }}</td>
                <td class="px-4 py-3 text-center font-bold text-green-600">{{ rec.presentDays }}</td>
                <td class="px-4 py-3 text-center font-bold" [class]="rec.lateHours > 0 ? 'text-amber-600' : 'text-slate-400'">{{ rec.lateHours }}h</td>
                <td class="px-4 py-3 text-center font-bold" [class]="rec.absentDays > 0 ? 'text-red-600' : 'text-slate-400'">{{ rec.absentDays }}</td>
                <td class="px-4 py-3 text-center font-bold" [class]="rec.overtimeHours > 0 ? 'text-indigo-600' : 'text-slate-400'">{{ rec.overtimeHours }}h</td>
                <td class="px-4 py-3 text-right font-bold text-slate-700">{{ rec.grossSalary | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-bold text-red-600">{{ rec.totalDeductions | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-black text-green-700">{{ rec.netSalary | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-center"><span [class]="statusBadge(rec.status)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ rec.status }}</span></td>
                <td class="px-4 py-3 text-center">
                  @if (rec.status === 'Pending Approval') {
                    <button (click)="hr.approvePayrollRecord(rec.id)" class="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">✓ Approve</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="12" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">💼</div>
                    <p class="font-black text-slate-600 text-sm">No payroll records for {{ selectedPeriodLabel() }}</p>
                    <button (click)="generatePayroll()" class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">
                      {{ 'hr.payroll.run_btn_generate' | translate }}
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
          @if (filteredRecords().length > 0) {
            <tfoot class="bg-slate-800 text-white">
              <tr>
                <td colspan="7" class="px-4 py-3 font-black text-xs">TOTAL — {{ filteredRecords().length }} {{ 'hr.payroll.summary_employees' | translate }}</td>
                <td class="px-4 py-3 text-right font-black text-sm">{{ periodGross() | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-black text-red-300 text-sm">{{ periodDed() | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-black text-green-300 text-sm">{{ periodNet() | number:'1.0-0' }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          }
        </table>
      </div>
    </div>
  </div>
  `
})
export class HrPayrollRunComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  isGenerating = signal(false);
  search = ''; filterDept = ''; filterStatus = '';
  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());

  readonly months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  readonly years = [2024, 2025, 2026, 2027];
  readonly payrollStatuses: PayrollRecord['status'][] = ['Draft', 'Pending Approval', 'Approved', 'Paid', 'Cancelled'];

  readonly depts = computed(() => [...new Set(this.hr.payrollRecords().map(r => r.departmentName || '').filter(Boolean))]);

  readonly periodRecords = computed(() =>
    this.hr.payrollRecords().filter(r => r.month === this.selectedMonth() && r.year === this.selectedYear())
  );

  readonly filteredRecords = computed(() => {
    let list = this.periodRecords();
    if (this.search) list = list.filter(r => r.employeeName.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterDept) list = list.filter(r => r.departmentName === this.filterDept);
    if (this.filterStatus) list = list.filter(r => r.status === this.filterStatus);
    return list;
  });

  readonly selectedPeriodLabel = computed(() => {
    const m = this.months.find(m => m.value === this.selectedMonth());
    return `${m?.label} ${this.selectedYear()}`;
  });

  readonly periodGross = computed(() => this.filteredRecords().reduce((s, r) => s + r.grossSalary, 0));
  readonly periodDed = computed(() => this.filteredRecords().reduce((s, r) => s + r.totalDeductions, 0));
  readonly periodNet = computed(() => this.filteredRecords().reduce((s, r) => s + r.netSalary, 0));

  statusBadge(s: string) {
    const map: Record<string, string> = {
      'Draft': 'bg-slate-100 text-slate-500 border-slate-200',
      'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-100',
      'Approved': 'bg-green-50 text-green-700 border-green-100',
      'Paid': 'bg-indigo-50 text-indigo-700 border-indigo-100',
      'Cancelled': 'bg-red-50 text-red-700 border-red-100'
    };
    return map[s] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  generatePayroll() {
    this.isGenerating.set(true);
    setTimeout(() => {
      this.hr.generatePayroll(this.selectedMonth(), this.selectedYear());
      this.isGenerating.set(false);
    }, 1500);
  }

  ngOnInit() { this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.payroll' }, { label: 'hr.payroll.run_title' }]); }
}
