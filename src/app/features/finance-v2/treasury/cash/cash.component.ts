import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FinanceApiService } from '../../../../core/services/finance-api.service';
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
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);
  readonly apService          = inject(ApMockService);
  readonly arService          = inject(ArMockService);

  readonly cashAccounts = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly showCreateModal = signal(false);
  readonly movements = signal<any[]>([]);

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
    return this.cashAccounts()
      .filter(c => {
        const mq = !q || (c.name && c.name.toLowerCase().includes(q)) ||
                   (c.code && c.code.toLowerCase().includes(q)) ||
                   (c.custodianName && c.custodianName.toLowerCase().includes(q)) ||
                   (c.responsibleEmployee && c.responsibleEmployee.toLowerCase().includes(q));
        const ms = st === 'All' || c.status === st;
        const mb = br === 'All' || (c.branchId || 'HeadOffice') === br;
        return mq && ms && mb;
      })
      .sort((a, b) => (b.currentBalance || b.balance || 0) - (a.currentBalance || a.balance || 0));
  });

  readonly activeBox = computed(() => {
    const id = this.selectedId();
    return id ? (this.cashAccounts().find(c => c.id === id || c._id === id) ?? null) : null;
  });

  readonly activeBoxMovements = computed(() => {
    const id = this.selectedId();
    if (!id) return [];
    return this.movements()
      .filter(m => m.accountType === 'Cash' && m.accountId === id)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  // KPI calculations
  readonly totalCashBalance = computed(() => {
    const br = this.branchFilter();
    return this.cashAccounts()
      .filter(c => c.status === 'Open' && (br === 'All' || (c.branchId || 'HeadOffice') === br))
      .reduce((s, c) => s + (c.currency === 'USD' ? (c.currentBalance || c.balance || 0) * 3.75 : (c.currentBalance || c.balance || 0)), 0);
  });

  readonly activeCount = computed(() => {
    const br = this.branchFilter();
    return this.cashAccounts().filter(c => c.status === 'Open' && (br === 'All' || (c.branchId || 'HeadOffice') === br)).length;
  });

  selectBox(box: CashBox) {
    this.selectedId.set(box.id);
  }

  toggleBoxStatus(box: any) {
    const next: CashBoxStatus = box.status === 'Open' ? 'Closed' : 'Open';
    this.cashAccounts.update(list =>
      list.map(c => (c.id === box.id || c._id === box.id) ? {
        ...c,
        status: next,
        openingBalance: next === 'Open' ? (c.currentBalance || c.balance || 0) : (c.openingBalance || 0)
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
    this.cashAccounts.update(list =>
      list.map(c => (c.id === box.id || c._id === box.id) ? {
        ...c,
        currentBalance: (c.currentBalance || c.balance || 0) + diff,
        balance: (c.balance || 0) + diff,
        todayReceipts: isDep ? (c.todayReceipts || 0) + amt : (c.todayReceipts || 0),
        todayPayments: !isDep ? (c.todayPayments || 0) + amt : (c.todayPayments || 0),
        closingBalance: (c.currentBalance || c.balance || 0) + diff
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
    this.movements.update(list => [newMovement, ...list]);

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
    this.loadCash();
  }

  loadCash() {
    this.isLoading.set(true);
    this.financeApi.getCashAccounts().subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          const mapped = raw.map((c: any) => ({
            id: c.id ?? c._id,
            _id: c._id ?? c.id,
            code: c.code ?? c.accountCode ?? 'CSH-001',
            name: c.name ?? c.officeLocation ?? 'Main Cash Box',
            officeLocation: c.officeLocation ?? c.name ?? '',
            custodianName: c.custodianName ?? c.responsibleEmployee ?? '',
            responsibleEmployee: c.responsibleEmployee ?? c.custodianName ?? '',
            currency: c.currency ?? 'SAR',
            currentBalance: c.currentBalance ?? c.balance ?? 0,
            maxLimit: c.maxLimit ?? 50000,
            status: c.status ?? 'Open',
            branchId: c.branchId ?? 'HeadOffice'
          }));
          this.cashAccounts.set(mapped);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  createCashAccount(form: any) {
    this.isSaving.set(true);
    this.financeApi.createCashAccount({
      officeLocation: form.officeLocation,
      custodianName: form.custodianName,
      currency: form.currency,
      balance: form.balance ?? 0
    }).subscribe({
      next: created => {
        this.cashAccounts.update(l => [...l, {...created, id: created._id}]);
        this.showCreateModal?.set(false);
        this.notify.success('Cash Account Created', '');
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}
