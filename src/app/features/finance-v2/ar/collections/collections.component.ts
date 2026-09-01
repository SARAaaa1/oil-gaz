import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FinanceApiService } from '../../../../core/services/finance-api.service';
import { ArCollection, CollectionStatus, CollectionMethod, CollectionAllocation } from '../../shared/ar.interfaces';
import { BranchService } from '../../shared/branch.service';

@Component({
  selector: 'app-finv2-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2CollectionsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);

  readonly searchQuery    = signal('');
  readonly statusFilter   = signal<CollectionStatus | 'All'>('All');
  readonly methodFilter   = signal<CollectionMethod | 'All'>('All');
  readonly branchFilter   = signal('All');
  readonly selectedId     = signal<string | null>(null);
  readonly showModal      = signal(false);
  readonly activeTab      = signal<'details' | 'allocations'>('details');

  readonly collections = signal<any[]>([]);
  readonly invoices = signal<any[]>([]);
  readonly customers = signal<any[]>([]);
  readonly isLoading = signal(false);

  // New voucher form
  readonly formCustomerId  = signal('');
  readonly formDate        = signal('2025-07-01');
  readonly formMethod      = signal<CollectionMethod>('Bank Transfer');
  readonly formBank        = signal('');
  readonly formRef         = signal('');
  readonly formNotes       = signal('');
  readonly formAllocations = signal<CollectionAllocation[]>([]);

  readonly collectionStatuses: CollectionStatus[] = ['Draft', 'Posted', 'Cancelled'];
  readonly collectionMethods:  CollectionMethod[]  = ['Bank Transfer', 'Cheque', 'Cash', 'Online'];

  readonly filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const st  = this.statusFilter();
    const mt  = this.methodFilter();
    const br  = this.branchFilter();
    return this.collections()
      .filter(c => {
        const mq = !q || c.voucherNumber.toLowerCase().includes(q) ||
                   c.customerName.toLowerCase().includes(q) ||
                   c.referenceNumber.toLowerCase().includes(q);
        const ms = st === 'All' || c.status === st;
        const mm = mt === 'All' || c.collectionMethod === mt;
        const mb = br === 'All' || (c.branchId || 'HeadOffice') === br;
        return mq && ms && mm && mb;
      })
      .sort((a, b) => b.voucherNumber.localeCompare(a.voucherNumber));
  });

  readonly activeCollection = computed(() => {
    const id = this.selectedId();
    return id ? (this.collections().find(c => c.id === id) ?? null) : null;
  });

  // KPIs — includes all fields the template references
  readonly kpis = computed(() => {
    const cols = this.collections();
    const postedCols = cols.filter(c => c.status === 'Posted');
    const draftCols  = cols.filter(c => c.status === 'Draft');
    const totalPosted  = postedCols.reduce((s, c) => s + (c.totalAmount ?? 0), 0);
    const totalPending = draftCols.reduce((s, c) => s + (c.totalAmount ?? 0), 0);

    // Derive outstanding/collectedThisMonth from invoices if available
    const invs = this.invoices();
    const outstanding       = invs.reduce((s, i) => s + (i.balanceDue ?? i.outstandingAmount ?? 0), 0);
    const now = new Date();
    const collectedThisMonth = postedCols
      .filter(c => { const d = new Date(c.collectionDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((s, c) => s + (c.totalAmount ?? 0), 0);

    return { totalPosted, totalPending, outstanding, collectedThisMonth };
  });
  readonly totalPosted    = computed(() => this.collections().filter(c => c.status === 'Posted').reduce((s, c) => s + c.totalAmount, 0));
  readonly totalPending   = computed(() => this.collections().filter(c => c.status === 'Draft').reduce((s, c) => s + c.totalAmount, 0));
  readonly countPosted    = computed(() => this.collections().filter(c => c.status === 'Posted').length);
  readonly countDraft     = computed(() => this.collections().filter(c => c.status === 'Draft').length);

  // Allocatable invoices for modal
  readonly allocatableInvoices = computed(() => {
    const cid = this.formCustomerId();
    if (!cid) return [];
    return this.invoices()
      .filter(i => i.customerId === cid && i.outstandingAmount > 0 && !['Collected','Closed','Rejected'].includes(i.status));
  });

  readonly formCustomerName = computed(() => {
    const cid = this.formCustomerId();
    return this.customers().find(c => c.id === cid)?.nameEn ?? '';
  });

  readonly formTotal = computed(() =>
    this.formAllocations().reduce((s, a) => s + a.allocatedAmount, 0)
  );

  isAllocated(invoiceId: string): boolean {
    return this.formAllocations().some(a => a.invoiceId === invoiceId);
  }

  addAllocation(inv: { id: string; invoiceNumber: string; customerId: string; customerName: string; outstandingAmount: number }) {
    this.formAllocations.update(list => [
      ...list,
      { invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, customerId: inv.customerId, customerName: inv.customerName, outstandingAmt: inv.outstandingAmount, allocatedAmount: inv.outstandingAmount, discount: 0 }
    ]);
  }

  removeAllocation(invoiceId: string) {
    this.formAllocations.update(list => list.filter(a => a.invoiceId !== invoiceId));
  }

  updateAllocationAmt(invoiceId: string, amt: number) {
    this.formAllocations.update(list =>
      list.map(a => a.invoiceId === invoiceId ? { ...a, allocatedAmount: Number(amt) || 0 } : a)
    );
  }

  selectVoucher(c: ArCollection) {
    this.selectedId.set(c.id);
    this.activeTab.set('details');
  }

  openModal() {
    this.formCustomerId.set('');
    this.formDate.set('2025-07-01');
    this.formMethod.set('Bank Transfer');
    this.formBank.set('');
    this.formRef.set('');
    this.formNotes.set('');
    this.formAllocations.set([]);
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  saveVoucher() {
    if (!this.formCustomerId() || this.formAllocations().length === 0) {
      this.notify.warning('finance_v2.ar.col.error_required', 'finance_v2.ar.col.error_required_msg');
      return;
    }
    this.financeApi.createArVoucher({
      collectionDate: this.formDate(),
      customerName: this.formCustomerName(),
      bankAccountId: this.formBank(),
      paymentMethod: this.formMethod() as any,
      referenceNumber: this.formRef(),
      invoicesCollected: this.formAllocations().map(a => ({ invoiceId: a.invoiceId, invoiceNumber: a.invoiceNumber, amountCollected: a.allocatedAmount }))
    }).subscribe({
      next: () => {
        this.loadAll();
        this.closeModal();
        this.notify.success('تم إنشاء سند القبض', '');
      },
      error: () => {}
    });
  }

  postCollection(col: ArCollection) {
    if (col.status !== 'Draft') return;
    this.collections.update(list =>
      list.map(c => c.id === col.id ? { ...c, status: 'Posted' as CollectionStatus, approvedBy: 'Sara Al-Rasheed', approvalDate: '2025-07-01' } : c)
    );
    // Update invoice collected amounts
    col.allocations.forEach(a => {
      this.invoices.update(list =>
        list.map(i => {
          if (i.id !== a.invoiceId) return i;
          const collected = i.collectedAmount + a.allocatedAmount;
          const outstanding = Math.max(0, i.grandTotal - collected);
          const status = outstanding === 0 ? 'Collected' as const : 'Partially Collected' as const;
          return { ...i, collectedAmount: collected, outstandingAmount: outstanding, status };
        })
      );
    });
    this.notify.success('finance_v2.ar.col.posted', 'finance_v2.ar.col.posted_desc');
  }

  cancelCollection(col: ArCollection) {
    if (col.status !== 'Draft') return;
    this.collections.update(list =>
      list.map(c => c.id === col.id ? { ...c, status: 'Cancelled' as CollectionStatus } : c)
    );
    this.notify.warning('finance_v2.ar.col.cancelled', 'finance_v2.ar.col.cancelled_desc');
  }

  getStatusClass(s: CollectionStatus): string {
    switch (s) {
      case 'Posted':    return 'bg-emerald-100 text-emerald-700';
      case 'Draft':     return 'bg-slate-100 text-slate-600';
      case 'Cancelled': return 'bg-red-100 text-red-700';
    }
  }

  getMethodIcon(m: CollectionMethod): string {
    switch (m) {
      case 'Bank Transfer': return '🏦';
      case 'Cheque':        return '📝';
      case 'Cash':          return '💵';
      case 'Online':        return '💻';
    }
  }

  formatAmt(v: number): string {
    if (!v) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.ar.title' },
      { label: 'finance_v2.ar.col.title' }
    ]);
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.financeApi.getArVouchers().subscribe({ next: v => this.collections.set(v), error: () => {} });
    this.financeApi.getArInvoices({ limit: 200 }).subscribe({ next: res => { this.invoices.set(res.data); this.isLoading.set(false); }, error: () => this.isLoading.set(false) });
  }
}
