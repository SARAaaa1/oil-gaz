import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({ selector: 'app-hr-reports-payroll', standalone: true, imports: [CommonModule, TranslateModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-5" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div><h1 class="text-2xl font-black text-slate-800">{{ 'hr.reports.pay_title' | translate }}</h1><p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.pay_subtitle' | translate }}</p></div>
      <div class="flex gap-2"><button class="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_pdf' | translate }}</button><button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_excel' | translate }}</button></div>
    </div>
    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      @for (kpi of payKpis(); track kpi.label) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
          <p class="text-lg font-black" [class]="kpi.color">{{ kpi.value }}</p>
          <p class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{{ kpi.label | translate }}</p>
        </div>
      }
    </div>
    <!-- Dept Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-50"><h3 class="text-xs font-black text-slate-700">{{ 'hr.reports.pay_by_dept' | translate }}</h3></div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100"><tr>
            <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.pay_col_dept' | translate }}</th>
            <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.pay_col_emp_count' | translate }}</th>
            <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.pay_col_basic' | translate }}</th>
            <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.pay_col_allowances' | translate }}</th>
            <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.pay_col_net' | translate }}</th>
            <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.pay_col_pct' | translate }}</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-50">
            @for (d of deptPayroll(); track d.dept) {
              <tr class="hover:bg-slate-50/50">
                <td class="px-4 py-2.5 font-bold text-slate-800">{{ d.dept }}</td>
                <td class="px-4 py-2.5 text-center text-slate-600 font-semibold">{{ d.count }}</td>
                <td class="px-4 py-2.5 text-right font-semibold text-slate-700">{{ d.basic | number }}</td>
                <td class="px-4 py-2.5 text-right font-semibold text-indigo-600">{{ d.allowances | number }}</td>
                <td class="px-4 py-2.5 text-right font-black text-primary">{{ d.net | number }}</td>
                <td class="px-4 py-2.5 text-center">
                  <div class="flex items-center gap-1.5 justify-center">
                    <div class="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden"><div class="h-full bg-primary rounded-full" [style.width]="d.pct + '%'"></div></div>
                    <span class="text-[10px] font-bold text-slate-600">{{ d.pct }}%</span>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    <!-- Monthly Cost Trend -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.pay_monthly_trend' | translate }}</h3>
      <div class="flex items-end gap-1.5 h-32">
        @for (m of monthlyPayroll(); track m.label) {
          <div class="flex-1 flex flex-col items-center gap-1">
            <span class="text-[9px] font-black text-primary">{{ (m.cost / 1000) | number:'1.0-0' }}K</span>
            <div class="w-full rounded-t-lg bg-gradient-to-t from-primary to-indigo-400 transition-all" [style.height]="(m.cost / maxPayroll() * 100) + '%'" style="min-height:4px"></div>
            <span class="text-[9px] text-slate-400">{{ m.label }}</span>
          </div>
        }
      </div>
    </div>
  </div>
  `
})
export class HrReportsPayrollComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);
  readonly payKpis = computed(() => [
    { label: 'hr.reports.pay_total_cost', value: 'SAR 2.4M', color: 'text-primary' },
    { label: 'hr.reports.pay_basic_salary', value: 'SAR 1.8M', color: 'text-slate-800' },
    { label: 'hr.reports.pay_allowances', value: 'SAR 480K', color: 'text-indigo-600' },
    { label: 'hr.reports.pay_deductions', value: 'SAR 120K', color: 'text-red-600' },
    { label: 'hr.reports.pay_net_total', value: 'SAR 2.16M', color: 'text-green-600' },
    { label: 'hr.reports.pay_avg_salary', value: 'SAR 12.4K', color: 'text-amber-600' },
  ]);
  readonly deptPayroll = computed(() =>
    ['Engineering','HR','Finance','Operations','HSE','Drilling','Maintenance'].map((dept, i) => ({
      dept, count: 8 + i * 2, basic: (80000 + i * 15000), allowances: (20000 + i * 4000), net: (95000 + i * 18000), pct: 18 - i * 1.5
    }))
  );
  readonly monthlyPayroll = computed(() => ['J','F','M','A','M','J','J','A','S','O','N','D'].map((label, i) => ({ label, cost: 2100000 + Math.round(Math.sin(i * 0.6) * 80000 + i * 10000) })));
  readonly maxPayroll = computed(() => Math.max(...this.monthlyPayroll().map(m => m.cost)));
  ngOnInit() { this.bc.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.reports' }, { label: 'hr.reports.nav_payroll' }]); }
}
