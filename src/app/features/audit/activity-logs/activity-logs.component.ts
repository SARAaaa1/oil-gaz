import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../../core/services/audit.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'activity_logs.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'activity_logs.subtitle' | translate }}</p>
      </div>

      <!-- KPI Summary Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Log Count -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ 'activity_logs.total_actions' | translate }}</span>
            <h2 class="text-2xl font-black text-slate-800">{{ 'activity_logs.events_count' | translate:{ count: logs().length } }}</h2>
          </div>
          <div class="p-3 bg-blue-50 rounded-xl">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <!-- Unique Users -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ 'activity_logs.active_operators' | translate }}</span>
            <h2 class="text-2xl font-black text-slate-800">{{ 'activity_logs.users_count' | translate:{ count: uniqueUsersCount() } }}</h2>
          </div>
          <div class="p-3 bg-emerald-50 rounded-xl">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        <!-- Primary Module -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ 'activity_logs.top_module' | translate }}</span>
            <h2 class="text-xl font-black text-indigo-850 uppercase">{{ topModule() }}</h2>
          </div>
          <div class="p-3 bg-indigo-50 rounded-xl">
            <svg class="w-6 h-6 text-indigo-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
        </div>

        <!-- Latest Event Time -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ 'activity_logs.last_activity' | translate }}</span>
            <h2 class="text-xs font-extrabold text-slate-800 mt-1.5">{{ lastLogTime() || 'N/A' }}</h2>
          </div>
          <div class="p-3 bg-amber-50 rounded-xl">
            <svg class="w-6 h-6 text-amber-505" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Timeline Widget -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-850 flex items-center space-x-2">
              <svg class="w-4 h-4 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{{ 'activity_logs.live_feed' | translate }}</span>
            </h3>

            <!-- Quick Filter Selection -->
            <div class="flex items-center space-x-2 text-xs">
              <span class="text-slate-400 font-semibold">{{ 'activity_logs.filter_module' | translate }}</span>
              <select 
                [(ngModel)]="activeModuleFilter"
                class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-bold focus:outline-none"
              >
                <option value="ALL">{{ 'activity_logs.all_modules' | translate }}</option>
                <option value="Procurement">{{ 'activity_logs.modules.Procurement' | translate }}</option>
                <option value="Operations">{{ 'activity_logs.modules.Operations' | translate }}</option>
                <option value="Auth">{{ 'activity_logs.modules.Auth' | translate }}</option>
                <option value="Settings">{{ 'activity_logs.modules.Settings' | translate }}</option>
              </select>
            </div>
          </div>

          <app-activity-timeline 
            [limit]="15"
            [moduleFilter]="activeModuleFilter === 'ALL' ? undefined : activeModuleFilter"
          ></app-activity-timeline>
        </div>

        <!-- Right Side: Info Drawer -->
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-xs font-semibold text-slate-600 space-y-4">
          <h3 class="text-sm font-bold text-slate-800 pb-2 border-b border-slate-50">{{ 'activity_logs.notes_title' | translate }}</h3>
          
          <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
            <h4 class="font-extrabold text-slate-800">{{ 'activity_logs.persistence_title' | translate }}</h4>
            <p class="text-[10px] text-slate-450 leading-relaxed font-medium">
              {{ 'activity_logs.persistence_desc' | translate }}
            </p>
          </div>

          <div class="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-2 text-indigo-950">
            <h4 class="font-extrabold text-indigo-900">{{ 'activity_logs.schema_title' | translate }}</h4>
            <p class="text-[10px] text-indigo-900/70 leading-relaxed font-medium">
              {{ 'activity_logs.schema_desc' | translate }}
            </p>
          </div>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityLogsComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly logs = this.auditService.logs;
  activeModuleFilter = 'ALL';

  readonly uniqueUsersCount = computed(() => {
    const list = this.logs();
    const set = new Set(list.map(l => l.user));
    return set.size;
  });

  readonly topModule = computed(() => {
    const list = this.logs();
    if (list.length === 0) return 'N/A';
    
    const counts: Record<string, number> = {};
    list.forEach(l => {
      counts[l.module] = (counts[l.module] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  });

  readonly lastLogTime = computed(() => {
    const list = this.logs();
    if (list.length === 0) return null;
    
    const date = new Date(list[0].timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + date.toLocaleDateString() + ')';
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.audit_logs' }
    ]);
  }
}
