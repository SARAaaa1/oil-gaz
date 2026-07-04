import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AttendanceException, ExceptionType } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-attendance-exceptions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.exception.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.exception.subtitle' | translate }}</p>
      </div>
      <div class="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        <span class="text-base">⚠️</span>
        <span class="text-xs font-black text-amber-700">{{ pendingCount() }} {{ 'hr.att.exception.stat_pending' | translate }}</span>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-slate-700">{{ hr.attendanceExceptions().length }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.exception.stat_total' | translate }}</p>
      </div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-amber-600">{{ pendingCount() }}</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.att.exception.stat_pending' | translate }}</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-green-600">{{ resolvedCount() }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.att.exception.stat_resolved' | translate }}</p>
      </div>
      <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-red-600">{{ rejectedCount() }}</p>
        <p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.att.exception.stat_rejected' | translate }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-48">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search employee..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-primary/50">
      </div>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Statuses</option>
        @for (s of exStatuses; track s) { <option [value]="s">{{ s }}</option> }
      </select>
      <select [(ngModel)]="filterType" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Types</option>
        @for (t of exTypes; track t) { <option [value]="t">{{ t }}</option> }
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.col_emp' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.col_dept' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.col_date' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.col_type' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.col_desc' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.col_status' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.col_resolved_by' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.col_actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (ex of filteredExceptions(); track ex.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-bold text-slate-800">{{ ex.employeeName }}</td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ ex.departmentName }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ ex.date }}</td>
                <td class="px-4 py-3"><span [class]="typeBadge(ex.type)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">{{ ex.type }}</span></td>
                <td class="px-4 py-3 text-slate-500 text-[11px] max-w-48 truncate">{{ ex.description }}</td>
                <td class="px-4 py-3 text-center"><span [class]="statusBadge(ex.status)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ ex.status }}</span></td>
                <td class="px-4 py-3 text-[11px] text-slate-500">{{ ex.resolvedBy || '—' }}</td>
                <td class="px-4 py-3">
                  @if (ex.status === 'Pending') {
                    <div class="flex gap-1 justify-center">
                      <button (click)="openResolve(ex)" class="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">{{ 'hr.att.exception.btn_resolve' | translate }}</button>
                      <button (click)="hr.rejectException(ex.id)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold">{{ 'hr.att.exception.btn_reject' | translate }}</button>
                    </div>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="px-4 py-10 text-center text-slate-400 text-xs font-semibold">No exceptions found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Resolve Modal -->
    @if (showResolveModal()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="showResolveModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="font-black text-slate-800 text-sm">{{ 'hr.att.exception.title_resolve' | translate }}</h3>
            <button (click)="showResolveModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <p class="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-3 font-semibold">{{ selectedEx()?.description }}</p>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.lbl_corrected_in' | translate }}</label>
              <input [(ngModel)]="correctedIn" type="time" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.lbl_corrected_out' | translate }}</label>
              <input [(ngModel)]="correctedOut" type="time" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.exception.lbl_resolver' | translate }}</label>
              <input [(ngModel)]="resolverName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800">
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t">
            <button (click)="showResolveModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submitResolve()" class="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl">{{ 'hr.att.exception.btn_resolve' | translate }}</button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrAttendanceExceptionsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = ''; filterStatus = ''; filterType = '';
  showResolveModal = signal(false);
  selectedId = signal('');
  selectedEx = computed(() => this.hr.attendanceExceptions().find(e => e.id === this.selectedId()));
  correctedIn = ''; correctedOut = ''; resolverName = 'HR Manager';

  readonly exTypes: ExceptionType[] = ['Missing Check-In', 'Missing Check-Out', 'Duplicate Punch', 'Invalid Time'];
  readonly exStatuses = ['Pending', 'Resolved', 'Rejected'];

  readonly filteredExceptions = computed(() => {
    let list = this.hr.attendanceExceptions();
    if (this.search) list = list.filter(e => e.employeeName.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterStatus) list = list.filter(e => e.status === this.filterStatus);
    if (this.filterType) list = list.filter(e => e.type === this.filterType);
    return list;
  });
  readonly pendingCount = computed(() => this.hr.attendanceExceptions().filter(e => e.status === 'Pending').length);
  readonly resolvedCount = computed(() => this.hr.attendanceExceptions().filter(e => e.status === 'Resolved').length);
  readonly rejectedCount = computed(() => this.hr.attendanceExceptions().filter(e => e.status === 'Rejected').length);

  typeBadge(type: string): string {
    return { 'Missing Check-In': 'bg-orange-50 text-orange-700 border-orange-100', 'Missing Check-Out': 'bg-amber-50 text-amber-700 border-amber-100', 'Duplicate Punch': 'bg-blue-50 text-blue-700 border-blue-100', 'Invalid Time': 'bg-red-50 text-red-700 border-red-100' }[type] || 'bg-slate-100 text-slate-500 border-slate-200';
  }
  statusBadge(status: string): string {
    return { 'Pending': 'bg-amber-50 text-amber-700 border-amber-100', 'Resolved': 'bg-green-50 text-green-700 border-green-100', 'Rejected': 'bg-red-50 text-red-700 border-red-100' }[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  openResolve(ex: AttendanceException) {
    this.selectedId.set(ex.id);
    this.correctedIn = ex.correctedClockIn || '';
    this.correctedOut = ex.correctedClockOut || '';
    this.resolverName = 'HR Manager';
    this.showResolveModal.set(true);
  }

  submitResolve() {
    this.hr.resolveException(this.selectedId(), this.resolverName, this.correctedIn || undefined, this.correctedOut || undefined);
    this.showResolveModal.set(false);
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.exception.title' }]);
  }
}
