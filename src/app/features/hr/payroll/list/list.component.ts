import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { PayrollRecord } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-payroll-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.payroll.list_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.payroll.list_subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl font-bold text-xs flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          {{ 'hr.payroll.list_btn_excel' | translate }}
        </button>
        <button class="px-3 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl font-bold text-xs flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          {{ 'hr.payroll.list_btn_pdf' | translate }}
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-slate-700">{{ hr.payrollRecords().length }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Records</p>
      </div>
      <div class="bg-slate-100 rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-slate-600">{{ countByStatus('Draft') }}</p>
        <p class="text-[10px] font-bold text-slate-500 uppercase mt-1">Draft</p>
      </div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-amber-600">{{ countByStatus('Pending Approval') }}</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase mt-1">Pending</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-green-600">{{ countByStatus('Approved') }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">Approved</p>
      </div>
      <div class="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-indigo-600">{{ countByStatus('Paid') }}</p>
        <p class="text-[10px] font-bold text-indigo-700 uppercase mt-1">Paid</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-48">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search employee or payroll #..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-primary/50">
      </div>
      <select [(ngModel)]="filterMonth" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="0">All Months</option>
        @for (m of months; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
      </select>
      <select [(ngModel)]="filterDept" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Departments</option>
        @for (d of depts(); track d) { <option [value]="d">{{ d }}</option> }
      </select>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Statuses</option>
        @for (s of payrollStatuses; track s) { <option [value]="s">{{ s }}</option> }
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_number' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_employee' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_dept' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_month' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_gross' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_deductions' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_net' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_status' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_created' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.list_col_actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (rec of paginatedRecords(); track rec.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-bold text-primary text-[11px]">{{ rec.payrollNumber }}</td>
                <td class="px-4 py-3">
                  <p class="font-bold text-slate-800">{{ rec.employeeName }}</p>
                  <p class="text-[10px] text-slate-400">{{ rec.employeeNumber }}</p>
                </td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ rec.departmentName }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ rec.periodLabel }}</td>
                <td class="px-4 py-3 text-right font-bold text-slate-700">{{ rec.grossSalary | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-bold text-red-600">{{ rec.totalDeductions | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-black text-green-700">{{ rec.netSalary | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-center"><span [class]="statusBadge(rec.status)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ rec.status }}</span></td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ rec.generatedAt }}</td>
                <td class="px-4 py-3">
                  <div class="flex gap-1 justify-center">
                    <a [routerLink]="['/hr/payroll/details', rec.id]" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold">{{ 'hr.payroll.list_btn_view' | translate }}</a>
                    @if (rec.status === 'Pending Approval') {
                      <button (click)="hr.approvePayrollRecord(rec.id)" class="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">✓</button>
                    }
                    <button class="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">🖨️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="10" class="px-4 py-10 text-center text-slate-400 text-xs font-semibold">No payroll records found</td></tr>
            }
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <p class="text-[11px] text-slate-400 font-semibold">Showing {{ (page() - 1) * pageSize + 1 }}–{{ minVal(page() * pageSize, filteredRecords().length) }} of {{ filteredRecords().length }}</p>
          <div class="flex gap-1">
            <button (click)="prevPage()" [disabled]="page() === 1" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold disabled:opacity-40">‹</button>
            @for (p of pageArr(); track p) {
              <button (click)="page.set(p)" [class]="p === page() ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'" class="px-3 py-1.5 rounded-lg text-xs font-bold">{{ p }}</button>
            }
            <button (click)="nextPage()" [disabled]="page() === totalPages()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold disabled:opacity-40">›</button>
          </div>
        </div>
      }
    </div>
  </div>
  `
})
export class HrPayrollListComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = ''; filterMonth = 0; filterDept = ''; filterStatus = '';
  page = signal(1);
  pageSize = 15;

  readonly months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  readonly payrollStatuses: PayrollRecord['status'][] = ['Draft', 'Pending Approval', 'Approved', 'Paid', 'Cancelled'];
  readonly depts = computed(() => [...new Set(this.hr.payrollRecords().map(r => r.departmentName || '').filter(Boolean))]);

  readonly filteredRecords = computed(() => {
    let list = [...this.hr.payrollRecords()].sort((a, b) => b.year - a.year || b.month - a.month);
    if (this.search) list = list.filter(r => r.employeeName.toLowerCase().includes(this.search.toLowerCase()) || r.payrollNumber.includes(this.search));
    if (this.filterMonth) list = list.filter(r => r.month === +this.filterMonth);
    if (this.filterDept) list = list.filter(r => r.departmentName === this.filterDept);
    if (this.filterStatus) list = list.filter(r => r.status === this.filterStatus);
    return list;
  });

  readonly totalPages = computed(() => Math.ceil(this.filteredRecords().length / this.pageSize));
  readonly pageArr = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  readonly paginatedRecords = computed(() => this.filteredRecords().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));

  minVal(a: number, b: number) { return Math.min(a, b); }
  prevPage() { if (this.page() > 1) this.page.update(p => p - 1); }
  nextPage() { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }
  countByStatus(s: string) { return this.hr.payrollRecords().filter(r => r.status === s).length; }

  statusBadge(s: string) {
    const map: Record<string, string> = { 'Draft': 'bg-slate-100 text-slate-500 border-slate-200', 'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-100', 'Approved': 'bg-green-50 text-green-700 border-green-100', 'Paid': 'bg-indigo-50 text-indigo-700 border-indigo-100', 'Cancelled': 'bg-red-50 text-red-700 border-red-100' };
    return map[s] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  ngOnInit() { this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.payroll' }, { label: 'hr.payroll.list_title' }]); }
}
