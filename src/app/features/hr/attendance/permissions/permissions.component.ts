import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { PermissionRequest, PermissionType } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.permission.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.permission.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.att.permission.btn_add' | translate }}
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-slate-700">{{ hr.permissionRequests().length }}</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.permission.stat_total' | translate }}</p></div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-amber-600">{{ pendingCount() }}</p><p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.att.permission.stat_pending' | translate }}</p></div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-green-600">{{ approvedCount() }}</p><p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.att.permission.stat_approved' | translate }}</p></div>
      <div class="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-red-600">{{ rejectedCount() }}</p><p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.att.permission.stat_rejected' | translate }}</p></div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-48">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search employee..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
      </div>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Statuses</option>
        @for (s of pstatuses; track s) { <option [value]="s">{{ s }}</option> }
      </select>
      <select [(ngModel)]="filterType" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Types</option>
        @for (t of permTypes; track t) { <option [value]="t">{{ t }}</option> }
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_emp' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_dept' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_date' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_type' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_from' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_to' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_duration' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_reason' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_status' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.daily.col_actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (pm of filteredRequests(); track pm.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3"><p class="font-bold text-slate-800">{{ pm.employeeName }}</p><p class="text-[10px] text-slate-400">{{ pm.employeeNumber }}</p></td>
                <td class="px-4 py-3 text-slate-500 text-[11px]">{{ pm.departmentName }}</td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ pm.date }}</td>
                <td class="px-4 py-3"><span [class]="typeBadge(pm.type)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">{{ pm.type }}</span></td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">{{ pm.timeFrom }}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">{{ pm.timeTo }}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-600">{{ durationLabel(pm.durationMinutes || 0) }}</td>
                <td class="px-4 py-3 text-slate-500 max-w-32 truncate">{{ pm.reason }}</td>
                <td class="px-4 py-3 text-center"><span [class]="pmBadge(pm.status)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ pm.status }}</span></td>
                <td class="px-4 py-3">
                  @if (pm.status === 'Pending') {
                    <div class="flex gap-1 justify-center">
                      <button (click)="hr.approvePermission(pm.id, 'HR Manager')" class="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">✓</button>
                      <button (click)="openReject(pm.id)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold">✕</button>
                    </div>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="10" class="px-4 py-10 text-center text-slate-400 text-xs">No permission requests found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- New Request Modal -->
    @if (showForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="showForm.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b"><h3 class="font-black text-slate-800 text-sm">{{ 'hr.att.permission.title_add' | translate }}</h3><button (click)="showForm.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button></div>
          <div class="p-5 grid grid-cols-2 gap-3 text-xs">
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.lbl_emp_name' | translate }}</label><input [(ngModel)]="form.employeeName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_dept' | translate }}</label><input [(ngModel)]="form.departmentName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_date' | translate }}</label><input [(ngModel)]="form.date" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_type' | translate }}</label>
              <select [(ngModel)]="form.type" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                @for (t of permTypes; track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_from' | translate }}</label><input [(ngModel)]="form.timeFrom" type="time" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_to' | translate }}</label><input [(ngModel)]="form.timeTo" type="time" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.col_reason' | translate }}</label><input [(ngModel)]="form.reason" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t">
            <button (click)="showForm.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submit()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">{{ 'hr.common.save' | translate }}</button>
          </div>
        </div>
      </div>
    }

    <!-- Reject Modal -->
    @if (showRejectModal()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="showRejectModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b"><h3 class="font-black text-red-700 text-sm">Reject Permission</h3><button (click)="showRejectModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button></div>
          <div class="p-5 text-xs">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.permission.lbl_rejection' | translate }}</label>
            <textarea [(ngModel)]="rejectionReason" rows="3" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-400 font-semibold text-slate-800 resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t">
            <button (click)="showRejectModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submitReject()" class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl">{{ 'hr.att.permission.btn_reject' | translate }}</button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrPermissionsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = ''; filterStatus = ''; filterType = '';
  showForm = signal(false); showRejectModal = signal(false);
  selectedId = signal(''); rejectionReason = '';
  form: Partial<PermissionRequest> = {};

  readonly permTypes: PermissionType[] = ['Late Arrival', 'Early Leave', 'Official Mission', 'Medical', 'Personal'];
  readonly pstatuses = ['Pending', 'Approved', 'Rejected'];

  readonly filteredRequests = computed(() => {
    let list = this.hr.permissionRequests();
    if (this.search) list = list.filter(p => p.employeeName.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterStatus) list = list.filter(p => p.status === this.filterStatus);
    if (this.filterType) list = list.filter(p => p.type === this.filterType);
    return list;
  });
  readonly pendingCount = computed(() => this.hr.permissionRequests().filter(p => p.status === 'Pending').length);
  readonly approvedCount = computed(() => this.hr.permissionRequests().filter(p => p.status === 'Approved').length);
  readonly rejectedCount = computed(() => this.hr.permissionRequests().filter(p => p.status === 'Rejected').length);

  durationLabel(mins: number): string {
    if (!mins) return '—';
    const h = Math.floor(mins / 60); const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  typeBadge(type: string): string {
    return { 'Late Arrival': 'bg-amber-50 text-amber-700 border-amber-100', 'Early Leave': 'bg-orange-50 text-orange-700 border-orange-100', 'Official Mission': 'bg-blue-50 text-blue-700 border-blue-100', 'Medical': 'bg-rose-50 text-rose-700 border-rose-100', 'Personal': 'bg-slate-100 text-slate-600 border-slate-200' }[type] || 'bg-slate-100 text-slate-500 border-slate-200';
  }
  pmBadge(status: string): string {
    return { 'Pending': 'bg-amber-50 text-amber-700 border-amber-100', 'Approved': 'bg-green-50 text-green-700 border-green-100', 'Rejected': 'bg-red-50 text-red-700 border-red-100' }[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  openAdd() { this.form = { type: 'Personal', date: new Date().toISOString().split('T')[0] }; this.showForm.set(true); }
  openReject(id: string) { this.selectedId.set(id); this.rejectionReason = ''; this.showRejectModal.set(true); }
  submitReject() { this.hr.rejectPermission(this.selectedId(), this.rejectionReason, 'HR Manager'); this.showRejectModal.set(false); }
  submit() { this.hr.addPermissionRequest(this.form); this.showForm.set(false); }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.permission.title' }]);
  }
}
