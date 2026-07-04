import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-doc-expiry',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.ent_doc_expiry_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">Monitor expiration dates of official documents</p>
      </div>
      <button (click)="sendReminders()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">
        ✉️ Send Expiry Reminders
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
        <p class="text-3xl font-black text-red-600">{{ countStatus('Expired') }}</p>
        <p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.reports.ent_doc_expired' | translate }}</p>
      </div>
      <div class="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
        <p class="text-3xl font-black text-amber-600">{{ countStatus('Expiring Soon') }}</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.reports.ent_doc_expiring_soon' | translate }}</p>
      </div>
      <div class="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
        <p class="text-3xl font-black text-green-600">{{ countStatus('Valid') }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.reports.ent_doc_valid' | translate }}</p>
      </div>
    </div>

    <!-- Filters & Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      
      <!-- Filters -->
      <div class="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-3">
        <div class="relative flex-1 min-w-[200px]">
          <input [(ngModel)]="search" type="text" placeholder="Search employee or document..." class="w-full pl-3 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        </div>
        <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
          <option value="">All Statuses</option>
          <option value="Expired">Expired</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Valid">Valid</option>
        </select>
        <select [(ngModel)]="filterType" class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
          <option value="">All Types</option>
          <option value="Passport">Passport</option>
          <option value="National ID">National ID</option>
          <option value="Driving License">Driving License</option>
          <option value="Medical Card">Medical Card</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Employee</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Document Type</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Document Number</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Expiry Date</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Days Left</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (doc of filteredDocs(); track doc.number) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-bold text-slate-800">{{ doc.employeeName }}</p>
                  <p class="text-[10px] text-slate-400">{{ doc.departmentName }}</p>
                </td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ doc.type }}</td>
                <td class="px-4 py-3 font-bold text-primary">{{ doc.number }}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-600">{{ doc.expiryDate }}</td>
                <td class="px-4 py-3 text-center font-black" [class]="daysLeftClass(doc.daysLeft)">
                  {{ doc.daysLeft <= 0 ? 'EXPIRED' : doc.daysLeft }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span [class]="statusBadge(doc.status)" class="px-2 py-0.5 rounded-full text-[9px] font-bold border">
                    {{ doc.status }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

    </div>

  </div>
  `
})
export class HrDocExpiryComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = '';
  filterStatus = '';
  filterType = '';

  readonly documents = signal([
    { employeeName: 'Ahmad Al-Dosari', departmentName: 'Drilling', type: 'Passport', number: 'PP-908722', expiryDate: '2026-07-15', daysLeft: 11, status: 'Expiring Soon' },
    { employeeName: 'John Smith', departmentName: 'Operations', type: 'National ID', number: 'NID-772291', expiryDate: '2026-05-30', daysLeft: 0, status: 'Expired' },
    { employeeName: 'Sarah Al-Qahtani', departmentName: 'HR', type: 'Driving License', number: 'DL-882201', expiryDate: '2028-12-05', daysLeft: 885, status: 'Valid' },
    { employeeName: 'Mohammed Al-Zahrani', departmentName: 'Drilling', type: 'Medical Card', number: 'MC-223910', expiryDate: '2026-07-02', daysLeft: 0, status: 'Expired' },
    { employeeName: 'Nora Al-Rashidi', departmentName: 'HR', type: 'Passport', number: 'PP-442290', expiryDate: '2026-08-20', daysLeft: 47, status: 'Expiring Soon' }
  ]);

  readonly filteredDocs = computed(() => {
    let list = this.documents();
    if (this.search) {
      list = list.filter(d => d.employeeName.toLowerCase().includes(this.search.toLowerCase()) || d.number.includes(this.search));
    }
    if (this.filterStatus) {
      list = list.filter(d => d.status === this.filterStatus);
    }
    if (this.filterType) {
      list = list.filter(d => d.type === this.filterType);
    }
    return list;
  });

  countStatus(s: string) {
    return this.documents().filter(d => d.status === s).length;
  }

  daysLeftClass(days: number) {
    if (days <= 0) return 'text-red-600';
    if (days < 30) return 'text-amber-500';
    return 'text-slate-500';
  }

  statusBadge(s: string) {
    const m: Record<string, string> = {
      'Expired': 'bg-red-50 text-red-700 border-red-150',
      'Expiring Soon': 'bg-amber-50 text-amber-700 border-amber-150',
      'Valid': 'bg-green-50 text-green-700 border-green-150'
    };
    return m[s] || 'bg-slate-100 text-slate-650';
  }

  sendReminders() {
    this.hr.notify.success('hr.common.success', 'Expiry reminder notifications successfully dispatched to users.');
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.ent_doc_expiry_title' }
    ]);
  }
}
