import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-perf-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.performance.nav_dashboard' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.performance.subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <a routerLink="/hr/performance/reviews" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">+ New Evaluation</a>
        <a routerLink="/hr/performance/goals" class="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs">🎯 Goals</a>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="col-span-2 sm:col-span-3 lg:col-span-2 bg-gradient-to-br from-primary to-indigo-700 rounded-2xl p-5 text-white shadow-md">
        <p class="text-[10px] font-bold uppercase opacity-80">{{ 'hr.performance.dash_avg_score' | translate }}</p>
        <p class="text-5xl font-black mt-1">{{ hr.avgPerfScore() }}<span class="text-lg opacity-60">/100</span></p>
        <div class="mt-3 bg-white/20 rounded-full h-2"><div class="h-2 bg-white rounded-full" [style.width]="hr.avgPerfScore() + '%'"></div></div>
        <p class="text-xs font-semibold opacity-70 mt-1">Company Average</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-green-600">{{ hr.totalEvaluated() }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.performance.dash_total_evaluated' | translate }}</p>
      </div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-amber-600">{{ hr.pendingEvals() }}</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.performance.dash_pending' | translate }}</p>
      </div>
      <div class="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-indigo-600">{{ hr.topPerformers() }}</p>
        <p class="text-[10px] font-bold text-indigo-700 uppercase mt-1">{{ 'hr.performance.dash_top_performers' | translate }}</p>
      </div>
      <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-red-600">{{ hr.belowTargetEmployees() }}</p>
        <p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.performance.dash_below_target' | translate }}</p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Department Performance -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4 flex items-center gap-2">
          <span class="w-3 h-3 bg-primary rounded-sm"></span>{{ 'hr.performance.dash_dept_perf' | translate }}
        </h3>
        <div class="space-y-3">
          @for (dept of deptPerformance(); track dept.name) {
            <div class="flex items-center gap-3">
              <div class="w-28 text-[11px] font-bold text-slate-500 truncate">{{ dept.name }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" [class]="dept.barColor" [style.width]="dept.avg + '%'"></div>
              </div>
              <div class="w-10 text-right text-xs font-black" [class]="dept.textColor">{{ dept.avg }}</div>
              <span [class]="dept.badge" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">{{ dept.rating }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Rating Distribution -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4 flex items-center gap-2">
          <span class="w-3 h-3 bg-indigo-500 rounded-sm"></span>Rating Distribution
        </h3>
        <div class="space-y-2.5">
          @for (r of ratingDist(); track r.label) {
            <div class="flex items-center gap-2">
              <div [class]="r.dot" class="w-2.5 h-2.5 rounded-full flex-shrink-0"></div>
              <div class="flex-1 text-[11px] font-semibold text-slate-600 truncate">{{ r.label }}</div>
              <div class="w-6 text-[11px] font-black text-slate-700 text-right">{{ r.count }}</div>
              <div class="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="h-full rounded-full" [class]="r.bar" [style.width]="r.pct + '%'"></div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Bottom Row: Top Performers + Goals + Activities -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Top Performers List -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-50 bg-gradient-to-r from-amber-50 to-yellow-50 flex items-center gap-2">
          <span class="text-lg">🏆</span>
          <h3 class="text-xs font-black text-amber-800">Top Performers</h3>
        </div>
        <div class="divide-y divide-slate-50">
          @for (e of topEvals().slice(0,6); track e.id; let i = $index) {
            <div class="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" [class]="rankBg(i)">{{ i+1 }}</div>
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center text-sm font-black text-primary">{{ e.employeeName[0] }}</div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-800 truncate">{{ e.employeeName }}</p>
                <p class="text-[10px] text-slate-400">{{ e.departmentName }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-black text-primary">{{ e.overallScore }}</p>
                <p class="text-[9px] font-bold text-slate-400">{{ e.finalRating }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Goals Overview -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 class="text-xs font-black text-slate-700">🎯 {{ 'hr.performance.nav_goals' | translate }}</h3>
          <a routerLink="/hr/performance/goals" class="text-[10px] text-primary font-bold hover:underline">View All</a>
        </div>
        <div class="divide-y divide-slate-50">
          @for (g of hr.performanceGoals().slice(0,6); track g.id) {
            <div class="px-4 py-3">
              <div class="flex items-start justify-between mb-1.5">
                <p class="text-[11px] font-bold text-slate-700 flex-1 truncate me-2">{{ g.title }}</p>
                <span [class]="goalStatusBadge(g.status)" class="text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap">{{ g.status }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div class="h-full bg-primary rounded-full" [style.width]="g.completionPct + '%'"></div>
                </div>
                <span class="text-[10px] font-black text-primary">{{ g.completionPct }}%</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Quick Actions + Upcoming -->
      <div class="space-y-3">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 class="text-xs font-black text-slate-700 mb-3">{{ 'hr.performance.dash_quick_actions' | translate }}</h3>
          <div class="grid grid-cols-2 gap-2">
            <a routerLink="/hr/performance/reviews" class="flex flex-col items-center gap-1.5 p-3 bg-primary/5 hover:bg-primary/10 rounded-xl text-center transition-colors">
              <span class="text-2xl">📋</span><span class="text-[10px] font-bold text-primary">New Review</span>
            </a>
            <a routerLink="/hr/performance/templates" class="flex flex-col items-center gap-1.5 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-center transition-colors">
              <span class="text-2xl">📁</span><span class="text-[10px] font-bold text-indigo-700">Templates</span>
            </a>
            <a routerLink="/hr/performance/competencies" class="flex flex-col items-center gap-1.5 p-3 bg-green-50 hover:bg-green-100 rounded-xl text-center transition-colors">
              <span class="text-2xl">🧠</span><span class="text-[10px] font-bold text-green-700">Competencies</span>
            </a>
            <a routerLink="/hr/performance/results" class="flex flex-col items-center gap-1.5 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-center transition-colors">
              <span class="text-2xl">📊</span><span class="text-[10px] font-bold text-amber-700">Results</span>
            </a>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 class="text-xs font-black text-slate-700 mb-3">Training Needs</h3>
          <div class="space-y-2">
            @for (c of trainingNeededList(); track c.id) {
              <div class="flex items-center gap-2 text-xs">
                <span class="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span>
                <span class="flex-1 font-semibold text-slate-700 truncate">{{ c.employeeName }}</span>
                <span class="text-[10px] text-slate-400 truncate">{{ c.trainingCourse }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class HrPerfDashboardComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  readonly topEvals = computed(() =>
    [...this.hr.performanceEvals()].sort((a, b) => b.overallScore - a.overallScore).slice(0, 8)
  );

  readonly deptPerformance = computed(() => {
    const map = new Map<string, number[]>();
    this.hr.performanceEvals().forEach(e => {
      if (!map.has(e.departmentName!)) map.set(e.departmentName!, []);
      map.get(e.departmentName!)!.push(e.overallScore);
    });
    const colors = ['bg-primary', 'bg-green-500', 'bg-amber-500', 'bg-indigo-500', 'bg-purple-500', 'bg-rose-500'];
    const textColors = ['text-primary', 'text-green-600', 'text-amber-600', 'text-indigo-600', 'text-purple-600', 'text-rose-600'];
    const badges = ['bg-primary/10 text-primary border-primary/20', 'bg-green-50 text-green-700 border-green-100', 'bg-amber-50 text-amber-700 border-amber-100', 'bg-indigo-50 text-indigo-700 border-indigo-100', 'bg-purple-50 text-purple-700 border-purple-100', 'bg-rose-50 text-rose-700 border-rose-100'];
    return [...map.entries()].map(([name, scores], i) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return { name, avg, barColor: colors[i % colors.length], textColor: textColors[i % textColors.length], badge: badges[i % badges.length], rating: avg >= 85 ? 'Excellent' : avg >= 75 ? 'Good' : avg >= 65 ? 'Acceptable' : 'Needs Improvement' };
    }).sort((a, b) => b.avg - a.avg);
  });

  readonly ratingDist = computed(() => {
    const ratings = ['Outstanding', 'Excellent', 'Very Good', 'Good', 'Acceptable', 'Needs Improvement', 'Unsatisfactory'];
    const dots = ['bg-purple-500', 'bg-indigo-500', 'bg-green-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'];
    const bars = ['bg-purple-500', 'bg-indigo-500', 'bg-green-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'];
    const total = this.hr.performanceEvals().length;
    return ratings.map((label, i) => {
      const count = this.hr.performanceEvals().filter(e => e.finalRating === label).length;
      return { label, count, pct: total ? Math.round(count / total * 100) : 0, dot: dots[i], bar: bars[i] };
    });
  });

  readonly trainingNeededList = computed(() => this.hr.competencyRecords().filter(c => c.trainingNeeded).slice(0, 4));

  rankBg(i: number) { return ['bg-amber-400 text-white', 'bg-slate-300 text-white', 'bg-amber-600 text-white'][i] || 'bg-slate-100 text-slate-600'; }
  goalStatusBadge(s: string) { return { 'Completed': 'bg-green-50 text-green-700 border-green-100', 'In Progress': 'bg-blue-50 text-blue-700 border-blue-100', 'Not Started': 'bg-slate-100 text-slate-500 border-slate-200', 'On Hold': 'bg-amber-50 text-amber-700 border-amber-100', 'Cancelled': 'bg-red-50 text-red-700 border-red-100' }[s] || 'bg-slate-100 text-slate-500 border-slate-200'; }

  ngOnInit() { this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.performance' }, { label: 'hr.performance.nav_dashboard' }]); }
}
