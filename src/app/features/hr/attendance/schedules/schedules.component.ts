import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { WorkSchedule } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-work-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.schedule.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.schedule.subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.att.schedule.btn_add' | translate }}
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <select [(ngModel)]="filterType" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none">
        <option value="">All Types</option>
        @for (t of scheduleTypes; track t) { <option [value]="t">{{ t }}</option> }
      </select>
      <select [(ngModel)]="filterAssign" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none">
        <option value="">All Assign Types</option>
        @for (a of assignTypes; track a) { <option [value]="a">{{ a }}</option> }
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.att.schedule.col_name' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.att.schedule.col_type' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.att.schedule.col_shift' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.att.schedule.col_assign_type' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.att.schedule.col_assigned' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.att.schedule.col_work_days' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.att.schedule.col_from' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.att.schedule.col_status' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.att.daily.col_actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (ws of filteredSchedules(); track ws.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-bold text-slate-800">{{ ws.name }}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">{{ ws.arabicName }}</p>
                </td>
                <td class="px-4 py-3"><span class="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">{{ ws.type }}</span></td>
                <td class="px-4 py-3 font-semibold text-slate-700 text-[11px]">{{ ws.shiftName }}</td>
                <td class="px-4 py-3"><span class="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">{{ ws.assignType }}</span></td>
                <td class="px-4 py-3 font-semibold text-slate-700 text-[11px]">{{ ws.assignedToName }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    @for (day of allDays; track day) {
                      <span [class]="ws.workDays.includes(day) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'" class="text-[9px] font-bold px-1.5 py-0.5 rounded-md">{{ day }}</span>
                    }
                  </div>
                </td>
                <td class="px-4 py-3 text-[11px] font-semibold text-slate-600">{{ ws.effectiveFrom }}</td>
                <td class="px-4 py-3 text-center">
                  <span [class]="ws.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'" class="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border">{{ ws.status }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex gap-1.5 justify-center">
                    <button (click)="openEdit(ws)" class="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold">{{ 'hr.common.edit' | translate }}</button>
                    <button (click)="hr.deleteWorkSchedule(ws.id)" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold">{{ 'hr.common.delete' | translate }}</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="px-4 py-10 text-center text-slate-400 text-xs">No schedules found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    @if (showForm()) {
      <div class="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" (click)="closeForm()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="font-black text-slate-800 text-sm">{{ isEdit() ? ('hr.att.schedule.title_edit' | translate) : ('hr.att.schedule.title_add' | translate) }}</h3>
            <button (click)="closeForm()" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.schedule.col_name' | translate }}</label>
                <input [(ngModel)]="form.name" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.schedule.lbl_name_ar' | translate }}</label>
                <input [(ngModel)]="form.arabicName" type="text" dir="rtl" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.schedule.col_type' | translate }}</label>
                <select [(ngModel)]="form.type" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                  @for (t of scheduleTypes; track t) { <option [value]="t">{{ t }}</option> }
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.schedule.col_shift' | translate }}</label>
                <select [(ngModel)]="form.shiftId" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                  @for (s of hr.shifts(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.schedule.col_assign_type' | translate }}</label>
                <select [(ngModel)]="form.assignType" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                  @for (a of assignTypes; track a) { <option [value]="a">{{ a }}</option> }
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.schedule.col_assigned' | translate }}</label>
                <input [(ngModel)]="form.assignedToName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.schedule.col_from' | translate }}</label>
                <input [(ngModel)]="form.effectiveFrom" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.schedule.col_status' | translate }}</label>
                <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800">
                  <option value="Active">Active</option><option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{{ 'hr.att.schedule.lbl_work_days' | translate }}</label>
              <div class="flex flex-wrap gap-2">
                @for (day of allDays; track day) {
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" [checked]="formDays.includes(day)" (change)="toggleDay(day)" class="rounded">
                    <span class="text-[11px] font-bold text-slate-700">{{ day }}</span>
                  </label>
                }
              </div>
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
export class HrWorkSchedulesComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  filterType = '';
  filterAssign = '';
  showForm = signal(false);
  isEdit = signal(false);
  editId = signal('');
  form: Partial<WorkSchedule> = {};
  formDays: string[] = [];

  readonly allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly scheduleTypes = ['Weekly', 'Monthly', 'Rotation'];
  readonly assignTypes = ['Department', 'Employee', 'Location'];

  readonly filteredSchedules = computed(() => {
    let list = this.hr.workSchedules();
    if (this.filterType) list = list.filter(ws => ws.type === this.filterType);
    if (this.filterAssign) list = list.filter(ws => ws.assignType === this.filterAssign);
    return list;
  });

  toggleDay(day: string) {
    if (this.formDays.includes(day)) this.formDays = this.formDays.filter(d => d !== day);
    else this.formDays = [...this.formDays, day];
  }

  openAdd() { this.isEdit.set(false); this.form = { type: 'Weekly', assignType: 'Department', status: 'Active', effectiveFrom: new Date().toISOString().split('T')[0] }; this.formDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu']; this.showForm.set(true); }
  openEdit(ws: WorkSchedule) { this.isEdit.set(true); this.editId.set(ws.id); this.form = { ...ws }; this.formDays = [...ws.workDays]; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }
  submit() {
    const data = { ...this.form, workDays: this.formDays };
    if (this.isEdit()) this.hr.updateWorkSchedule(this.editId(), data);
    else this.hr.addWorkSchedule(data);
    this.closeForm();
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.schedule.title' }]);
  }
}
