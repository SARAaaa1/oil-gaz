import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'reports.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'reports.subtitle' | translate }}</p>
      </div>

      <!-- Report Categories -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold text-slate-655">
        
        <!-- Procurement Report -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-56">
          <div class="space-y-3">
            <div class="w-10 h-10 rounded-lg bg-green-50 text-success flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">{{ 'reports.procurement_title' | translate }}</h3>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ 'reports.procurement_desc' | translate }}</p>
            </div>
          </div>
          <button 
            (click)="exportReport('Procurement Ledger')"
            class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
          >
            {{ 'reports.procurement_btn' | translate }}
          </button>
        </div>

        <!-- Operations Summary -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-56">
          <div class="space-y-3">
            <div class="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">{{ 'reports.operations_title' | translate }}</h3>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ 'reports.operations_desc' | translate }}</p>
            </div>
          </div>
          <button 
            (click)="exportReport('Drilling Operations Logs')"
            class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
          >
            {{ 'reports.operations_btn' | translate }}
          </button>
        </div>

        <!-- Inventory Balance -->
        <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-56">
          <div class="space-y-3">
            <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">{{ 'reports.inventory_title' | translate }}</h3>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ 'reports.inventory_desc' | translate }}</p>
            </div>
          </div>
          <button 
            (click)="exportReport('Material Storage Ledger')"
            class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
          >
            {{ 'reports.inventory_btn' | translate }}
          </button>
        </div>

      </div>

      <!-- Recent Exports Log -->
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm font-semibold text-slate-600 text-xs">
        <h3 class="text-sm font-bold text-slate-850 pb-3 border-b border-slate-50 mb-3">{{ 'reports.pipeline_title' | translate }}</h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
            <div>
              <p class="font-bold text-slate-800">Procurement Ledger_Q2.pdf</p>
              <span class="text-[9px] text-slate-400">
                {{ 'reports.exported_by' | translate:{ user: 'Admin User', date: '2026-06-03 12:44' } }}
              </span>
            </div>
            <span class="px-2 py-0.5 text-[8px] bg-green-50 text-success rounded font-extrabold uppercase">{{ 'reports.completed' | translate }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
            <div>
              <p class="font-bold text-slate-800">DrillLogs_RigAlpha_May.csv</p>
              <span class="text-[9px] text-slate-400">
                {{ 'reports.exported_by' | translate:{ user: 'Admin User', date: '2026-06-02 09:12' } }}
              </span>
            </div>
            <span class="px-2 py-0.5 text-[8px] bg-green-50 text-success rounded font-extrabold uppercase">{{ 'reports.completed' | translate }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.reports' }
    ]);
  }

  exportReport(name: string) {
    const translatedName = this.translateService.instant('reports.report_names.' + name);
    this.notificationService.success(
      this.translateService.instant('reports.notification_title'),
      this.translateService.instant('reports.notification_desc', { name: translatedName })
    );
  }
}
