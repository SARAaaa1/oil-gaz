import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { WorkLocation, LocationType } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-locations',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.org.locations.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.org.locations.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 self-start md:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.org.locations.btn_add' | translate }}
      </button>
    </div>

    <!-- Stats by Type -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      @for (t of locationTypes; track t) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
          <p class="text-lg">{{ typeIcon(t) }}</p>
          <p class="text-xl font-black text-slate-800 mt-1">{{ countByType(t) }}</p>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{{ t }}</p>
        </div>
      }
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" [placeholder]="'hr.common.search_placeholder' | translate" class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary/50">
      </div>
      <select [(ngModel)]="filterType" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none">
        <option value="">{{ 'hr.org.locations.all_types' | translate }}</option>
        @for (t of locationTypes; track t) { <option [value]="t">{{ t }}</option> }
      </select>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none">
        <option value="">{{ 'hr.common.all_statuses' | translate }}</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (loc of filtered(); track loc.id) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">{{ typeIcon(loc.type) }}</div>
              <div>
                <p class="font-black text-slate-800 text-sm">{{ loc.name }}</p>
                <p class="text-[11px] text-slate-500 font-semibold">{{ loc.arabicName }}</p>
              </div>
            </div>
            <span [class]="loc.status === 'Active' ? 'text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full' : 'text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full'">{{ loc.status }}</span>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center gap-2 text-slate-500">
              <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span class="font-semibold">{{ loc.city }}, {{ loc.country }}</span>
            </div>
            @if (loc.phone) {
              <div class="flex items-center gap-2 text-slate-500">
                <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <span class="font-semibold">{{ loc.phone }}</span>
              </div>
            }
            @if (loc.managerName) {
              <div class="flex items-center gap-2 text-slate-500">
                <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <span class="font-semibold">{{ loc.managerName }}</span>
              </div>
            }
            <p class="text-[10px] font-bold text-slate-400 mt-1">{{ loc.code }}</p>
          </div>
          <div class="flex gap-2 mt-4 pt-3 border-t border-slate-100">
            <button (click)="openEdit(loc)" class="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.edit' | translate }}</button>
            <button (click)="hr.deleteWorkLocation(loc.id)" class="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.delete' | translate }}</button>
          </div>
        </div>
      } @empty {
        <div class="col-span-3 bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs font-semibold">{{ 'hr.common.no_data' | translate }}</div>
      }
    </div>

    <!-- Add/Edit Modal -->
    @if (showForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeForm()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
            <h3 class="font-black text-slate-800 text-sm">{{ isEdit() ? ('hr.org.locations.title_edit' | translate) : ('hr.org.locations.title_add' | translate) }}</h3>
            <button (click)="closeForm()" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_code' | translate }} *</label>
                <input [(ngModel)]="form.code" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.locations.col_type' | translate }}</label>
                <select [(ngModel)]="form.type" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold">
                  @for (t of locationTypes; track t) { <option [value]="t">{{ t }}</option> }
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_name_en' | translate }} *</label>
                <input [(ngModel)]="form.name" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.jobs.col_name_ar' | translate }} *</label>
                <input [(ngModel)]="form.arabicName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800" dir="rtl">
              </div>
              <div class="col-span-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.locations.col_address' | translate }}</label>
                <input [(ngModel)]="form.address" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.locations.col_city' | translate }}</label>
                <input [(ngModel)]="form.city" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_phone' | translate }}</label>
                <input [(ngModel)]="form.phone" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_manager' | translate }}</label>
                <input [(ngModel)]="form.managerName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_status' | translate }}</label>
                <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 p-4 border-t sticky bottom-0 bg-white">
            <button (click)="closeForm()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submit()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.common.save' | translate }}</button>
          </div>
        </div>
      </div>
    }

  </div>
  `
})
export class HrLocationsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = '';
  filterType = '';
  filterStatus = '';
  showForm = signal(false);
  isEdit = signal(false);
  editId = signal('');
  form: Partial<WorkLocation> = {};

  readonly locationTypes: LocationType[] = ['Company', 'Branch', 'Office', 'Project Site', 'Camp', 'Warehouse'];

  readonly filtered = computed(() => {
    const s = this.search.toLowerCase();
    return this.hr.workLocations().filter(l =>
      (!s || l.name.toLowerCase().includes(s) || l.arabicName.toLowerCase().includes(s) || l.code.toLowerCase().includes(s) || l.city?.toLowerCase().includes(s)) &&
      (!this.filterType || l.type === this.filterType) &&
      (!this.filterStatus || l.status === this.filterStatus)
    );
  });

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.org.locations.title' }
    ]);
  }

  typeIcon(t: string): string {
    const icons: Record<string, string> = { 'Company': '🏢', 'Branch': '🏬', 'Office': '🏛️', 'Project Site': '⚙️', 'Camp': '⛺', 'Warehouse': '🏭' };
    return icons[t] || '📍';
  }

  countByType(t: string) { return this.hr.workLocations().filter(l => l.type === t).length; }

  openAdd() { this.isEdit.set(false); this.form = { status: 'Active', type: 'Office', country: 'Saudi Arabia' }; this.showForm.set(true); }
  openEdit(l: WorkLocation) { this.isEdit.set(true); this.editId.set(l.id); this.form = { ...l }; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }
  submit() {
    if (this.isEdit()) this.hr.updateWorkLocation(this.editId(), this.form);
    else this.hr.addWorkLocation(this.form);
    this.closeForm();
  }
}
