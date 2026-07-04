import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-reports-turnover',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-5" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800">{{ 'hr.reports.turn_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.turn_subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_pdf' | translate }}</button>
        <button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_excel' | translate }}</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-slate-800">{{ turnoverRate() }}%</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.reports.turn_rate' | translate }}</p>
      </div>
      <div class="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-blue-600">{{ voluntaryExits() }}</p>
        <p class="text-[10px] font-bold text-blue-700 uppercase mt-1">{{ 'hr.reports.turn_voluntary' | translate }}</p>
      </div>
      <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-red-600">{{ involuntaryExits() }}</p>
        <p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.reports.turn_involuntary' | translate }}</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-green-600">{{ replacements() }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.reports.turn_new_hires' | translate }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- By Department -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.turn_by_dept' | translate }}</h3>
        <div class="space-y-3">
          @for (d of deptTurnover(); track d.dept) {
            <div class="flex items-center gap-3">
              <div class="w-24 text-[11px] font-bold text-slate-600 truncate">{{ d.dept }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="h-full bg-red-400 rounded-full transition-all duration-500" [style.width]="d.rate * 8 + '%'"></div>
              </div>
              <span class="text-xs font-black text-slate-800 w-8 text-right">{{ d.exits }}</span>
              <span class="text-[10px] text-slate-400 w-10 text-right">{{ d.rate }}%</span>
            </div>
          }
        </div>
      </div>

      <!-- By Reason -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.turn_by_reason' | translate }}</h3>
        <div class="space-y-3">
          @for (r of turnoverReasons(); track r.reason) {
            <div class="flex items-center gap-3">
              <div class="w-32 text-[11px] font-bold text-slate-600 truncate">{{ r.reason | translate }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" [style.width]="r.pct + '%'"></div>
              </div>
              <span class="text-xs font-black text-slate-800 w-6">{{ r.count }}</span>
              <span class="text-[10px] text-slate-400 w-8">{{ r.pct }}%</span>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Monthly Trend -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.turn_trend' | translate }}</h3>
      <div class="flex items-end gap-1.5 h-28">
        @for (m of monthlyTurnover(); track m.label) {
          <div class="flex-1 flex flex-col items-center gap-1">
            <span class="text-[9px] font-black text-red-600">{{ m.rate }}%</span>
            <div class="w-full rounded-t-lg bg-red-400 transition-all" [style.height]="(m.rate * 10) + '%'" style="min-height:4px"></div>
            <span class="text-[9px] text-slate-400">{{ m.label }}</span>
          </div>
        }
      </div>
    </div>
  </div>
  `
})
export class HrReportsTurnoverComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  readonly turnoverRate = signal(4.8);
  readonly voluntaryExits = signal(3);
  readonly involuntaryExits = signal(1);
  readonly replacements = signal(5);

  readonly deptTurnover = computed(() => [
    { dept: 'Drilling', exits: 2, rate: 8.3 },
    { dept: 'Operations', exits: 1, rate: 4.5 },
    { dept: 'Maintenance', exits: 1, rate: 3.8 },
    { dept: 'Finance', exits: 0, rate: 0.0 },
    { dept: 'HR', exits: 0, rate: 0.0 },
    { dept: 'HSE', exits: 0, rate: 0.0 }
  ]);

  readonly turnoverReasons = computed(() => [
    { reason: 'hr.reports.turn_reason_resignation', count: 3, pct: 75 },
    { reason: 'hr.reports.turn_reason_termination', count: 1, pct: 25 },
    { reason: 'hr.reports.turn_reason_retirement', count: 0, pct: 0 },
    { reason: 'hr.reports.turn_reason_contract', count: 0, pct: 0 }
  ]);

  readonly monthlyTurnover = computed(() => [
    { label: 'J', rate: 0.4 }, { label: 'F', rate: 0.2 }, { label: 'M', rate: 0.5 },
    { label: 'A', rate: 0.3 }, { label: 'M', rate: 0.8 }, { label: 'J', rate: 0.4 },
    { label: 'J', rate: 0.5 }, { label: 'A', rate: 0.3 }, { label: 'S', rate: 0.6 },
    { label: 'O', rate: 0.2 }, { label: 'N', rate: 0.4 }, { label: 'D', rate: 0.2 }
  ]);

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'navigation.reports' },
      { label: 'hr.reports.nav_turnover' }
    ]);
  }
}
