import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-reports-recruitment',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-5" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div><h1 class="text-2xl font-black text-slate-800">{{ 'hr.reports.rec_title' | translate }}</h1><p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.rec_subtitle' | translate }}</p></div>
      <div class="flex gap-2">
        <button class="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_pdf' | translate }}</button>
        <button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_excel' | translate }}</button>
      </div>
    </div>
    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-slate-800">{{ totalApps() }}</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.reports.rec_applications' | translate }}</p></div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-green-600">{{ hired() }}</p><p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.reports.rec_hired' | translate }}</p></div>
      <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-red-600">{{ rejected() }}</p><p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.reports.rec_rejected' | translate }}</p></div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-amber-600">{{ pending() }}</p><p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.reports.rec_pending' | translate }}</p></div>
      <div class="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-indigo-600">18d</p><p class="text-[10px] font-bold text-indigo-700 uppercase mt-1">{{ 'hr.reports.rec_tth' | translate }}</p></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Funnel -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.rec_funnel' | translate }}</h3>
        <div class="space-y-3">
          @for (stage of funnel(); track stage.label) {
            <div>
              <div class="flex justify-between text-xs mb-1"><span class="font-semibold text-slate-600">{{ stage.label }}</span><span class="font-black text-slate-800">{{ stage.count }}</span></div>
              <div class="bg-slate-100 rounded-full h-4 overflow-hidden">
                <div class="h-full rounded-full flex items-center justify-end pr-2 transition-all" [class]="stage.color" [style.width]="stage.pct + '%'">
                  <span class="text-[9px] font-black text-white">{{ stage.pct }}%</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
      <!-- Source -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.rec_source' | translate }}</h3>
        <div class="space-y-3">
          @for (src of sources(); track src.name) {
            <div class="flex items-center gap-3">
              <div class="w-24 text-[11px] font-bold text-slate-600 truncate">{{ src.name }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden"><div class="h-full rounded-full" [class]="src.color" [style.width]="src.pct + '%'"></div></div>
              <span class="text-xs font-black text-slate-800 w-6">{{ src.count }}</span>
              <span class="text-[10px] text-slate-400 w-8">{{ src.pct }}%</span>
            </div>
          }
        </div>
        <div class="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs">
          <span class="text-slate-500 font-semibold">{{ 'hr.reports.rec_acceptance_rate' | translate }}</span>
          <span class="font-black text-green-600">{{ acceptanceRate() }}%</span>
        </div>
        <div class="flex justify-between text-xs mt-2">
          <span class="text-slate-500 font-semibold">{{ 'hr.reports.rec_cost_per_hire' | translate }}</span>
          <span class="font-black text-indigo-600">SAR 4,200</span>
        </div>
      </div>
    </div>
  </div>
  `
})
export class HrReportsRecruitmentComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);
  readonly totalApps = computed(() => this.hr.candidates().length);
  readonly hired = computed(() => this.hr.candidates().filter(c => c.status === 'Hired').length);
  readonly rejected = computed(() => this.hr.candidates().filter(c => c.status === 'Rejected').length);
  readonly pending = computed(() => this.hr.candidates().filter(c => !['Hired','Rejected'].includes(c.status)).length);
  readonly acceptanceRate = computed(() => { const t = this.totalApps(); return t ? Math.round(this.hired() / t * 100) : 0; });
  readonly funnel = computed(() => {
    const t = this.totalApps();
    return [
      { label: 'Applied', count: t, pct: 100, color: 'bg-blue-500' },
      { label: 'Screening', count: Math.round(t * 0.65), pct: 65, color: 'bg-indigo-500' },
      { label: 'Interview', count: Math.round(t * 0.4), pct: 40, color: 'bg-violet-500' },
      { label: 'Offer', count: Math.round(t * 0.2), pct: 20, color: 'bg-amber-500' },
      { label: 'Hired', count: this.hired(), pct: Math.round(this.hired() / t * 100), color: 'bg-green-500' },
    ];
  });
  readonly sources = computed(() => [
    { name: 'LinkedIn', count: 42, pct: 40, color: 'bg-blue-600' },
    { name: 'Indeed', count: 28, pct: 27, color: 'bg-indigo-500' },
    { name: 'Referral', count: 18, pct: 17, color: 'bg-green-500' },
    { name: 'Website', count: 12, pct: 11, color: 'bg-amber-500' },
    { name: 'Agency', count: 5, pct: 5, color: 'bg-purple-500' },
  ]);
  ngOnInit() { this.bc.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.reports' }, { label: 'hr.reports.nav_recruitment' }]); }
}
