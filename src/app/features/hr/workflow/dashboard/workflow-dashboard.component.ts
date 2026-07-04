import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrWorkflowService } from '../../shared/hr-workflow.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-workflow-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.wf_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.wf_subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <a routerLink="/hr/workflow/approvals" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">
          📥 {{ 'hr.reports.wf_nav_approvals' | translate }} ({{ wf.pendingApprovalsCount() }})
        </a>
        <a routerLink="/hr/workflow/automation" class="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs">
          ⚙️ {{ 'hr.reports.wf_nav_automation' | translate }}
        </a>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.reports.wf_pending' | translate }}</p>
        <p class="text-3xl font-black text-amber-500 mt-1">{{ wf.pendingApprovalsCount() }}</p>
        <div class="w-full bg-slate-100 rounded-full h-1 mt-2">
          <div class="bg-amber-400 h-1 rounded-full animate-pulse" [style.width]="(wf.pendingApprovalsCount() * 30) + '%'"></div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.reports.wf_approved_today' | translate }}</p>
        <p class="text-3xl font-black text-green-600 mt-1">4</p>
        <div class="w-full bg-slate-100 rounded-full h-1 mt-2">
          <div class="bg-green-500 h-1 rounded-full" style="width: 60%"></div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.reports.wf_rejected_today' | translate }}</p>
        <p class="text-3xl font-black text-red-500 mt-1">1</p>
        <div class="w-full bg-slate-100 rounded-full h-1 mt-2">
          <div class="bg-red-500 h-1 rounded-full" style="width: 15%"></div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.reports.wf_active_flows' | translate }}</p>
        <p class="text-3xl font-black text-primary mt-1">{{ wf.workflowInstances().length }}</p>
        <div class="w-full bg-slate-100 rounded-full h-1 mt-2">
          <div class="bg-primary h-1 rounded-full" style="width: 80%"></div>
        </div>
      </div>
    </div>

    <!-- Active Processes List -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
        <h3 class="text-xs font-black text-slate-700 uppercase tracking-wider">⏱️ {{ 'hr.reports.wf_active_flows' | translate }}</h3>
      </div>
      <div class="divide-y divide-slate-50">
        @for (item of wf.workflowInstances(); track item.id) {
          <div class="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span [class]="typeBadge(item.type)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border">{{ item.type | translate }}</span>
                <span [class]="priorityBadge(item.priority)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border">{{ item.priority | translate }}</span>
                <span class="text-[10px] font-semibold text-slate-400">{{ item.submittedAt }}</span>
              </div>
              <h4 class="font-black text-slate-800 text-sm mt-2">{{ item.description }}</h4>
              <p class="text-[11px] text-slate-400 font-semibold mt-1">Submitted by: <span class="text-slate-600">{{ item.submittedBy }}</span></p>
            </div>

            <!-- Steps Progress visualizer -->
            <div class="flex flex-col gap-2 min-w-[240px]">
              <div class="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Approval Chain: Step {{ item.currentStep }} of {{ item.totalSteps }}</span>
                <span [class]="statusBadge(item.status)" class="font-black">{{ item.status }}</span>
              </div>
              <div class="flex gap-1.5">
                @for (step of item.steps; track step.stepNumber) {
                  <div class="flex-1 h-3 rounded-full relative group cursor-pointer" 
                       [class]="step.status === 'Approved' ? 'bg-green-500' : step.status === 'Rejected' ? 'bg-red-500' : 'bg-slate-100 border border-slate-200'">
                    <!-- Tooltip -->
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[9px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-10">
                      {{ step.role }}: {{ step.assigneeName || 'TBD' }} ({{ step.status }})
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  </div>
  `
})
export class HrWorkflowDashboardComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly wf = inject(HrWorkflowService);
  readonly lang = inject(LanguageService);

  typeBadge(t: string) {
    const m: Record<string, string> = {
      'Leave Request': 'bg-blue-50 text-blue-700 border-blue-150',
      'Overtime Request': 'bg-indigo-50 text-indigo-700 border-indigo-150',
      'New Hire': 'bg-green-50 text-green-700 border-green-150',
      'Transfer': 'bg-purple-50 text-purple-700 border-purple-150',
      'Promotion': 'bg-amber-50 text-amber-700 border-amber-150',
      'Resignation': 'bg-rose-50 text-rose-700 border-rose-150',
      'Termination': 'bg-red-50 text-red-700 border-red-150'
    };
    return m[t] || 'bg-slate-50 text-slate-700 border-slate-150';
  }

  priorityBadge(p: string) {
    const m: Record<string, string> = {
      'Urgent': 'bg-red-100 text-red-800 border-red-200',
      'High': 'bg-orange-100 text-orange-800 border-orange-200',
      'Medium': 'bg-amber-100 text-amber-800 border-amber-200',
      'Low': 'bg-slate-100 text-slate-650 border-slate-200'
    };
    return m[p] || 'bg-slate-100 text-slate-650 border-slate-200';
  }

  statusBadge(s: string) {
    const m: Record<string, string> = {
      'Pending': 'text-amber-500',
      'Approved': 'text-green-600',
      'Rejected': 'text-red-500',
      'In Progress': 'text-blue-500'
    };
    return m[s] || 'text-slate-500';
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.wf_title' },
      { label: 'hr.reports.wf_nav_dashboard' }
    ]);
  }
}
