import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AuditStep {
  role: string;
  approverName: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Not Started';
  date?: string;
  comments?: string;
}

@Component({
  selector: 'app-audit-trail-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop overlay -->
    @if (isOpen) {
      <div 
        (click)="close.emit()" 
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity"
      ></div>

      <!-- Drawer Side Panel -->
      <div 
        class="fixed inset-y-0 right-0 rtl:left-0 rtl:right-auto w-full max-w-md bg-bg-card border-l rtl:border-r rtl:border-l-0 border-border-color shadow-2xl z-50 animate-slide-left p-6 flex flex-col h-full text-left rtl:text-right"
      >
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-border-color shrink-0">
          <div>
            <h3 class="text-sm font-bold text-text-primary">System Audit Trail</h3>
            <p class="text-[10px] text-text-secondary mt-0.5">{{ entityType }} #{{ entityNumber }}</p>
          </div>
          <button 
            (click)="close.emit()" 
            class="p-1 rounded-lg hover:bg-bg-secondary text-text-secondary transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto py-4 space-y-6">
          
          <!-- Creation & Modification Info -->
          <div class="bg-bg-secondary/40 rounded-xl p-4 border border-border-color/60 space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-text-secondary">Created By</span>
              <span class="font-bold text-text-primary">{{ createdBy || 'System Admin' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Created Date</span>
              <span class="font-mono text-text-primary">{{ createdDate || '2026-06-01' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Last Modified By</span>
              <span class="font-bold text-text-primary">{{ modifiedBy || createdBy || 'System Admin' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">Last Modified Date</span>
              <span class="font-mono text-text-primary">{{ modifiedDate || createdDate || '2026-06-01' }}</span>
            </div>
          </div>

          <!-- Approval History Timeline -->
          @if (workflow && workflow.length > 0) {
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-text-secondary uppercase tracking-wider">Approval workflow status</h4>
              <div class="relative pl-6 rtl:pr-6 rtl:pl-0 border-l rtl:border-r rtl:border-l-0 border-border-color space-y-6 ml-3 rtl:mr-3 rtl:ml-0">
                @for (step of workflow; track step.role) {
                  <div class="relative">
                    <!-- Dot Indicator -->
                    <span 
                      [class.bg-emerald-500]="step.status === 'Approved'"
                      [class.bg-amber-500]="step.status === 'Pending'"
                      [class.bg-red-500]="step.status === 'Rejected'"
                      [class.bg-slate-300]="step.status === 'Not Started' || !step.status"
                      class="absolute -left-[31px] rtl:-right-[31px] rtl:left-auto top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-bg-card"
                    ></span>
                    
                    <div class="text-xs space-y-0.5">
                      <div class="flex justify-between items-center">
                        <span class="font-bold text-text-primary">{{ step.role }}</span>
                        <span 
                          [class.text-emerald-500]="step.status === 'Approved'"
                          [class.text-amber-500]="step.status === 'Pending'"
                          [class.text-red-500]="step.status === 'Rejected'"
                          class="font-bold uppercase text-[9px]"
                        >
                          {{ step.status || 'Not Started' }}
                        </span>
                      </div>
                      <p class="text-text-secondary text-[11px]">{{ step.approverName || 'Not Assigned' }}</p>
                      @if (step.date) {
                        <p class="text-[10px] text-text-secondary font-mono">{{ step.date }}</p>
                      }
                      @if (step.comments) {
                        <div class="mt-1 p-2 bg-bg-secondary rounded text-[11px] text-text-primary border-l-2 border-primary/40">
                          "{{ step.comments }}"
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- System Logs / Audit Events -->
          @if (history && history.length > 0) {
            <div class="space-y-3 pt-2">
              <h4 class="text-xs font-bold text-text-secondary uppercase tracking-wider">Activity timeline</h4>
              <div class="divide-y divide-border-color/60 border-t border-b border-border-color/60">
                @for (log of history; track log.id) {
                  <div class="py-3 text-xs space-y-1">
                    <div class="flex justify-between items-center text-[10px] text-text-secondary">
                      <span class="font-bold">{{ log.user || 'Admin' }} ({{ log.role || 'Operator' }})</span>
                      <span class="font-mono">{{ log.date || log.timestamp }}</span>
                    </div>
                    <p class="font-semibold text-text-primary text-[11px]">
                      {{ log.action }} - {{ log.details }}
                    </p>
                    @if (log.notes) {
                      <p class="text-text-secondary text-[10px] italic">Note: {{ log.notes }}</p>
                    }
                  </div>
                }
              </div>
            </div>
          }

        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditTrailDrawerComponent {
  @Input() isOpen: boolean = false;
  @Input() entityType: string = 'Document';
  @Input() entityNumber: string = '';
  @Input() createdBy: string = '';
  @Input() createdDate: string = '';
  @Input() modifiedBy: string = '';
  @Input() modifiedDate: string = '';
  
  @Input() workflow: AuditStep[] = [];
  @Input() history: any[] = [];

  @Output() close = new EventEmitter<void>();
}
