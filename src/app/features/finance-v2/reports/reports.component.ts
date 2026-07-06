import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ReportsMockService } from '../shared/reports-mock.service';
import { ReportType, ReportFilter, ReportMetadata } from '../shared/reports.interfaces';
import { BranchService } from '../shared/branch.service';

@Component({
  selector: 'app-finv2-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2ReportsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly reportService      = inject(ReportsMockService);
  readonly branchService      = inject(BranchService);

  readonly selectedReport = signal<ReportType>('Trial Balance');

  readonly branchFilter = computed(() => {
    const br = this.reportService.activeFilter().branch;
    if (br === 'Head Office') return 'HeadOffice';
    if (br === 'Free Zone') return 'FreeZone';
    return 'All';
  });

  updateBranch(branch: string) {
    this.reportService.activeFilter.update(o => ({
      ...o,
      branch: branch === 'All' ? 'All Branches' : branch === 'HeadOffice' ? 'Head Office' : 'Free Zone'
    }));
  }

  // Drill down simulator state
  readonly showDrillDownDlg = signal(false);
  readonly drillDownAccount = signal('');
  readonly drillDownRows    = signal<{ doc: string; date: string; desc: string; amount: number }[]>([]);

  // Report Types list
  readonly reportsList: ReportType[] = [
    'Trial Balance', 'Income Statement', 'Balance Sheet', 'Cash Flow',
    'Budget vs Actual', 'AP Aging', 'AR Aging', 'Asset Register',
    'VAT Summary', 'Cost Center', 'Project Financial'
  ];

  // Filters computed metadata
  readonly activeFilter = this.reportService.activeFilter;
  readonly kpis         = this.reportService.kpis;

  // Reports data maps
  readonly trialBalance   = this.reportService.trialBalance;
  readonly incomeStatement = this.reportService.incomeStatement;
  readonly balanceSheet   = this.reportService.balanceSheet;
  readonly cashFlow       = this.reportService.cashFlow;
  readonly budgetVsActual = this.reportService.budgetVsActual;
  readonly apAging         = this.reportService.apAging;
  readonly arAging         = this.reportService.arAging;
  readonly assetRegister   = this.reportService.assetRegister;
  readonly vatSummary     = this.reportService.vatSummary;
  readonly costCenter      = this.reportService.costCenterReport;
  readonly projectFinancial = this.reportService.projectFinancialReport;

  readonly reportMetadata = computed<ReportMetadata>(() => {
    const f = this.activeFilter();
    return {
      companyName: f.company,
      reportName: this.selectedReport(),
      fiscalYear: f.fiscalYear,
      period: f.accountingPeriod,
      generatedBy: 'Sara Al-Rasheed',
      generatedDate: '2025-07-02 10:15',
      filtersApplied: `${f.branch} · ${f.project} · ${f.costCenter} · ${f.currency}`
    };
  });

  // Scenario toggle
  toggleScenario(sc: 'Profit' | 'Loss') {
    this.reportService.activeScenario.set(sc);
    this.notify.info('finance_v2.reports.msg.scenario_changed', `Scenario set to ${sc}`);
  }

  updatePeriod(period: string) {
    this.reportService.activeFilter.update(o => ({ ...o, accountingPeriod: period }));
  }

  // Drill down action
  drillDown(accountCode: string, accountName: string) {
    this.drillDownAccount.set(`${accountCode} - ${accountName}`);
    // Simulate drill down sub-transactions
    this.drillDownRows.set([
      { doc: 'JV-2025-001', date: '2025-05-10', desc: 'Aramco Site Pipeline mobilization costs', amount: 450_000 },
      { doc: 'JV-2025-008', date: '2025-05-18', desc: 'Cummins Diesel Generator capitalization entry', amount: 240_000 },
      { doc: 'JV-2025-015', date: '2025-05-28', desc: 'Monthly project site office rental allocation', amount: 80_000 }
    ]);
    this.showDrillDownDlg.set(true);
  }

  closeDrillDown() {
    this.showDrillDownDlg.set(false);
  }

  // Exports
  exportExcel() {
    this.notify.success('finance_v2.reports.msg.export_success', 'Excel file exported successfully.');
  }

  exportPdf() {
    this.notify.success('finance_v2.reports.msg.export_success', 'PDF document exported successfully.');
  }

  printReport() {
    window.print();
  }

  // Formatting helpers
  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.reports.title' }
    ]);
  }
}
