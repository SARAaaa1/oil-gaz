import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-integration-overview',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.int_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.int_subtitle' | translate }}</p>
      </div>
      <button (click)="syncAll()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">
        🔄 Sync All Modules
      </button>
    </div>

    <!-- Integrations Status Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (m of modules(); track m.name) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl p-2 bg-slate-50 rounded-xl">{{ m.icon }}</span>
              <div>
                <h3 class="font-black text-slate-850 text-xs tracking-wide uppercase">{{ m.name }}</h3>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Last Sync: {{ m.lastSync }}</p>
              </div>
            </div>
            <span [class]="statusClass(m.status)" class="px-2.5 py-0.5 rounded-full text-[9px] font-bold border">
              {{ m.status }}
            </span>
          </div>

          <div class="text-[11px] font-semibold text-slate-600 bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100">
            @for (log of m.details; track log) {
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span class="truncate">{{ log }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>

  </div>
  `
})
export class HrIntegrationOverviewComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  readonly modules = signal([
    {
      name: 'General Ledger & Finance',
      icon: '💵',
      status: 'Connected',
      lastSync: '2026-07-04 02:00',
      details: [
        'Payroll Journal (SAR 2,160,000) posted.',
        'Tax withholdings reconciled.',
        'Social insurance entry created.'
      ]
    },
    {
      name: 'Asset Registry & Vehicles',
      icon: '🚗',
      status: 'Connected',
      lastSync: '2026-07-03 18:30',
      details: [
        '14 laptops assigned to onboarding.',
        '2 fleet vehicles assigned to supervisors.',
        'No SIM assignments pending.'
      ]
    },
    {
      name: 'HSE & Safety PPE',
      icon: '🦺',
      status: 'Connected',
      lastSync: '2026-07-04 01:15',
      details: [
        'Medical compliance checks completed.',
        '10 PPE uniform packages distributed.',
        '2 incident allocations registered.'
      ]
    },
    {
      name: 'Projects & Rig Sites',
      icon: '🏗️',
      status: 'Connected',
      lastSync: '2026-07-04 03:00',
      details: [
        'Drilling engineer assigned to RIG-102.',
        'Timesheet supervisor verified.',
        'Cost Center codes aligned.'
      ]
    },
    {
      name: 'Fleet & Driving Licenses',
      icon: '🎫',
      status: 'Connected',
      lastSync: '2026-07-02 12:00',
      details: [
        'Driver licenses monitored.',
        '1 license expiry warning generated.',
        'Vehicle logs synced.'
      ]
    }
  ]);

  statusClass(s: string) {
    return s === 'Connected' ? 'bg-green-50 text-green-700 border-green-150' : 'bg-amber-50 text-amber-700 border-amber-150';
  }

  syncAll() {
    this.hr.notify.success('hr.common.success', 'All ERP integration channels synchronized.');
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.int_title' },
      { label: 'hr.reports.int_nav_overview' }
    ]);
  }
}
