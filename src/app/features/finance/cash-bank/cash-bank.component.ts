import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { BankAccountDetails, CashAccountDetails, BankReconciliation } from '../../../shared/interfaces/finance-extended.interface';

@Component({
  selector: 'app-cash-bank',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './cash-bank.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashBankComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly financeApi = inject(FinanceApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  // Core signals — populated from API
  readonly bankAccounts = signal<any[]>([]);
  readonly cashAccounts = signal<any[]>([]);
  readonly reconciliations = signal<any[]>([]);
  readonly isLoading = signal(false);

  // UI States
  readonly activeTab = signal<'banks' | 'cash' | 'reconciliation'>('banks');
  readonly showBankModal = signal<boolean>(false);
  readonly showCashModal = signal<boolean>(false);
  readonly showReconcileModal = signal<boolean>(false);

  // Form: Bank Account
  bankName = '';
  accountNumber = '';
  iban = '';
  bankCurrency = 'USD';
  bankBalance = 0;

  // Form: Cash Account
  officeLocation = '';
  custodianName = '';
  cashCurrency = 'SAR';
  cashBalance = 0;

  // Form: Reconciliation
  reconcileBankAccountId = '';
  statementPeriod = '';
  statementEndDate = new Date().toISOString().split('T')[0];
  statementBalance = 0;

  // Computed Totals for KPIs
  readonly kpis = computed(() => {
    const banks = this.bankAccounts();
    const cash = this.cashAccounts();
    const recs = this.reconciliations();

    // Convert currencies crudely for mock KPIs (1 USD = 3.75 SAR)
    const bankUSD = banks.reduce((sum, b) => sum + (b.currency === 'SAR' ? b.balance / 3.75 : b.balance), 0);
    const cashUSD = cash.reduce((sum, c) => sum + (c.currency === 'SAR' ? c.balance / 3.75 : c.balance), 0);
    const totalLiquidityUSD = bankUSD + cashUSD;

    const pendingRecsCount = recs.filter(r => r.status === 'Unreconciled').length;

    return {
      totalLiquidityUSD,
      bankBalanceUSD: bankUSD,
      cashBalanceUSD: cashUSD,
      pendingRecsCount
    };
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.cash_bank' }
    ]);
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.financeApi.getBankAccounts().subscribe({
      next: (res) => {
        this.bankAccounts.set((res.data || []).map((b: any) => ({ ...b, id: b._id ?? b.id })));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    this.financeApi.getCashAccounts().subscribe({
      next: (res: any) => this.cashAccounts.set((Array.isArray(res) ? res : (res.data ?? [])).map((c: any) => ({ ...c, id: c._id ?? c.id }))),
      error: () => {}
    });
    this.financeApi.getReconciliations().subscribe({
      next: (res: any) => this.reconciliations.set((Array.isArray(res) ? res : (res.data ?? [])).map((r: any) => ({ ...r, id: r._id ?? r.id }))),
      error: () => {}
    });
  }

  getBankAccountName(id: string): string {
    const bank = this.bankAccounts().find(b => b.id === id);
    return bank ? `${bank.bankName} (${bank.accountNumber})` : id;
  }

  // Add Bank Account
  openAddBankModal() {
    this.bankName = '';
    this.accountNumber = '';
    this.iban = '';
    this.bankCurrency = 'USD';
    this.bankBalance = 0;
    this.showBankModal.set(true);
  }

  submitBankAccount() {
    if (!this.bankName || !this.accountNumber) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }
    this.financeApi.createBankAccount({
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      iban: this.iban || undefined,
      currency: this.bankCurrency as any,
      balance: Number(this.bankBalance) || 0
    }).subscribe({
      next: (created: any) => {
        this.bankAccounts.update(list => [{ ...created, id: created._id ?? created.id }, ...list]);
        this.showBankModal.set(false);
        this.notificationService.success('finance.cash_bank.bank_created_title', 'finance.cash_bank.bank_created_desc');
      },
      error: (err: any) => this.notificationService.danger('finance.cash_bank.title', err?.error?.message || 'Failed to create bank account')
    });
  }

  // Add Cash Account
  openAddCashModal() {
    this.officeLocation = '';
    this.custodianName = '';
    this.cashCurrency = 'SAR';
    this.cashBalance = 0;
    this.showCashModal.set(true);
  }

  submitCashAccount() {
    if (!this.officeLocation || !this.custodianName) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }
    this.financeApi.createCashAccount({
      officeLocation: this.officeLocation,
      custodianName: this.custodianName,
      currency: this.cashCurrency,
      balance: Number(this.cashBalance) || 0
    }).subscribe({
      next: (created: any) => {
        this.cashAccounts.update(list => [{ ...created, id: created._id ?? created.id }, ...list]);
        this.showCashModal.set(false);
        this.notificationService.success('finance.cash_bank.cash_created_title', 'finance.cash_bank.cash_created_desc');
      },
      error: (err: any) => this.notificationService.danger('finance.cash_bank.title', err?.error?.message || 'Failed to create cash account')
    });
  }

  // Reconciliation Flow
  openReconcileModal() {
    this.reconcileBankAccountId = this.bankAccounts()[0]?.id || '';
    // Format statement period as current Month Year (e.g. "June 2026")
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = new Date();
    this.statementPeriod = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    this.statementEndDate = now.toISOString().split('T')[0];
    this.statementBalance = this.bankAccounts().find(b => b.id === this.reconcileBankAccountId)?.balance || 0;
    this.showReconcileModal.set(true);
  }

  readonly currentBookBalance = computed(() => {
    const id = this.reconcileBankAccountId;
    if (!id) return 0;
    return this.bankAccounts().find(b => b.id === id)?.balance || 0;
  });

  readonly reconciliationDifference = computed(() => {
    return this.currentBookBalance() - (Number(this.statementBalance) || 0);
  });

  submitReconciliation() {
    if (!this.reconcileBankAccountId || !this.statementPeriod) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }
    this.financeApi.createReconciliation({
      bankAccountId: this.reconcileBankAccountId,
      statementPeriod: this.statementPeriod,
      statementEndDate: this.statementEndDate,
      statementBalance: Number(this.statementBalance) || 0
    }).subscribe({
      next: (created: any) => {
        const normalized = { ...created, id: created._id ?? created.id };
        this.reconciliations.update(list => [normalized, ...list]);
        this.showReconcileModal.set(false);
        if (normalized.status === 'Reconciled') {
          this.notificationService.success('finance.cash_bank.reconciled_success_title', 'finance.cash_bank.reconciled_success_desc');
        } else {
          this.notificationService.warning('finance.cash_bank.reconciled_warning_title', 'finance.cash_bank.reconciled_warning_desc');
        }
      },
      error: (err: any) => this.notificationService.danger('finance.cash_bank.title', err?.error?.message || 'Reconciliation failed')
    });
  }
}
