import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { HrContractType } from '../../../../shared/interfaces';


@Component({
  selector: 'app-hr-contract-types',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.org.contract.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.org.contract.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 self-start md:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.org.contract.btn_add' | translate }}
      </button>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (ct of hr.contractTypes(); track ct.id) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[11px] font-black">{{ ct.code }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              @if (ct.renewable) {
                <span class="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{{ 'hr.org.contract.renewable' | translate }}</span>
              }
              <span [class]="ct.status === 'Active' ? 'text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full' : 'text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full'">{{ ct.status }}</span>
            </div>
          </div>
          <h3 class="font-black text-slate-800 text-sm">{{ ct.name }}</h3>
          <p class="text-[11px] text-slate-500 font-semibold mt-0.5">{{ ct.arabicName }}</p>
          @if (ct.description) {
            <p class="text-[11px] text-slate-400 mt-2 leading-relaxed line-clamp-2">{{ ct.description }}</p>
          }

          <!-- Contract Details -->
          <div class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.contract.notice' | translate }}</p>
              <p class="font-black text-slate-800 text-sm mt-0.5">{{ ct.noticePeriodDays }}<span class="text-[10px] text-slate-400 font-semibold">d</span></p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.contract.probation' | translate }}</p>
              <p class="font-black text-slate-800 text-sm mt-0.5">{{ ct.probationDays }}<span class="text-[10px] text-slate-400 font-semibold">d</span></p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.contract.max_dur' | translate }}</p>
              <p class="font-black text-slate-800 text-sm mt-0.5">{{ ct.maxDurationMonths ? ct.maxDurationMonths + 'mo' : '∞' }}</p>
            </div>
          </div>

          <div class="flex gap-2 mt-4 pt-3 border-t border-slate-100">
            <button (click)="openEdit(ct)" class="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.edit' | translate }}</button>
            <button (click)="hr.deleteContractType(ct.id)" class="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.delete' | translate }}</button>
          </div>
        </div>
      }
    </div>

    <!-- Add/Edit Modal -->
    @if (showForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" (click)="closeForm()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
            <h3 class="font-black text-slate-800 text-sm">{{ isEdit() ? ('hr.org.contract.title_edit' | translate) : ('hr.org.contract.title_add' | translate) }}</h3>
            <button (click)="closeForm()" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_code' | translate }} *</label>
                <input [(ngModel)]="form.code" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.col_status' | translate }}</label>
                <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none text-slate-800 font-semibold">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.contract.notice' | translate }} ({{ 'hr.common.days' | translate }})</label>
                <input [(ngModel)]="form.noticePeriodDays" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.contract.probation' | translate }} ({{ 'hr.common.days' | translate }})</label>
                <input [(ngModel)]="form.probationDays" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.contract.max_dur' | translate }} ({{ 'hr.common.months' | translate }})</label>
                <input [(ngModel)]="form.maxDurationMonths" type="number" min="0" [placeholder]="'hr.org.contract.unlimited' | translate" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div class="flex items-center gap-2 mt-4">
                <input [(ngModel)]="form.renewable" type="checkbox" id="renewable" class="w-4 h-4 accent-primary">
                <label for="renewable" class="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{{ 'hr.org.contract.renewable' | translate }}</label>
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.dept.lbl_description' | translate }}</label>
              <textarea [(ngModel)]="form.description" rows="3" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800 resize-none"></textarea>
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
export class HrContractTypesComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  showForm = signal(false);
  isEdit = signal(false);
  editId = signal('');
  form: Partial<HrContractType> = {};

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.org.contract.title' }
    ]);
  }

  openAdd() { this.isEdit.set(false); this.form = { status: 'Active', renewable: false, noticePeriodDays: 30, probationDays: 90 }; this.showForm.set(true); }
  openEdit(ct: HrContractType) { this.isEdit.set(true); this.editId.set(ct.id); this.form = { ...ct }; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }
  submit() {
    if (this.isEdit()) this.hr.updateContractType(this.editId(), this.form);
    else this.hr.addContractType(this.form);
    this.closeForm();
  }
}
