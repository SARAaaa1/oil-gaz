import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';
import { FinanceV2MockService } from '../shared/finance-v2-mock.service';
import { MonthlyChartData, AgingBucket } from '../shared/finance-v2.interfaces';
import { BranchService } from '../shared/branch.service';

@Component({
  selector: 'app-finv2-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2DashboardComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly mockService = inject(FinanceV2MockService);
  readonly branchService = inject(BranchService);

  readonly activeBranch = computed(() => this.branchService.activeBranch());

  // Expose data signals
  readonly kpis = this.mockService.dashboardKpis;
  readonly monthlyData = this.mockService.monthlyData;
  readonly apAging = this.mockService.apAging;
  readonly arAging = this.mockService.arAging;
  readonly recentJournals = this.mockService.recentJournals;
  readonly recentVendorInvoices = this.mockService.recentVendorInvoices;
  readonly recentCollections = this.mockService.recentCollections;

  readonly branchKpis = computed(() => {
    const kpi = this.kpis();
    const br = this.activeBranch();
    if (br === 'FreeZone') {
      return {
        totalAssets: 4_280_000,
        totalLiabilities: 1_220_000,
        equity: 3_060_000,
        cash: 95_000,
        bankBalance: 580_000,
        accountsReceivable: 480_000,
        accountsPayable: 610_000,
        monthRevenue: 310_000,
        monthExpenses: 220_000,
        netProfit: 90_000
      };
    } else if (br === 'HeadOffice') {
      return {
        totalAssets: 8_170_000,
        totalLiabilities: 3_060_000,
        equity: 5_110_000,
        cash: 185_000,
        bankBalance: 1_260_000,
        accountsReceivable: 1_160_000,
        accountsPayable: 1_210_000,
        monthRevenue: 610_000,
        monthExpenses: 460_000,
        netProfit: 150_000
      };
    }
    return kpi; // All
  });

  readonly filteredJournals = computed(() => {
    const br = this.activeBranch();
    const list = this.recentJournals();
    return br === 'All' ? list : list.filter(j => (j.branchId || 'HeadOffice') === br);
  });

  readonly filteredVendorInvoices = computed(() => {
    const br = this.activeBranch();
    const list = this.recentVendorInvoices();
    return br === 'All' ? list : list.filter(i => (i.branchId || 'HeadOffice') === br);
  });

  readonly filteredCollections = computed(() => {
    const br = this.activeBranch();
    const list = this.recentCollections();
    return br === 'All' ? list : list.filter(c => (c.branchId || 'HeadOffice') === br);
  });

  // Currency specific computed values
  readonly cashEgp = computed(() => this.branchKpis().cash * 48);
  readonly cashUsd = computed(() => this.branchKpis().cash);
  readonly bankEgp = computed(() => this.branchKpis().bankBalance * 48);
  readonly bankUsd = computed(() => this.branchKpis().bankBalance);

  // Chart dimensions
  readonly chartWidth = 520;
  readonly chartHeight = 180;
  readonly chartPadding = { top: 20, right: 10, bottom: 30, left: 60 };

  // Computed: max value for revenue/expense chart Y-axis
  readonly revenueMax = computed(() => {
    const data = this.monthlyData();
    return Math.max(...data.map(d => Math.max(d.revenue, d.expenses))) * 1.15;
  });

  // Computed: max value for profit chart
  readonly profitMax = computed(() => {
    const data = this.monthlyData();
    return Math.max(...data.map(d => d.profit)) * 1.15;
  });

  // Computed: max AP aging value
  readonly apAgingMax = computed(() =>
    Math.max(...this.apAging().map(b => b.amount)) * 1.1
  );

  // Computed: max AR aging value
  readonly arAgingMax = computed(() =>
    Math.max(...this.arAging().map(b => b.amount)) * 1.1
  );

  // Computed: total AP aging
  readonly apAgingTotal = computed(() =>
    this.apAging().reduce((s, b) => s + b.amount, 0)
  );

  // Computed: total AR aging
  readonly arAgingTotal = computed(() =>
    this.arAging().reduce((s, b) => s + b.amount, 0)
  );

  // Computed: budget vs actual (from cost centers)
  readonly budgetVsActual = computed(() => {
    const ccs = this.mockService.costCenters();
    const topLevel = ccs.filter(c => c.level === 1);
    return topLevel.map(c => ({
      label: this.langService.isRtl() ? c.nameAr : c.nameEn,
      budget: c.budget,
      spent: c.spent,
      utilization: Math.round((c.spent / c.budget) * 100)
    }));
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.dashboard.title' }
    ]);
  }

  // SVG helpers for line chart
  getChartInnerWidth(): number {
    return this.chartWidth - this.chartPadding.left - this.chartPadding.right;
  }

  getChartInnerHeight(): number {
    return this.chartHeight - this.chartPadding.top - this.chartPadding.bottom;
  }

  getRevenuePoints(field: 'revenue' | 'expenses'): string {
    const data = this.monthlyData();
    const maxVal = this.revenueMax();
    const w = this.getChartInnerWidth();
    const h = this.getChartInnerHeight();
    return data.map((d, i) => {
      const x = this.chartPadding.left + (i / (data.length - 1)) * w;
      const y = this.chartPadding.top + h - (d[field] / maxVal) * h;
      return `${x},${y}`;
    }).join(' ');
  }

  getProfitPoints(): string {
    const data = this.monthlyData();
    const maxVal = this.profitMax();
    const w = this.getChartInnerWidth();
    const h = this.getChartInnerHeight();
    return data.map((d, i) => {
      const x = this.chartPadding.left + (i / (data.length - 1)) * w;
      const y = this.chartPadding.top + h - (d.profit / maxVal) * h;
      return `${x},${y}`;
    }).join(' ');
  }

  getBarX(index: number, total: number, groupWidth = 60): number {
    return this.chartPadding.left + index * (this.getChartInnerWidth() / total);
  }

  getAgingBarHeight(amount: number, max: number): number {
    return (amount / max) * this.getChartInnerHeight();
  }

  getAgingBarY(amount: number, max: number): number {
    return this.chartPadding.top + this.getChartInnerHeight() - this.getAgingBarHeight(amount, max);
  }

  formatAmount(value: number): string {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(0) + 'K';
    return value.toString();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Posted': case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Approved': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Draft': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }

  getStatusKey(status: string): string {
    switch (status) {
      case 'Posted': return 'finance_v2.journal_entries.posted';
      case 'Paid': return 'finance_v2.ap.payments.cash';
      case 'Approved': return 'finance_v2.ap.approved_invoices.approve';
      case 'Draft': return 'finance_v2.journal_entries.draft';
      default: return status;
    }
  }
}
