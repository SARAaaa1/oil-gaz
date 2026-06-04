import { Component, OnInit, Input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog } from '../../interfaces/audit.interface';

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Chronological Event Logs</h4>
        <span class="text-[10px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded-full font-bold">
          {{ displayedLogs().length }} entries
        </span>
      </div>

      <div class="relative pl-6 border-l-2 border-slate-100 space-y-6">
        @for (log of displayedLogs(); track log.id) {
          <div class="relative group">
            
            <!-- Timeline Bullet Indicator -->
            <span 
              [class]="getIconBgClass(log.action)"
              class="absolute -left-[31px] top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm text-[10px] font-bold text-white transition-transform group-hover:scale-110"
            >
              {{ getActionInitial(log.action) }}
            </span>

            <!-- Timeline Content -->
            <div class="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-lg border border-slate-100 transition-colors">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <div class="flex items-center space-x-2">
                  <span class="font-extrabold text-slate-800 text-xs">{{ log.user }}</span>
                  <span class="text-[9px] bg-slate-200/60 text-slate-550 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                    {{ log.role }}
                  </span>
                </div>
                <span class="text-[9px] text-slate-400 font-bold font-mono">
                  {{ log.timestamp | date:'MMM d, h:mm a' }}
                </span>
              </div>

              <p class="text-xs font-medium text-slate-700">
                <span class="font-bold text-slate-900 bg-slate-100 px-1 rounded-md text-[10px] border border-slate-200/50 mr-1.5">
                  {{ log.module }}
                </span>
                {{ log.details || (log.action + ' event triggered on ' + log.entityName) }}
              </p>

              <!-- Optional micro metadata summary -->
              <div class="mt-2 flex items-center space-x-3 text-[10px] text-slate-400 font-bold">
                <span>ID: <code class="font-mono text-slate-500 bg-white px-1 border border-slate-100 rounded">{{ log.entityId }}</code></span>
                <span>•</span>
                <span class="uppercase tracking-wider font-extrabold" [class]="getTextClass(log.action)">
                  {{ log.action }}
                </span>
              </div>
            </div>

          </div>
        } @empty {
          <div class="text-center py-6 text-slate-400 text-xs font-semibold">
            No activity logged in this workspace yet.
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityTimelineComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  @Input() limit = 10;
  @Input() userFilter?: string;
  @Input() moduleFilter?: string;

  readonly displayedLogs = computed(() => {
    let logsList = this.auditService.logs();
    
    if (this.userFilter) {
      logsList = logsList.filter(l => l.username === this.userFilter);
    }
    if (this.moduleFilter) {
      logsList = logsList.filter(l => l.module === this.moduleFilter);
    }

    return logsList.slice(0, this.limit);
  });

  ngOnInit() {}

  getActionInitial(action: string): string {
    switch(action) {
      case 'Create': return '+';
      case 'Delete': return '×';
      case 'Approve': return '✓';
      case 'Reject': return '✖';
      case 'Update': return '✎';
      case 'Login': return '➔';
      case 'Logout': return '←';
      default: return 'i';
    }
  }

  getIconBgClass(action: string): string {
    switch (action) {
      case 'Create':
        return 'bg-blue-500';
      case 'Approve':
        return 'bg-green-500';
      case 'Reject':
      case 'Delete':
        return 'bg-red-500';
      case 'Update':
      case 'Status Change':
        return 'bg-amber-500';
      case 'Login':
      case 'Logout':
        return 'bg-slate-700';
      default:
        return 'bg-indigo-500';
    }
  }

  getTextClass(action: string): string {
    switch (action) {
      case 'Approve':
        return 'text-green-600';
      case 'Reject':
      case 'Delete':
        return 'text-red-600';
      case 'Create':
        return 'text-blue-600';
      case 'Update':
      case 'Status Change':
        return 'text-amber-600';
      default:
        return 'text-slate-600';
    }
  }
}
