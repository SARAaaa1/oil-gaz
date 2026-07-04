import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { PayrollRecord } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-payroll-details',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <a routerLink="/hr/payroll/list" class="text-slate-400 hover:text-primary text-xs font-bold">← {{ 'hr.payroll.det_btn_back' | translate }}</a>
        </div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.payroll.det_title' | translate }}</h1>
        @if (record()) {
          <p class="text-xs text-slate-500 font-semibold mt-1">{{ record()!.payrollNumber }} · {{ record()!.periodLabel }}</p>
        }
      </div>
      @if (record()) {
        <div class="flex gap-2 flex-wrap">
          <span [class]="statusBadge(record()!.status)" class="inline-flex px-3 py-1.5 rounded-xl text-xs font-black border">{{ record()!.status }}</span>
          @if (record()!.status === 'Pending Approval') {
            <button (click)="approveThis()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs shadow-sm">✓ {{ 'hr.payroll.det_btn_approve' | translate }}</button>
          }
          <button class="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs">🖨️ {{ 'hr.payroll.det_btn_print' | translate }}</button>
        </div>
      }
    </div>

    @if (record(); as rec) {

    <!-- Employee Info & Audit Top Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Employee Card -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><span class="w-4 h-0.5 bg-primary inline-block rounded"></span>{{ 'hr.payroll.det_section_employee' | translate }}</h3>
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center text-2xl font-black text-primary">{{ rec.employeeName[0] }}</div>
          <div class="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div><p class="text-[10px] text-slate-400 font-bold uppercase">Name</p><p class="font-black text-slate-800 mt-0.5">{{ rec.employeeName }}</p></div>
            <div><p class="text-[10px] text-slate-400 font-bold uppercase">Employee #</p><p class="font-bold text-slate-700 mt-0.5">{{ rec.employeeNumber }}</p></div>
            <div><p class="text-[10px] text-slate-400 font-bold uppercase">Department</p><p class="font-bold text-slate-700 mt-0.5">{{ rec.departmentName }}</p></div>
            <div><p class="text-[10px] text-slate-400 font-bold uppercase">Job Title</p><p class="font-bold text-slate-700 mt-0.5">{{ rec.jobTitle }}</p></div>
            <div><p class="text-[10px] text-slate-400 font-bold uppercase">Period</p><p class="font-bold text-slate-700 mt-0.5">{{ rec.periodLabel }}</p></div>
            <div><p class="text-[10px] text-slate-400 font-bold uppercase">Payroll #</p><p class="font-bold text-primary mt-0.5">{{ rec.payrollNumber }}</p></div>
          </div>
        </div>
      </div>

      <!-- Net Salary Hero -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white flex flex-col justify-center text-center shadow-md">
        <p class="text-[10px] font-bold uppercase opacity-60">{{ 'hr.payroll.det_net' | translate }}</p>
        <p class="text-5xl font-black mt-2">{{ rec.netSalary | number:'1.0-0' }}</p>
        <p class="text-sm font-semibold opacity-60 mt-1">{{ 'hr.payroll.summary_sar' | translate }}</p>
        <div class="mt-4 grid grid-cols-2 gap-2 text-[10px]">
          <div class="bg-white/10 rounded-lg p-2"><p class="opacity-60">Gross</p><p class="font-black text-sm">{{ rec.grossSalary | number:'1.0-0' }}</p></div>
          <div class="bg-red-500/20 rounded-lg p-2"><p class="text-red-300 opacity-80">Deductions</p><p class="font-black text-red-300 text-sm">{{ rec.totalDeductions | number:'1.0-0' }}</p></div>
        </div>
      </div>
    </div>

    <!-- Salary Breakdown Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Earnings -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-5 py-4 bg-green-50 border-b border-green-100">
          <h3 class="text-[10px] font-black text-green-700 uppercase flex items-center gap-2">💰 {{ 'hr.payroll.det_section_earnings' | translate }}</h3>
        </div>
        <div class="divide-y divide-slate-50">
          <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_basic' | translate }}</span><span class="font-black text-slate-800">{{ rec.basicSalary | number:'1.0-0' }} SAR</span></div>
          <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_housing' | translate }}</span><span class="font-bold text-slate-700">{{ rec.housingAllowance | number:'1.0-0' }} SAR</span></div>
          <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_transport' | translate }}</span><span class="font-bold text-slate-700">{{ rec.transportationAllowance | number:'1.0-0' }} SAR</span></div>
          <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_food' | translate }}</span><span class="font-bold text-slate-700">{{ rec.foodAllowance | number:'1.0-0' }} SAR</span></div>
          <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_mobile' | translate }}</span><span class="font-bold text-slate-700">{{ rec.mobileAllowance | number:'1.0-0' }} SAR</span></div>
          @if (rec.otherAllowances > 0) {
            <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_other' | translate }}</span><span class="font-bold text-slate-700">{{ rec.otherAllowances | number:'1.0-0' }} SAR</span></div>
          }
          @if (rec.bonusAmount > 0) {
            <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_bonus' | translate }}</span><span class="font-bold text-indigo-700">{{ rec.bonusAmount | number:'1.0-0' }} SAR</span></div>
          }
          @if (rec.overtimePay > 0) {
            <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_ot_pay' | translate }} ({{ rec.overtimeHours }}h)</span><span class="font-bold text-indigo-700">{{ rec.overtimePay | number:'1.0-0' }} SAR</span></div>
          }
          <div class="px-5 py-3 flex justify-between text-xs bg-green-50"><span class="font-black text-green-800">{{ 'hr.payroll.det_gross' | translate }}</span><span class="font-black text-green-800 text-sm">{{ rec.grossSalary | number:'1.0-0' }} SAR</span></div>
        </div>
      </div>

      <!-- Deductions -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-5 py-4 bg-red-50 border-b border-red-100">
          <h3 class="text-[10px] font-black text-red-700 uppercase flex items-center gap-2">📉 {{ 'hr.payroll.det_section_deductions' | translate }}</h3>
        </div>
        <div class="divide-y divide-slate-50">
          @if (rec.lateDeduction > 0) {
            <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_late_ded' | translate }} ({{ rec.lateHours }}h)</span><span class="font-bold text-red-600">−{{ rec.lateDeduction | number:'1.0-0' }} SAR</span></div>
          }
          @if (rec.absenceDeduction > 0) {
            <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_absence_ded' | translate }} ({{ rec.absentDays }}d)</span><span class="font-bold text-red-600">−{{ rec.absenceDeduction | number:'1.0-0' }} SAR</span></div>
          }
          @if (rec.socialInsurance > 0) {
            <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_insurance' | translate }}</span><span class="font-bold text-red-600">−{{ rec.socialInsurance | number:'1.0-0' }} SAR</span></div>
          }
          @if (rec.incomeTax > 0) {
            <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_tax' | translate }}</span><span class="font-bold text-red-600">−{{ rec.incomeTax | number:'1.0-0' }} SAR</span></div>
          }
          @if (rec.loanDeduction > 0) {
            <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_loan' | translate }}</span><span class="font-bold text-red-600">−{{ rec.loanDeduction | number:'1.0-0' }} SAR</span></div>
          }
          @if (rec.penaltyAmount > 0) {
            <div class="px-5 py-3 flex justify-between text-xs"><span class="text-slate-500 font-semibold">{{ 'hr.payroll.det_penalty' | translate }}</span><span class="font-bold text-red-600">−{{ rec.penaltyAmount | number:'1.0-0' }} SAR</span></div>
          }
          <div class="px-5 py-3 flex justify-between text-xs bg-red-50"><span class="font-black text-red-800">{{ 'hr.payroll.det_total_ded' | translate }}</span><span class="font-black text-red-800 text-sm">−{{ rec.totalDeductions | number:'1.0-0' }} SAR</span></div>
        </div>
      </div>
    </div>

    <!-- Attendance + Leave + OT Summary Row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

      <!-- Attendance -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><span class="w-4 h-0.5 bg-blue-500 inline-block rounded"></span>{{ 'hr.payroll.det_section_attendance' | translate }}</h3>
        <div class="space-y-2.5">
          <div class="flex justify-between text-xs"><span class="text-slate-500">{{ 'hr.payroll.det_working_days' | translate }}</span><span class="font-black text-slate-800">{{ rec.workingDays }}</span></div>
          <div class="flex justify-between text-xs"><span class="text-slate-500">{{ 'hr.payroll.det_present_days' | translate }}</span><span class="font-black text-green-600">{{ rec.presentDays }}</span></div>
          <div class="flex justify-between text-xs"><span class="text-slate-500">{{ 'hr.payroll.det_absent_days' | translate }}</span><span class="font-black text-red-600">{{ rec.absentDays }}</span></div>
          <div class="flex justify-between text-xs"><span class="text-slate-500">{{ 'hr.payroll.det_late_hrs' | translate }}</span><span class="font-black text-amber-600">{{ rec.lateHours }}h</span></div>
          <div class="h-px bg-slate-100"></div>
          <div class="flex justify-between items-center">
            <span class="text-[10px] text-slate-400 font-bold uppercase">Attendance Rate</span>
            <div class="flex items-center gap-2">
              <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-green-500 rounded-full" [style.width]="(rec.presentDays / rec.workingDays * 100) + '%'"></div>
              </div>
              <span class="font-black text-sm text-green-700">{{ (rec.presentDays / rec.workingDays * 100) | number:'1.0-0' }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Leave -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><span class="w-4 h-0.5 bg-purple-500 inline-block rounded"></span>{{ 'hr.payroll.det_section_leave' | translate }}</h3>
        <div class="space-y-2.5">
          <div class="flex justify-between text-xs"><span class="text-slate-500">{{ 'hr.payroll.det_leave_days' | translate }}</span><span class="font-black text-purple-600">{{ rec.leaveDays }}</span></div>
          <div class="flex justify-between text-xs"><span class="text-slate-500">Early Leave Hours</span><span class="font-black text-orange-500">{{ rec.earlyLeaveHours }}h</span></div>
        </div>
      </div>

      <!-- Overtime -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><span class="w-4 h-0.5 bg-indigo-500 inline-block rounded"></span>{{ 'hr.payroll.det_section_ot' | translate }}</h3>
        <div class="space-y-2.5">
          <div class="flex justify-between text-xs"><span class="text-slate-500">{{ 'hr.payroll.det_ot_hrs' | translate }}</span><span class="font-black text-indigo-600">{{ rec.overtimeHours }}h</span></div>
          <div class="flex justify-between text-xs"><span class="text-slate-500">{{ 'hr.payroll.det_ot_pay' | translate }}</span><span class="font-black text-indigo-700">{{ rec.overtimePay | number:'1.0-0' }} SAR</span></div>
        </div>
      </div>
    </div>

    <!-- Audit Timeline -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 class="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><span class="w-4 h-0.5 bg-slate-500 inline-block rounded"></span>{{ 'hr.payroll.det_section_audit' | translate }}</h3>
      <div class="flex items-start gap-3 flex-wrap">
        <!-- Generated -->
        <div class="flex-1 min-w-48">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm">⚙️</div>
            <div class="h-px flex-1 bg-slate-100"></div>
          </div>
          <p class="text-[10px] font-bold text-slate-400 uppercase">Generated</p>
          <p class="text-xs font-black text-slate-800 mt-0.5">{{ rec.generatedAt }}</p>
          <p class="text-[10px] text-slate-500">{{ rec.generatedBy }}</p>
        </div>
        <!-- Approved -->
        @if (rec.approvedAt) {
          <div class="flex-1 min-w-48">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-sm">✅</div>
              <div class="h-px flex-1 bg-slate-100"></div>
            </div>
            <p class="text-[10px] font-bold text-slate-400 uppercase">Approved</p>
            <p class="text-xs font-black text-slate-800 mt-0.5">{{ rec.approvedAt }}</p>
            <p class="text-[10px] text-slate-500">{{ rec.approvedBy }}</p>
          </div>
        }
        <!-- Paid -->
        @if (rec.status === 'Paid') {
          <div class="flex-1 min-w-48">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-sm">💳</div>
            </div>
            <p class="text-[10px] font-bold text-slate-400 uppercase">Paid</p>
            <p class="text-xs font-black text-slate-800 mt-0.5">{{ rec.approvedAt }}</p>
            <p class="text-[10px] text-slate-500">Finance Department</p>
          </div>
        }
      </div>
    </div>

    } @else {
      <div class="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <p class="text-4xl mb-3">🔍</p>
        <p class="font-black text-slate-600">Payroll record not found</p>
        <a routerLink="/hr/payroll/list" class="mt-4 inline-flex px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Back to List</a>
      </div>
    }
  </div>
  `
})
export class HrPayrollDetailsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly route = inject(ActivatedRoute);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  private readonly recordId = signal('');
  readonly record = computed<PayrollRecord | undefined>(() =>
    this.hr.payrollRecords().find(r => r.id === this.recordId())
  );

  statusBadge(s: string) {
    const map: Record<string, string> = { 'Draft': 'bg-slate-100 text-slate-500 border-slate-200', 'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-100', 'Approved': 'bg-green-50 text-green-700 border-green-100', 'Paid': 'bg-indigo-50 text-indigo-700 border-indigo-100', 'Cancelled': 'bg-red-50 text-red-700 border-red-100' };
    return map[s] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  approveThis() { if (this.recordId()) this.hr.approvePayrollRecord(this.recordId()); }

  ngOnInit() {
    this.recordId.set(this.route.snapshot.paramMap.get('id') || '');
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.payroll' }, { label: 'hr.payroll.list_title' }, { label: 'hr.payroll.det_title' }]);
  }
}
