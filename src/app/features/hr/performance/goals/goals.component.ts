import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { PerformanceGoal } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-perf-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.performance.goals_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.performance.goals_subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.performance.goals_btn_add' | translate }}
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-slate-700">{{ hr.performanceGoals().length }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Goals</p>
      </div>
      <div class="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-blue-600">{{ countGoalStatus('In Progress') }}</p>
        <p class="text-[10px] font-bold text-blue-700 uppercase mt-1">In Progress</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-green-600">{{ countGoalStatus('Completed') }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">Completed</p>
      </div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-amber-600">{{ avgCompletion() | number:'1.0-0' }}%</p>
        <p class="text-[10px] font-bold text-amber-700 uppercase mt-1">Avg Completion</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-52">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search employee or goal..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
      </div>
      <select [(ngModel)]="filterCategory" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Categories</option>
        @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
      </select>
      <select [(ngModel)]="filterPriority" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">All Priorities</option>
        @for (p of priorities; track p) { <option [value]="p">{{ p }}</option> }
      </select>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">{{ 'hr.performance.all_statuses' | translate }}</option>
        @for (s of goalStatuses; track s) { <option [value]="s">{{ s }}</option> }
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_col_employee' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_col_title' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_col_category' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_col_priority' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_col_weight' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Period</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_col_progress' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_col_status' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_col_actions' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (g of filteredGoals(); track g.id) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-bold text-slate-800">{{ g.employeeName }}</p>
                  <p class="text-[10px] text-slate-400">{{ g.departmentName }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="font-bold text-slate-800 max-w-48 truncate">{{ g.title }}</p>
                  @if (g.description) { <p class="text-[10px] text-slate-400 truncate max-w-48">{{ g.description }}</p> }
                </td>
                <td class="px-4 py-3"><span [class]="categoryBadge(g.category)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ g.category }}</span></td>
                <td class="px-4 py-3 text-center"><span [class]="priorityBadge(g.priority)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ g.priority }}</span></td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">{{ g.weight }}%</td>
                <td class="px-4 py-3 text-[11px] text-slate-500 font-semibold">{{ g.period }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-col items-center gap-1">
                    <span class="font-black text-sm" [class]="g.completionPct >= 80 ? 'text-green-600' : g.completionPct >= 50 ? 'text-amber-600' : 'text-red-500'">{{ g.completionPct }}%</span>
                    <div class="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div class="h-full rounded-full transition-all" [class]="g.completionPct >= 80 ? 'bg-green-500' : g.completionPct >= 50 ? 'bg-amber-400' : 'bg-red-500'" [style.width]="g.completionPct + '%'"></div>
                    </div>
                    <span class="text-[9px] text-slate-400">{{ g.currentProgress }}/{{ g.targetValue }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center"><span [class]="goalStatusBadge(g.status)" class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border">{{ g.status }}</span></td>
                <td class="px-4 py-3">
                  <div class="flex gap-1 justify-center">
                    <button (click)="openEdit(g)" class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">Edit</button>
                    <button (click)="hr.deleteGoal(g.id)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold">✕</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="px-4 py-10 text-center text-slate-400 text-xs font-semibold">No goals found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" (click)="showModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <h3 class="font-black text-slate-800 text-sm">{{ (editId() ? 'hr.performance.goals_title_edit' : 'hr.performance.goals_title_add') | translate }}</h3>
            <button (click)="showModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 grid grid-cols-2 gap-3 text-xs">
            <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_employee' | translate }}</label>
              <select [(ngModel)]="form.employeeId" (ngModelChange)="onEmpSelect()" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                <option value="">— Select —</option>
                @for (e of hr.employees(); track e.id) { <option [value]="e.id">{{ e.fullName }}</option> }
              </select>
            </div>
            <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_title' | translate }}</label><input [(ngModel)]="form.title" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
            <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_description' | translate }}</label><input [(ngModel)]="form.description" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_category' | translate }}</label>
              <select [(ngModel)]="form.category" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_priority' | translate }}</label>
              <select [(ngModel)]="form.priority" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                @for (p of priorities; track p) { <option [value]="p">{{ p }}</option> }
              </select>
            </div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_weight' | translate }}</label><input [(ngModel)]="form.weight" type="number" min="0" max="100" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_status' | translate }}</label>
              <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                @for (s of goalStatuses; track s) { <option [value]="s">{{ s }}</option> }
              </select>
            </div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_start' | translate }}</label><input [(ngModel)]="form.startDate" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_end' | translate }}</label><input [(ngModel)]="form.endDate" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_target' | translate }}</label><input [(ngModel)]="form.targetValue" type="number" min="0" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
            <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_progress' | translate }}</label><input [(ngModel)]="form.currentProgress" type="number" min="0" (ngModelChange)="calcCompletion()" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
            <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.goals_field_comments' | translate }}</label><input [(ngModel)]="form.comments" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-2xl">
            <button (click)="showModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">{{ 'hr.performance.goals_btn_cancel' | translate }}</button>
            <button (click)="submit()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">{{ 'hr.performance.goals_btn_save' | translate }}</button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrPerformanceGoalsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = ''; filterCategory = ''; filterPriority = ''; filterStatus = '';
  showModal = signal(false);
  editId = signal('');
  form: Partial<PerformanceGoal> = {};

  readonly categories = ['Operational','Development','Strategic','Financial','Safety','Quality'];
  readonly priorities = ['Critical','High','Medium','Low'];
  readonly goalStatuses = ['Not Started','In Progress','Completed','On Hold','Cancelled'];

  readonly filteredGoals = computed(() => {
    let list = this.hr.performanceGoals();
    if (this.search) list = list.filter(g => g.employeeName.toLowerCase().includes(this.search.toLowerCase()) || g.title.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterCategory) list = list.filter(g => g.category === this.filterCategory);
    if (this.filterPriority) list = list.filter(g => g.priority === this.filterPriority);
    if (this.filterStatus) list = list.filter(g => g.status === this.filterStatus);
    return list;
  });

  readonly avgCompletion = computed(() => {
    const gs = this.hr.performanceGoals();
    return gs.length ? gs.reduce((s,g) => s + g.completionPct, 0) / gs.length : 0;
  });

  countGoalStatus(s: string) { return this.hr.performanceGoals().filter(g => g.status === s).length; }

  onEmpSelect() {
    const emp = this.hr.employees().find(e => e.id === this.form.employeeId);
    if (emp) { this.form.employeeName = emp.fullName; this.form.departmentName = emp.departmentId; }
  }

  calcCompletion() {
    if (this.form.targetValue && this.form.currentProgress !== undefined)
      this.form.completionPct = Math.min(100, Math.round(this.form.currentProgress / this.form.targetValue * 100));
  }

  openAdd() { this.editId.set(''); this.form = { category:'Operational', priority:'Medium', weight:20, status:'Not Started', targetValue:100, currentProgress:0, completionPct:0, period:'Annual 2026' }; this.showModal.set(true); }
  openEdit(g: PerformanceGoal) { this.editId.set(g.id); this.form = {...g}; this.showModal.set(true); }
  submit() { if (this.editId()) this.hr.updateGoal(this.editId(), this.form); else this.hr.addGoal(this.form); this.showModal.set(false); }

  categoryBadge(c: string) { const m: Record<string,string> = {'Operational':'bg-blue-50 text-blue-700 border-blue-100','Development':'bg-indigo-50 text-indigo-700 border-indigo-100','Strategic':'bg-purple-50 text-purple-700 border-purple-100','Financial':'bg-emerald-50 text-emerald-700 border-emerald-100','Safety':'bg-red-50 text-red-700 border-red-100','Quality':'bg-amber-50 text-amber-700 border-amber-100'}; return m[c]||'bg-slate-100 text-slate-500 border-slate-200'; }
  priorityBadge(p: string) { const m: Record<string,string> = {'Critical':'bg-red-50 text-red-700 border-red-100','High':'bg-orange-50 text-orange-700 border-orange-100','Medium':'bg-amber-50 text-amber-700 border-amber-100','Low':'bg-slate-100 text-slate-500 border-slate-200'}; return m[p]||'bg-slate-100 text-slate-500 border-slate-200'; }
  goalStatusBadge(s: string) { const m: Record<string,string> = {'Completed':'bg-green-50 text-green-700 border-green-100','In Progress':'bg-blue-50 text-blue-700 border-blue-100','Not Started':'bg-slate-100 text-slate-500 border-slate-200','On Hold':'bg-amber-50 text-amber-700 border-amber-100','Cancelled':'bg-red-50 text-red-700 border-red-100'}; return m[s]||'bg-slate-100 text-slate-500 border-slate-200'; }

  ngOnInit() { this.breadcrumb.setBreadcrumbs([{label:'navigation.hr'},{label:'navigation.performance'},{label:'hr.performance.goals_title'}]); }
}
