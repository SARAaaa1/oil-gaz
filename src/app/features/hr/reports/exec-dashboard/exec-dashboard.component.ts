import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-reports-exec-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.exec_headcount' | translate }} — {{ 'hr.reports.nav_dashboard' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button class="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_pdf' | translate }}</button>
        <button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_excel' | translate }}</button>
        <button class="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold">🖨️ {{ 'hr.reports.btn_print' | translate }}</button>
      </div>
    </div>

    <!-- Sub Nav -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
      <div class="flex gap-1 p-2 min-w-max">
        @for (nav of navItems; track nav.path) {
          <a [routerLink]="'/hr/' + nav.path" routerLinkActive="bg-primary text-white shadow-sm" class="px-3 py-2 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors whitespace-nowrap">{{ nav.label | translate }}</a>
        }
      </div>
    </div>

    <!-- KPI Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      @for (kpi of kpis(); track kpi.label) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase">{{ kpi.label | translate }}</p>
              <p class="text-2xl font-black mt-1" [class]="kpi.color">{{ kpi.value }}</p>
              <p class="text-[10px] font-semibold mt-1" [class]="kpi.change > 0 ? 'text-green-600' : 'text-red-600'">
                {{ kpi.change > 0 ? '▲' : '▼' }} {{ kpi.change | number:'1.0-1' }}% {{ 'hr.reports.vs_last' | translate }}
              </p>
            </div>
            <span class="text-2xl">{{ kpi.icon }}</span>
          </div>
        </div>
      }
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Headcount by Dept -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.exec_by_dept' | translate }}</h3>
        <div class="space-y-3">
          @for (d of deptDist(); track d.name) {
            <div class="flex items-center gap-3">
              <div class="w-28 text-[11px] font-bold text-slate-600 truncate">{{ d.name }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-700" [style.width]="d.pct + '%'"></div>
              </div>
              <div class="w-12 text-right text-xs font-black text-slate-800">{{ d.count }}</div>
              <div class="w-10 text-right text-[11px] text-slate-400">{{ d.pct }}%</div>
            </div>
          }
        </div>
      </div>

      <!-- Gender + Nationality -->
      <div class="space-y-3">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 class="text-xs font-black text-slate-700 mb-3">{{ 'hr.reports.exec_by_gender' | translate }}</h3>
          <div class="space-y-2">
            @for (g of genderDist(); track g.label) {
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full flex-shrink-0" [class]="g.color"></div>
                <span class="flex-1 text-[11px] font-semibold text-slate-600">{{ g.label }}</span>
                <span class="text-xs font-black text-slate-800">{{ g.count }}</span>
                <span class="text-[10px] text-slate-400 w-10 text-right">{{ g.pct }}%</span>
              </div>
            }
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 class="text-xs font-black text-slate-700 mb-3">{{ 'hr.reports.exec_by_age' | translate }}</h3>
          <div class="space-y-2">
            @for (a of ageDist(); track a.label) {
              <div class="flex items-center gap-2">
                <div class="flex-1 text-[11px] font-semibold text-slate-600">{{ a.label }}</div>
                <div class="w-20 bg-slate-100 rounded-full h-2 overflow-hidden"><div class="h-full bg-indigo-400 rounded-full" [style.width]="a.pct + '%'"></div></div>
                <span class="text-xs font-black text-slate-800 w-6 text-right">{{ a.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Monthly Trend Bar Chart -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.exec_monthly_trend' | translate }}</h3>
      <div class="flex items-end gap-2 h-36">
        @for (m of monthlyTrend(); track m.label) {
          <div class="flex-1 flex flex-col items-center gap-1">
            <span class="text-[9px] font-black text-primary">{{ m.count }}</span>
            <div class="w-full rounded-t-lg bg-gradient-to-t from-primary to-indigo-400 transition-all duration-700" [style.height]="(m.count / maxTrend() * 100) + '%'" style="min-height:4px"></div>
            <span class="text-[9px] font-semibold text-slate-400 truncate w-full text-center">{{ m.label }}</span>
          </div>
        }
      </div>
    </div>

    <!-- Bottom: Leave Usage + Performance Dist -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.exec_leave_usage' | translate }}</h3>
        <div class="space-y-2.5">
          @for (l of leaveUsage(); track l.type) {
            <div class="flex items-center gap-3">
              <div class="w-24 text-[11px] font-bold text-slate-600 truncate">{{ l.type }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="h-full rounded-full" [class]="l.color" [style.width]="l.pct + '%'"></div></div>
              <span class="text-xs font-black text-slate-800 w-8 text-right">{{ l.count }}</span>
            </div>
          }
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.exec_perf_dist' | translate }}</h3>
        <div class="space-y-2.5">
          @for (p of perfDist(); track p.rating) {
            <div class="flex items-center gap-3">
              <div class="w-28 text-[11px] font-bold text-slate-600 truncate">{{ p.rating }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden"><div class="h-full rounded-full" [class]="p.color" [style.width]="p.pct + '%'"></div></div>
              <span class="text-xs font-black text-slate-800 w-8 text-right">{{ p.count }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  </div>
  `
})
export class HrReportsExecDashboardComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  readonly navItems = [
    { path: 'reports/dashboard', label: 'hr.reports.nav_dashboard' },
    { path: 'reports/employees', label: 'hr.reports.nav_employees' },
    { path: 'reports/recruitment', label: 'hr.reports.nav_recruitment' },
    { path: 'reports/attendance', label: 'hr.reports.nav_attendance' },
    { path: 'reports/leaves', label: 'hr.reports.nav_leaves' },
    { path: 'reports/payroll', label: 'hr.reports.nav_payroll' },
    { path: 'reports/performance', label: 'hr.reports.nav_performance' },
    { path: 'reports/turnover', label: 'hr.reports.nav_turnover' },
    { path: 'reports/custom', label: 'hr.reports.nav_custom' },
  ];

  readonly kpis = computed(() => {
    const emps = this.hr.employees();
    const total = emps.length;
    return [
      { label: 'hr.reports.exec_headcount', value: total, change: 3.2, color: 'text-slate-800', icon: '👥' },
      { label: 'hr.reports.exec_attendance_rate', value: '94.2%', change: 1.1, color: 'text-green-600', icon: '📋' },
      { label: 'hr.reports.exec_turnover', value: '8.4%', change: -0.6, color: 'text-amber-600', icon: '🔄' },
      { label: 'hr.reports.exec_open_positions', value: 12, change: 2.0, color: 'text-blue-600', icon: '📌' },
      { label: 'hr.reports.exec_payroll_cost', value: 'SAR 2.4M', change: 1.8, color: 'text-indigo-600', icon: '💰' },
      { label: 'hr.reports.exec_avg_salary', value: 'SAR 12,400', change: 0.5, color: 'text-slate-700', icon: '📊' },
      { label: 'hr.reports.exec_training_hrs', value: 286, change: 12.0, color: 'text-purple-600', icon: '🎓' },
      { label: 'hr.reports.exec_pending_approvals', value: this.hr.pendingEvals(), change: -5.0, color: 'text-red-600', icon: '⏳' },
    ];
  });

  readonly deptDist = computed(() => {
    const map = new Map<string, number>();
    this.hr.employees().forEach(e => { const d = e.departmentId || 'Other'; map.set(d, (map.get(d) || 0) + 1); });
    const total = this.hr.employees().length;
    const depts = ['Engineering', 'HR', 'Finance', 'Operations', 'HSE', 'Maintenance', 'Drilling'];
    return depts.map((name, i) => ({ name, count: 8 + i * 3, pct: Math.round((8 + i * 3) / total * 100) })).sort((a, b) => b.count - a.count).slice(0, 6);
  });

  readonly genderDist = computed(() => [
    { label: 'Male', count: Math.round(this.hr.employees().length * 0.73), pct: 73, color: 'bg-blue-500' },
    { label: 'Female', count: Math.round(this.hr.employees().length * 0.27), pct: 27, color: 'bg-pink-400' },
  ]);

  readonly ageDist = computed(() => [
    { label: '20–30', count: 18, pct: 30 }, { label: '31–40', count: 24, pct: 40 },
    { label: '41–50', count: 12, pct: 20 }, { label: '50+', count: 6, pct: 10 },
  ]);

  readonly monthlyTrend = computed(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((label, i) => ({ label, count: 52 + Math.round(Math.sin(i) * 4 + i * 0.8) }));
  });

  readonly maxTrend = computed(() => Math.max(...this.monthlyTrend().map(m => m.count)));

  readonly leaveUsage = computed(() => [
    { type: 'Annual', count: 142, pct: 45, color: 'bg-blue-400' },
    { type: 'Sick', count: 67, pct: 21, color: 'bg-red-400' },
    { type: 'Emergency', count: 48, pct: 15, color: 'bg-orange-400' },
    { type: 'Unpaid', count: 28, pct: 9, color: 'bg-slate-400' },
    { type: 'Other', count: 32, pct: 10, color: 'bg-purple-400' },
  ]);

  readonly perfDist = computed(() => [
    { rating: 'Outstanding', count: this.hr.performanceEvals().filter(e => e.finalRating === 'Outstanding').length, pct: 8, color: 'bg-purple-500' },
    { rating: 'Excellent', count: this.hr.performanceEvals().filter(e => e.finalRating === 'Excellent').length, pct: 22, color: 'bg-indigo-500' },
    { rating: 'Very Good', count: this.hr.performanceEvals().filter(e => e.finalRating === 'Very Good').length, pct: 35, color: 'bg-green-500' },
    { rating: 'Good', count: this.hr.performanceEvals().filter(e => e.finalRating === 'Good').length, pct: 25, color: 'bg-blue-400' },
    { rating: 'Needs Improve.', count: this.hr.performanceEvals().filter(e => e.finalRating === 'Needs Improvement').length, pct: 10, color: 'bg-red-400' },
  ]);

  ngOnInit() { this.bc.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.reports' }, { label: 'hr.reports.nav_dashboard' }]); }
}
