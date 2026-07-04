import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-attendance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-3">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.dashboard.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.dashboard.subtitle' | translate }}</p>
      </div>
      <div class="text-xs font-bold text-slate-400">{{ today }}</div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div class="bg-white rounded-2xl border border-green-100 shadow-sm p-4">
        <div class="flex items-center justify-between mb-2"><span class="text-xl">✅</span><span class="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">Today</span></div>
        <p class="text-3xl font-black text-green-600">{{ hr.todayPresent() }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.dashboard.stat_present' | translate }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-red-100 shadow-sm p-4">
        <div class="flex items-center justify-between mb-2"><span class="text-xl">❌</span><span class="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">Today</span></div>
        <p class="text-3xl font-black text-red-600">{{ hr.todayAbsent() }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.dashboard.stat_absent' | translate }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
        <div class="flex items-center justify-between mb-2"><span class="text-xl">⏰</span><span class="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">Today</span></div>
        <p class="text-3xl font-black text-amber-600">{{ hr.todayLate() }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.dashboard.stat_late' | translate }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
        <div class="flex items-center justify-between mb-2"><span class="text-xl">🏖️</span><span class="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">Today</span></div>
        <p class="text-3xl font-black text-blue-600">{{ hr.todayOnLeave() }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.dashboard.stat_leave' | translate }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-purple-100 shadow-sm p-4">
        <div class="flex items-center justify-between mb-2"><span class="text-xl">✈️</span><span class="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">Today</span></div>
        <p class="text-3xl font-black text-purple-600">{{ hr.todayOnTrip() }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.dashboard.stat_trips' | translate }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-teal-100 shadow-sm p-4">
        <div class="flex items-center justify-between mb-2"><span class="text-xl">💻</span></div>
        <p class="text-3xl font-black text-teal-600">{{ hr.todayRemote() }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.dashboard.stat_remote' | translate }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
        <div class="flex items-center justify-between mb-2"><span class="text-xl">⚡</span></div>
        <p class="text-3xl font-black text-orange-500">{{ hr.totalOvertimeToday() | number:'1.1-1' }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.dashboard.stat_overtime' | translate }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-primary/20 shadow-sm p-4">
        <div class="flex items-center justify-between mb-2"><span class="text-xl">📊</span></div>
        <p class="text-3xl font-black text-primary">{{ hr.attendanceRate() }}%</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.dashboard.stat_rate' | translate }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-rose-100 shadow-sm p-4">
        <div class="flex items-center justify-between mb-2"><span class="text-xl">⚠️</span></div>
        <p class="text-3xl font-black text-rose-600">{{ pendingExceptions() }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.dashboard.stat_exceptions' | translate }}</p>
      </div>
      <!-- Attendance Rate Visual -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">{{ 'hr.att.dashboard.stat_rate' | translate }}</p>
        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary to-green-400 rounded-full transition-all" [style.width]="hr.attendanceRate() + '%'"></div>
        </div>
        <p class="text-[10px] font-semibold text-slate-500 mt-1">{{ hr.attendanceRate() }}% of workforce</p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Weekly Attendance Chart -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="font-black text-slate-800 text-sm mb-4">{{ 'hr.att.dashboard.week_chart' | translate }}</h3>
        <div class="flex items-end gap-3 h-32">
          @for (day of weeklyData; track day.label) {
            <div class="flex-1 flex flex-col items-center gap-1">
              <span class="text-[10px] font-black text-slate-500">{{ day.pct }}%</span>
              <div class="w-full rounded-t-lg transition-all" [style.height]="day.pct * 1.1 + 'px'" [style.background]="day.pct >= 90 ? '#10B981' : day.pct >= 80 ? '#F59E0B' : '#EF4444'"></div>
              <span class="text-[10px] font-bold text-slate-400">{{ day.label }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Pending Approvals -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="font-black text-slate-800 text-sm mb-4">{{ 'hr.att.dashboard.pending_approvals' | translate }}</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
            <div class="flex items-center gap-2"><span class="text-base">⚡</span><span class="text-xs font-bold text-amber-800">{{ 'hr.att.dashboard.ot_pending' | translate }}</span></div>
            <span class="text-lg font-black text-amber-600">{{ pendingOvertimes() }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div class="flex items-center gap-2"><span class="text-base">📋</span><span class="text-xs font-bold text-blue-800">{{ 'hr.att.dashboard.perm_pending' | translate }}</span></div>
            <span class="text-lg font-black text-blue-600">{{ pendingPermissions() }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
            <div class="flex items-center gap-2"><span class="text-base">✈️</span><span class="text-xs font-bold text-purple-800">{{ 'hr.att.dashboard.trip_pending' | translate }}</span></div>
            <span class="text-lg font-black text-purple-600">{{ pendingTrips() }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
            <div class="flex items-center gap-2"><span class="text-base">⚠️</span><span class="text-xs font-bold text-rose-800">{{ 'hr.att.dashboard.stat_exceptions' | translate }}</span></div>
            <span class="text-lg font-black text-rose-600">{{ pendingExceptions() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Shift Distribution -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="font-black text-slate-800 text-sm mb-4">{{ 'hr.att.dashboard.shift_dist' | translate }}</h3>
        <div class="space-y-3">
          @for (shift of hr.shifts(); track shift.id) {
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full flex-shrink-0" [style.background]="shift.color"></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-700 truncate">{{ shift.name }}</span>
                  <span class="text-[10px] font-black text-slate-500 ml-2">{{ shift.code }}</span>
                </div>
                <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" [style.width]="(60 + $index * 10) + '%'" [style.background]="shift.color"></div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Recent Exceptions -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 class="font-black text-slate-800 text-sm mb-4">{{ 'hr.att.dashboard.recent_exceptions' | translate }}</h3>
        <div class="space-y-2">
          @for (ex of hr.attendanceExceptions().slice(0, 5); track ex.id) {
            <div class="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl hover:bg-slate-100/80 transition-colors">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-800 truncate">{{ ex.employeeName }}</p>
                <p class="text-[10px] text-slate-500 font-semibold mt-0.5">{{ ex.type }} · {{ ex.date }}</p>
              </div>
              <span [class]="exBadge(ex.status)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border ml-2 flex-shrink-0">{{ ex.status }}</span>
            </div>
          }
        </div>
      </div>
    </div>

  </div>
  `
})
export class HrAttendanceDashboardComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  readonly today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  readonly weeklyData = [
    { label: 'Sun', pct: 92 }, { label: 'Mon', pct: 87 }, { label: 'Tue', pct: 95 },
    { label: 'Wed', pct: 89 }, { label: 'Thu', pct: 78 }, { label: 'Fri', pct: 40 }, { label: 'Sat', pct: 30 }
  ];

  readonly pendingExceptions = computed(() => this.hr.attendanceExceptions().filter(e => e.status === 'Pending').length);
  readonly pendingOvertimes = computed(() => this.hr.overtimeRequests().filter(o => o.status === 'Pending').length);
  readonly pendingPermissions = computed(() => this.hr.permissionRequests().filter(p => p.status === 'Pending').length);
  readonly pendingTrips = computed(() => this.hr.businessTrips().filter(t => t.status === 'Pending').length);

  exBadge(status: string): string {
    return status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-100' :
           status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
           'bg-amber-50 text-amber-700 border-amber-100';
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.dashboard.title' }]);
  }
}
