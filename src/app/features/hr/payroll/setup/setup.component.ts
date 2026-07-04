import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { SalaryStructure, DeductionRule } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-payroll-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.payroll.setup_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.payroll.setup_subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.payroll.setup_btn_add' | translate }}
      </button>
    </div>

    <!-- Dashboard Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="col-span-2 sm:col-span-3 lg:col-span-2 bg-gradient-to-br from-primary to-indigo-700 rounded-2xl p-5 text-white shadow-md">
        <p class="text-[10px] font-bold uppercase opacity-80">{{ 'hr.payroll.dash_monthly_cost' | translate }}</p>
        <p class="text-3xl font-black mt-1">{{ hr.totalMonthlyCost() | number:'1.0-0' }}</p>
        <p class="text-xs font-semibold opacity-70 mt-0.5">{{ 'hr.payroll.summary_sar' | translate }}</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-green-600">{{ hr.employeesPaid() }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.payroll.dash_employees_paid' | translate }}</p>
      </div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-amber-600">{{ hr.pendingPayroll() }}</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.payroll.dash_pending' | translate }}</p>
      </div>
      <div class="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-blue-600">{{ hr.averageSalary() | number:'1.0-0' }}</p>
        <p class="text-[10px] font-bold text-blue-700 uppercase mt-1">{{ 'hr.payroll.dash_avg_salary' | translate }}</p>
      </div>
      <div class="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-indigo-600">{{ hr.totalOvertimePay() | number:'1.0-0' }}</p>
        <p class="text-[10px] font-bold text-indigo-700 uppercase mt-1">{{ 'hr.payroll.dash_total_ot' | translate }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-52">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search employee..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-primary/50">
      </div>
      <select [(ngModel)]="filterDept" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">{{ 'hr.payroll.col_dept' | translate }}</option>
        @for (d of depts(); track d) { <option [value]="d">{{ d }}</option> }
      </select>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">{{ 'hr.payroll.col_status' | translate }}</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_employee' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_dept' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_basic' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_housing' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_gross' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_deductions' | translate }}</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_net' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_effective' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_status' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (ss of filteredStructures(); track ss.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3"><p class="font-bold text-slate-800">{{ ss.employeeName }}</p><p class="text-[10px] text-slate-400">{{ ss.employeeNumber }}</p></td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ ss.departmentName }}</td>
                <td class="px-4 py-3 text-right font-bold text-slate-700">{{ ss.basicSalary | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right text-slate-500">{{ ss.housingAllowance | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-black text-slate-800">{{ grossOf(ss) | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-bold text-red-600">{{ totalDedOf(ss) | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-black text-green-700 text-sm">{{ netOf(ss) | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ ss.effectiveFrom }}</td>
                <td class="px-4 py-3 text-center"><span [class]="statusBadge(ss.status)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ ss.status }}</span></td>
                <td class="px-4 py-3 text-center">
                  <button (click)="openEdit(ss)" class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold mr-1">{{ 'hr.payroll.setup_btn_edit' | translate }}</button>
                  <button (click)="hr.deleteSalaryStructure(ss.id)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold">✕</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="10" class="px-4 py-10 text-center text-slate-400 text-xs font-semibold">No salary structures configured</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" (click)="showModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <div>
              <h3 class="font-black text-slate-800 text-sm">{{ (editId() ? 'hr.payroll.setup_title_edit' : 'hr.payroll.setup_title_add') | translate }}</h3>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ form.employeeName || '—' }}</p>
            </div>
            <button (click)="showModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-5 text-xs">

            <!-- Employee Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="md:col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.setup_employee' | translate }}</label>
                <select [(ngModel)]="form.employeeId" (change)="onEmpSelect()" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                  <option value="">— Select —</option>
                  @for (e of hr.employees(); track e.id) { <option [value]="e.id">{{ e.fullName }} ({{ e.employeeCode }})</option> }
                </select>
              </div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.col_effective' | translate }}</label>
                <input [(ngModel)]="form.effectiveFrom" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
            </div>

            <!-- Earnings Section -->
            <div class="border border-green-100 rounded-xl p-4 bg-green-50/30">
              <p class="text-[10px] font-black text-green-700 uppercase mb-3">💰 Earnings & Allowances</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_basic' | translate }}</label><input [(ngModel)]="form.basicSalary" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_housing' | translate }}</label><input [(ngModel)]="form.housingAllowance" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_transport' | translate }}</label><input [(ngModel)]="form.transportationAllowance" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_food' | translate }}</label><input [(ngModel)]="form.foodAllowance" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_mobile' | translate }}</label><input [(ngModel)]="form.mobileAllowance" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_other' | translate }}</label><input [(ngModel)]="form.otherAllowances" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_bonus' | translate }}</label><input [(ngModel)]="form.bonusAmount" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.setup_ot_rate' | translate }} (×)</label><input [(ngModel)]="form.overtimeRateMultiplier" type="number" min="1" max="3" step="0.25" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800 bg-white"></div>
              </div>
            </div>

            <!-- Deductions Section -->
            <div class="border border-red-100 rounded-xl p-4 bg-red-50/20">
              <p class="text-[10px] font-black text-red-700 uppercase mb-3">📉 Fixed Deductions</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_insurance' | translate }}</label><input [(ngModel)]="form.socialInsurance" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_tax' | translate }}</label><input [(ngModel)]="form.incomeTax" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_loan' | translate }}</label><input [(ngModel)]="form.loanDeduction" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.det_penalty' | translate }}</label><input [(ngModel)]="form.penaltyAmount" (ngModelChange)="calcEstimate()" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-400 font-semibold text-slate-800 bg-white"></div>
              </div>
            </div>

            <!-- Rules Section -->
            <div class="border border-amber-100 rounded-xl p-4 bg-amber-50/20">
              <p class="text-[10px] font-black text-amber-700 uppercase mb-3">⚙️ Variable Deduction Rules</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.setup_late_rule' | translate }}</label>
                  <select [(ngModel)]="form.lateDeductionRule" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                    @for (r of deductionRules; track r) { <option [value]="r">{{ r }}</option> }
                  </select>
                </div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.setup_late_amount' | translate }}</label><input [(ngModel)]="form.lateDeductionAmount" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-400 font-semibold text-slate-800 bg-white"></div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.setup_absence_rule' | translate }}</label>
                  <select [(ngModel)]="form.absenceDeductionRule" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                    @for (r of deductionRules; track r) { <option [value]="r">{{ r }}</option> }
                  </select>
                </div>
                <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.setup_absence_amount' | translate }}</label><input [(ngModel)]="form.absenceDeductionAmount" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-amber-400 font-semibold text-slate-800 bg-white"></div>
              </div>
            </div>

            <!-- Live Estimate -->
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 flex flex-wrap gap-6 items-center justify-center">
              <div class="text-center"><p class="text-[9px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.setup_gross' | translate }}</p><p class="text-xl font-black text-white mt-0.5">{{ estimateGross() | number:'1.0-0' }}</p></div>
              <div class="text-2xl font-black text-slate-600">−</div>
              <div class="text-center"><p class="text-[9px] font-bold text-red-400 uppercase">{{ 'hr.payroll.setup_total_ded' | translate }}</p><p class="text-xl font-black text-red-400 mt-0.5">{{ estimateDed() | number:'1.0-0' }}</p></div>
              <div class="text-2xl font-black text-slate-600">=</div>
              <div class="text-center flex-1"><p class="text-[9px] font-bold text-green-400 uppercase">{{ 'hr.payroll.setup_net' | translate }}</p><p class="text-3xl font-black text-green-300 mt-0.5">{{ estimateNet() | number:'1.0-0' }} <span class="text-xs opacity-60">SAR</span></p></div>
            </div>

            <!-- Status & Notes -->
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.setup_status' | translate }}</label>
                <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                  <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Suspended">Suspended</option>
                </select>
              </div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.payroll.setup_notes' | translate }}</label>
                <input [(ngModel)]="form.notes" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-2xl">
            <button (click)="showModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50">{{ 'hr.payroll.setup_btn_cancel' | translate }}</button>
            <button (click)="submit()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">{{ 'hr.payroll.setup_btn_save' | translate }}</button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrPayrollSetupComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = ''; filterDept = ''; filterStatus = '';
  showModal = signal(false);
  editId = signal('');
  form: Partial<SalaryStructure> = {};
  estimateGross = signal(0); estimateDed = signal(0); estimateNet = signal(0);

  readonly deductionRules: DeductionRule[] = ['Per Hour', 'Per Day', 'Fixed Amount', 'None'];
  readonly depts = computed(() => [...new Set(this.hr.salaryStructures().map(s => s.departmentName || '').filter(Boolean))]);

  readonly filteredStructures = computed(() => {
    let list = this.hr.salaryStructures();
    if (this.search) list = list.filter(s => s.employeeName.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterDept) list = list.filter(s => s.departmentName === this.filterDept);
    if (this.filterStatus) list = list.filter(s => s.status === this.filterStatus);
    return list;
  });

  grossOf(ss: SalaryStructure) { return ss.basicSalary + ss.housingAllowance + ss.transportationAllowance + ss.foodAllowance + ss.mobileAllowance + ss.otherAllowances + ss.bonusAmount; }
  totalDedOf(ss: SalaryStructure) { return ss.socialInsurance + ss.incomeTax + ss.loanDeduction + ss.penaltyAmount; }
  netOf(ss: SalaryStructure) { return this.grossOf(ss) - this.totalDedOf(ss); }

  statusBadge(s: string) {
    return { 'Active': 'bg-green-50 text-green-700 border-green-100', 'Inactive': 'bg-slate-100 text-slate-500 border-slate-200', 'Suspended': 'bg-amber-50 text-amber-700 border-amber-100' }[s] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  calcEstimate() {
    const f = this.form;
    const g = (f.basicSalary || 0) + (f.housingAllowance || 0) + (f.transportationAllowance || 0) + (f.foodAllowance || 0) + (f.mobileAllowance || 0) + (f.otherAllowances || 0) + (f.bonusAmount || 0);
    const d = (f.socialInsurance || 0) + (f.incomeTax || 0) + (f.loanDeduction || 0) + (f.penaltyAmount || 0);
    this.estimateGross.set(g); this.estimateDed.set(d); this.estimateNet.set(g - d);
  }

  onEmpSelect() {
    const emp = this.hr.employees().find(e => e.id === this.form.employeeId);
    if (emp) { this.form.employeeName = emp.fullName; this.form.employeeNumber = emp.employeeCode; this.form.jobTitle = emp.jobTitle; }
  }

  openAdd() {
    this.editId.set('');
    this.form = { status: 'Active', overtimeRateMultiplier: 1.5, lateDeductionRule: 'Per Hour', absenceDeductionRule: 'Per Day', effectiveFrom: new Date().toISOString().split('T')[0], basicSalary: 0, housingAllowance: 0, transportationAllowance: 0, foodAllowance: 0, mobileAllowance: 0, otherAllowances: 0, bonusAmount: 0, socialInsurance: 0, incomeTax: 0, loanDeduction: 0, penaltyAmount: 0, lateDeductionAmount: 0, absenceDeductionAmount: 0 };
    this.calcEstimate(); this.showModal.set(true);
  }

  openEdit(ss: SalaryStructure) { this.editId.set(ss.id); this.form = { ...ss }; this.calcEstimate(); this.showModal.set(true); }

  submit() {
    if (this.editId()) this.hr.updateSalaryStructure(this.editId(), this.form);
    else this.hr.addSalaryStructure(this.form);
    this.showModal.set(false);
  }

  ngOnInit() { this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.payroll' }, { label: 'hr.payroll.setup_title' }]); }
}
