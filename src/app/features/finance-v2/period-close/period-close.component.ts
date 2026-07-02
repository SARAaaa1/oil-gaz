import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AutomationMockService } from '../shared/automation-mock.service';
import { ChecklistItem, PeriodStatus, ChecklistStatus } from '../shared/automation.interfaces';

@Component({
  selector: 'app-finv2-period-close',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './period-close.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2PeriodCloseComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly automationService   = inject(AutomationMockService);

  readonly activeTab = signal<'checklist' | 'validation' | 'automation' | 'audit'>('checklist');

  // Confirmation dialogs
  readonly showCloseDlg = signal(false);

  // Filters/Search
  readonly searchQuery = signal('');

  // KPIs
  readonly kpis = this.automationService.kpis;

  // Data lists
  readonly checklist        = this.automationService.checklist;
  readonly validationIssues = this.automationService.validationIssues;
  readonly automationRules  = this.automationService.automationRules;
  readonly auditTrail       = this.automationService.auditTrail;

  // Actions
  toggleChecklistItem(item: ChecklistItem) {
    const nextStatus: ChecklistStatus = item.status === 'Completed' ? 'Not Started' : 'Completed';
    this.automationService.updateChecklistItemStatus(item.id, nextStatus, 'Sara Al-Rasheed');
    this.notify.info('finance_v2.period_close.msg.checklist_updated', `Task status set to ${nextStatus}`);
  }

  runValidation() {
    this.automationService.runValidationRules();
    this.notify.success('finance_v2.period_close.msg.validation_run', 'GL & Budget validation completed. Issues updated.');
  }

  runJob(id: string, name: string) {
    this.automationService.runAutomationRule(id);
    this.notify.success('finance_v2.period_close.msg.job_executed', `Job "${name}" executed successfully.`);
  }

  openCloseDialog() {
    this.showCloseDlg.set(true);
  }

  closeCloseDialog() {
    this.showCloseDlg.set(false);
  }

  confirmPeriodClose() {
    this.automationService.closePeriod();
    this.closeCloseDialog();
    this.notify.success('finance_v2.period_close.msg.period_closed', 'Accounting period Q2 2025 closed and locked.');
  }

  reopenPeriod() {
    this.automationService.reopenPeriod();
    this.notify.warning('finance_v2.period_close.msg.period_reopened', 'Accounting period Q2 2025 reopened by admin.');
  }

  exportExcel() {
    this.notify.success('finance_v2.reports.msg.export_success', 'Excel document exported.');
  }

  exportPdf() {
    this.notify.success('finance_v2.reports.msg.export_success', 'PDF document exported.');
  }

  // Formatting helpers
  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  getPeriodStatusClass(s: PeriodStatus): string {
    switch (s) {
      case 'Open':           return 'bg-green-100 text-green-700';
      case 'Soft Close':     return 'bg-amber-100 text-amber-700';
      case 'Review':         return 'bg-blue-100 text-blue-700';
      case 'Ready To Close': return 'bg-teal-100 text-teal-700';
      case 'Closed':         return 'bg-slate-200 text-slate-500';
      case 'Locked':         return 'bg-red-100 text-red-700';
      default:               return 'bg-slate-100 text-slate-500';
    }
  }

  getChecklistStatusClass(s: ChecklistItem['status']): string {
    switch (s) {
      case 'Not Started': return 'bg-slate-100 text-slate-600';
      case 'In Progress': return 'bg-amber-100 text-amber-750';
      case 'Completed':   return 'bg-green-100 text-green-700';
      case 'Blocked':     return 'bg-red-100 text-red-700';
      case 'Skipped':     return 'bg-slate-200 text-slate-500';
      default:            return 'bg-slate-100 text-slate-500';
    }
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.period_close.title' }
    ]);
  }
}
