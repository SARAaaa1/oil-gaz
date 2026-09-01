import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FinanceApiService } from '../../../../core/services/finance-api.service';
import { BankAccount, BankAccountStatus, TreasuryMovement } from '../../shared/treasury.interfaces';
import { Router } from '@angular/router';
import { BranchService } from '../../shared/branch.service';
import { ApMockService } from '../../shared/ap-mock.service';
import { ArMockService } from '../../shared/ar-mock.service';

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
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);
  readonly apService          = inject(ApMockService);
  readonly arService          = inject(ArMockService);

  readonly bankAccounts = signal<any[]>([]);
  readonly kpiData = signal<any>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly showCreateModal = signal(false);
  readonly movements = signal<any[]>([]);

  // قوائم المحاسبين
  readonly accountants = [
    'ريم المعيقل', 'سارة الرشيد', 'إبراهيم الحربي', 'خالد الغامدي', 'نوال العمري'
  ];
  readonly searchQuery  = signal('');
  readonly statusFilter = signal<BankAccountStatus | 'All'>('All');
  readonly branchFilter = signal('All');
  readonly selectedId   = signal<string | null>(null);

  // Bank Voucher dialogs (سند قبض / سند صرف)
  readonly showTxDialog      = signal(false);
  readonly txType            = signal<'Deposit' | 'Withdrawal'>('Deposit');
  readonly txAmount          = signal<number>(0);
  readonly txReference       = signal('');
  readonly txReason          = signal('');
  readonly txPartnerId       = signal('');    // id العميل / المورد
  readonly txPartnerName     = signal('');    // اسم الجهة الدافعة / المستفيد
  readonly txPaymentMethod   = signal<'cheque' | 'transfer' | 'book_transfer'>('transfer');
  readonly txChequeNumber    = signal('');    // رقم الشيك

  readonly filtered = computed(() => {
    const q  = this.searchQuery().toLowerCase();
    const st = this.statusFilter();
    const br = this.branchFilter();
    return this.bankAccounts()
      .filter(b => {
        const mq = !q || b.bankName.toLowerCase().includes(q) ||
                   (b.branch && b.branch.toLowerCase().includes(q)) ||
                   (b.iban && b.iban.toLowerCase().includes(q)) ||
                   (b.accountNumber && b.accountNumber.toLowerCase().includes(q));
        const ms = st === 'All' || b.status === st;
        const mb = br === 'All' || (b.branchId || 'HeadOffice') === br;
        return mq && ms && mb;
      })
      .sort((a, b) => (b.currentBalance || b.balance || 0) - (a.currentBalance || a.balance || 0));
  });

  readonly activeAccount = computed(() => {
    const id = this.selectedId();
    return id ? (this.bankAccounts().find(b => b.id === id || b._id === id) ?? null) : null;
  });

  readonly activeAccountMovements = computed(() => {
    const id = this.selectedId();
    if (!id) return [];
    return this.movements()
      .filter(m => m.accountType === 'Bank' && m.accountId === id)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  // KPIs
  readonly totalBankBalance = computed(() => {
    const br = this.branchFilter();
    return this.bankAccounts()
      .filter(b => b.status === 'Active' && (br === 'All' || (b.branchId || 'HeadOffice') === br))
      .reduce((s, b) => s + (b.currency === 'USD' ? (b.currentBalance || b.balance || 0) * 3.75 : b.currency === 'EUR' ? (b.currentBalance || b.balance || 0) * 4.0 : (b.currentBalance || b.balance || 0)), 0);
  });

  readonly activeCount = computed(() => {
    const br = this.branchFilter();
    return this.bankAccounts().filter(b => b.status === 'Active' && (br === 'All' || (b.branchId || 'HeadOffice') === br)).length;
  });

  selectAccount(acc: BankAccount) {
    this.selectedId.set(acc.id);
  }

  toggleAccountStatus(acc: any) {
    const next: BankAccountStatus = acc.status === 'Active' ? 'Inactive' : 'Active';
    this.bankAccounts.update(list =>
      list.map(b => (b.id === acc.id || b._id === acc.id) ? { ...b, status: next } : b)
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
    this.txPartnerId.set('');
    this.txPartnerName.set('');
    this.txPaymentMethod.set('transfer');
    this.txChequeNumber.set('');
    this.showTxDialog.set(true);
  }

  // ربط اختيار الطرف من القائمة
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
    this.bankAccounts.update(list =>
      list.map(b => (b.id === acc.id || b._id === acc.id) ? {
        ...b,
        currentBalance: (b.currentBalance || b.balance || 0) + diff,
        availableBalance: (b.availableBalance || b.balance || 0) + diff,
        balance: (b.balance || 0) + diff
      } : b)
    );

    // Append to movement ledger
    const voucherLabel  = this.txType() === 'Deposit' ? 'سند قبض' : 'سند صرف';
    const methodMap: Record<string, string> = { cheque: 'شيك', transfer: 'تحويل إلكتروني', book_transfer: 'تحويل دفتري' };
    const methodLabel   = methodMap[this.txPaymentMethod()] ?? '';
    const chequeInfo    = this.txPaymentMethod() === 'cheque' && this.txChequeNumber() ? ` شيك رقم: ${this.txChequeNumber()}` : '';
    const partnerInfo   = this.txPartnerName() ? ` — ${this.txPartnerName()}` : '';
    const newMovement: TreasuryMovement = {
      id: `mov-bank-manual-${Date.now()}`,
      accountType: 'Bank',
      accountId: acc.id,
      accountName: `${acc.bankName} - ${acc.accountNumber}`,
      type: this.txType(),
      date: '2025-07-01',
      amount: amt,
      currency: acc.currency,
      reference: this.txReference() || `BNK-${this.txType() === 'Deposit' ? 'RCV' : 'PAY'}-${Date.now().toString().slice(-6)}`,
      description: this.txReason() || `${voucherLabel} ${methodLabel}${chequeInfo}${partnerInfo}`,
      matched: false
    };
    this.movements.update(list => [newMovement, ...list]);

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
    this.loadBanks();
  }

  loadBanks() {
    this.isLoading.set(true);
    this.financeApi.getBankAccounts().subscribe({
      next: res => { this.bankAccounts.set(res.data); this.kpiData.set(res.kpis); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  createBankAccount(form: any) {
    this.isSaving.set(true);
    this.financeApi.createBankAccount({
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      iban: form.iban,
      currency: form.currency,
      balance: form.balance ?? 0
    }).subscribe({
      next: created => {
        this.bankAccounts.update(list => [...list, {...created, id: created._id}]);
        this.showCreateModal?.set(false);
        this.notify.success('Bank Account Created', '');
        this.loadBanks();
        this.isSaving.set(false);
      },
      error: err => {
        this.isSaving.set(false);
      }
    });
  }
}
