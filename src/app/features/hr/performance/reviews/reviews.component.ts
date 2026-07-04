import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { PerformanceEval } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-perf-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.performance.rev_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.performance.rev_subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl font-bold text-xs flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Export
        </button>
        <button (click)="openForm(null)" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">+ {{ 'hr.performance.rev_btn_new' | translate }}</button>
      </div>
    </div>

    <!-- Status Pills -->
    <div class="flex flex-wrap gap-2">
      @for (s of statuses; track s.val) {
        <button (click)="filterStatus = s.val" [class]="filterStatus === s.val ? s.active : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors">
          {{ s.label }} <span class="ml-1 opacity-70">({{ countByStatus(s.val) }})</span>
        </button>
      }
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-52">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search employee or eval #..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
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

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.rev_col_number' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.rev_col_employee' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.rev_col_dept' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.rev_col_evaluator' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Period</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.rev_col_score' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.rev_col_rating' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.rev_col_status' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.rev_col_actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (ev of pagedEvals(); track ev.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-bold text-primary text-[11px]">{{ ev.evalNumber }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-indigo-100 flex items-center justify-center text-[11px] font-black text-primary">{{ ev.employeeName[0] }}</div>
                    <div><p class="font-bold text-slate-800">{{ ev.employeeName }}</p><p class="text-[10px] text-slate-400">{{ ev.employeeNumber }}</p></div>
                  </div>
                </td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ ev.departmentName }}</td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ ev.managerName }}</td>
                <td class="px-4 py-3 text-slate-600 text-[11px] font-semibold">{{ ev.period }}</td>
                <td class="px-4 py-3 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span class="text-lg font-black" [class]="scoreColor(ev.overallScore)">{{ ev.overallScore }}</span>
                    <div class="w-12 bg-slate-100 rounded-full h-1 overflow-hidden"><div class="h-full rounded-full" [class]="scoreBar(ev.overallScore)" [style.width]="ev.overallScore + '%'"></div></div>
                  </div>
                </td>
                <td class="px-4 py-3 text-center"><span [class]="ratingBadge(ev.finalRating)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ ev.finalRating }}</span></td>
                <td class="px-4 py-3 text-center"><span [class]="statusBadge(ev.status)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ ev.status }}</span></td>
                <td class="px-4 py-3">
                  <div class="flex gap-1 justify-center">
                    <button (click)="openForm(ev)" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold">{{ 'hr.performance.rev_btn_view' | translate }}</button>
                    @if (ev.status === 'Pending Approval') {
                      <button (click)="hr.approveEval(ev.id)" class="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">✓</button>
                    }
                    <button class="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">🖨️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="px-4 py-10 text-center text-slate-400 text-xs font-semibold">No evaluations found</td></tr>
            }
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <p class="text-[11px] text-slate-400 font-semibold">Showing {{ minVal((page()-1)*pageSize+1, filteredEvals().length) }}–{{ minVal(page()*pageSize, filteredEvals().length) }} of {{ filteredEvals().length }}</p>
          <div class="flex gap-1">
            <button (click)="prevPage()" [disabled]="page()===1" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold disabled:opacity-40">‹</button>
            @for (p of pageArr(); track p) {
              <button (click)="page.set(p)" [class]="p===page() ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'" class="px-3 py-1.5 rounded-lg text-xs font-bold">{{ p }}</button>
            }
            <button (click)="nextPage()" [disabled]="page()===totalPages()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold disabled:opacity-40">›</button>
          </div>
        </div>
      }
    </div>

    <!-- Evaluation Detail Modal -->
    @if (selectedEval()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" (click)="selectedEval.set(null)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <div>
              <h3 class="font-black text-slate-800 text-sm">{{ selectedEval()!.evalNumber }} — {{ selectedEval()!.employeeName }}</h3>
              <p class="text-[10px] text-slate-400 mt-0.5">{{ selectedEval()!.period }} · {{ selectedEval()!.departmentName }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span [class]="ratingBadge(selectedEval()!.finalRating)" class="px-3 py-1 rounded-xl text-xs font-black border">{{ selectedEval()!.finalRating }}</span>
              <button (click)="selectedEval.set(null)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>
          </div>
          <div class="p-5 space-y-5 text-xs">
            <!-- Score Hero -->
            <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 flex items-center justify-around text-white">
              <div class="text-center"><p class="text-[10px] opacity-60 uppercase">Overall Score</p><p class="text-5xl font-black mt-1">{{ selectedEval()!.overallScore }}</p><p class="text-[10px] opacity-50 mt-0.5">/ 100</p></div>
              <div class="grid grid-cols-2 gap-3">
                @for (sec of evalSections(); track sec.key) {
                  <div class="text-center"><p class="text-[9px] opacity-60 uppercase">{{ sec.label }}</p><p class="text-lg font-black mt-0.5" [class]="sec.score >= 80 ? 'text-green-300' : sec.score >= 60 ? 'text-amber-300' : 'text-red-400'">{{ sec.score }}</p></div>
                }
              </div>
            </div>
            <!-- Section Score Bars -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (sec of evalSections(); track sec.key) {
                <div>
                  <div class="flex justify-between mb-1"><span class="font-semibold text-slate-600">{{ sec.label }}</span><span class="font-black text-slate-800">{{ sec.score }}/100</span></div>
                  <div class="bg-slate-100 rounded-full h-2 overflow-hidden"><div class="h-full rounded-full transition-all" [class]="sec.score >= 80 ? 'bg-green-500' : sec.score >= 60 ? 'bg-amber-400' : 'bg-red-500'" [style.width]="sec.score + '%'"></div></div>
                </div>
              }
            </div>
            <!-- Comments -->
            @if (selectedEval()!.finalComments) {
              <div class="bg-slate-50 rounded-xl p-4"><p class="text-[10px] font-bold text-slate-400 uppercase mb-1">{{ 'hr.performance.form_final_comments' | translate }}</p><p class="text-slate-700 font-semibold">{{ selectedEval()!.finalComments }}</p></div>
            }
            @if (selectedEval()!.managerRecommendation) {
              <div class="bg-indigo-50 rounded-xl p-4 border border-indigo-100"><p class="text-[10px] font-bold text-indigo-600 uppercase mb-1">{{ 'hr.performance.form_recommendation' | translate }}</p><p class="text-indigo-800 font-semibold">{{ selectedEval()!.managerRecommendation }}</p></div>
            }
          </div>
          <div class="flex justify-between p-4 border-t bg-slate-50 rounded-b-2xl">
            <button (click)="selectedEval.set(null)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">Close</button>
            @if (selectedEval()!.status === 'Pending Approval') {
              <button (click)="approveSelected()" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm">✓ {{ 'hr.performance.rev_btn_approve' | translate }}</button>
            }
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrPerformanceReviewsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = ''; filterStatus = ''; filterDept = ''; filterPeriod = '';
  page = signal(1);
  pageSize = 12;
  selectedEval = signal<PerformanceEval | null>(null);

  readonly periods = ['Annual 2025','Q1 2026','Q2 2026','Q3 2026','Q4 2026','Annual 2026'];
  readonly statuses = [
    { val: '', label: 'All', active: 'bg-slate-800 text-white border-slate-800' },
    { val: 'Draft', label: 'Draft', active: 'bg-slate-500 text-white border-slate-500' },
    { val: 'In Progress', label: 'In Progress', active: 'bg-blue-500 text-white border-blue-500' },
    { val: 'Pending Approval', label: 'Pending', active: 'bg-amber-500 text-white border-amber-500' },
    { val: 'Approved', label: 'Approved', active: 'bg-green-600 text-white border-green-600' },
  ];

  readonly depts = computed(() => [...new Set(this.hr.performanceEvals().map(e => e.departmentName || '').filter(Boolean))]);

  readonly filteredEvals = computed(() => {
    let list = this.hr.performanceEvals();
    if (this.search) list = list.filter(e => e.employeeName.toLowerCase().includes(this.search.toLowerCase()) || e.evalNumber.includes(this.search));
    if (this.filterStatus) list = list.filter(e => e.status === this.filterStatus);
    if (this.filterDept) list = list.filter(e => e.departmentName === this.filterDept);
    if (this.filterPeriod) list = list.filter(e => e.period === this.filterPeriod);
    return list;
  });

  readonly totalPages = computed(() => Math.ceil(this.filteredEvals().length / this.pageSize));
  readonly pageArr = computed(() => Array.from({ length: Math.min(this.totalPages(), 5) }, (_, i) => i + 1));
  readonly pagedEvals = computed(() => this.filteredEvals().slice((this.page()-1)*this.pageSize, this.page()*this.pageSize));

  readonly evalSections = computed(() => {
    const e = this.selectedEval();
    if (!e) return [];
    return [
      { key: 'technical', label: 'Technical', score: e.technicalScore },
      { key: 'quality', label: 'Quality', score: e.qualityScore },
      { key: 'productivity', label: 'Productivity', score: e.productivityScore },
      { key: 'communication', label: 'Communication', score: e.communicationScore },
      { key: 'leadership', label: 'Leadership', score: e.leadershipScore },
      { key: 'problemSolving', label: 'Problem Solving', score: e.problemSolvingScore },
      { key: 'discipline', label: 'Discipline', score: e.disciplineScore },
      { key: 'attendance', label: 'Attendance', score: e.attendanceScore },
      { key: 'teamwork', label: 'Teamwork', score: e.teamworkScore },
      { key: 'innovation', label: 'Innovation', score: e.innovationScore },
      { key: 'safety', label: 'Safety', score: e.safetyScore },
    ];
  });

  countByStatus(s: string) { return s ? this.hr.performanceEvals().filter(e => e.status === s).length : this.hr.performanceEvals().length; }
  openForm(ev: PerformanceEval | null) { this.selectedEval.set(ev); }
  approveSelected() { if (this.selectedEval()) { this.hr.approveEval(this.selectedEval()!.id); this.selectedEval.set(null); } }
  minVal(a: number, b: number) { return Math.min(a, b); }
  prevPage() { if (this.page() > 1) this.page.update(p => p - 1); }
  nextPage() { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }

  scoreColor(s: number) { return s >= 85 ? 'text-green-600' : s >= 65 ? 'text-amber-600' : 'text-red-600'; }
  scoreBar(s: number) { return s >= 85 ? 'bg-green-500' : s >= 65 ? 'bg-amber-400' : 'bg-red-500'; }

  ratingBadge(r: string) {
    const m: Record<string, string> = { 'Outstanding': 'bg-purple-50 text-purple-700 border-purple-100', 'Excellent': 'bg-indigo-50 text-indigo-700 border-indigo-100', 'Very Good': 'bg-green-50 text-green-700 border-green-100', 'Good': 'bg-blue-50 text-blue-700 border-blue-100', 'Acceptable': 'bg-amber-50 text-amber-700 border-amber-100', 'Needs Improvement': 'bg-orange-50 text-orange-700 border-orange-100', 'Unsatisfactory': 'bg-red-50 text-red-700 border-red-100' };
    return m[r] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  statusBadge(s: string) {
    const m: Record<string, string> = { 'Draft': 'bg-slate-100 text-slate-500 border-slate-200', 'In Progress': 'bg-blue-50 text-blue-700 border-blue-100', 'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-100', 'Approved': 'bg-green-50 text-green-700 border-green-100', 'Rejected': 'bg-red-50 text-red-700 border-red-100' };
    return m[s] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  ngOnInit() { this.breadcrumb.setBreadcrumbs([{label:'navigation.hr'},{label:'navigation.performance'},{label:'hr.performance.rev_title'}]); }
}
