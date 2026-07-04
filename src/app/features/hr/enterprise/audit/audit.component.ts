import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.ent_audit_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.ent_audit_subtitle' | translate }}</p>
      </div>
      <button (click)="clearAudit()" class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl font-bold text-xs">
        Clear Audit Logs
      </button>
    </div>

    <!-- Filters & Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      
      <!-- Filters -->
      <div class="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-3">
        <div class="relative flex-1 min-w-[200px]">
          <input [(ngModel)]="search" type="text" placeholder="Search user or action..." class="w-full pl-3 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        </div>
        <select [(ngModel)]="filterModule" class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
          <option value="">{{ 'hr.reports.ent_audit_filter_module' | translate }}</option>
          <option value="Payroll">Payroll</option>
          <option value="Leaves">Leaves</option>
          <option value="Attendance">Attendance</option>
          <option value="Recruitment">Recruitment</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.ent_audit_col_time' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.ent_audit_col_user' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.ent_audit_col_module' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.ent_audit_col_action' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.ent_audit_col_before' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.ent_audit_col_after' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (log of filteredLogs(); track log.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-semibold text-slate-500">{{ log.time }}</td>
                <td class="px-4 py-3 font-bold text-slate-750">{{ log.user }}</td>
                <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full bg-slate-100 border text-slate-600 font-bold text-[9px]">{{ log.module }}</span></td>
                <td class="px-4 py-3 font-bold text-primary">{{ log.action }}</td>
                <td class="px-4 py-3 text-red-650 font-mono text-[10px]">{{ log.before || '—' }}</td>
                <td class="px-4 py-3 text-green-700 font-mono text-[10px]">{{ log.after }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

    </div>

  </div>
  `
})
export class HrAuditComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = '';
  filterModule = '';

  readonly logs = signal([
    { id: '1', time: '2026-07-04 02:15:30', user: 'Sarah Al-Qahtani', module: 'Payroll', action: 'Update Record', before: 'salary: 12000', after: 'salary: 12500' },
    { id: '2', time: '2026-07-04 01:10:05', user: 'Khalid Al-Shehri', module: 'Leaves', action: 'Approve Request', before: 'status: Pending', after: 'status: Approved' },
    { id: '3', time: '2026-07-03 16:45:12', user: 'IT Auto-System', module: 'Recruitment', action: 'Create Employee', before: '', after: 'EMP-009: Rami Al-Harbi' },
    { id: '4', time: '2026-07-03 09:20:00', user: 'Nora Al-Rashidi', module: 'Attendance', action: 'Import File', before: 'records: 0', after: 'records: 124' }
  ]);

  readonly filteredLogs = computed(() => {
    let list = this.logs();
    if (this.search) {
      list = list.filter(l => l.user.toLowerCase().includes(this.search.toLowerCase()) || l.action.toLowerCase().includes(this.search.toLowerCase()));
    }
    if (this.filterModule) {
      list = list.filter(l => l.module === this.filterModule);
    }
    return list;
  });

  clearAudit() {
    this.logs.set([]);
    this.hr.notify.warning('hr.common.success', 'Audit log database cleared.');
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.ent_audit_title' }
    ]);
  }
}
