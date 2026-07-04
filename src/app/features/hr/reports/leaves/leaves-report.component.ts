import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({ selector: 'app-hr-reports-leaves', standalone: true, imports: [CommonModule, TranslateModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-5" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div><h1 class="text-2xl font-black text-slate-800">{{ 'hr.reports.leave_title' | translate }}</h1><p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.leave_subtitle' | translate }}</p></div>
      <div class="flex gap-2"><button class="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_pdf' | translate }}</button><button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_excel' | translate }}</button></div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-slate-800">{{ totalRequests() }}</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.reports.leave_total_requests' | translate }}</p></div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-green-600">{{ approved() }}</p><p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.reports.leave_approved' | translate }}</p></div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-amber-600">{{ pending() }}</p><p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.reports.leave_pending' | translate }}</p></div>
      <div class="bg-slate-100 rounded-2xl border border-slate-200 shadow-sm p-4 text-center"><p class="text-3xl font-black text-slate-600">{{ daysUsed() }}</p><p class="text-[10px] font-bold text-slate-500 uppercase mt-1">{{ 'hr.reports.leave_days_used' | translate }}</p></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.leave_by_type' | translate }}</h3>
        <div class="space-y-3">
          @for (t of byType(); track t.type) {
            <div class="flex items-center gap-3">
              <div class="w-24 text-[11px] font-bold text-slate-600 truncate">{{ t.type }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden"><div class="h-full rounded-full transition-all" [class]="t.color" [style.width]="t.pct + '%'"></div></div>
              <span class="text-xs font-black text-slate-800 w-6">{{ t.count }}</span>
              <span class="text-[10px] text-slate-400 w-10 text-right">{{ t.pct }}%</span>
            </div>
          }
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.leave_balance_summary' | translate }}</h3>
        <div class="space-y-3">
          @for (b of balanceSummary(); track b.type) {
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-[11px] font-bold text-slate-700">{{ b.type }}</span>
              <div class="flex gap-3 text-xs">
                <div class="text-center"><p class="text-[10px] text-slate-400">Entitled</p><p class="font-black text-slate-800">{{ b.entitled }}</p></div>
                <div class="text-center"><p class="text-[10px] text-slate-400">Used</p><p class="font-black text-red-600">{{ b.used }}</p></div>
                <div class="text-center"><p class="text-[10px] text-slate-400">Balance</p><p class="font-black text-green-600">{{ b.balance }}</p></div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  </div>
  `
})
export class HrReportsLeavesComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);
  readonly totalRequests = computed(() => this.hr.leaveRequests().length);
  readonly approved = computed(() => this.hr.leaveRequests().filter(l => l.status === 'Approved').length);
  readonly pending = computed(() => this.hr.leaveRequests().filter(l => l.status === 'Pending').length);
  readonly daysUsed = computed(() => this.hr.leaveRequests().filter(l => l.status === 'Approved').reduce((s, l) => {
    const diff = new Date(l.endDate).getTime() - new Date(l.startDate).getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
    return s + (isNaN(days) ? 0 : days);
  }, 0));
  readonly byType = computed(() => {
    const total = this.totalRequests() || 1;
    return [
      { type: 'Annual', count: Math.round(total * 0.45), pct: 45, color: 'bg-blue-500' },
      { type: 'Sick', count: Math.round(total * 0.22), pct: 22, color: 'bg-red-400' },
      { type: 'Emergency', count: Math.round(total * 0.16), pct: 16, color: 'bg-orange-400' },
      { type: 'Maternity', count: Math.round(total * 0.08), pct: 8, color: 'bg-pink-400' },
      { type: 'Unpaid', count: Math.round(total * 0.09), pct: 9, color: 'bg-slate-400' },
    ];
  });
  readonly balanceSummary = computed(() => [
    { type: 'Annual Leave', entitled: 30, used: 14, balance: 16 },
    { type: 'Sick Leave', entitled: 15, used: 5, balance: 10 },
    { type: 'Emergency', entitled: 5, used: 2, balance: 3 },
    { type: 'Maternity', entitled: 70, used: 70, balance: 0 },
  ]);
  ngOnInit() { this.bc.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.reports' }, { label: 'hr.reports.nav_leaves' }]); }
}
