import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { OvertimeRequest, OvertimeType } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-overtime',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.overtime.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.overtime.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.att.overtime.btn_add' | translate }}
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-slate-700">{{ hr.overtimeRequests().length }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.overtime.stat_total' | translate }}</p>
      </div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-amber-600">{{ pendingCount() }}</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.att.overtime.stat_pending' | translate }}</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-3xl font-black text-green-600">{{ approvedCount() }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.att.overtime.stat_approved' | translate }}</p>
      </div>
      <div class="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-indigo-600">{{ totalPaid() | number:'1.0-0' }}</p>
        <p class="text-[10px] font-bold text-indigo-700 uppercase mt-1">{{ 'hr.att.overtime.stat_paid' | translate }}</p>
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
        @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
      </select>
      <select [(ngModel)]="filterType" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Types</option>
        @for (t of otTypes; track t) { <option [value]="t">{{ t }}</option> }
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_emp' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_dept' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_date' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_type' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_req_hrs' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_app_hrs' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_reason' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_status' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.col_actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (ot of filteredRequests(); track ot.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-bold text-slate-800">{{ ot.employeeName }}</p>
                  <p class="text-[10px] text-slate-400">{{ ot.employeeNumber }}</p>
                </td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ ot.departmentName }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ ot.date }}</td>
                <td class="px-4 py-3"><span class="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">{{ ot.type }}</span></td>
                <td class="px-4 py-3 text-center font-black text-slate-700">{{ ot.requestedHours }}h</td>
                <td class="px-4 py-3 text-center font-black text-green-600">{{ ot.approvedHours ? ot.approvedHours + 'h' : '—' }}</td>
                <td class="px-4 py-3 text-slate-500 max-w-32 truncate">{{ ot.reason }}</td>
                <td class="px-4 py-3 text-center"><span [class]="otBadge(ot.status)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ ot.status }}</span></td>
                <td class="px-4 py-3">
                  <div class="flex gap-1 justify-center">
                    @if (ot.status === 'Pending') {
                      <button (click)="openApprove(ot)" class="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">✓ {{ 'hr.att.overtime.btn_approve' | translate }}</button>
                      <button (click)="openReject(ot.id)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold">✕ {{ 'hr.att.overtime.btn_reject' | translate }}</button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="px-4 py-10 text-center text-slate-400 text-xs">No overtime requests found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- New Request Modal -->
    @if (showForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="showForm.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="font-black text-slate-800 text-sm">{{ 'hr.att.overtime.title_add' | translate }}</h3>
            <button (click)="showForm.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 grid grid-cols-2 gap-3 text-xs">
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">Employee Name</label><input [(ngModel)]="form.employeeName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_dept' | translate }}</label><input [(ngModel)]="form.departmentName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_date' | translate }}</label><input [(ngModel)]="form.date" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_type' | translate }}</label>
              <select [(ngModel)]="form.type" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                @for (t of otTypes; track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_req_hrs' | translate }}</label><input [(ngModel)]="form.requestedHours" type="number" min="1" max="24" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">Hourly Rate (SAR)</label><input [(ngModel)]="form.hourlyRate" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.col_reason' | translate }}</label><input [(ngModel)]="form.reason" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t">
            <button (click)="showForm.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submit()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">{{ 'hr.common.save' | translate }}</button>
          </div>
        </div>
      </div>
    }

    <!-- Approve Modal -->
    @if (showApproveModal()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="showApproveModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="font-black text-slate-800 text-sm">{{ 'hr.att.overtime.title_approve' | translate }}</h3>
            <button (click)="showApproveModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <p class="text-slate-500 font-semibold">Requested: <span class="font-black text-slate-800">{{ selectedOt()?.requestedHours }}h</span></p>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.lbl_approved_hrs' | translate }}</label>
              <input [(ngModel)]="approvedHoursVal" type="number" min="0" [max]="selectedOt()?.requestedHours ?? 24" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-green-400 font-semibold text-slate-800">
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t">
            <button (click)="showApproveModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submitApprove()" class="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl">{{ 'hr.att.overtime.btn_approve' | translate }}</button>
          </div>
        </div>
      </div>
    }

    <!-- Reject Modal -->
    @if (showRejectModal()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="showRejectModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="font-black text-slate-800 text-sm text-red-700">{{ 'hr.att.overtime.title_reject' | translate }}</h3>
            <button (click)="showRejectModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 text-xs">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.overtime.lbl_rejection' | translate }}</label>
            <textarea [(ngModel)]="rejectionReason" rows="3" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-400 font-semibold text-slate-800 resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t">
            <button (click)="showRejectModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submitReject()" class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl">{{ 'hr.att.overtime.btn_reject' | translate }}</button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrOvertimeComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = '';
  filterStatus = '';
  filterType = '';
  showForm = signal(false);
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  selectedId = signal('');
  selectedOt = computed(() => this.hr.overtimeRequests().find(o => o.id === this.selectedId()));
  approvedHoursVal = 0;
  rejectionReason = '';
  form: Partial<OvertimeRequest> = {};

  readonly otTypes: OvertimeType[] = ['Weekday', 'Weekend', 'Holiday', 'Night Shift'];
  readonly statuses = ['Draft', 'Pending', 'Approved', 'Rejected', 'Paid'];

  readonly filteredRequests = computed(() => {
    let list = this.hr.overtimeRequests();
    if (this.search) list = list.filter(o => o.employeeName.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterStatus) list = list.filter(o => o.status === this.filterStatus);
    if (this.filterType) list = list.filter(o => o.type === this.filterType);
    return list;
  });
  readonly pendingCount = computed(() => this.hr.overtimeRequests().filter(o => o.status === 'Pending').length);
  readonly approvedCount = computed(() => this.hr.overtimeRequests().filter(o => o.status === 'Approved').length);
  readonly totalPaid = computed(() => this.hr.overtimeRequests().filter(o => o.status === 'Paid').reduce((s, o) => s + (o.totalAmount ?? 0), 0));

  otBadge(status: string): string {
    return { 'Pending': 'bg-amber-50 text-amber-700 border-amber-100', 'Approved': 'bg-green-50 text-green-700 border-green-100', 'Rejected': 'bg-red-50 text-red-700 border-red-100', 'Paid': 'bg-indigo-50 text-indigo-700 border-indigo-100', 'Draft': 'bg-slate-100 text-slate-500 border-slate-200' }[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  openAdd() { this.form = { type: 'Weekday', date: new Date().toISOString().split('T')[0] }; this.showForm.set(true); }
  openApprove(ot: OvertimeRequest) { this.selectedId.set(ot.id); this.approvedHoursVal = ot.requestedHours; this.showApproveModal.set(true); }
  openReject(id: string) { this.selectedId.set(id); this.rejectionReason = ''; this.showRejectModal.set(true); }
  submitApprove() { this.hr.approveOvertime(this.selectedId(), this.approvedHoursVal, 'HR Manager'); this.showApproveModal.set(false); }
  submitReject() { this.hr.rejectOvertime(this.selectedId(), this.rejectionReason, 'HR Manager'); this.showRejectModal.set(false); }
  submit() { this.hr.addOvertimeRequest(this.form); this.showForm.set(false); }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.overtime.title' }]);
  }
}
