import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { BusinessTrip, TransportationType } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-business-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.trip.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.trip.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.att.trip.btn_add' | translate }}
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center"><p class="text-2xl font-black text-slate-700">{{ hr.businessTrips().length }}</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.trip.stat_total' | translate }}</p></div>
      <div class="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4 text-center"><p class="text-2xl font-black text-blue-600">{{ inProgressCount() }}</p><p class="text-[10px] font-bold text-blue-700 uppercase mt-1">{{ 'hr.att.trip.stat_inprogress' | translate }}</p></div>
      <div class="bg-purple-50 rounded-2xl border border-purple-100 shadow-sm p-4 text-center"><p class="text-2xl font-black text-purple-600">{{ approvedCount() }}</p><p class="text-[10px] font-bold text-purple-700 uppercase mt-1">Approved</p></div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center"><p class="text-2xl font-black text-green-600">{{ completedCount() }}</p><p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.att.trip.stat_completed' | translate }}</p></div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center"><p class="text-2xl font-black text-amber-600">{{ pendingCount() }}</p><p class="text-[10px] font-bold text-amber-700 uppercase mt-1">Pending</p></div>
      <div class="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm p-4 text-center"><p class="text-2xl font-black text-slate-600">{{ draftCount() }}</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-1">Draft</p></div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-48">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search employee or destination..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
      </div>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Statuses</option>
        @for (s of tripStatuses; track s) { <option [value]="s">{{ s }}</option> }
      </select>
    </div>

    <!-- Trip Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      @for (trip of filteredTrips(); track trip.id) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-slate-50">
            <div>
              <p class="font-black text-slate-800 text-sm">{{ trip.employeeName }}</p>
              <p class="text-[10px] text-slate-400 font-semibold">{{ trip.employeeNumber }} · {{ trip.departmentName }}</p>
            </div>
            <span [class]="tripBadge(trip.status)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">{{ trip.status }}</span>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex items-start gap-2">
              <span class="text-base mt-0.5">📍</span>
              <div>
                <p class="font-black text-slate-800 text-sm">{{ trip.destination }}</p>
                @if (trip.projectName) { <p class="text-[10px] text-slate-500 font-semibold">{{ trip.projectName }}</p> }
              </div>
            </div>
            <p class="text-[11px] text-slate-600 font-medium line-clamp-2">{{ trip.purpose }}</p>
            <div class="flex items-center gap-4 text-[11px]">
              <span class="flex items-center gap-1 font-bold text-slate-700">📅 {{ trip.startDate }} → {{ trip.endDate }}</span>
              <span class="font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{{ trip.durationDays }} days</span>
            </div>
            <div class="flex items-center justify-between bg-slate-50 rounded-xl p-3">
              <div class="flex items-center gap-2">
                <span class="text-base">{{ transportIcon(trip.transportation) }}</span>
                <span class="text-[11px] font-bold text-slate-600">{{ trip.transportation }}</span>
                @if (trip.accommodation) { <span class="text-[10px] text-slate-400">· {{ trip.accommodation }}</span> }
              </div>
              <div class="text-right">
                <p class="text-[10px] text-slate-400">SAR {{ trip.dailyAllowance }}/day</p>
                <p class="font-black text-slate-800 text-sm">SAR {{ trip.totalAllowance | number:'1.0-0' }}</p>
              </div>
            </div>
            <div class="flex gap-2 pt-1">
              @if (trip.status === 'Draft') {
                <button (click)="hr.submitTrip(trip.id)" class="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition-all">{{ 'hr.att.trip.btn_submit' | translate }}</button>
              }
              @if (trip.status === 'Pending') {
                <button (click)="hr.approveTrip(trip.id, 'HR Manager')" class="flex-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] font-bold transition-all">✓ {{ 'hr.att.trip.btn_approve' | translate }}</button>
                <button (click)="openReject(trip.id)" class="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all">✕ {{ 'hr.att.trip.btn_reject' | translate }}</button>
              }
            </div>
          </div>
        </div>
      } @empty {
        <div class="col-span-2 bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-xs font-semibold">No business trips found</div>
      }
    </div>

    <!-- New Trip Modal -->
    @if (showForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" (click)="showForm.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b"><h3 class="font-black text-slate-800 text-sm">{{ 'hr.att.trip.title_add' | translate }}</h3><button (click)="showForm.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button></div>
          <div class="p-5 grid grid-cols-2 gap-3 text-xs">
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">Employee Name</label><input [(ngModel)]="form.employeeName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.trip.col_dept' | translate }}</label><input [(ngModel)]="form.departmentName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.trip.col_dest' | translate }}</label><input [(ngModel)]="form.destination" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.trip.col_start' | translate }}</label><input [(ngModel)]="form.startDate" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.trip.col_end' | translate }}</label><input [(ngModel)]="form.endDate" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.trip.col_transport' | translate }}</label>
              <select [(ngModel)]="form.transportation" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                @for (t of transTypes; track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.trip.lbl_daily_allowance' | translate }}</label><input [(ngModel)]="form.dailyAllowance" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.trip.col_purpose' | translate }}</label><input [(ngModel)]="form.purpose" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.trip.lbl_accommodation' | translate }}</label><input [(ngModel)]="form.accommodation" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
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
          <div class="flex items-center justify-between p-5 border-b"><h3 class="font-black text-red-700 text-sm">Cancel / Reject Trip</h3><button (click)="showRejectModal.set(false)" class="text-slate-400 font-bold text-lg">✕</button></div>
          <div class="p-5 text-xs">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.trip.lbl_rejection' | translate }}</label>
            <textarea [(ngModel)]="rejectionReason" rows="3" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-400 font-semibold text-slate-800 resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t">
            <button (click)="showRejectModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submitReject()" class="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl">{{ 'hr.att.trip.btn_reject' | translate }}</button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrBusinessTripsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = ''; filterStatus = '';
  showForm = signal(false); showRejectModal = signal(false);
  selectedId = signal(''); rejectionReason = '';
  form: Partial<BusinessTrip> = {};

  readonly transTypes: TransportationType[] = ['Air', 'Land', 'Sea', 'Company Vehicle'];
  readonly tripStatuses = ['Draft', 'Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled'];

  readonly filteredTrips = computed(() => {
    let list = this.hr.businessTrips();
    if (this.search) list = list.filter(t => t.employeeName.toLowerCase().includes(this.search.toLowerCase()) || t.destination.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterStatus) list = list.filter(t => t.status === this.filterStatus);
    return list;
  });
  readonly inProgressCount = computed(() => this.hr.businessTrips().filter(t => t.status === 'In Progress').length);
  readonly approvedCount = computed(() => this.hr.businessTrips().filter(t => t.status === 'Approved').length);
  readonly completedCount = computed(() => this.hr.businessTrips().filter(t => t.status === 'Completed').length);
  readonly pendingCount = computed(() => this.hr.businessTrips().filter(t => t.status === 'Pending').length);
  readonly draftCount = computed(() => this.hr.businessTrips().filter(t => t.status === 'Draft').length);

  tripBadge(status: string): string {
    const map: Record<string, string> = { 'Draft': 'bg-slate-100 text-slate-500 border-slate-200', 'Pending': 'bg-amber-50 text-amber-700 border-amber-100', 'Approved': 'bg-purple-50 text-purple-700 border-purple-100', 'In Progress': 'bg-blue-50 text-blue-700 border-blue-100', 'Completed': 'bg-green-50 text-green-700 border-green-100', 'Cancelled': 'bg-red-50 text-red-700 border-red-100' };
    return map[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  }
  transportIcon(t: string): string { return { 'Air': '✈️', 'Land': '🚗', 'Sea': '🚢', 'Company Vehicle': '🏢' }[t] || '🚗'; }

  openAdd() { this.form = { transportation: 'Air', startDate: new Date().toISOString().split('T')[0] }; this.showForm.set(true); }
  openReject(id: string) { this.selectedId.set(id); this.rejectionReason = ''; this.showRejectModal.set(true); }
  submitReject() { this.hr.rejectTrip(this.selectedId(), this.rejectionReason, 'HR Manager'); this.showRejectModal.set(false); }
  submit() { this.hr.addBusinessTrip(this.form); this.showForm.set(false); }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.trip.title' }]);
  }
}
