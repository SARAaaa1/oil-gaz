import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrWorkflowService } from '../../shared/hr-workflow.service';
import { LanguageService } from '../../../../core/services/language.service';
import { AutomationRule } from '../../../../shared/interfaces';


@Component({
  selector: 'app-hr-workflow-automation',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.wf_nav_automation' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">Configure triggers and auto actions to streamline HR processes</p>
      </div>
      <button (click)="openAddModal()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        New Rule
      </button>
    </div>

    <!-- Rules List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (rule of wf.automationRules(); track rule.id) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 space-y-4 flex flex-col justify-between">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span [class]="rule.active ? 'bg-green-50 text-green-700 border-green-150' : 'bg-slate-100 text-slate-550 border-slate-200'" class="px-2.5 py-0.5 rounded-full text-[9px] font-bold border">
                {{ rule.active ? 'Active' : 'Inactive' }}
              </span>
              <button (click)="wf.toggleRule(rule.id)" class="text-primary hover:underline text-[10px] font-black">
                {{ rule.active ? ('hr.reports.wf_auto_disable' | translate) : ('hr.reports.wf_auto_enable' | translate) }}
              </button>
            </div>
            <h3 class="font-black text-slate-800 text-sm leading-snug">{{ rule.name }}</h3>
          </div>

          <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] font-medium space-y-1.5">
            <div>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.reports.wf_auto_trigger' | translate }}</p>
              <p class="text-slate-700 font-bold mt-0.5">{{ rule.trigger }}</p>
            </div>
            <hr class="border-slate-200/50">
            <div>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.reports.wf_auto_action' | translate }}</p>
              <p class="text-slate-700 font-bold mt-0.5">{{ rule.action }}</p>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Create Rule Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4" (click)="showModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md my-16" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <h3 class="font-black text-slate-800 text-sm">Create Automation Rule</h3>
            <button (click)="showModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-4 text-xs">
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">Rule Name</label>
              <input [(ngModel)]="form.name" type="text" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" placeholder="e.g. Trigger Notification on Transfer">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.wf_auto_trigger' | translate }}</label>
              <input [(ngModel)]="form.trigger" type="text" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" placeholder="e.g. Employee Contract Expired">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.wf_auto_action' | translate }}</label>
              <input [(ngModel)]="form.action" type="text" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" placeholder="e.g. Email Warning to HR + Manager">
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-2xl">
            <button (click)="showModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">Cancel</button>
            <button (click)="submitRule()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">
              Create Rule
            </button>
          </div>
        </div>
      </div>
    }

  </div>
  `
})
export class HrWorkflowAutomationComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly wf = inject(HrWorkflowService);
  readonly lang = inject(LanguageService);

  showModal = signal(false);
  form: Partial<AutomationRule> = {};

  openAddModal() {
    this.form = { name: '', trigger: '', action: '', active: true };
    this.showModal.set(true);
  }

  submitRule() {
    if (this.form.name && this.form.trigger && this.form.action) {
      this.wf.addRule(this.form);
    }
    this.showModal.set(false);
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.wf_title' },
      { label: 'hr.reports.wf_nav_automation' }
    ]);
  }
}
