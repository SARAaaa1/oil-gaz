import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({ selector: 'app-hr-reports-performance', standalone: true, imports: [CommonModule, TranslateModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-5" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div><h1 class="text-2xl font-black text-slate-800">{{ 'hr.reports.perf_title' | translate }}</h1><p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.perf_subtitle' | translate }}</p></div>
      <div class="flex gap-2"><button class="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_pdf' | translate }}</button><button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_excel' | translate }}</button></div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-gradient-to-br from-primary to-indigo-700 rounded-2xl shadow-md p-4 text-center text-white"><p class="text-4xl font-black">{{ hr.avgPerfScore() }}</p><p class="text-[10px] font-bold uppercase opacity-80 mt-1">{{ 'hr.reports.perf_avg_score' | translate }}</p></div>
      <div class="bg-purple-50 rounded-2xl border border-purple-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-purple-600">{{ topPct() }}%</p><p class="text-[10px] font-bold text-purple-700 uppercase mt-1">{{ 'hr.reports.perf_top_pct' | translate }}</p></div>
      <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-red-600">{{ belowPct() }}%</p><p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.reports.perf_below_pct' | translate }}</p></div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-green-600">{{ hr.completedEvals() }}</p><p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.reports.perf_completed' | translate }}</p></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.perf_by_rating' | translate }}</h3>
        <div class="space-y-3">
          @for (r of ratingDist(); track r.label) {
            <div class="flex items-center gap-3">
              <div class="w-24 text-[11px] font-bold text-slate-600 truncate">{{ r.label }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden"><div class="h-full rounded-full transition-all" [class]="r.color" [style.width]="r.pct + '%'"></div></div>
              <span class="text-xs font-black text-slate-800 w-6">{{ r.count }}</span>
              <span class="text-[10px] text-slate-400 w-10 text-right">{{ r.pct }}%</span>
            </div>
          }
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.perf_top_list' | translate }}</h3>
        <div class="space-y-2.5">
          @for (e of topPerformers().slice(0,6); track e.id; let i = $index) {
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" [class]="i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'">{{ i+1 }}</div>
              <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[11px] font-black text-primary">{{ e.employeeName[0] }}</div>
              <div class="flex-1 min-w-0"><p class="font-bold text-slate-800 text-xs truncate">{{ e.employeeName }}</p><p class="text-[10px] text-slate-400">{{ e.departmentName }}</p></div>
              <div class="text-right"><p class="text-sm font-black text-primary">{{ e.overallScore }}</p><p class="text-[9px] text-slate-400">{{ e.finalRating }}</p></div>
            </div>
          }
        </div>
      </div>
    </div>
    <!-- Promo candidates -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 class="text-xs font-black text-slate-700 mb-3">{{ 'hr.reports.perf_promo_list' | translate }}</h3>
      <div class="flex flex-wrap gap-2">
        @for (e of promoCandidates(); track e.id) {
          <div class="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
            <div class="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center text-[10px] font-black text-green-700">{{ e.employeeName[0] }}</div>
            <div><p class="text-[11px] font-bold text-slate-800">{{ e.employeeName }}</p><p class="text-[9px] text-slate-400">Score: {{ e.overallScore }}</p></div>
          </div>
        }
      </div>
    </div>
  </div>
  `
})
export class HrReportsPerformanceComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);
  readonly total = computed(() => this.hr.performanceEvals().length);
  readonly topPct = computed(() => { const t = this.total(); return t ? Math.round((this.hr.topPerformers() / t) * 100) : 0; });
  readonly belowPct = computed(() => { const t = this.total(); return t ? Math.round((this.hr.belowTargetEmployees() / t) * 100) : 0; });
  readonly ratingDist = computed(() => {
    const ratings = ['Outstanding','Excellent','Very Good','Good','Acceptable','Needs Improvement','Unsatisfactory'];
    const colors = ['bg-purple-500','bg-indigo-500','bg-green-500','bg-blue-400','bg-amber-400','bg-orange-500','bg-red-500'];
    const t = this.total() || 1;
    return ratings.map((label, i) => { const count = this.hr.performanceEvals().filter(e => e.finalRating === label).length; return { label, count, pct: Math.round(count / t * 100), color: colors[i] }; });
  });
  readonly topPerformers = computed(() => [...this.hr.performanceEvals()].sort((a, b) => b.overallScore - a.overallScore).slice(0, 8));
  readonly promoCandidates = computed(() => this.hr.performanceEvals().filter(e => e.overallScore >= 85 && e.status === 'Approved').slice(0, 6));
  ngOnInit() { this.bc.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.reports' }, { label: 'hr.reports.nav_performance' }]); }
}
