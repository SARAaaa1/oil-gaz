import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TreasuryMockService } from '../../shared/treasury-mock.service';
import { CashBox, CashBoxStatus, TreasuryMovement } from '../../shared/treasury.interfaces';
import { BranchService } from '../../shared/branch.service';
import { ApMockService } from '../../shared/ap-mock.service';
import { ArMockService } from '../../shared/ar-mock.service';

@Component({
  selector: 'app-finv2-cash',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './cash.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2CashComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly treasuryService    = inject(TreasuryMockService);
  readonly branchService      = inject(BranchService);
  readonly apService          = inject(ApMockService);
  readonly arService          = inject(ArMockService);

  // قوائم المحاسبين
  readonly accountants = [
    'ريم المعيقل', 'سارة الرشيد', 'إبراهيم الحربي', 'خالد الغامدي', 'نوال العمري'
  ];
  readonly searchQuery  = signal('');
  readonly statusFilter = signal<CashBoxStatus | 'All'>('All');
  readonly branchFilter = signal('All');
  readonly selectedId   = signal<string | null>(null);

  // Cash Voucher dialogs  (إذن وارد / إذن صرف)
  readonly showTxDialog    = signal(false);
  readonly txType          = signal<'Deposit' | 'Withdrawal'>('Deposit');
  readonly txAmount        = signal<number>(0);
  readonly txReference     = signal('');
  readonly txReason        = signal('');
  readonly txAccountant    = signal('');   // اسم المحاسب
  readonly txPartnerId     = signal('');   // id المورد / العميل
  readonly txPartnerName   = signal('');   // اسم الجهة

  readonly filtered = computed(() => {
    const q  = this.searchQuery().toLowerCase();
    const st = this.statusFilter();
    const br = this.branchFilter();
    return this.treasuryService.cashBoxes()
      .filter(c => {
        const mq = !q || c.name.toLowerCase().includes(q) ||
                   c.code.toLowerCase().includes(q) ||
                   c.responsibleEmployee.toLowerCase().includes(q);
        const ms = st === 'All' || c.status === st;
        const mb = br === 'All' || (c.branchId || 'HeadOffice') === br;
        return mq && ms && mb;
      })
      .sort((a, b) => b.currentBalance - a.currentBalance);
  });

  readonly activeBox = computed(() => {
    const id = this.selectedId();
    return id ? (this.treasuryService.cashBoxes().find(c => c.id === id) ?? null) : null;
  });

  readonly activeBoxMovements = computed(() => {
    const id = this.selectedId();
    if (!id) return [];
    return this.treasuryService.movements()
      .filter(m => m.accountType === 'Cash' && m.accountId === id)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  // KPI calculations
  readonly totalCashBalance = computed(() => {
    const br = this.branchFilter();
    return this.treasuryService.cashBoxes()
      .filter(c => c.status === 'Open' && (br === 'All' || (c.branchId || 'HeadOffice') === br))
      .reduce((s, c) => s + (c.currency === 'USD' ? c.currentBalance * 3.75 : c.currentBalance), 0);
  });

  readonly activeCount = computed(() => {
    const br = this.branchFilter();
    return this.treasuryService.cashBoxes().filter(c => c.status === 'Open' && (br === 'All' || (c.branchId || 'HeadOffice') === br)).length;
  });

  selectBox(box: CashBox) {
    this.selectedId.set(box.id);
  }

  toggleBoxStatus(box: CashBox) {
    const next: CashBoxStatus = box.status === 'Open' ? 'Closed' : 'Open';
    this.treasuryService.cashBoxes.update(list =>
      list.map(c => c.id === box.id ? {
        ...c,
        status: next,
        openingBalance: next === 'Open' ? c.currentBalance : c.openingBalance
      } : c)
    );
    this.notify.success(
      next === 'Open' ? 'finance_v2.treasury.cash.box_opened' : 'finance_v2.treasury.cash.box_closed',
      next === 'Open' ? 'finance_v2.treasury.cash.box_opened_desc' : 'finance_v2.treasury.cash.box_closed_desc'
    );
  }

  openTxDialog(type: 'Deposit' | 'Withdrawal') {
    const box = this.activeBox();
    if (!box) return;
    if (box.status === 'Closed') {
      this.notify.warning('finance_v2.treasury.cash.error_closed_box', 'finance_v2.treasury.cash.error_closed_box_desc');
      return;
    }
    this.txType.set(type);
    this.txAmount.set(0);
    this.txReference.set('');
    this.txReason.set('');
    this.txAccountant.set('');
    this.txPartnerId.set('');
    this.txPartnerName.set('');
    this.showTxDialog.set(true);
  }

  // ربط اختيار المورد/العميل بالاسم
  onPartnerChange(id: string) {
    this.txPartnerId.set(id);
    if (this.txType() === 'Withdrawal') {
      const s = this.apService.suppliers().find(x => x.id === id);
      this.txPartnerName.set(s ? s.nameAr || s.nameEn : '');
    } else {
      const c = this.arService.customers().find(x => x.id === id);
      this.txPartnerName.set(c ? c.nameAr || c.nameEn : '');
    }
  }

  closeTxDialog() {
    this.showTxDialog.set(false);
  }

  submitTransaction() {
    const box = this.activeBox();
    const amt = this.txAmount();
    if (!box || amt <= 0) return;

    if (this.txType() === 'Withdrawal' && amt > box.currentBalance) {
      this.notify.warning('finance_v2.treasury.cash.error_insufficient', 'finance_v2.treasury.cash.error_insufficient_desc');
      return;
    }

    const isDep = this.txType() === 'Deposit';
    const diff  = isDep ? amt : -amt;

    // Update box balance
    this.treasuryService.cashBoxes.update(list =>
      list.map(c => c.id === box.id ? {
        ...c,
        currentBalance: c.currentBalance + diff,
        todayReceipts: isDep ? c.todayReceipts + amt : c.todayReceipts,
        todayPayments: !isDep ? c.todayPayments + amt : c.todayPayments,
        closingBalance: c.currentBalance + diff
      } : c)
    );

    // Append movement ledger
    const voucherLabel = this.txType() === 'Deposit' ? 'إذن وارد' : 'إذن صرف';
    const partnerInfo  = this.txPartnerName() ? ` — ${this.txPartnerName()}` : '';
    const acctInfo     = this.txAccountant() ? ` (المحاسب: ${this.txAccountant()})` : '';
    const newMovement: TreasuryMovement = {
      id: `mov-manual-${Date.now()}`,
      accountType: 'Cash',
      accountId: box.id,
      accountName: box.name,
      type: this.txType(),
      date: '2025-07-01',
      amount: amt,
      currency: box.currency,
      reference: this.txReference() || `CASH-${this.txType() === 'Deposit' ? 'RCV' : 'PAY'}-${Date.now().toString().slice(-6)}`,
      description: this.txReason() || `${voucherLabel}${partnerInfo}${acctInfo}`,
      matched: true
    };
    this.treasuryService.movements.update(list => [newMovement, ...list]);

    this.closeTxDialog();
    this.notify.success('finance_v2.treasury.cash.tx_success', 'finance_v2.treasury.cash.tx_success_desc');
  }

  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  getStatusClass(s: CashBoxStatus): string {
    return s === 'Open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500';
  }

  getMovementClass(type: string): string {
    return ['Deposit', 'Receipt', 'Transfer In'].includes(type) ? 'text-green-600' : 'text-red-600';
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.treasury.title' },
      { label: 'finance_v2.treasury.cash.title' }
    ]);
    // Auto-select first cash box
    const first = this.treasuryService.cashBoxes()[0];
    if (first) this.selectedId.set(first.id);
  }
}
