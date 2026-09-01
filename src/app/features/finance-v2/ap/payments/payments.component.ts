import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FinanceApiService } from '../../../../core/services/finance-api.service';
import { ApPayment, ApInvoice, PaymentAllocation, PaymentMethod, PaymentStatus } from '../../shared/ap.interfaces';
import { BranchService } from '../../shared/branch.service';

@Component({
  selector: 'app-finv2-ap-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './payments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2ApPaymentsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);

  // ── UI State ──────────────────────────────────────────────────────
  readonly searchQuery   = signal('');
  readonly statusFilter  = signal<PaymentStatus | 'All'>('All');
  readonly branchFilter  = signal('All');
  readonly selectedId    = signal<string | null>(null);
  readonly showAddModal  = signal(false);

  readonly payments = signal<any[]>([]);
  readonly invoices = signal<any[]>([]);
  readonly bankAccounts = signal<any[]>([]);
  readonly isLoading = signal(false);

  // ── Form State ────────────────────────────────────────────────────
  formDate        = new Date().toISOString().split('T')[0];
  formMethod: PaymentMethod = 'Bank Transfer';
  formBank        = 'SAB Bank — Main (1121)';
  formCheque      = '';
  formRef         = '';
  formCurrency    = 'SAR';
  formRemarks     = '';
  formAllocations: PaymentAllocation[] = [];
  formTotalAmount = 0;

  // ── Filtered Payments ─────────────────────────────────────────────
  readonly filtered = computed(() => {
    const q  = this.searchQuery().toLowerCase();
    const st = this.statusFilter();
    const br = this.branchFilter();
    return this.payments()
      .filter(p => {
        const mq = !q || p.voucherNumber.toLowerCase().includes(q) ||
                   p.allocations.some((a: any) => a.supplierName.toLowerCase().includes(q));
        const ms = st === 'All' || p.status === st;
        const mb = br === 'All' || (p.branchId || 'HeadOffice') === br;
        return mq && ms && mb;
      })
      .sort((a, b) => b.voucherNumber.localeCompare(a.voucherNumber));
  });

  readonly activePayment = computed(() => {
    const id = this.selectedId();
    return id ? (this.payments().find(p => p.id === id) ?? null) : null;
  });

  // ── KPIs ──────────────────────────────────────────────────────────
  readonly totalPosted   = computed(() =>
    this.payments().filter(p => p.status === 'Posted').reduce((s, p) => s + p.totalAmount, 0));
  readonly countDraft    = computed(() =>
    this.payments().filter(p => p.status === 'Draft').length);
  readonly countApproved = computed(() =>
    this.payments().filter(p => p.status === 'Approved').length);
  readonly countPosted   = computed(() =>
    this.payments().filter(p => p.status === 'Posted').length);

  // Invoices available for allocation (Ready For Payment or Approved)
  readonly allocatableInvoices = computed(() =>
    this.invoices().filter(i =>
      i.status === 'Ready For Payment' || i.status === 'Approved'
    )
  );

  // ── Actions ───────────────────────────────────────────────────────
  openAddModal() {
    const today = new Date().toISOString().split('T')[0];
    this.formDate       = today;
    this.formMethod     = 'Bank Transfer';
    this.formBank       = 'SAB Bank — Main (1121)';
    this.formCheque     = '';
    this.formRef        = '';
    this.formCurrency   = 'SAR';
    this.formRemarks    = '';
    this.formAllocations = [];
    this.formTotalAmount = 0;
    this.showAddModal.set(true);
  }

  addAllocation(inv: ApInvoice) {
    if (this.formAllocations.find(a => a.invoiceId === inv.id)) return;
    this.formAllocations = [...this.formAllocations, {
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      supplierId: inv.supplierId,
      supplierName: inv.supplierName,
      dueAmount: inv.balanceDue,
      allocatedAmount: inv.balanceDue,
      discount: 0
    }];
    this.recalcTotal();
  }

  removeAllocation(idx: number) {
    this.formAllocations = this.formAllocations.filter((_, i) => i !== idx);
    this.recalcTotal();
  }

  recalcTotal() {
    this.formTotalAmount = this.formAllocations.reduce(
      (s, a) => s + (Number(a.allocatedAmount) || 0), 0
    );
  }

  savePayment(status: PaymentStatus) {
    if (!this.formDate || this.formAllocations.length === 0) {
      this.notify.warning('finance_v2.ap.pmt.error_required', 'finance_v2.ap.pmt.error_required_msg');
      return;
    }
    const payments = this.payments();
    const lastNum  = payments.length > 0
      ? parseInt(payments[0].voucherNumber.split('-')[2]) + 1
      : 16;
    const now = new Date().toISOString().split('T')[0];

    const newPayment: ApPayment = {
      id: 'pv-' + Date.now(),
      voucherNumber: `PV-2025-${String(lastNum).padStart(3, '0')}`,
      paymentDate: this.formDate,
      paymentMethod: this.formMethod,
      bankName: this.formBank,
      chequeNumber: this.formCheque,
      referenceNumber: this.formRef,
      currency: this.formCurrency,
      totalAmount: this.formTotalAmount,
      status,
      remarks: this.formRemarks,
      createdBy: 'Reem Al-Muaiqel',
      createdDate: now,
      approvedBy: status === 'Approved' || status === 'Posted' ? 'Sara Al-Rasheed' : '',
      approvalDate: status !== 'Draft' ? now : '',
      allocations: this.formAllocations.map(a => ({ ...a })),
      attachments: []
    };

    const vendorName = this.formAllocations.length > 0 ? this.formAllocations[0].supplierName : 'Unknown Vendor';
    
    this.financeApi.createApVoucher({
      paymentDate: this.formDate,
      vendorName: vendorName,
      bankAccountId: this.formBank,
      paymentMethod: this.formMethod as any,
      referenceNumber: this.formRef,
      invoicesPaid: this.formAllocations.map(a => ({ invoiceId: a.invoiceId, invoiceNumber: a.invoiceNumber, amountPaid: a.allocatedAmount }))
    }).subscribe({
      next: () => {
        this.loadAll();
        this.showAddModal.set(false);
        this.notify.success('تم إنشاء سند الدفع', '');
      },
      error: () => {}
    });
  }

  postPayment(pmt: ApPayment) {
    this.payments.update(list =>
      list.map(p => p.id === pmt.id
        ? { ...p, status: 'Posted' as PaymentStatus, approvedBy: 'Sara Al-Rasheed', approvalDate: new Date().toISOString().split('T')[0] }
        : p)
    );
    this.notify.success('finance_v2.ap.pmt.posted', 'finance_v2.ap.pmt.posted_desc');
  }

  cancelPayment(pmt: ApPayment) {
    this.payments.update(list =>
      list.map(p => p.id === pmt.id ? { ...p, status: 'Cancelled' as PaymentStatus } : p)
    );
    this.notify.warning('finance_v2.ap.pmt.cancelled', 'finance_v2.ap.pmt.cancelled_desc');
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getStatusClass(s: PaymentStatus): string {
    switch (s) {
      case 'Draft':     return 'bg-slate-100 text-slate-600';
      case 'Approved':  return 'bg-amber-100 text-amber-700';
      case 'Posted':    return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
    }
  }

  getMethodIcon(m: PaymentMethod): string {
    switch (m) {
      case 'Bank Transfer': return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z';
      case 'Cheque':        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'Cash':          return 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z';
      default:              return 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9';
    }
  }

  formatAmt(v: number): string {
    if (!v) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  isAllocated(invoiceId: string): boolean {
    return this.formAllocations.some(a => a.invoiceId === invoiceId);
  }

  readonly paymentStatuses: PaymentStatus[] = ['Draft', 'Approved', 'Posted', 'Cancelled'];
  readonly paymentMethods: PaymentMethod[]  = ['Bank Transfer', 'Cheque', 'Cash', 'Online'];
  readonly bankOptions = ['SAB Bank — Main (1121)', 'Riyad Bank — Payroll (1122)', 'Al Rajhi Bank (1123)', 'HSBC Saudi Arabia (1124)', 'Citibank KSA (1125)'];

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.ap.title' },
      { label: 'finance_v2.ap.pmt.title' }
    ]);
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.financeApi.getApVouchers().subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          const mapped = raw.map((v: any) => ({
            id: v.id ?? v._id,
            voucherNumber: v.voucherNumber ?? v.number ?? '',
            paymentDate: v.paymentDate ?? v.date ?? '',
            paymentMethod: v.paymentMethod ?? v.method ?? 'Bank Transfer',
            bankAccount: v.bankAccount ?? '',
            chequeNumber: v.chequeNumber ?? '',
            reference: v.reference ?? '',
            currency: v.currency ?? 'SAR',
            totalAmount: v.totalAmount ?? v.amount ?? 0,
            status: v.status ?? 'Posted',
            allocations: v.allocations ?? [],
            remarks: v.remarks ?? '',
            branchId: v.branchId ?? 'HeadOffice'
          }));
          this.payments.set(mapped);
        }
      },
      error: () => {}
    });

    this.financeApi.getApInvoices({ status: 'Unpaid', limit: 200 }).subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          const mapped = raw.map((inv: any) => ({
            id: inv.id ?? inv._id,
            invoiceNumber: inv.invoiceNumber ?? '',
            supplierId: inv.supplierId ?? inv.vendorId ?? '',
            supplierName: inv.supplierName ?? inv.vendorName ?? '',
            poNumber: inv.poNumber ?? inv.poId ?? '',
            invoiceDate: inv.invoiceDate ?? '',
            dueDate: inv.dueDate ?? '',
            subtotal: inv.subtotal ?? inv.subTotal ?? 0,
            vatAmount: inv.vatAmount ?? inv.taxAmount ?? 0,
            totalAmount: inv.totalAmount ?? 0,
            paidAmount: inv.paidAmount ?? 0,
            balanceDue: inv.balanceDue ?? 0,
            status: inv.status ?? 'Draft',
            branchId: inv.branchId ?? 'HeadOffice'
          }));
          this.invoices.set(mapped);
        }
      },
      error: () => {}
    });

    this.financeApi.getBankAccounts().subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          this.bankAccounts.set(raw);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
