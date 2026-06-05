import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../../core/services/audit.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuditLog, AuditAction } from '../../../shared/interfaces/audit.interface';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'audit_trail.title' | translate }}</h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'audit_trail.subtitle' | translate }}</p>
        </div>
        <button 
          (click)="clearAuditTrail()"
          class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-xs font-bold transition-colors border border-red-200/50 self-start"
        >
          {{ 'audit_trail.reset_btn' | translate }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Main Table Ledger -->
        <div class="lg:col-span-2 space-y-4">
          
          <!-- Filters Toolbar -->
          <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-xs font-semibold text-slate-500 space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Search query -->
              <div class="sm:col-span-3 relative">
                <input 
                  type="text" 
                  [(ngModel)]="searchQuery"
                  [placeholder]="'audit_trail.search_placeholder' | translate"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50"
                >
                <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <!-- Module filter -->
              <div>
                <label class="block mb-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">{{ 'audit_trail.filter_module' | translate }}</label>
                <select 
                  [(ngModel)]="moduleFilter"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-bold focus:outline-none"
                >
                  <option value="ALL">{{ 'audit_trail.all_modules' | translate }}</option>
                  <option value="Procurement">{{ 'activity_logs.modules.Procurement' | translate }}</option>
                  <option value="Operations">{{ 'activity_logs.modules.Operations' | translate }}</option>
                  <option value="Auth">{{ 'activity_logs.modules.Auth' | translate }}</option>
                  <option value="Settings">{{ 'activity_logs.modules.Settings' | translate }}</option>
                </select>
              </div>

              <!-- Action type filter -->
              <div>
                <label class="block mb-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">{{ 'audit_trail.filter_action' | translate }}</label>
                <select 
                  [(ngModel)]="actionFilter"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-bold focus:outline-none"
                >
                  <option value="ALL">{{ 'audit_trail.all_actions' | translate }}</option>
                  <option value="Create">{{ 'audit_trail.actions.Create' | translate }}</option>
                  <option value="Update">{{ 'audit_trail.actions.Update' | translate }}</option>
                  <option value="Approve">{{ 'audit_trail.actions.Approve' | translate }}</option>
                  <option value="Reject">{{ 'audit_trail.actions.Reject' | translate }}</option>
                  <option value="Login">{{ 'audit_trail.actions.Login' | translate }}</option>
                  <option value="Logout">{{ 'audit_trail.actions.Logout' | translate }}</option>
                  <option value="Status Change">{{ 'audit_trail.actions.Status_Change' | translate }}</option>
                </select>
              </div>
 
              <!-- Role filter -->
              <div>
                <label class="block mb-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">{{ 'audit_trail.filter_role' | translate }}</label>
                <select 
                  [(ngModel)]="roleFilter"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-bold focus:outline-none"
                >
                  <option value="ALL">{{ 'audit_trail.all_roles' | translate }}</option>
                  <option value="Super Admin">{{ 'roles.Super Admin' | translate }}</option>
                  <option value="General Manager">{{ 'roles.General Manager' | translate }}</option>
                  <option value="Finance Manager">{{ 'roles.Finance Manager' | translate }}</option>
                  <option value="Procurement Manager">{{ 'roles.Procurement Manager' | translate }}</option>
                  <option value="Operations Manager">{{ 'roles.Operations Manager' | translate }}</option>
                  <option value="Store Keeper">{{ 'roles.Store Keeper' | translate }}</option>
                </select>
              </div>
            </div>
          </div>
 
          <!-- Tabular view -->
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="text-slate-400 font-bold border-b border-slate-100 bg-slate-50/20">
                    <th class="p-4 py-3">{{ 'audit_trail.headers.timestamp' | translate }}</th>
                    <th class="p-4 py-3">{{ 'audit_trail.headers.operator' | translate }}</th>
                    <th class="p-4 py-3">{{ 'audit_trail.headers.module' | translate }}</th>
                    <th class="p-4 py-3">{{ 'audit_trail.headers.action' | translate }}</th>
                    <th class="p-4 py-3">{{ 'audit_trail.headers.target_entity' | translate }}</th>
                    <th class="p-4 py-3 text-right">{{ 'audit_trail.headers.details' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                  @for (log of filteredLogs(); track log.id) {
                    <tr 
                      (click)="inspectLog(log)"
                      class="hover:bg-indigo-50/25 transition-colors cursor-pointer"
                      [class.bg-indigo-50]="selectedLog()?.id === log.id"
                    >
                      <td class="p-4 font-mono text-slate-400 text-[10px]">
                        {{ log.timestamp | date:'HH:mm:ss dd/MM' }}
                      </td>
                      <td class="p-4">
                        <div class="font-bold text-slate-900">{{ log.user }}</div>
                        <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{{ 'roles.' + log.role | translate }}</div>
                      </td>
                      <td class="p-4">
                        <span class="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-full font-bold">
                          {{ log.module }}
                        </span>
                      </td>
                      <td class="p-4">
                        <span 
                          class="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
                          [class.bg-blue-50]="log.action === 'Create'"
                          [class.text-blue-600]="log.action === 'Create'"
                          [class.bg-green-50]="log.action === 'Approve'"
                          [class.text-green-600]="log.action === 'Approve'"
                          [class.bg-amber-50]="log.action === 'Update' || log.action === 'Status Change'"
                          [class.text-amber-600]="log.action === 'Update' || log.action === 'Status Change'"
                          [class.bg-red-50]="log.action === 'Reject' || log.action === 'Delete'"
                          [class.text-red-600]="log.action === 'Reject' || log.action === 'Delete'"
                          [class.bg-slate-100]="log.action === 'Login' || log.action === 'Logout'"
                          [class.text-slate-700]="log.action === 'Login' || log.action === 'Logout'"
                        >
                          {{ 'audit_trail.actions.' + (log.action === 'Status Change' ? 'Status_Change' : log.action) | translate }}
                        </span>
                      </td>
                      <td class="p-4">
                        <div class="font-bold text-slate-800">{{ log.entityName }}</div>
                        <div class="font-mono text-[10px] text-slate-455 font-bold">{{ log.entityId }}</div>
                      </td>
                      <td class="p-4 text-right">
                        <span class="text-blue-500 hover:text-blue-600 font-bold">{{ 'audit_trail.inspect' | translate }}</span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="p-8 text-center text-slate-400">
                        <span class="font-bold">{{ 'audit_trail.no_logs' | translate }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Detail Inspector Drawer -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-xs font-semibold text-slate-655 space-y-4 sticky top-6">
            <h3 class="text-sm font-bold text-slate-800 pb-2 border-b border-slate-50 flex items-center space-x-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{{ 'audit_trail.diff_inspector' | translate }}</span>
            </h3>

            @if (selectedLog(); as log) {
              <div class="space-y-4 animate-fade-in">
                <!-- Metadata Details -->
                <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">{{ 'audit_trail.log_id' | translate }}</span>
                    <span class="font-mono text-slate-800 font-bold">{{ log.id }}</span>
                  </div>
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">{{ 'audit_trail.operator' | translate }}</span>
                    <span class="text-slate-800 font-bold">{{ log.user }}</span>
                  </div>
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">{{ 'audit_trail.target_entity' | translate }}</span>
                    <span class="text-slate-800 font-bold">{{ log.entityName }}</span>
                  </div>
                  <div>
                    <span class="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">{{ 'audit_trail.entity_key' | translate }}</span>
                    <span class="font-mono text-slate-700 font-bold">{{ log.entityId }}</span>
                  </div>
                </div>

                <!-- Descriptive summary -->
                <div>
                  <span class="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mb-1">{{ 'audit_trail.action_desc' | translate }}</span>
                  <p class="p-3 bg-indigo-50/50 rounded-lg text-indigo-950 font-bold border border-indigo-100/50">
                    {{ log.details || ('audit_trail.no_desc' | translate) }}
                  </p>
                </div>

                <!-- Difference Grid (Old vs New) -->
                <div class="space-y-3">
                  <div>
                    <span class="text-[9px] text-red-500 block uppercase font-bold tracking-wider mb-1 flex items-center space-x-1">
                      <span>{{ 'audit_trail.pre_state' | translate }}</span>
                    </span>
                    <div class="p-3 bg-red-50/40 rounded-lg border border-red-100 font-mono text-[10px] text-red-800 overflow-x-auto whitespace-pre">
                      {{ formatLogPayload(log.oldValue) }}
                    </div>
                  </div>

                  <div>
                    <span class="text-[9px] text-green-600 block uppercase font-bold tracking-wider mb-1 flex items-center space-x-1">
                      <span>{{ 'audit_trail.post_state' | translate }}</span>
                    </span>
                    <div class="p-3 bg-green-50/40 rounded-lg border border-green-100 font-mono text-[10px] text-green-800 overflow-x-auto whitespace-pre">
                      {{ formatLogPayload(log.newValue) }}
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <div class="text-center py-12 text-slate-400 flex flex-col items-center justify-center space-y-2">
                <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span class="font-bold">{{ 'audit_trail.select_log_prompt' | translate }}</span>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditTrailComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly logs = this.auditService.logs;
  readonly selectedLog = signal<AuditLog | null>(null);

  // Filters
  searchQuery = '';
  moduleFilter = 'ALL';
  actionFilter = 'ALL';
  roleFilter = 'ALL';

  readonly filteredLogs = computed(() => {
    let list = this.logs();
    const query = this.searchQuery.trim().toLowerCase();
    const moduleF = this.moduleFilter;
    const actionF = this.actionFilter;
    const roleF = this.roleFilter;

    if (moduleF !== 'ALL') {
      list = list.filter(l => l.module === moduleF);
    }
    if (actionF !== 'ALL') {
      list = list.filter(l => l.action === actionF);
    }
    if (roleF !== 'ALL') {
      list = list.filter(l => l.role === roleF);
    }

    if (query) {
      list = list.filter(l => 
        l.user.toLowerCase().includes(query) ||
        l.entityId.toLowerCase().includes(query) ||
        l.details?.toLowerCase().includes(query) ||
        l.oldValue.toLowerCase().includes(query) ||
        l.newValue.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.settings', url: '/settings' },
      { label: 'navigation.activity_tracking' }
    ]);

    // Pre-select first log if available
    const list = this.filteredLogs();
    if (list.length > 0) {
      this.selectedLog.set(list[0]);
    }
  }

  inspectLog(log: AuditLog) {
    this.selectedLog.set(log);
  }

  clearAuditTrail() {
    // Clear and restore original pre-populated mock logs
    localStorage.removeItem('petroflow_audit_logs');
    window.location.reload();
  }

  formatLogPayload(value: string): string {
    if (!value) return 'N/A';
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return value;
      }
    }
    return value;
  }
}
