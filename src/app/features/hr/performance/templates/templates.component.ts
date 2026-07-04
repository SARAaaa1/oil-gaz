import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { EvalTemplate, EvalCriterion } from '../../../../shared/interfaces';

@Component({
  selector: 'app-hr-perf-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.performance.tmpl_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.performance.tmpl_subtitle' | translate }}</p>
      </div>
      <button (click)="openAdd()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        {{ 'hr.performance.tmpl_btn_create' | translate }}
      </button>
    </div>
    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-slate-700">{{ hr.evalTemplates().length }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">Total</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-green-600">{{ countStatus('Active') }}</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">Active</p>
      </div>
      <div class="bg-slate-100 rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-slate-500">{{ countStatus('Archived') }}</p>
        <p class="text-[10px] font-bold text-slate-500 uppercase mt-1">Archived</p>
      </div>
    </div>
    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-52">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" placeholder="Search templates..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
      </div>
      <select [(ngModel)]="filterStatus" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none">
        <option value="">{{ 'hr.performance.all_statuses' | translate }}</option>
        <option value="Active">Active</option><option value="Draft">Draft</option><option value="Archived">Archived</option>
      </select>
    </div>
    <!-- Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      @for (t of filteredTemplates(); track t.id) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div class="p-4 border-b border-slate-50">
            <div class="flex items-center gap-2 mb-1.5"><span [class]="statusBadge(t.status)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">{{ t.status }}</span></div>
            <h3 class="font-black text-slate-800 text-sm">{{ t.name }}</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">{{ t.description }}</p>
          </div>
          <div class="px-4 py-3 grid grid-cols-2 gap-2 text-xs border-b border-slate-50">
            <div><p class="text-[10px] text-slate-400">{{ 'hr.performance.tmpl_period' | translate }}</p><p class="font-bold text-slate-700">{{ t.period }}</p></div>
            <div><p class="text-[10px] text-slate-400">{{ 'hr.performance.tmpl_department' | translate }}</p><p class="font-bold text-slate-700">{{ t.departmentName || 'All' }}</p></div>
            <div><p class="text-[10px] text-slate-400">{{ 'hr.performance.tmpl_job_level' | translate }}</p><p class="font-bold text-slate-700">{{ t.jobLevel || 'All' }}</p></div>
            <div><p class="text-[10px] text-slate-400">{{ 'hr.performance.tmpl_criteria' | translate }}</p><p class="font-bold text-primary">{{ t.criteria.length }} items</p></div>
          </div>
          <div class="px-4 py-2.5 flex flex-wrap gap-1.5 border-b border-slate-50">
            @for (c of t.criteria.slice(0,3); track c.id) {
              <span class="text-[10px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-semibold">{{ c.name }} <span class="text-primary font-black">{{ c.weight }}%</span></span>
            }
            @if (t.criteria.length > 3) { <span class="text-[10px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full text-slate-400 font-semibold">+{{ t.criteria.length - 3 }}</span> }
          </div>
          <div class="px-4 py-2 flex gap-4 text-[10px] font-bold border-b border-slate-50">
            <span [class]="t.allowSelfEvaluation ? 'text-green-600' : 'text-slate-300'">{{ t.allowSelfEvaluation ? '✓' : '✕' }} Self Eval</span>
            <span [class]="t.approvalRequired ? 'text-amber-600' : 'text-slate-300'">{{ t.approvalRequired ? '✓' : '✕' }} Approval</span>
          </div>
          <div class="px-4 py-3 flex gap-2">
            <button (click)="openEdit(t)" class="flex-1 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg text-[11px] font-bold">{{ 'hr.performance.tmpl_btn_edit' | translate }}</button>
            <button (click)="duplicate(t)" class="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold">{{ 'hr.performance.tmpl_btn_duplicate' | translate }}</button>
            <button (click)="hr.deleteEvalTemplate(t.id)" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[11px] font-bold">✕</button>
          </div>
        </div>
      } @empty {
        <div class="col-span-3 bg-white rounded-2xl border border-slate-100 p-12 text-center"><p class="text-4xl mb-3">📁</p><p class="font-black text-slate-500">No templates found</p></div>
      }
    </div>
    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" (click)="showModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <h3 class="font-black text-slate-800 text-sm">{{ (editId() ? 'hr.performance.tmpl_title_edit' : 'hr.performance.tmpl_title_add') | translate }}</h3>
            <button (click)="showModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.tmpl_name' | translate }}</label><input [(ngModel)]="form.name" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/50 font-semibold text-slate-800"></div>
              <div class="col-span-2"><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.tmpl_description' | translate }}</label><input [(ngModel)]="form.description" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.tmpl_period' | translate }}</label>
                <select [(ngModel)]="form.period" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                  @for (p of periods; track p) { <option [value]="p">{{ p }}</option> }
                </select>
              </div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.tmpl_status' | translate }}</label>
                <select [(ngModel)]="form.status" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800 bg-white text-xs">
                  <option value="Active">Active</option><option value="Draft">Draft</option><option value="Archived">Archived</option>
                </select>
              </div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.tmpl_department' | translate }}</label><input [(ngModel)]="form.departmentName" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
              <div><label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.performance.tmpl_job_level' | translate }}</label><input [(ngModel)]="form.jobLevel" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-semibold text-slate-800"></div>
              <div class="flex items-center gap-3"><input [(ngModel)]="form.allowSelfEvaluation" type="checkbox" id="self" class="w-4 h-4 accent-primary"><label for="self" class="text-xs font-semibold text-slate-700">{{ 'hr.performance.tmpl_self_eval' | translate }}</label></div>
              <div class="flex items-center gap-3"><input [(ngModel)]="form.approvalRequired" type="checkbox" id="appr" class="w-4 h-4 accent-primary"><label for="appr" class="text-xs font-semibold text-slate-700">{{ 'hr.performance.tmpl_approval_required' | translate }}</label></div>
            </div>
            <div class="border border-slate-100 rounded-xl overflow-hidden">
              <div class="px-4 py-3 bg-slate-50 flex items-center justify-between">
                <p class="text-[10px] font-black text-slate-600 uppercase">{{ 'hr.performance.tmpl_criteria' | translate }}</p>
                <button (click)="addCriterion()" class="text-[10px] font-bold text-primary hover:underline">+ {{ 'hr.performance.tmpl_add_criterion' | translate }}</button>
              </div>
              <div class="divide-y divide-slate-50">
                @for (c of formCriteria(); track c.id; let i = $index) {
                  <div class="px-4 py-2.5 grid grid-cols-5 gap-2 items-center">
                    <input [(ngModel)]="c.name" type="text" placeholder="Name" class="col-span-2 px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold outline-none">
                    <div class="flex items-center gap-1"><input [(ngModel)]="c.weight" type="number" min="0" max="100" class="w-14 px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold outline-none text-center"><span class="text-[10px] text-slate-400">%</span></div>
                    <div class="flex items-center gap-1 text-[10px] text-slate-500"><input [(ngModel)]="c.allowComments" type="checkbox" class="accent-primary"><span>Cmts</span></div>
                    <button (click)="removeCriterion(i)" class="text-red-500 hover:text-red-700 font-bold text-center">✕</button>
                  </div>
                }
              </div>
              <div class="px-4 py-2 bg-slate-50 flex justify-between text-[10px] font-bold">
                <span class="text-slate-500">Total Weight:</span>
                <span [class]="totalWeight() === 100 ? 'text-green-600' : 'text-red-600'">{{ totalWeight() }}% {{ totalWeight() === 100 ? '✓' : '≠ 100%' }}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-2xl">
            <button (click)="showModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">{{ 'hr.performance.tmpl_btn_cancel' | translate }}</button>
            <button (click)="submit()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">{{ 'hr.performance.tmpl_btn_save' | translate }}</button>
          </div>
        </div>
      </div>
    }
  </div>
  `
})
export class HrPerformanceTemplatesComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);
  search = ''; filterStatus = '';
  showModal = signal(false);
  editId = signal('');
  form: Partial<EvalTemplate> = {};
  formCriteria = signal<EvalCriterion[]>([]);
  readonly periods = ['Annual 2025','Annual 2026','Q1 2026','Q2 2026','Q3 2026','Q4 2026'];
  readonly totalWeight = computed(() => this.formCriteria().reduce((s,c) => s + (c.weight||0), 0));
  readonly filteredTemplates = computed(() => {
    let list = this.hr.evalTemplates();
    if (this.search) list = list.filter(t => t.name.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterStatus) list = list.filter(t => t.status === this.filterStatus);
    return list;
  });
  countStatus(s: string) { return this.hr.evalTemplates().filter(t => t.status === s).length; }
  statusBadge(s: string) { return {'Active':'bg-green-50 text-green-700 border-green-100','Draft':'bg-amber-50 text-amber-700 border-amber-100','Archived':'bg-slate-100 text-slate-500 border-slate-200'}[s]||'bg-slate-100 text-slate-500 border-slate-200'; }
  openAdd() { this.editId.set(''); this.form = { name:'',description:'',period:'Annual 2026',status:'Draft',departmentName:'All',jobLevel:'All',allowSelfEvaluation:false,approvalRequired:true }; this.formCriteria.set([]); this.showModal.set(true); }
  openEdit(t: EvalTemplate) { this.editId.set(t.id); this.form = {...t}; this.formCriteria.set(t.criteria.map(c => ({...c}))); this.showModal.set(true); }
  duplicate(t: EvalTemplate) { this.hr.addEvalTemplate({...t, id:'', name: t.name+' (Copy)', status:'Draft'}); }
  addCriterion() { this.formCriteria.update(l => [...l, {id:`c-${Date.now()}`,name:'',weight:10,minScore:0,maxScore:100,allowComments:true}]); }
  removeCriterion(i: number) { this.formCriteria.update(l => l.filter((_,idx) => idx !== i)); }
  submit() { const p = {...this.form, criteria: this.formCriteria()}; if(this.editId()) this.hr.updateEvalTemplate(this.editId(), p); else this.hr.addEvalTemplate(p); this.showModal.set(false); }
  ngOnInit() { this.breadcrumb.setBreadcrumbs([{label:'navigation.hr'},{label:'navigation.performance'},{label:'hr.performance.tmpl_title'}]); }
}
