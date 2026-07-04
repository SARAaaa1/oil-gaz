import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { Shift } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-shift-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.shift.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.shift.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.att.shift.btn_add' | translate }}
      </button>
    </div>

    <!-- Shift Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (shift of hr.shifts(); track shift.id; let i = $index) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
          <!-- Color Strip -->
          <div class="h-1.5 w-full" [style.background]="shift.color"></div>
          <div class="p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-full text-white" [style.background]="shift.color">{{ shift.code }}</span>
                  @if (shift.isNightShift) { <span class="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">🌙 Night</span> }
                  @if (shift.isFlexible) { <span class="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">⚡ Flexible</span> }
                </div>
                <h3 class="font-black text-slate-800 text-sm">{{ shift.name }}</h3>
                <p class="text-[11px] text-slate-500 font-semibold">{{ shift.arabicName }}</p>
              </div>
              <span [class]="shift.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">{{ shift.status }}</span>
            </div>

            <!-- Time Info -->
            <div class="flex items-center gap-2 mb-3 bg-slate-50 rounded-xl p-3">
              <span class="text-lg">🕐</span>
              <div class="flex items-center gap-2 text-sm font-black text-slate-800">
                <span>{{ shift.startTime }}</span>
                <span class="text-slate-400 font-normal text-xs">→</span>
                <span>{{ shift.endTime }}</span>
              </div>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-2 gap-2 mb-3 text-[10px]">
              <div class="bg-slate-50 rounded-lg p-2">
                <p class="text-slate-400 font-bold uppercase">{{ 'hr.att.shift.col_break' | translate }}</p>
                <p class="font-black text-slate-700 mt-0.5">{{ shift.breakMinutes }}min</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-2">
                <p class="text-slate-400 font-bold uppercase">{{ 'hr.att.shift.col_grace' | translate }}</p>
                <p class="font-black text-slate-700 mt-0.5">{{ shift.gracePeriodMinutes }}min</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-2">
                <p class="text-slate-400 font-bold uppercase">{{ 'hr.att.shift.lbl_late_policy' | translate }}</p>
                <p class="font-black text-slate-700 mt-0.5">{{ shift.latePolicy }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-2">
                <p class="text-slate-400 font-bold uppercase">{{ 'hr.att.shift.lbl_min_hrs' | translate }}</p>
                <p class="font-black text-slate-700 mt-0.5">{{ shift.minWorkingHours }}h</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
              <span class="text-[10px] font-bold text-slate-400">👥 {{ i * 3 + 4 }} {{ 'hr.att.shift.lbl_employees' | translate }}</span>
              <div class="flex gap-1.5">
                <button (click)="openEdit(shift)" class="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.edit' | translate }}</button>
                <button (click)="deleteShift(shift.id)" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all">{{ 'hr.common.delete' | translate }}</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Add/Edit Modal -->
    @if (showForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" (click)="closeForm()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="font-black text-slate-800 text-sm">{{ isEdit() ? ('hr.att.shift.title_edit' | translate) : ('hr.att.shift.title_add' | translate) }}</h3>
            <button (click)="closeForm()" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 grid grid-cols-2 gap-4 text-xs">
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.col_code' | translate }} *</label>
              <input [(ngModel)]="form.code" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.col_type' | translate }}</label>
              <select [(ngModel)]="form.type" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                @for (t of shiftTypes; track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.col_name_en' | translate }} *</label>
              <input [(ngModel)]="form.name" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.col_name_ar' | translate }}</label>
              <input [(ngModel)]="form.arabicName" type="text" dir="rtl" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.col_start' | translate }}</label>
              <input [(ngModel)]="form.startTime" type="time" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.col_end' | translate }}</label>
              <input [(ngModel)]="form.endTime" type="time" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.col_break' | translate }} (min)</label>
              <input [(ngModel)]="form.breakMinutes" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.col_grace' | translate }} (min)</label>
              <input [(ngModel)]="form.gracePeriodMinutes" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.lbl_late_policy' | translate }}</label>
              <select [(ngModel)]="form.latePolicy" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                @for (p of policies; track p) { <option [value]="p">{{ p }}</option> }
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.lbl_early_policy' | translate }}</label>
              <select [(ngModel)]="form.earlyLeavePolicy" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                @for (p of policies; track p) { <option [value]="p">{{ p }}</option> }
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.lbl_min_hrs' | translate }}</label>
              <input [(ngModel)]="form.minWorkingHours" type="number" min="1" max="24" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.lbl_max_hrs' | translate }}</label>
              <input [(ngModel)]="form.maxWorkingHours" type="number" min="1" max="24" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.lbl_color' | translate }}</label>
              <input [(ngModel)]="form.color" type="color" class="w-full h-10 mt-1 border border-slate-200 rounded-lg cursor-pointer">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.col_status' | translate }}</label>
              <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Draft">Draft</option>
              </select>
            </div>
            <div class="col-span-2 flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input [(ngModel)]="form.isNightShift" type="checkbox" class="rounded">
                <span class="font-semibold text-slate-700">{{ 'hr.att.shift.lbl_night' | translate }}</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input [(ngModel)]="form.isFlexible" type="checkbox" class="rounded">
                <span class="font-semibold text-slate-700">{{ 'hr.att.shift.lbl_flexible' | translate }}</span>
              </label>
            </div>
            <div class="col-span-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.shift.lbl_description' | translate }}</label>
              <input [(ngModel)]="form.description" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t">
            <button (click)="closeForm()" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submit()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">{{ 'hr.common.save' | translate }}</button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrShiftsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  showForm = signal(false);
  isEdit = signal(false);
  editId = signal('');
  form: Partial<Shift> = {};

  readonly shiftTypes = ['Fixed', 'Rotary', 'Night', 'Flexible', 'Split'];
  readonly policies = ['Warning', 'Deduction', 'None'];

  openAdd() { this.isEdit.set(false); this.form = { type: 'Fixed', latePolicy: 'Warning', earlyLeavePolicy: 'Warning', status: 'Active', color: '#3B82F6', breakMinutes: 60, gracePeriodMinutes: 10, minWorkingHours: 6, maxWorkingHours: 10, isNightShift: false, isFlexible: false }; this.showForm.set(true); }
  openEdit(s: Shift) { this.isEdit.set(true); this.editId.set(s.id); this.form = { ...s }; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }
  submit() { if (this.isEdit()) this.hr.updateShift(this.editId(), this.form); else this.hr.addShift(this.form); this.closeForm(); }
  deleteShift(id: string) { this.hr.deleteShift(id); }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.shift.title' }]);
  }
}
