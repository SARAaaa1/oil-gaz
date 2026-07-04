import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrWorkflowService } from '../../shared/hr-workflow.service';
import { LanguageService } from '../../../../core/services/language.service';
import { WorkflowInstance } from '../../../../shared/interfaces';


@Component({
  selector: 'app-hr-workflow-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.wf_nav_approvals' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">Review pending requests and actions</p>
      </div>
    </div>

    <!-- Approvals List -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
        <h3 class="text-xs font-black text-slate-700 uppercase">📥 {{ 'hr.reports.wf_pending' | translate }}</h3>
      </div>
      
      <div class="divide-y divide-slate-50">
        @for (item of pendingWorkflows(); track item.id) {
          <div class="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <span [class]="typeBadge(item.type)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border">{{ item.type }}</span>
                <span [class]="priorityBadge(item.priority)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border">{{ item.priority }}</span>
              </div>
              <h4 class="font-black text-slate-800 text-sm">{{ item.description }}</h4>
              <div class="flex gap-4 text-[10px] text-slate-400 font-semibold">
                <span>Submitted by: <strong class="text-slate-600">{{ item.submittedBy }}</strong></span>
                <span>Submitted: <strong class="text-slate-600">{{ item.submittedAt }}</strong></span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex gap-2 self-end md:self-center">
              <button (click)="openDecisionModal(item, 'Approve')" class="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold text-xs">
                ✓ {{ 'hr.reports.wf_approve' | translate }}
              </button>
              <button (click)="openDecisionModal(item, 'Reject')" class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl font-bold text-xs">
                ✕ {{ 'hr.reports.wf_reject' | translate }}
              </button>
            </div>
          </div>
        } @empty {
          <div class="p-12 text-center text-slate-400">
            <span class="text-3xl block mb-2">📥</span>
            No pending approvals at the moment.
          </div>
        }
      </div>
    </div>

    <!-- Action Modal -->
    @if (activeModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4" (click)="activeModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md my-16" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <h3 class="font-black text-slate-800 text-sm">
              {{ actionType() === 'Approve' ? ('hr.reports.wf_approve' | translate) : ('hr.reports.wf_reject' | translate) }} Request
            </h3>
            <button (click)="activeModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <p class="font-bold text-slate-600">Are you sure you want to {{ actionType() | lowercase }} this workflow?</p>
            <div class="mt-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase">Comments / Remarks</label>
              <textarea [(ngModel)]="comments" rows="3" class="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-primary/50" placeholder="Optional comments..."></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-2xl">
            <button (click)="activeModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">Cancel</button>
            <button (click)="submitDecision()" class="px-6 py-2 text-white text-xs font-bold rounded-xl shadow-sm" [class]="actionType() === 'Approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'">
              Confirm
            </button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrWorkflowApprovalsComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly wf = inject(HrWorkflowService);
  readonly lang = inject(LanguageService);

  activeModal = signal(false);
  selectedWf = signal<WorkflowInstance | null>(null);
  actionType = signal<'Approve' | 'Reject'>('Approve');
  comments = '';

  readonly pendingWorkflows = computed(() =>
    this.wf.workflowInstances().filter(w => w.status === 'Pending')
  );

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

  openDecisionModal(item: WorkflowInstance, type: 'Approve' | 'Reject') {
    this.selectedWf.set(item);
    this.actionType.set(type);
    this.comments = '';
    this.activeModal.set(true);
  }

  submitDecision() {
    const item = this.selectedWf();
    if (item) {
      if (this.actionType() === 'Approve') {
        this.wf.approveStep(item.id, item.currentStep, this.comments);
      } else {
        this.wf.rejectStep(item.id, item.currentStep, this.comments);
      }
    }
    this.activeModal.set(false);
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.wf_title' },
      { label: 'hr.reports.wf_nav_approvals' }
    ]);
  }
}
