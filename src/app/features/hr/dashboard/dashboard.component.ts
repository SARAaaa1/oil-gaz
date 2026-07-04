import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { HrMockService } from '../shared/hr-mock.service';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.dashboard.title' | translate }}</h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.dashboard.subtitle' | translate }}</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Applications Today -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.dashboard.apps_today' | translate }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-850">{{ appsToday() }}</span>
            <span class="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+100%</span>
          </div>
        </div>

        <!-- Open Interviews -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.dashboard.open_interviews' | translate }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-850">{{ openInterviews() }}</span>
          </div>
        </div>

        <!-- Pending Hiring -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.dashboard.pending_hiring' | translate }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-850">{{ pendingHiring() }}</span>
          </div>
        </div>

        <!-- Pending Onboarding -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.dashboard.pending_onboarding' | translate }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-850">{{ pendingOnboarding() }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Rejected Candidates -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.dashboard.rejected_candidates' | translate }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-red-650">{{ rejectedCandidates() }}</span>
          </div>
        </div>

        <!-- Accepted Candidates -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.dashboard.accepted_candidates' | translate }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-green-600">{{ acceptedCandidates() }}</span>
          </div>
        </div>

        <!-- Average Hiring Time -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.dashboard.avg_hiring_time' | translate }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-slate-850">14 {{ 'hr.dashboard.days' | translate }}</span>
          </div>
        </div>

        <!-- Hiring Success Rate -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.dashboard.hiring_success_rate' | translate }}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-black text-indigo-650">84%</span>
          </div>
        </div>
      </div>

      <!-- Quick Shortcuts -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h3 class="text-sm font-bold text-slate-800">{{ 'hr.dashboard.quick_shortcuts' | translate }}</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a routerLink="/hr/recruitment/applications" class="p-4 rounded-xl border border-slate-100 hover:border-indigo-150 hover:bg-indigo-50/20 text-center transition-all">
            <span class="text-xl">📄</span>
            <p class="text-xs font-bold text-slate-700 mt-2">{{ 'navigation.job_applications' | translate }}</p>
          </a>
          <a routerLink="/hr/recruitment/candidates" class="p-4 rounded-xl border border-slate-100 hover:border-indigo-150 hover:bg-indigo-50/20 text-center transition-all">
            <span class="text-xl">👤</span>
            <p class="text-xs font-bold text-slate-700 mt-2">{{ 'navigation.candidates' | translate }}</p>
          </a>
          <a routerLink="/hr/recruitment/interviews" class="p-4 rounded-xl border border-slate-100 hover:border-indigo-150 hover:bg-indigo-50/20 text-center transition-all">
            <span class="text-xl">🗓️</span>
            <p class="text-xs font-bold text-slate-700 mt-2">{{ 'navigation.interviews' | translate }}</p>
          </a>
          <a routerLink="/hr/recruitment/hiring" class="p-4 rounded-xl border border-slate-100 hover:border-indigo-150 hover:bg-indigo-50/20 text-center transition-all">
            <span class="text-xl">🤝</span>
            <p class="text-xs font-bold text-slate-700 mt-2">{{ 'navigation.hiring' | translate }}</p>
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrDashboardComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly hrService = inject(HrMockService);

  // Computations
  readonly appsToday = computed(() => 
    this.hrService.candidates().filter(c => c.status === 'New').length
  );
  readonly openInterviews = computed(() => 
    this.hrService.interviews().filter(i => i.status === 'Scheduled').length
  );
  readonly pendingHiring = computed(() => 
    this.hrService.hiringRecords().filter(h => h.status !== 'Completed').length
  );
  readonly pendingOnboarding = computed(() => 
    this.hrService.onboardingTasks().length > 0 ? 1 : 0
  );
  readonly rejectedCandidates = computed(() => 
    this.hrService.candidates().filter(c => c.status === 'Rejected').length
  );
  readonly acceptedCandidates = computed(() => 
    this.hrService.candidates().filter(c => c.status === 'Hired').length
  );

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.dashboard.title' }
    ]);
  }
}
