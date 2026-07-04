import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { PerformanceEval } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-perf-results',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.performance.res_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.performance.res_subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl font-bold text-xs">⬇ Export</button>
        <button class="px-3 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl font-bold text-xs">🖨️ Print</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-52">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search employee..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
      </div>
      <select [(ngModel)]="filterDept" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">{{ 'hr.performance.all_departments' | translate }}</option>
        @for (d of depts(); track d) { <option [value]="d">{{ d }}</option> }
      </select>
      <select [(ngModel)]="filterPeriod" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Periods</option>
        @for (p of periods; track p) { <option [value]="p">{{ p }}</option> }
      </select>
    </div>

    <!-- Department Ranking -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4 flex items-center gap-2"><span class="w-3 h-3 bg-primary rounded-sm"></span>{{ 'hr.performance.res_dept_ranking' | translate }}</h3>
        <div class="space-y-3">
          @for (d of deptRanking(); track d.dept; let i = $index) {
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" [class]="i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'">{{ i+1 }}</div>
              <div class="w-28 text-[11px] font-bold text-slate-700 truncate">{{ d.dept }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" [class]="i === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-primary'" [style.width]="d.avg + '%'"></div>
              </div>
              <div class="w-10 text-right text-sm font-black text-slate-800">{{ d.avg }}</div>
              <span [class]="ratingBadge(d.rating)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">{{ d.rating }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Company Stats -->
      <div class="space-y-3">
        <div class="bg-gradient-to-br from-primary to-indigo-700 rounded-2xl p-5 text-white shadow-md">
          <p class="text-[10px] font-bold uppercase opacity-80">Company Average</p>
          <p class="text-5xl font-black mt-1">{{ companyAvg() }}</p>
          <p class="text-xs opacity-60 mt-0.5">out of 100</p>
          <div class="mt-3 bg-white/20 rounded-full h-2"><div class="h-2 bg-white rounded-full" [style.width]="companyAvg() + '%'"></div></div>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 grid grid-cols-2 gap-3 text-center">
          <div><p class="text-xl font-black text-purple-600">{{ countRating('Outstanding') }}</p><p class="text-[10px] font-bold text-purple-700 uppercase mt-0.5">Outstanding</p></div>
          <div><p class="text-xl font-black text-indigo-600">{{ countRating('Excellent') }}</p><p class="text-[10px] font-bold text-indigo-700 uppercase mt-0.5">Excellent</p></div>
          <div><p class="text-xl font-black text-green-600">{{ countRating('Very Good') }}</p><p class="text-[10px] font-bold text-green-700 uppercase mt-0.5">Very Good</p></div>
          <div><p class="text-xl font-black text-red-600">{{ countRating('Needs Improvement') + countRating('Unsatisfactory') }}</p><p class="text-[10px] font-bold text-red-700 uppercase mt-0.5">Below Target</p></div>
        </div>
      </div>
    </div>

    <!-- Employee Results Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
        <h3 class="text-xs font-black text-slate-700">{{ 'hr.performance.res_section_summary' | translate }}</h3>
        <span class="text-[11px] text-slate-400 font-semibold">{{ filteredResults().length }} employees</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Employee</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Department</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Latest Score</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Rating</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">vs Company</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Promotion</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Salary Inc.</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">PIP</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (r of filteredResults(); track r.employeeId) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-primary" [class]="ratingAvatarBg(r.rating)">{{ r.name[0] }}</div>
                    <div><p class="font-bold text-slate-800">{{ r.name }}</p><p class="text-[10px] text-slate-400">{{ r.job }}</p></div>
                  </div>
                </td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ r.dept }}</td>
                <td class="px-4 py-3 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-lg font-black" [class]="r.score >= 85 ? 'text-green-600' : r.score >= 65 ? 'text-amber-600' : 'text-red-600'">{{ r.score }}</span>
                    <div class="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden"><div class="h-full rounded-full" [class]="r.score >= 85 ? 'bg-green-500' : r.score >= 65 ? 'bg-amber-400' : 'bg-red-500'" [style.width]="r.score + '%'"></div></div>
                  </div>
                </td>
                <td class="px-4 py-3 text-center"><span [class]="ratingBadge(r.rating)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ r.rating }}</span></td>
                <td class="px-4 py-3 text-center">
                  <span [class]="r.score > companyAvg() ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'" class="text-[11px] font-black px-2 py-0.5 rounded-lg">
                    {{ r.score > companyAvg() ? '+' : '' }}{{ (r.score - companyAvg()) | number:'1.0-1' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  @if (r.score >= 85) { <span class="text-green-600 font-black text-sm">✓</span> }
                  @else { <span class="text-slate-300 text-sm">—</span> }
                </td>
                <td class="px-4 py-3 text-center">
                  @if (r.score >= 75) { <span class="text-indigo-600 font-black text-sm">✓</span> }
                  @else { <span class="text-slate-300 text-sm">—</span> }
                </td>
                <td class="px-4 py-3 text-center">
                  @if (r.score < 55) { <span class="text-red-600 font-black bg-red-50 text-[10px] px-2 py-0.5 rounded-full">PIP</span> }
                  @else { <span class="text-slate-300 text-sm">—</span> }
                </td>
                <td class="px-4 py-3 text-center">
                  <button (click)="showDetail(r)" class="px-2 py-1 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg text-[10px] font-bold">Details</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="px-4 py-10 text-center text-slate-400 text-xs font-semibold">No results found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    @if (detailEmployee()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" (click)="selectedEmpId.set('')">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" (click)="$event.stopPropagation()">
          @for (r of [detailEmployee()!]; track r.employeeId) {
            <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
              <div>
                <h3 class="font-black text-slate-800 text-sm">{{ r.name }}</h3>
                <p class="text-[10px] text-slate-400 mt-0.5">{{ r.dept }} · {{ r.job }}</p>
              </div>
              <button (click)="selectedEmpId.set('')" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>
            <div class="p-5 space-y-4 text-xs">
              <!-- Score Radar (Visual) -->
              <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 grid grid-cols-3 gap-3 text-white text-center">
                @for (sec of r.sections; track sec.label) {
                  <div>
                    <p class="text-[9px] opacity-60 uppercase">{{ sec.label }}</p>
                    <p class="text-xl font-black mt-0.5" [class]="sec.score >= 80 ? 'text-green-300' : sec.score >= 60 ? 'text-amber-300' : 'text-red-400'">{{ sec.score }}</p>
                    <div class="w-full bg-white/10 rounded-full h-1 mt-1 overflow-hidden"><div class="h-full bg-white/60 rounded-full" [style.width]="sec.score + '%'"></div></div>
                  </div>
                }
              </div>
              <!-- History -->
              <div>
                <p class="text-[10px] font-black text-slate-400 uppercase mb-2">{{ 'hr.performance.res_section_history' | translate }}</p>
                <div class="flex gap-3 flex-wrap">
                  @for (h of r.history; track h.period) {
                    <div class="flex-1 min-w-24 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                      <p class="text-[10px] text-slate-400 font-semibold">{{ h.period }}</p>
                      <p class="text-2xl font-black mt-1" [class]="h.score >= 85 ? 'text-green-600' : h.score >= 65 ? 'text-amber-600' : 'text-red-600'">{{ h.score }}</p>
                      <span [class]="ratingBadge(h.rating)" class="text-[9px] font-bold px-1.5 py-0.5 rounded-full border">{{ h.rating }}</span>
                    </div>
                  }
                </div>
              </div>
              <!-- Recommendations -->
              <div class="grid grid-cols-2 gap-3">
                <div class="border rounded-xl p-3" [class]="r.score >= 85 ? 'border-green-100 bg-green-50' : 'border-slate-100 bg-slate-50'">
                  <p class="text-[10px] font-black uppercase mb-1" [class]="r.score >= 85 ? 'text-green-700' : 'text-slate-400'">{{ 'hr.performance.res_section_promotion' | translate }}</p>
                  <p class="font-bold" [class]="r.score >= 85 ? 'text-green-800' : 'text-slate-500'">{{ r.score >= 85 ? '✓ Recommended' : '— Not Yet' }}</p>
                </div>
                <div class="border rounded-xl p-3" [class]="r.score >= 75 ? 'border-indigo-100 bg-indigo-50' : 'border-slate-100 bg-slate-50'">
                  <p class="text-[10px] font-black uppercase mb-1" [class]="r.score >= 75 ? 'text-indigo-700' : 'text-slate-400'">{{ 'hr.performance.res_section_salary' | translate }}</p>
                  <p class="font-bold" [class]="r.score >= 75 ? 'text-indigo-800' : 'text-slate-500'">{{ r.score >= 75 ? '✓ Recommended' : '— Not Yet' }}</p>
                </div>
                <div class="border rounded-xl p-3" [class]="r.score >= 85 ? 'border-amber-100 bg-amber-50' : 'border-slate-100 bg-slate-50'">
                  <p class="text-[10px] font-black uppercase mb-1" [class]="r.score >= 85 ? 'text-amber-700' : 'text-slate-400'">{{ 'hr.performance.res_section_bonus' | translate }}</p>
                  <p class="font-bold" [class]="r.score >= 85 ? 'text-amber-800' : 'text-slate-500'">{{ r.score >= 85 ? '✓ Recommended' : '— Not Eligible' }}</p>
                </div>
                <div class="border rounded-xl p-3" [class]="r.score < 55 ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-slate-50'">
                  <p class="text-[10px] font-black uppercase mb-1" [class]="r.score < 55 ? 'text-red-700' : 'text-slate-400'">{{ 'hr.performance.rec_pip' | translate }}</p>
                  <p class="font-bold" [class]="r.score < 55 ? 'text-red-800' : 'text-slate-500'">{{ r.score < 55 ? '⚠ Required' : '— Not Required' }}</p>
                </div>
              </div>
              <!-- Training -->
              @if (trainingFor(r.employeeId).length > 0) {
                <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p class="text-[10px] font-black text-amber-700 uppercase mb-2">{{ 'hr.performance.res_section_training' | translate }}</p>
                  @for (t of trainingFor(r.employeeId); track t) {
                    <div class="flex items-center gap-2 mt-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span class="text-xs font-semibold text-amber-800">{{ t }}</span></div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  </div>
  `
})
export class HrPerformanceResultsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = ''; filterDept = ''; filterPeriod = '';
  selectedEmpId = signal('');

  readonly periods = ['Annual 2025','Q1 2026','Q2 2026','Annual 2026'];
  readonly depts = computed(() => [...new Set(this.hr.performanceEvals().map(e => e.departmentName || '').filter(Boolean))]);

  readonly companyAvg = computed(() => {
    const evals = this.hr.performanceEvals().filter(e => e.overallScore > 0);
    return evals.length ? parseFloat((evals.reduce((s, e) => s + e.overallScore, 0) / evals.length).toFixed(1)) : 0;
  });

  readonly deptRanking = computed(() => {
    const map = new Map<string, number[]>();
    this.hr.performanceEvals().forEach(e => {
      if (!map.has(e.departmentName!)) map.set(e.departmentName!, []);
      map.get(e.departmentName!)!.push(e.overallScore);
    });
    return [...map.entries()].map(([dept, scores]) => {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return { dept, avg, rating: avg >= 85 ? 'Excellent' : avg >= 75 ? 'Very Good' : avg >= 65 ? 'Good' : 'Needs Improvement' };
    }).sort((a, b) => b.avg - a.avg);
  });

  readonly allResults = computed(() => {
    const empMap = new Map<string, PerformanceEval[]>();
    this.hr.performanceEvals().forEach(e => {
      if (!empMap.has(e.employeeId)) empMap.set(e.employeeId, []);
      empMap.get(e.employeeId)!.push(e);
    });
    return [...empMap.entries()].map(([empId, evals]) => {
      const latest = evals.sort((a, b) => a.period.localeCompare(b.period)).at(-1)!;
      return {
        employeeId: empId,
        name: latest.employeeName,
        dept: latest.departmentName || '',
        job: latest.jobTitle || '',
        score: latest.overallScore,
        rating: latest.finalRating,
        history: evals.map(e => ({ period: e.period, score: e.overallScore, rating: e.finalRating })),
        sections: [
          { label: 'Technical', score: latest.technicalScore },
          { label: 'Quality', score: latest.qualityScore },
          { label: 'Productivity', score: latest.productivityScore },
          { label: 'Communication', score: latest.communicationScore },
          { label: 'Leadership', score: latest.leadershipScore },
          { label: 'Safety', score: latest.safetyScore },
        ],
      };
    });
  });

  readonly filteredResults = computed(() => {
    let list = this.allResults();
    if (this.search) list = list.filter(r => r.name.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterDept) list = list.filter(r => r.dept === this.filterDept);
    return list.sort((a, b) => b.score - a.score);
  });

  readonly detailEmployee = computed(() => this.filteredResults().find(r => r.employeeId === this.selectedEmpId()) || null);

  showDetail(r: { employeeId: string }) { this.selectedEmpId.set(r.employeeId); }

  countRating(r: string) { return this.hr.performanceEvals().filter(e => e.finalRating === r).length; }

  trainingFor(empId: string) {
    return this.hr.competencyRecords().filter(c => c.employeeId === empId && c.trainingNeeded && c.trainingCourse).map(c => c.trainingCourse!);
  }

  ratingBadge(r: string) {
    const m: Record<string,string> = {'Outstanding':'bg-purple-50 text-purple-700 border-purple-100','Excellent':'bg-indigo-50 text-indigo-700 border-indigo-100','Very Good':'bg-green-50 text-green-700 border-green-100','Good':'bg-blue-50 text-blue-700 border-blue-100','Acceptable':'bg-amber-50 text-amber-700 border-amber-100','Needs Improvement':'bg-orange-50 text-orange-700 border-orange-100','Unsatisfactory':'bg-red-50 text-red-700 border-red-100'};
    return m[r]||'bg-slate-100 text-slate-500 border-slate-200';
  }

  ratingAvatarBg(r: string) {
    const m: Record<string,string> = {'Outstanding':'bg-purple-100','Excellent':'bg-indigo-100','Very Good':'bg-green-100','Good':'bg-blue-100','Acceptable':'bg-amber-100','Needs Improvement':'bg-orange-100','Unsatisfactory':'bg-red-100'};
    return m[r]||'bg-slate-100';
  }

  ngOnInit() { this.breadcrumb.setBreadcrumbs([{label:'navigation.hr'},{label:'navigation.performance'},{label:'hr.performance.res_title'}]); }
}
