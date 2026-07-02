import { Injectable, signal, computed } from '@angular/core';
import {
  ReportType, ReportFilter, ReportMetadata, TrialBalanceRow, IncomeStatementRow,
  BalanceSheetRow, CashFlowRow, BudgetVsActualRow, AgingRow, AssetRegisterRow,
  VatSummaryRow, CostCenterRow, ProjectFinancialRow, ReportDashboardKpi
} from './reports.interfaces';

@Injectable({ providedIn: 'root' })
export class ReportsMockService {

  // ── Scenario Signal (Profit vs Loss Scenario) ─────────────────────
  readonly activeScenario = signal<'Profit' | 'Loss'>('Profit');

  // ── Filters Signal ────────────────────────────────────────────────
  readonly activeFilter = signal<ReportFilter>({
    company: 'PetroFlow KSA',
    branch: 'All Branches',
    project: 'All Projects',
    costCenter: 'All Cost Centers',
    fiscalYear: '2025',
    accountingPeriod: 'Q2 2025',
    currency: 'SAR'
  });

  // ── Global KPI metrics computed from selected Scenario ─────────────
  readonly kpis = computed<ReportDashboardKpi>(() => {
    const isProfit = this.activeScenario() === 'Profit';
    return {
      totalAssets:       45_000_000,
      totalLiabilities:  15_000_000,
      totalEquity:       30_000_000,
      revenue:           isProfit ? 14_500_000 : 8_200_000,
      expenses:          isProfit ? 10_200_000 : 9_800_000,
      netProfit:         isProfit ? 4_300_000 : -1_600_000,
      cashBalance:       2_500_000,
      bankBalance:       18_500_000,
      arBalance:         12_000_000,
      apBalance:         8_500_000,
      budgetUtilization: 78,
      workingCapital:    24_500_000
    };
  });

  // ── 1. Trial Balance Data ─────────────────────────────────────────
  readonly trialBalance = computed<TrialBalanceRow[]>(() => {
    const mult = this.activeScenario() === 'Profit' ? 1.2 : 0.8;
    return [
      { accountCode: '101001', accountName: 'Cash in Hand - HQ safe', openingDebit: 500_000, openingCredit: 0, periodDebit: 100_000, periodCredit: 80_000, closingDebit: 520_000, closingCredit: 0 },
      { accountCode: '102001', accountName: 'Al Rajhi Corporate Bank', openingDebit: 15_000_000, openingCredit: 0, periodDebit: 4_500_000 * mult, periodCredit: 3_200_000, closingDebit: 16_300_000, closingCredit: 0 },
      { accountCode: '110101', accountName: 'Accounts Receivable control', openingDebit: 9_800_000, openingCredit: 0, periodDebit: 3_800_000, periodCredit: 2_600_000, closingDebit: 11_000_000, closingCredit: 0 },
      { accountCode: '190101', accountName: 'Fixed Assets - Rigs & Machinery', openingDebit: 25_000_000, openingCredit: 0, periodDebit: 2_000_000, periodCredit: 0, closingDebit: 27_000_000, closingCredit: 0 },
      { accountCode: '195101', accountName: 'Accumulated Depreciation Control', openingDebit: 0, openingCredit: 4_500_050, periodDebit: 0, periodCredit: 750_000, closingDebit: 0, closingCredit: 5_250_050 },
      { accountCode: '210101', accountName: 'Accounts Payable Control', openingDebit: 0, openingCredit: 6_200_000, periodDebit: 2_100_000, periodCredit: 3_900_000, closingDebit: 0, closingCredit: 8_000_000 },
      { accountCode: '410101', accountName: 'Contract Revenue - Petroleum', openingDebit: 0, openingCredit: 30_000_000, periodDebit: 0, periodCredit: 12_000_000 * mult, closingDebit: 0, closingCredit: 42_000_000 },
      { accountCode: '510101', accountName: 'Direct Site Excavation Cost', openingDebit: 18_000_000, openingCredit: 0, periodDebit: 5_200_000, periodCredit: 0, closingDebit: 23_200_000, closingCredit: 0 }
    ];
  });

  // ── 2. Income Statement Data ──────────────────────────────────────
  readonly incomeStatement = computed<IncomeStatementRow[]>(() => {
    const isProfit = this.activeScenario() === 'Profit';
    const rev = isProfit ? 14_500_000 : 8_200_000;
    const cost = isProfit ? 8_100_000 : 7_500_000;
    const gross = rev - cost;
    const opex = isProfit ? 2_100_000 : 2_300_000;
    const net = gross - opex;

    return [
      { category: 'Revenue', amount: rev, isSubtotal: false },
      { category: 'Cost of Revenue', amount: cost, isSubtotal: false },
      { category: 'Gross Profit', amount: gross, isSubtotal: true },
      { category: 'Operating Expenses', amount: opex, isSubtotal: false },
      { category: 'Net Operating Income', amount: net, isSubtotal: true }
    ];
  });

  // ── 3. Balance Sheet Data ─────────────────────────────────────────
  readonly balanceSheet = computed<BalanceSheetRow[]>(() => {
    const isProfit = this.activeScenario() === 'Profit';
    const currentProfit = isProfit ? 4_300_000 : -1_600_000;
    return [
      { section: 'Assets', category: 'Cash & Bank Balances', amount: 21_000_000, isSubtotal: false },
      { section: 'Assets', category: 'Accounts Receivable', amount: 12_000_000, isSubtotal: false },
      { section: 'Assets', category: 'Fixed Assets (NBV)', amount: 21_750_000, isSubtotal: false },
      { section: 'Assets', category: 'Total Assets', amount: 54_750_000, isSubtotal: true },
      { section: 'Liabilities', category: 'Accounts Payable', amount: 8_500_000, isSubtotal: false },
      { section: 'Liabilities', category: 'VAT Payable', amount: 795_000, isSubtotal: false },
      { section: 'Liabilities', category: 'Total Liabilities', amount: 9_295_000, isSubtotal: true },
      { section: 'Equity', category: 'Share Capital', amount: 35_000_000, isSubtotal: false },
      { section: 'Equity', category: 'Retained Earnings', amount: 6_155_000, isSubtotal: false },
      { section: 'Equity', category: 'Current Period Profit/Loss', amount: currentProfit, isSubtotal: false },
      { section: 'Equity', category: 'Total Equity', amount: 41_155_000 + currentProfit, isSubtotal: true }
    ];
  });

  // ── 4. Cash Flow Statement Data ───────────────────────────────────
  readonly cashFlow = computed<CashFlowRow[]>(() => {
    const mult = this.activeScenario() === 'Profit' ? 1.5 : 0.5;
    return [
      { section: 'Operating', activity: 'Customer Collections', amount: 12_500_000 * mult, isSubtotal: false },
      { section: 'Operating', activity: 'Supplier Payments', amount: -6_200_000, isSubtotal: false },
      { section: 'Operating', activity: 'VAT Tax Payments', amount: -600_000, isSubtotal: false },
      { section: 'Operating', activity: 'Net cash from Operating Activities', amount: (12_500_000 * mult) - 6_800_000, isSubtotal: true },
      { section: 'Investing', activity: 'Purchase of Rig Equipment', amount: -1_440_000, isSubtotal: false },
      { section: 'Investing', activity: 'Net cash from Investing Activities', amount: -1_440_000, isSubtotal: true },
      { section: 'Summary', activity: 'Opening Cash & equivalents', amount: 18_000_000, isSubtotal: false },
      { section: 'Summary', activity: 'Net change in Cash during period', amount: (12_500_000 * mult) - 8_240_000, isSubtotal: false },
      { section: 'Summary', activity: 'Closing Cash & equivalents', amount: 18_000_000 + ((12_500_000 * mult) - 8_240_000), isSubtotal: true }
    ];
  });

  // ── 5. Budget vs Actual Data ──────────────────────────────────────
  readonly budgetVsActual = computed<BudgetVsActualRow[]>(() => {
    return [
      { item: 'Materials - Aramco Pipeline', budget: 5_000_000, actual: 3_800_000, committed: 800_000, remaining: 400_000, variance: 400_000, variancePct: 8 },
      { item: 'Labor - Aramco Pipeline', budget: 2_500_000, actual: 2_100_000, committed: 300_000, remaining: 100_000, variance: 100_000, variancePct: 4 },
      { item: 'Equipment - SWCC Desalination', budget: 4_000_000, actual: 3_900_000, committed: 400_000, remaining: -300_000, variance: -300_000, variancePct: -7.5 }
    ];
  });

  // ── 6. AP Aging Data ──────────────────────────────────────────────
  readonly apAging = computed<AgingRow[]>(() => {
    return [
      { partyName: 'Saudi Steel Corp', current: 3_000_000, age30: 1_200_000, age60: 400_000, age90: 0, age120Plus: 0, total: 4_600_000 },
      { partyName: 'Khobar Logistics Ltd', current: 1_500_000, age30: 800_000, age60: 0, age90: 0, age120Plus: 0, total: 2_300_000 },
      { partyName: 'Suez Welding Works', current: 600_000, age30: 500_000, age60: 300_000, age90: 200_000, age120Plus: 0, total: 1_600_000 }
    ];
  });

  // ── 7. AR Aging Data ──────────────────────────────────────────────
  readonly arAging = computed<AgingRow[]>(() => {
    return [
      { partyName: 'Saudi Aramco', current: 6_000_000, age30: 2_000_000, age60: 500_000, age90: 0, age120Plus: 0, total: 8_500_000 },
      { partyName: 'SABIC Industries', current: 2_500_000, age30: 1_000_000, age60: 0, age90: 0, age120Plus: 0, total: 3_500_000 }
    ];
  });

  // ── 8. Asset Register Data ────────────────────────────────────────
  readonly assetRegister = computed<AssetRegisterRow[]>(() => {
    return [
      { assetName: 'Cummins 500kVA Diesel Generator Set', cost: 240_000, accDep: 18_000, nbv: 222_000, status: 'Active' },
      { assetName: 'Drilling Rig Mast Section 1500HP', cost: 1_200_000, accDep: 36_000, nbv: 1_164_000, status: 'Active' },
      { assetName: 'Ford F-150 Pickup Truck 4x4', cost: 180_000, accDep: 8_100, nbv: 171_900, status: 'Active' }
    ];
  });

  // ── 9. VAT Summary Data ───────────────────────────────────────────
  readonly vatSummary = computed<VatSummaryRow[]>(() => {
    return [
      { period: 'Q1 2025', inputVat: 1_200_000, outputVat: 1_800_000, netVat: 600_000, status: 'Settled' },
      { period: 'Q2 2025', inputVat: 1_380_000, outputVat: 2_175_000, netVat: 795_000, status: 'Submitted' }
    ];
  });

  // ── 10. Cost Center Data ──────────────────────────────────────────
  readonly costCenterReport = computed<CostCenterRow[]>(() => {
    return [
      { costCenterName: 'Dhahran Excavation A', budget: 8_000_000, actual: 6_250_000, variance: 1_750_000 },
      { costCenterName: 'Dhahran Drilling B', budget: 7_000_000, actual: 5_800_000, variance: 1_200_000 },
      { costCenterName: 'SWCC Intake Site', budget: 11_500_000, actual: 8_600_000, variance: 2_900_000 }
    ];
  });

  // ── 11. Project Financial Data ────────────────────────────────────
  readonly projectFinancialReport = computed<ProjectFinancialRow[]>(() => {
    return [
      { projectName: 'Saudi Aramco Pipeline', revenue: 12_000_000, cost: 9_200_000, profit: 2_800_000, marginPct: 23, budget: 15_800_000, forecast: 13_500_000 },
      { projectName: 'SWCC Desalination Support', revenue: 8_000_000, cost: 6_500_000, profit: 1_500_000, marginPct: 18.7, budget: 10_000_000, forecast: 9_800_000 }
    ];
  });
}
