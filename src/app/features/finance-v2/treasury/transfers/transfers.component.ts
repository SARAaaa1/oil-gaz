import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TreasuryMockService } from '../../shared/treasury-mock.service';
import { TreasuryTransfer, TransferStatus, AccountType, TreasuryMovement } from '../../shared/treasury.interfaces';

@Component({
  selector: 'app-finv2-transfers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './transfers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2TransfersComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly treasuryService    = inject(TreasuryMockService);

  readonly searchQuery  = signal('');
  readonly statusFilter = signal<TransferStatus | 'All'>('All');
  readonly selectedId   = signal<string | null>(null);

  // New transfer modal form
  readonly showModal        = signal(false);
  readonly formFromType     = signal<AccountType>('Bank');
  readonly formFromId       = signal('');
  readonly formToType       = signal<AccountType>('Bank');
  readonly formToId         = signal('');
  readonly formAmount       = signal<number>(0);
  readonly formDate         = signal('2025-07-01');
  readonly formReason       = signal('');
  readonly formRemarks      = signal('');
  readonly formReference    = signal('');

  readonly filtered = computed(() => {
    const q  = this.searchQuery().toLowerCase();
    const st = this.statusFilter();
    return this.treasuryService.transfers()
      .filter(t => {
        const mq = !q || t.transferNumber.toLowerCase().includes(q) ||
                   t.fromAccountName.toLowerCase().includes(q) ||
                   t.toAccountName.toLowerCase().includes(q) ||
                   t.reference.toLowerCase().includes(q);
        const ms = st === 'All' || t.status === st;
        return mq && ms;
      })
      .sort((a, b) => b.transferNumber.localeCompare(a.transferNumber));
  });

  readonly activeTransfer = computed(() => {
    const id = this.selectedId();
    return id ? (this.treasuryService.transfers().find(t => t.id === id) ?? null) : null;
  });

  // source and destination lists for modal dropdowns
  readonly availableFromAccounts = computed(() => {
    if (this.formFromType() === 'Cash') {
      return this.treasuryService.cashBoxes().filter(c => c.status === 'Open');
    } else {
      return this.treasuryService.bankAccounts().filter(b => b.status === 'Active');
    }
  });

  readonly availableToAccounts = computed(() => {
    if (this.formToType() === 'Cash') {
      return this.treasuryService.cashBoxes().filter(c => c.status === 'Open' && c.id !== this.formFromId());
    } else {
      return this.treasuryService.bankAccounts().filter(b => b.status === 'Active' && b.id !== this.formFromId());
    }
  });

  // KPIs
  readonly countDraft     = computed(() => this.treasuryService.transfers().filter(t => t.status === 'Draft').length);
  readonly countApproved  = computed(() => this.treasuryService.transfers().filter(t => t.status === 'Approved').length);
  readonly countExecuted  = computed(() => this.treasuryService.transfers().filter(t => t.status === 'Executed').length);

  selectTransfer(t: TreasuryTransfer) {
    this.selectedId.set(t.id);
  }

  openModal() {
    this.formFromType.set('Bank');
    this.formFromId.set('');
    this.formToType.set('Bank');
    this.formToId.set('');
    this.formAmount.set(0);
    this.formDate.set('2025-07-01');
    this.formReason.set('');
    this.formRemarks.set('');
    this.formReference.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveTransfer() {
    if (!this.formFromId() || !this.formToId() || this.formAmount() <= 0) {
      this.notify.warning('finance_v2.treasury.transfers.error_required', 'finance_v2.treasury.transfers.error_required_desc');
      return;
    }

    if (this.formFromId() === this.formToId() && this.formFromType() === this.formToType()) {
      this.notify.warning('finance_v2.treasury.transfers.error_same_account', 'finance_v2.treasury.transfers.error_same_account_desc');
      return;
    }

    // Check balance of source account
    let balance = 0;
    if (this.formFromType() === 'Cash') {
      balance = this.treasuryService.cashBoxes().find(c => c.id === this.formFromId())?.currentBalance ?? 0;
    } else {
      balance = this.treasuryService.bankAccounts().find(b => b.id === this.formFromId())?.availableBalance ?? 0;
    }

    if (this.formAmount() > balance) {
      this.notify.warning('finance_v2.treasury.cash.error_insufficient', 'finance_v2.treasury.cash.error_insufficient_desc');
      return;
    }

    const fromName = this.formFromType() === 'Cash'
      ? this.treasuryService.cashBoxes().find(c => c.id === this.formFromId())?.name ?? ''
      : this.treasuryService.bankAccounts().find(b => b.id === this.formFromId())?.bankName ?? '';

    const toName = this.formToType() === 'Cash'
      ? this.treasuryService.cashBoxes().find(c => c.id === this.formToId())?.name ?? ''
      : this.treasuryService.bankAccounts().find(b => b.id === this.formToId())?.bankName ?? '';

    const trs = this.treasuryService.transfers();
    const nextNo = `TRF-2025-${String(trs.length + 1).padStart(3, '0')}`;
    const newTr: TreasuryTransfer = {
      id: `tr-${Date.now()}`,
      transferNumber: nextNo,
      date: this.formDate(),
      fromAccountType: this.formFromType(),
      fromAccountId: this.formFromId(),
      fromAccountName: fromName,
      toAccountType: this.formToType(),
      toAccountId: this.formToId(),
      toAccountName: toName,
      amount: this.formAmount(),
      currency: 'SAR',
      exchangeRate: 1,
      reference: this.formReference() || `TR-${Date.now().toString().slice(-6)}`,
      reason: this.formReason(),
      remarks: this.formRemarks(),
      status: 'Draft',
      attachments: []
    };

    this.treasuryService.transfers.update(list => [newTr, ...list]);
    this.selectedId.set(newTr.id);
    this.closeModal();
    this.notify.success('finance_v2.treasury.transfers.saved', 'finance_v2.treasury.transfers.saved_desc');
  }

  approveTransfer(tr: TreasuryTransfer) {
    if (tr.status !== 'Draft') return;
    this.updateStatus(tr.id, 'Approved');
    this.notify.success('finance_v2.treasury.transfers.approved', 'finance_v2.treasury.transfers.approved_desc');
  }

  executeTransfer(tr: TreasuryTransfer) {
    if (tr.status !== 'Approved') return;

    // Check balances again at execution
    let balance = 0;
    if (tr.fromAccountType === 'Cash') {
      balance = this.treasuryService.cashBoxes().find(c => c.id === tr.fromAccountId)?.currentBalance ?? 0;
    } else {
      balance = this.treasuryService.bankAccounts().find(b => b.id === tr.fromAccountId)?.availableBalance ?? 0;
    }

    if (tr.amount > balance) {
      this.notify.warning('finance_v2.treasury.cash.error_insufficient', 'finance_v2.treasury.cash.error_insufficient_desc');
      return;
    }

    // Deduct from source
    if (tr.fromAccountType === 'Cash') {
      this.treasuryService.cashBoxes.update(list =>
        list.map(c => c.id === tr.fromAccountId ? {
          ...c,
          currentBalance: c.currentBalance - tr.amount,
          todayPayments: c.todayPayments + tr.amount
        } : c)
      );
    } else {
      this.treasuryService.bankAccounts.update(list =>
        list.map(b => b.id === tr.fromAccountId ? {
          ...b,
          currentBalance: b.currentBalance - tr.amount,
          availableBalance: b.availableBalance - tr.amount
        } : b)
      );
    }

    // Add to destination
    if (tr.toAccountType === 'Cash') {
      this.treasuryService.cashBoxes.update(list =>
        list.map(c => c.id === tr.toAccountId ? {
          ...c,
          currentBalance: c.currentBalance + tr.amount,
          todayReceipts: c.todayReceipts + tr.amount
        } : c)
      );
    } else {
      this.treasuryService.bankAccounts.update(list =>
        list.map(b => b.id === tr.toAccountId ? {
          ...b,
          currentBalance: b.currentBalance + tr.amount,
          availableBalance: b.availableBalance + tr.amount
        } : b)
      );
    }

    // Append movements
    const moveOut: TreasuryMovement = {
      id: `mov-tr-out-${Date.now()}`,
      accountType: tr.fromAccountType,
      accountId: tr.fromAccountId,
      accountName: tr.fromAccountName,
      type: 'Transfer Out',
      date: tr.date,
      amount: tr.amount,
      currency: tr.currency,
      reference: tr.transferNumber,
      description: `Transfer Out to ${tr.toAccountName}`,
      matched: true
    };
    const moveIn: TreasuryMovement = {
      id: `mov-tr-in-${Date.now()}-2`,
      accountType: tr.toAccountType,
      accountId: tr.toAccountId,
      accountName: tr.toAccountName,
      type: 'Transfer In',
      date: tr.date,
      amount: tr.amount,
      currency: tr.currency,
      reference: tr.transferNumber,
      description: `Transfer In from ${tr.fromAccountName}`,
      matched: true
    };

    this.treasuryService.movements.update(list => [moveOut, moveIn, ...list]);
    this.updateStatus(tr.id, 'Executed');
    this.notify.success('finance_v2.treasury.transfers.executed', 'finance_v2.treasury.transfers.executed_desc');
  }

  cancelTransfer(tr: TreasuryTransfer) {
    if (tr.status === 'Executed' || tr.status === 'Cancelled') return;
    this.updateStatus(tr.id, 'Cancelled');
    this.notify.warning('finance_v2.treasury.transfers.cancelled', 'finance_v2.treasury.transfers.cancelled_desc');
  }

  private updateStatus(id: string, status: TransferStatus) {
    this.treasuryService.transfers.update(list =>
      list.map(t => t.id === id ? { ...t, status } : t)
    );
  }

  getStatusClass(s: TransferStatus): string {
    switch (s) {
      case 'Draft':     return 'bg-slate-100 text-slate-600';
      case 'Approved':  return 'bg-blue-100 text-blue-700';
      case 'Executed':  return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
    }
  }

  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.treasury.title' },
      { label: 'finance_v2.treasury.transfers.title' }
    ]);
  }
}
