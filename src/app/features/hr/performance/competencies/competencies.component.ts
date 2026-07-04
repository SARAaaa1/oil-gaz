import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-perf-competencies',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.performance.comp_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.performance.comp_subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <button class="px-4 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl font-bold text-xs">⬇ Export</button>
      </div>
    </div>

    <!-- Gap Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-slate-700">{{ hr.competencyRecords().length }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Records</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-green-600">{{ countGap('No Gap') }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.performance.comp_gap_none' | translate }}</p>
      </div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-amber-600">{{ countGap('Moderate') }}</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase mt-1">Moderate Gap</p>
      </div>
      <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-red-600">{{ countGap('Critical') }}</p>
        <p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.performance.comp_gap_critical' | translate }}</p>
      </div>
    </div>

    <!-- Competency Type Tabs -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="flex overflow-x-auto border-b border-slate-100 px-4 pt-3 gap-1">
        <button (click)="activeType = ''" [class]="activeType === '' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-2 text-[11px] font-bold rounded-t-lg whitespace-nowrap transition-colors">All</button>
        @for (t of compTypes; track t.key) {
          <button (click)="activeType = t.key" [class]="activeType === t.key ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-slate-500 hover:text-slate-700'" class="px-3 py-2 text-[11px] font-bold rounded-t-lg whitespace-nowrap transition-colors">{{ t.label }}</button>
        }
      </div>

      <!-- Filters -->
      <div class="p-4 flex flex-wrap gap-3 border-b border-slate-50">
        <div class="relative flex-1 min-w-48">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input [(ngModel)]="search" type="text" placeholder="Search employee..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        </div>
        <select [(ngModel)]="filterGap" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
          <option value="">All Gaps</option>
          @for (g of gaps; track g) { <option [value]="g">{{ g }}</option> }
        </select>
        <select [(ngModel)]="filterTraining" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
          <option value="">Training Filter</option>
          <option value="true">Training Needed</option>
          <option value="false">No Training</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.comp_col_employee' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.comp_col_dept' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.comp_col_competency' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Type</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.comp_col_required' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.comp_col_current' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.comp_col_gap' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.comp_col_training' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (c of filteredRecords(); track c.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-bold text-slate-800">{{ c.employeeName }}</p>
                  <p class="text-[10px] text-slate-400">{{ c.employeeNumber }}</p>
                </td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ c.departmentName }}</td>
                <td class="px-4 py-3">
                  <p class="font-bold text-slate-800">{{ c.competencyName }}</p>
                  <p class="text-[10px] text-slate-400">{{ c.jobTitle }}</p>
                </td>
                <td class="px-4 py-3 text-center"><span class="text-[10px] font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full text-slate-600">{{ c.competencyType }}</span></td>
                <td class="px-4 py-3 text-center"><span [class]="levelBadge(c.requiredLevel)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ c.requiredLevel }}</span></td>
                <td class="px-4 py-3 text-center"><span [class]="levelBadge(c.currentLevel)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ c.currentLevel }}</span></td>
                <td class="px-4 py-3 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span [class]="gapBadge(c.gap)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ c.gap }}</span>
                    <div class="w-16 bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div class="h-full rounded-full" [class]="gapBar(c.gap)" [style.width]="gapWidth(c.gap)"></div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  @if (c.trainingNeeded) {
                    <div>
                      <span class="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">⚠ Needed</span>
                      @if (c.trainingCourse) { <p class="text-[9px] text-slate-400 mt-0.5 max-w-28 truncate">{{ c.trainingCourse }}</p> }
                    </div>
                  } @else {
                    <span class="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">✓ None</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="px-4 py-10 text-center text-slate-400 text-xs font-semibold">No competency records</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Training Needs Summary -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 class="text-xs font-black text-slate-700 mb-4 flex items-center gap-2"><span class="w-3 h-3 bg-amber-400 rounded-sm"></span>Training Needs Summary</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        @for (r of trainingNeeds(); track r.employee) {
          <div class="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p class="font-bold text-slate-800 text-xs">{{ r.employee }}</p>
            <p class="text-[10px] text-slate-500 mb-2">{{ r.dept }}</p>
            @for (course of r.courses; track course) {
              <div class="flex items-center gap-1.5 mt-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span><span class="text-[10px] text-slate-700 font-semibold">{{ course }}</span></div>
            }
          </div>
        }
      </div>
    </div>
  </div>
  `
})
export class HrPerformanceCompetenciesComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = ''; filterGap = ''; filterTraining = ''; activeType = '';

  readonly compTypes = [
    { key: 'Technical', label: 'Technical' }, { key: 'Management', label: 'Management' },
    { key: 'Leadership', label: 'Leadership' }, { key: 'Communication', label: 'Communication' },
    { key: 'Safety', label: 'Safety' }, { key: 'Software Skills', label: 'Software' },
    { key: 'Certification', label: 'Certification' },
  ];
  readonly gaps = ['No Gap', 'Minor', 'Moderate', 'Critical'];

  readonly filteredRecords = computed(() => {
    let list = this.hr.competencyRecords();
    if (this.search) list = list.filter(c => c.employeeName.toLowerCase().includes(this.search.toLowerCase()));
    if (this.activeType) list = list.filter(c => c.competencyType === this.activeType);
    if (this.filterGap) list = list.filter(c => c.gap === this.filterGap);
    if (this.filterTraining === 'true') list = list.filter(c => c.trainingNeeded);
    if (this.filterTraining === 'false') list = list.filter(c => !c.trainingNeeded);
    return list;
  });

  readonly trainingNeeds = computed(() => {
    const map = new Map<string, { employee: string; dept: string; courses: string[] }>();
    this.hr.competencyRecords().filter(c => c.trainingNeeded && c.trainingCourse).forEach(c => {
      if (!map.has(c.employeeId)) map.set(c.employeeId, { employee: c.employeeName, dept: c.departmentName || '', courses: [] });
      map.get(c.employeeId)!.courses.push(c.trainingCourse!);
    });
    return [...map.values()];
  });

  countGap(g: string) { return this.hr.competencyRecords().filter(c => c.gap === g).length; }

  levelBadge(l: string) { const m: Record<string,string> = {'Expert':'bg-purple-50 text-purple-700 border-purple-100','Advanced':'bg-blue-50 text-blue-700 border-blue-100','Intermediate':'bg-amber-50 text-amber-700 border-amber-100','Beginner':'bg-slate-100 text-slate-500 border-slate-200'}; return m[l]||'bg-slate-100 text-slate-500 border-slate-200'; }
  gapBadge(g: string) { const m: Record<string,string> = {'No Gap':'bg-green-50 text-green-700 border-green-100','Minor':'bg-blue-50 text-blue-700 border-blue-100','Moderate':'bg-amber-50 text-amber-700 border-amber-100','Critical':'bg-red-50 text-red-700 border-red-100'}; return m[g]||'bg-slate-100 text-slate-500 border-slate-200'; }
  gapBar(g: string) { return {'No Gap':'bg-green-500','Minor':'bg-blue-400','Moderate':'bg-amber-400','Critical':'bg-red-500'}[g]||'bg-slate-300'; }
  gapWidth(g: string) { return {'No Gap':'0%','Minor':'33%','Moderate':'66%','Critical':'100%'}[g]||'0%'; }

  ngOnInit() { this.breadcrumb.setBreadcrumbs([{label:'navigation.hr'},{label:'navigation.performance'},{label:'hr.performance.comp_title'}]); }
}
