import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TreasuryMockService } from '../../shared/treasury-mock.service';
import { BankAccount, BankAccountStatus, TreasuryMovement } from '../../shared/treasury.interfaces';
import { Router } from '@angular/router';
import { BranchService } from '../../shared/branch.service';

@Component({
  selector: 'app-finv2-banks',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './banks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2BanksComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  private readonly router     = inject(Router);
  readonly treasuryService    = inject(TreasuryMockService);
  readonly branchService      = inject(BranchService);

  readonly searchQuery  = signal('');
  readonly statusFilter = signal<BankAccountStatus | 'All'>('All');
  readonly branchFilter = signal('All');
  readonly selectedId   = signal<string | null>(null);

  // Deposit/Withdraw popup dialogs
  readonly showTxDialog = signal(false);
  readonly txType       = signal<'Deposit' | 'Withdrawal'>('Deposit');
  readonly txAmount     = signal<number>(0);
  readonly txReference  = signal('');
  readonly txReason     = signal('');

  readonly filtered = computed(() => {
    const q  = this.searchQuery().toLowerCase();
    const st = this.statusFilter();
    const br = this.branchFilter();
    return this.treasuryService.bankAccounts()
      .filter(b => {
        const mq = !q || b.bankName.toLowerCase().includes(q) ||
                   b.branch.toLowerCase().includes(q) ||
                   b.iban.toLowerCase().includes(q) ||
                   b.accountNumber.toLowerCase().includes(q);
        const ms = st === 'All' || b.status === st;
        const mb = br === 'All' || (b.branchId || 'HeadOffice') === br;
        return mq && ms && mb;
      })
      .sort((a, b) => b.currentBalance - a.currentBalance);
  });

  readonly activeAccount = computed(() => {
    const id = this.selectedId();
    return id ? (this.treasuryService.bankAccounts().find(b => b.id === id) ?? null) : null;
  });

  readonly activeAccountMovements = computed(() => {
    const id = this.selectedId();
    if (!id) return [];
    return this.treasuryService.movements()
      .filter(m => m.accountType === 'Bank' && m.accountId === id)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  // KPIs
  readonly totalBankBalance = computed(() => {
    const br = this.branchFilter();
    return this.treasuryService.bankAccounts()
      .filter(b => b.status === 'Active' && (br === 'All' || (b.branchId || 'HeadOffice') === br))
      .reduce((s, b) => s + (b.currency === 'USD' ? b.currentBalance * 3.75 : b.currency === 'EUR' ? b.currentBalance * 4.0 : b.currentBalance), 0);
  });

  readonly activeCount = computed(() => {
    const br = this.branchFilter();
    return this.treasuryService.bankAccounts().filter(b => b.status === 'Active' && (br === 'All' || (b.branchId || 'HeadOffice') === br)).length;
  });

  selectAccount(acc: BankAccount) {
    this.selectedId.set(acc.id);
  }

  toggleAccountStatus(acc: BankAccount) {
    const next: BankAccountStatus = acc.status === 'Active' ? 'Inactive' : 'Active';
    this.treasuryService.bankAccounts.update(list =>
      list.map(b => b.id === acc.id ? { ...b, status: next } : b)
    );
    this.notify.success('finance_v2.treasury.banks.status_updated', 'finance_v2.treasury.banks.status_updated_desc');
  }

  openTxDialog(type: 'Deposit' | 'Withdrawal') {
    const acc = this.activeAccount();
    if (!acc) return;
    if (acc.status === 'Inactive') {
      this.notify.warning('finance_v2.treasury.banks.error_inactive', 'finance_v2.treasury.banks.error_inactive_desc');
      return;
    }
    this.txType.set(type);
    this.txAmount.set(0);
    this.txReference.set('');
    this.txReason.set('');
    this.showTxDialog.set(true);
  }

  closeTxDialog() { this.showTxDialog.set(false); }

  submitTransaction() {
    const acc = this.activeAccount();
    const amt = this.txAmount();
    if (!acc || amt <= 0) return;

    if (this.txType() === 'Withdrawal' && amt > acc.availableBalance) {
      this.notify.warning('finance_v2.treasury.cash.error_insufficient', 'finance_v2.treasury.cash.error_insufficient_desc');
      return;
    }

    const isDep = this.txType() === 'Deposit';
    const diff  = isDep ? amt : -amt;

    // Update bank balance
    this.treasuryService.bankAccounts.update(list =>
      list.map(b => b.id === acc.id ? {
        ...b,
        currentBalance: b.currentBalance + diff,
        availableBalance: b.availableBalance + diff
      } : b)
    );

    // Append to movement ledger
    const newMovement: TreasuryMovement = {
      id: `mov-bank-manual-${Date.now()}`,
      accountType: 'Bank',
      accountId: acc.id,
      accountName: `${acc.bankName} - ${acc.accountNumber}`,
      type: this.txType(),
      date: '2025-07-01',
      amount: amt,
      currency: acc.currency,
      reference: this.txReference() || `MAN-B-${Date.now().toString().slice(-6)}`,
      description: this.txReason() || `${this.txType()} entry`,
      matched: false
    };
    this.treasuryService.movements.update(list => [newMovement, ...list]);

    this.closeTxDialog();
    this.notify.success('finance_v2.treasury.banks.tx_success', 'finance_v2.treasury.banks.tx_success_desc');
  }

  goToReconciliation() {
    this.router.navigate(['/finance-v2/treasury/reconciliation']);
  }

  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  getStatusClass(s: BankAccountStatus): string {
    return s === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500';
  }

  getMovementClass(type: string): string {
    return ['Deposit', 'Receipt', 'Transfer In'].includes(type) ? 'text-green-600' : 'text-red-600';
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.treasury.title' },
      { label: 'finance_v2.treasury.banks.title' }
    ]);
  }
}
