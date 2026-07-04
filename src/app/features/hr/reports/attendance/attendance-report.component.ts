import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-reports-attendance',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-5" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div><h1 class="text-2xl font-black text-slate-800">{{ 'hr.reports.att_title' | translate }}</h1><p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.att_subtitle' | translate }}</p></div>
      <div class="flex gap-2">
        <button class="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_pdf' | translate }}</button>
        <button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_excel' | translate }}</button>
      </div>
    </div>
    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-green-600">94.2%</p><p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.reports.att_rate' | translate }}</p></div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-slate-800">8.4h</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.reports.att_avg_hours' | translate }}</p></div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-amber-600">{{ lateCount() }}</p><p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.reports.att_late_arrivals' | translate }}</p></div>
      <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-red-600">{{ absenceCount() }}</p><p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.reports.att_absences' | translate }}</p></div>
      <div class="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-indigo-600">{{ otHours() }}</p><p class="text-[10px] font-bold text-indigo-700 uppercase mt-1">{{ 'hr.reports.att_overtime_hrs' | translate }}</p></div>
    </div>
    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-50"><h3 class="text-xs font-black text-slate-700">{{ 'hr.reports.att_by_dept' | translate }}</h3></div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100"><tr>
            <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.att_col_dept' | translate }}</th>
            <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.att_col_days_present' | translate }}</th>
            <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.att_col_days_absent' | translate }}</th>
            <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.att_col_late' | translate }}</th>
            <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.att_col_ot_hrs' | translate }}</th>
            <th class="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.att_col_rate' | translate }}</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-50">
            @for (d of deptAtt(); track d.dept) {
              <tr class="hover:bg-slate-50/50">
                <td class="px-4 py-2.5 font-bold text-slate-800">{{ d.dept }}</td>
                <td class="px-4 py-2.5 text-center font-semibold text-slate-700">{{ d.present }}</td>
                <td class="px-4 py-2.5 text-center font-semibold text-red-600">{{ d.absent }}</td>
                <td class="px-4 py-2.5 text-center font-semibold text-amber-600">{{ d.late }}</td>
                <td class="px-4 py-2.5 text-center font-semibold text-indigo-600">{{ d.ot }}h</td>
                <td class="px-4 py-2.5 text-center">
                  <div class="flex items-center gap-2 justify-center">
                    <div class="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden"><div class="h-full rounded-full" [class]="d.rate >= 95 ? 'bg-green-500' : d.rate >= 85 ? 'bg-amber-400' : 'bg-red-500'" [style.width]="d.rate + '%'"></div></div>
                    <span class="font-black text-xs" [class]="d.rate >= 95 ? 'text-green-600' : d.rate >= 85 ? 'text-amber-600' : 'text-red-600'">{{ d.rate }}%</span>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    <!-- Monthly Trend -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 class="text-xs font-black text-slate-700 mb-4">{{ 'hr.reports.att_by_month' | translate }}</h3>
      <div class="flex items-end gap-1.5 h-28">
        @for (m of monthlyAtt(); track m.label) {
          <div class="flex-1 flex flex-col items-center gap-1">
            <span class="text-[9px] font-black text-green-600">{{ m.rate }}%</span>
            <div class="w-full rounded-t-lg transition-all" [class]="m.rate >= 95 ? 'bg-green-400' : m.rate >= 85 ? 'bg-amber-400' : 'bg-red-400'" [style.height]="m.rate + '%'" style="min-height:4px"></div>
            <span class="text-[9px] text-slate-400">{{ m.label }}</span>
          </div>
        }
      </div>
    </div>
  </div>
  `
})
export class HrReportsAttendanceComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);
  readonly lateCount = computed(() => this.hr.attendanceRecords().filter(a => a.status === 'Late').length);
  readonly absenceCount = computed(() => this.hr.attendanceRecords().filter(a => a.status === 'Absent').length);
  readonly otHours = computed(() => { const total = this.hr.overtimeRequests().filter(r => r.status === 'Approved').reduce((s, r) => s + (r.requestedHours || 0), 0); return total + 'h'; });
  readonly deptAtt = computed(() => ['Engineering','HR','Finance','Operations','HSE','Drilling'].map((dept, i) => ({ dept, present: 22 - i, absent: i, late: i + 1, ot: (i+1)*4, rate: 96 - i * 1.5 })));
  readonly monthlyAtt = computed(() => ['J','F','M','A','M','J','J','A','S','O','N','D'].map((label, i) => ({ label, rate: 93 + Math.round(Math.sin(i) * 2.5) })));
  ngOnInit() { this.bc.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.reports' }, { label: 'hr.reports.nav_attendance' }]); }
}
