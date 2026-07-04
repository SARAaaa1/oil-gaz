import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AttendanceRecord, AttendanceStatus } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.daily.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.daily.subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ 'hr.att.daily.btn_add' | translate }}
        </button>
        <button class="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all">📤 {{ 'hr.att.daily.btn_export' | translate }}</button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
        <p class="text-2xl font-black text-green-600">{{ presentCount() }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase">{{ 'hr.att.dashboard.stat_present' | translate }}</p>
      </div>
      <div class="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
        <p class="text-2xl font-black text-red-600">{{ absentCount() }}</p>
        <p class="text-[10px] font-bold text-red-700 uppercase">{{ 'hr.att.dashboard.stat_absent' | translate }}</p>
      </div>
      <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
        <p class="text-2xl font-black text-amber-600">{{ lateCount() }}</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase">{{ 'hr.att.dashboard.stat_late' | translate }}</p>
      </div>
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
        <p class="text-2xl font-black text-blue-600">{{ leaveCount() }}</p>
        <p class="text-[10px] font-bold text-blue-700 uppercase">{{ 'hr.att.dashboard.stat_leave' | translate }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div class="flex flex-wrap gap-3">
        <div class="relative flex-1 min-w-48">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input [(ngModel)]="searchQ" type="text" [placeholder]="'hr.employees.search_placeholder' | translate" class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary/50">
        </div>
        <input [(ngModel)]="selectedDate" type="date" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary/50">
        <select [(ngModel)]="selectedDept" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none">
          <option value="">{{ 'hr.att.daily.filter_dept' | translate }}</option>
          @for (d of hr.departments(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
        </select>
        <select [(ngModel)]="selectedShift" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none">
          <option value="">{{ 'hr.att.daily.filter_shift' | translate }}</option>
          @for (s of hr.shifts(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
        </select>
        <select [(ngModel)]="selectedStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none">
          <option value="">{{ 'hr.att.daily.filter_status' | translate }}</option>
          @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
        </select>
        <button (click)="clearFilters()" class="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all">✕ Clear</button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_emp_num' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_name' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_dept' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_shift' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_checkin' | translate }}</th>
              <th class="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_checkout' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_hours' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_late' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_ot' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_status' | translate }}</th>
              <th class="px-4 py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.att.daily.col_actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (rec of filteredRecords(); track rec.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-black text-slate-600 text-[10px]">{{ rec.employeeNumber || '—' }}</td>
                <td class="px-4 py-3 font-semibold text-slate-800">{{ rec.employeeName }}</td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ rec.departmentName || '—' }}</td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ rec.shiftName || '—' }}</td>
                <td class="px-4 py-3 font-bold text-slate-700">{{ rec.clockIn || '—' }}</td>
                <td class="px-4 py-3 font-bold text-slate-700">{{ rec.clockOut || '—' }}</td>
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
                <td class="px-4 py-3 text-center">
                  <button (click)="openEdit(rec)" class="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.edit' | translate }}</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="11" class="px-4 py-10 text-center text-slate-400 text-xs font-semibold">No records found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeModal()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="font-black text-slate-800 text-sm">{{ isEdit() ? ('hr.att.daily.title_edit' | translate) : ('hr.att.daily.title_add' | translate) }}</h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            @if (formError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-[11px] font-semibold">{{ formError() }}</div>
            }
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.col_name' | translate }}</label>
                <input [(ngModel)]="form.employeeName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.filter_date' | translate }}</label>
                <input [(ngModel)]="form.date" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.col_status' | translate }}</label>
                <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                  @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.col_checkin' | translate }}</label>
                <input [(ngModel)]="form.clockIn" type="time" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.col_checkout' | translate }}</label>
                <input [(ngModel)]="form.clockOut" type="time" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.col_dept' | translate }}</label>
                <input [(ngModel)]="form.departmentName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.col_shift' | translate }}</label>
                <select [(ngModel)]="form.shiftId" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                  <option value="">—</option>
                  @for (s of hr.shifts(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
                </select>
              </div>
              <div class="col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.lbl_notes' | translate }}</label>
                <input [(ngModel)]="form.notes" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t">
            <button (click)="closeModal()" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submit()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.common.save' | translate }}</button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrAttendanceComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  searchQ = '';
  selectedDate = new Date().toISOString().split('T')[0];
  selectedDept = '';
  selectedShift = '';
  selectedStatus = '';

  showModal = signal(false);
  isEdit = signal(false);
  editId = signal('');
  formError = signal('');
  form: Partial<AttendanceRecord> = {};

  readonly statuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Leave', 'Business Trip', 'Remote', 'Holiday', 'Weekend'];

  readonly filteredRecords = computed(() => {
    let records = this.hr.attendanceRecords();
    if (this.selectedDate) records = records.filter(r => r.date === this.selectedDate);
    if (this.searchQ) records = records.filter(r => r.employeeName.toLowerCase().includes(this.searchQ.toLowerCase()) || r.employeeNumber?.includes(this.searchQ));
    if (this.selectedDept) records = records.filter(r => r.departmentId === this.selectedDept);
    if (this.selectedShift) records = records.filter(r => r.shiftId === this.selectedShift);
    if (this.selectedStatus) records = records.filter(r => r.status === this.selectedStatus);
    return records;
  });

  readonly presentCount = computed(() => this.filteredRecords().filter(r => r.status === 'Present' || r.status === 'Remote').length);
  readonly absentCount = computed(() => this.filteredRecords().filter(r => r.status === 'Absent').length);
  readonly lateCount = computed(() => this.filteredRecords().filter(r => r.status === 'Late').length);
  readonly leaveCount = computed(() => this.filteredRecords().filter(r => r.status === 'Leave' || r.status === 'On Leave').length);

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      'Present': 'bg-green-50 text-green-700 border-green-100',
      'Remote': 'bg-teal-50 text-teal-700 border-teal-100',
      'Absent': 'bg-red-50 text-red-700 border-red-100',
      'Late': 'bg-amber-50 text-amber-700 border-amber-100',
      'Leave': 'bg-blue-50 text-blue-700 border-blue-100',
      'On Leave': 'bg-blue-50 text-blue-700 border-blue-100',
      'Business Trip': 'bg-purple-50 text-purple-700 border-purple-100',
      'Holiday': 'bg-indigo-50 text-indigo-700 border-indigo-100',
      'Weekend': 'bg-slate-100 text-slate-500 border-slate-200',
    };
    return map[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  clearFilters() { this.searchQ = ''; this.selectedDept = ''; this.selectedShift = ''; this.selectedStatus = ''; }

  openAdd() { this.isEdit.set(false); this.formError.set(''); this.form = { date: this.selectedDate, status: 'Present', source: 'Manual' }; this.showModal.set(true); }
  openEdit(rec: AttendanceRecord) { this.isEdit.set(true); this.editId.set(rec.id); this.formError.set(''); this.form = { ...rec }; this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  submit() {
    if (this.form.clockIn && this.form.clockOut && this.form.clockIn >= this.form.clockOut) {
      this.formError.set('Check-In must be before Check-Out');
      return;
    }
    if (this.isEdit()) this.hr.updateAttendanceRecord(this.editId(), this.form);
    else this.hr.addAttendanceRecord(this.form);
    this.closeModal();
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.daily.title' }]);
  }
}
