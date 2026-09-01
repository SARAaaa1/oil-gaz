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
import { FinanceApiService } from '../../../core/services/finance-api.service';

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
  private readonly financeApi = inject(FinanceApiService);

  readonly selectedReport      = signal<ReportType>('Trial Balance');
  readonly isLoading           = signal(false);
  readonly apiCashFlow         = signal<any[] | null>(null);
  readonly apiBudgetVsActual   = signal<any[] | null>(null);
  readonly apiCostCenter       = signal<any[] | null>(null);
  readonly apiProjectFinancial = signal<any[] | null>(null);
  readonly apiApAging          = signal<any[] | null>(null);
  readonly apiArAging          = signal<any[] | null>(null);

  selectReport(r: ReportType) {
    this.selectedReport.set(r);
    this.loadReport(r);
  }

  loadReport(r: ReportType) {
    this.isLoading.set(true);
    const filter = this.reportService.activeFilter();
    switch (r) {
      case 'Cash Flow':
        this.financeApi.getCashFlowReport({}).subscribe({
          next: d => {
            const raw = Array.isArray(d) ? d : (d?.data ?? null);
            if (raw && raw.length > 0) this.apiCashFlow.set(raw);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;
      case 'Budget vs Actual':
        this.financeApi.getBudgetVsActualReport(
          filter.project && filter.project !== 'All Projects' ? { projectCode: filter.project } : {}
        ).subscribe({
          next: d => {
            const raw = Array.isArray(d) ? d : (d?.data ?? null);
            if (raw && raw.length > 0) this.apiBudgetVsActual.set(raw);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;
      case 'Cost Center':
        this.financeApi.getCostCenterPLReport(
          filter.costCenter && filter.costCenter !== 'All Cost Centers' ? { costCenterCode: filter.costCenter } : {}
        ).subscribe({
          next: d => {
            const raw = Array.isArray(d) ? d : (d?.data ?? null);
            if (raw && raw.length > 0) this.apiCostCenter.set(raw);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;
      case 'Project Financial':
        this.financeApi.getProjectFinancialReport(
          filter.project && filter.project !== 'All Projects' ? { projectCode: filter.project } : {}
        ).subscribe({
          next: d => {
            const raw = Array.isArray(d) ? d : (d?.data ?? null);
            if (raw && raw.length > 0) this.apiProjectFinancial.set(raw);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;
      case 'AP Aging':
        this.financeApi.getApAgingDetailReport({}).subscribe({
          next: d => {
            const raw = Array.isArray(d) ? d : (d?.data ?? null);
            if (raw && raw.length > 0) this.apiApAging.set(raw);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;
      case 'AR Aging':
        this.financeApi.getArAgingDetailReport({}).subscribe({
          next: d => {
            const raw = Array.isArray(d) ? d : (d?.data ?? null);
            if (raw && raw.length > 0) this.apiArAging.set(raw);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
        break;
      default:
        this.isLoading.set(false);
    }
  }

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

  // Reports data maps (with API override computed fallback)
  readonly trialBalance   = this.reportService.trialBalance;
  readonly incomeStatement = this.reportService.incomeStatement;
  readonly balanceSheet   = this.reportService.balanceSheet;
  readonly cashFlow       = computed(() => this.apiCashFlow() ?? this.reportService.cashFlow());
  readonly budgetVsActual = computed(() => this.apiBudgetVsActual() ?? this.reportService.budgetVsActual());
  readonly apAging         = computed(() => this.apiApAging() ?? this.reportService.apAging());
  readonly arAging         = computed(() => this.apiArAging() ?? this.reportService.arAging());
  readonly assetRegister   = this.reportService.assetRegister;
  readonly vatSummary     = this.reportService.vatSummary;
  readonly costCenter      = computed(() => this.apiCostCenter() ?? this.reportService.costCenterReport());
  readonly projectFinancial = computed(() => this.apiProjectFinancial() ?? this.reportService.projectFinancialReport());

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
    // Load initial report from API
    this.loadReport(this.selectedReport());
  }
}
