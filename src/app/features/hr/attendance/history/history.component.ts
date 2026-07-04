import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-attendance-history',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.history.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.history.subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <button (click)="print()" class="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold">📊 {{ 'hr.att.history.btn_excel' | translate }}</button>
        <button (click)="print()" class="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold">📄 {{ 'hr.att.history.btn_pdf' | translate }}</button>
        <button (click)="print()" class="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold">🖨️ {{ 'hr.att.history.btn_print' | translate }}</button>
      </div>
    </div>

    <!-- Selectors -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="flex-1 min-w-48">
        <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.history.select_employee' | translate }}</label>
        <select [(ngModel)]="selectedEmpId" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary/50 bg-slate-50">
          @for (e of hr.employees(); track e.id) { <option [value]="e.id">{{ e.fullName }}</option> }
        </select>
      </div>
      <div>
        <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.history.select_month' | translate }}</label>
        <input [(ngModel)]="selectedMonth" type="month" class="block mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary/50 bg-slate-50">
      </div>
    </div>

    <!-- Monthly Summary -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      <div class="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
        <p class="text-2xl font-black text-green-600">{{ presentDays() }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-0.5">{{ 'hr.att.history.stat_present' | translate }}</p>
      </div>
      <div class="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
        <p class="text-2xl font-black text-red-600">{{ absentDays() }}</p>
        <p class="text-[10px] font-bold text-red-700 uppercase mt-0.5">{{ 'hr.att.history.stat_absent' | translate }}</p>
      </div>
      <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
        <p class="text-2xl font-black text-amber-600">{{ lateDays() }}</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase mt-0.5">{{ 'hr.att.history.stat_late' | translate }}</p>
      </div>
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
        <p class="text-2xl font-black text-blue-600">{{ leaveDays() }}</p>
        <p class="text-[10px] font-bold text-blue-700 uppercase mt-0.5">{{ 'hr.att.history.stat_leave' | translate }}</p>
      </div>
      <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
        <p class="text-xl font-black text-indigo-600">{{ totalHours() | number:'1.1-1' }}</p>
        <p class="text-[10px] font-bold text-indigo-700 uppercase mt-0.5">{{ 'hr.att.history.stat_hours' | translate }}</p>
      </div>
      <div class="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
        <p class="text-xl font-black text-orange-600">{{ totalOT() | number:'1.1-1' }}</p>
        <p class="text-[10px] font-bold text-orange-700 uppercase mt-0.5">{{ 'hr.att.history.stat_ot' | translate }}</p>
      </div>
      <div class="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
        <p class="text-xl font-black text-rose-600">{{ totalLateMin() }}</p>
        <p class="text-[10px] font-bold text-rose-700 uppercase mt-0.5">{{ 'hr.att.history.stat_late_min' | translate }}</p>
      </div>
      <div class="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
        <p class="text-xl font-black text-primary">{{ attendanceRate() }}%</p>
        <p class="text-[10px] font-bold text-primary/70 uppercase mt-0.5">{{ 'hr.att.history.stat_rate' | translate }}</p>
      </div>
    </div>

    <!-- Daily Records Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-black text-slate-800 text-sm">{{ 'hr.att.history.section_daily' | translate }}</h3>
        <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{{ employeeRecords().length }} records</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.history.col_date' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.history.col_day' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.history.col_shift' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.history.col_checkin' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.history.col_checkout' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.history.col_hours' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.history.col_late' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.history.col_ot' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.history.col_status' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (rec of employeeRecords(); track rec.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-bold text-slate-700">{{ rec.date }}</td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ getDayName(rec.date) }}</td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ rec.shiftName || '—' }}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">{{ rec.clockIn || '—' }}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">{{ rec.clockOut || '—' }}</td>
                <td class="px-4 py-3 text-center font-black text-slate-700">{{ rec.workingHours ? (rec.workingHours | number:'1.1-1') : '—' }}</td>
                <td class="px-4 py-3 text-center">
                  @if (rec.lateMinutes && rec.lateMinutes > 0) {
                    <span class="font-black text-amber-600">{{ rec.lateMinutes }}m</span>
                  } @else { <span class="text-slate-300">—</span> }
                </td>
                <td class="px-4 py-3 text-center">
                  @if (rec.overtimeHours && rec.overtimeHours > 0) {
                    <span class="font-black text-green-600">{{ rec.overtimeHours | number:'1.1-1' }}h</span>
                  } @else { <span class="text-slate-300">—</span> }
                </td>
                <td class="px-4 py-3 text-center">
                  <span [class]="statusBadge(rec.status)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ rec.status }}</span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="px-4 py-10 text-center text-slate-400 text-xs font-semibold">No records for selected period</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Late Summary -->
    @if (lateRecords().length > 0) {
      <div class="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-amber-100 bg-amber-50/50">
          <h3 class="font-black text-amber-800 text-sm">⏰ {{ 'hr.att.history.section_late' | translate }}</h3>
        </div>
        <div class="divide-y divide-slate-50">
          @for (rec of lateRecords(); track rec.id) {
            <div class="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50">
              <div>
                <span class="font-bold text-slate-800 text-xs">{{ rec.date }}</span>
                <span class="text-slate-500 text-[11px] ml-3">{{ rec.shiftName }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs font-semibold text-slate-500">In: {{ rec.clockIn }}</span>
                <span class="font-black text-amber-600 text-sm">+{{ rec.lateMinutes }}min</span>
              </div>
            </div>
          }
        </div>
      </div>
    }

  </div>
  `
})
export class HrAttendanceHistoryComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  selectedEmpId = 'emp1';
  selectedMonth = new Date().toISOString().substring(0, 7);

  readonly employeeRecords = computed(() =>
    this.hr.attendanceRecords().filter(r => r.employeeId === this.selectedEmpId && r.date.startsWith(this.selectedMonth))
  );

  readonly presentDays = computed(() => this.employeeRecords().filter(r => r.status === 'Present' || r.status === 'Remote').length);
  readonly absentDays = computed(() => this.employeeRecords().filter(r => r.status === 'Absent').length);
  readonly lateDays = computed(() => this.employeeRecords().filter(r => r.status === 'Late').length);
  readonly leaveDays = computed(() => this.employeeRecords().filter(r => r.status === 'Leave' || r.status === 'On Leave').length);
  readonly totalHours = computed(() => this.employeeRecords().reduce((s, r) => s + (r.workingHours ?? 0), 0));
  readonly totalOT = computed(() => this.employeeRecords().reduce((s, r) => s + (r.overtimeHours ?? 0), 0));
  readonly totalLateMin = computed(() => this.employeeRecords().reduce((s, r) => s + (r.lateMinutes ?? 0), 0));
  readonly attendanceRate = computed(() => {
    const total = this.employeeRecords().length;
    if (!total) return 0;
    return Math.round(((this.presentDays() + this.lateDays()) / total) * 100);
  });
  readonly lateRecords = computed(() => this.employeeRecords().filter(r => r.status === 'Late' || (r.lateMinutes ?? 0) > 0));

  getDayName(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      'Present': 'bg-green-50 text-green-700 border-green-100', 'Remote': 'bg-teal-50 text-teal-700 border-teal-100',
      'Absent': 'bg-red-50 text-red-700 border-red-100', 'Late': 'bg-amber-50 text-amber-700 border-amber-100',
      'Leave': 'bg-blue-50 text-blue-700 border-blue-100', 'Business Trip': 'bg-purple-50 text-purple-700 border-purple-100'
    };
    return map[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  print() { window.print(); }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.history.title' }]);
  }
}
