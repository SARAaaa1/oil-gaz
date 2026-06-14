import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface ApprovalStep {
  role: string;
  approverName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  actionDate?: string;
  comments?: string;
}

@Component({
  selector: 'app-approval-history',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Approval Workflow Timeline</h4>
        <span 
          class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
          [class]="getGlobalStatusClass()"
        >
          {{ getGlobalStatusText() }}
        </span>
      </div>

      <div class="relative pl-6 border-l-2 border-slate-100 space-y-6">
        @for (step of workflow; track $index) {
          <div class="relative group">
            
            <!-- Timeline Bullet -->
            <span 
              [class]="getStepBulletClass(step.status)"
              class="absolute -left-[31px] top-1.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm text-[10px] font-bold text-white transition-all"
            >
              @if (step.status === 'Approved') {
                ✓
              } @else if (step.status === 'Rejected') {
                ✖
              } @else {
                ⏳
              }
            </span>

            <!-- Step Details -->
            <div class="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-lg border border-slate-100 transition-colors text-xs font-semibold">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <div>
                  <span class="font-extrabold text-slate-800 text-xs">{{ step.approverName || 'Awaiting Sign-off' }}</span>
                  <span class="text-[9px] bg-slate-200/50 text-slate-550 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ml-1.5">
                    {{ step.role }}
                  </span>
                </div>
                @if (step.actionDate) {
                  <span class="text-[9px] text-slate-400 font-bold font-mono">
                    {{ step.actionDate }}
                  </span>
                }
              </div>

              @if (step.comments) {
                <p class="text-xs text-slate-500 italic font-medium mt-1">
                  "{{ step.comments }}"
                </p>
              }

              <div class="mt-2 flex items-center space-x-2 text-[10px] text-slate-400 font-bold">
                <span class="uppercase tracking-wider font-extrabold" [class]="getTextClass(step.status)">
                  {{ step.status }}
                </span>
              </div>
            </div>

          </div>
        } @empty {
          <div class="text-center py-4 text-slate-400 text-xs italic">
            No approval steps configured for this record.
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalHistoryComponent {
  @Input() workflow: ApprovalStep[] = [];

  getGlobalStatusText(): string {
    if (this.workflow.length === 0) return 'DRAFT';
    if (this.workflow.some(s => s.status === 'Rejected')) return 'REJECTED';
    if (this.workflow.every(s => s.status === 'Approved')) return 'APPROVED';
    return 'PENDING APPROVAL';
  }

  getGlobalStatusClass(): string {
    const status = this.getGlobalStatusText();
    switch (status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700';
      case 'REJECTED': return 'bg-red-50 text-red-700';
      case 'PENDING APPROVAL': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  }

  getStepBulletClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500';
      case 'Rejected':
        return 'bg-red-500';
      default:
        return 'bg-amber-400 animate-pulse';
    }
  }

  getTextClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'text-emerald-600';
      case 'Rejected':
        return 'text-red-600';
      default:
        return 'text-amber-600';
    }
  }
}
