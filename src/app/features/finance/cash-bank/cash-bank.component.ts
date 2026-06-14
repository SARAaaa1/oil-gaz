import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  // Core signals
  readonly bankAccounts = this.mockDataService.bankAccountsDetails;
  readonly cashAccounts = this.mockDataService.cashAccountsDetails;
  readonly reconciliations = this.mockDataService.bankReconciliations;

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
    if (!this.bankName || !this.accountNumber || !this.iban) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const newBank: BankAccountDetails = {
      id: 'ba-' + Math.random().toString(36).substring(2, 9),
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      iban: this.iban,
      currency: this.bankCurrency,
      balance: Number(this.bankBalance) || 0,
      status: 'Active'
    };

    this.bankAccounts.update(prev => [...prev, newBank]);
    this.showBankModal.set(false);
    this.notificationService.success('finance.cash_bank.bank_created_title', 'finance.cash_bank.bank_created_desc');
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

    const newCash: CashAccountDetails = {
      id: 'ca-' + Math.random().toString(36).substring(2, 9),
      officeLocation: this.officeLocation,
      custodianName: this.custodianName,
      currency: this.cashCurrency,
      balance: Number(this.cashBalance) || 0,
      status: 'Active'
    };

    this.cashAccounts.update(prev => [...prev, newCash]);
    this.showCashModal.set(false);
    this.notificationService.success('finance.cash_bank.cash_created_title', 'finance.cash_bank.cash_created_desc');
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

    const diff = this.reconciliationDifference();
    const status: 'Reconciled' | 'Unreconciled' = Math.abs(diff) < 0.01 ? 'Reconciled' : 'Unreconciled';

    const newRec: BankReconciliation = {
      id: 'br-' + Math.random().toString(36).substring(2, 9),
      bankAccountId: this.reconcileBankAccountId,
      statementPeriod: this.statementPeriod,
      statementEndDate: this.statementEndDate,
      bookBalance: this.currentBookBalance(),
      statementBalance: Number(this.statementBalance) || 0,
      difference: diff,
      status: status,
      reconciledDate: status === 'Reconciled' ? new Date().toISOString().split('T')[0] : undefined,
      reconciledBy: status === 'Reconciled' ? 'Sophia Sterling' : undefined
    };

    this.reconciliations.update(prev => [newRec, ...prev]);
    this.showReconcileModal.set(false);

    if (status === 'Reconciled') {
      this.notificationService.success('finance.cash_bank.reconciled_success_title', 'finance.cash_bank.reconciled_success_desc');
    } else {
      this.notificationService.warning('finance.cash_bank.reconciled_warning_title', 'finance.cash_bank.reconciled_warning_desc');
    }
  }
}
