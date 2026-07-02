import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ArMockService } from '../../shared/ar-mock.service';
import { ArCollection, CollectionStatus, CollectionMethod, CollectionAllocation } from '../../shared/ar.interfaces';

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
  readonly arService          = inject(ArMockService);

  readonly searchQuery    = signal('');
  readonly statusFilter   = signal<CollectionStatus | 'All'>('All');
  readonly methodFilter   = signal<CollectionMethod | 'All'>('All');
  readonly selectedId     = signal<string | null>(null);
  readonly showModal      = signal(false);
  readonly activeTab      = signal<'details' | 'allocations'>('details');

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
    return this.arService.collections()
      .filter(c => {
        const mq = !q || c.voucherNumber.toLowerCase().includes(q) ||
                   c.customerName.toLowerCase().includes(q) ||
                   c.referenceNumber.toLowerCase().includes(q);
        const ms = st === 'All' || c.status === st;
        const mm = mt === 'All' || c.collectionMethod === mt;
        return mq && ms && mm;
      })
      .sort((a, b) => b.voucherNumber.localeCompare(a.voucherNumber));
  });

  readonly activeCollection = computed(() => {
    const id = this.selectedId();
    return id ? (this.arService.collections().find(c => c.id === id) ?? null) : null;
  });

  // KPIs
  readonly kpis           = this.arService.kpis;
  readonly totalPosted    = computed(() => this.arService.collections().filter(c => c.status === 'Posted').reduce((s, c) => s + c.totalAmount, 0));
  readonly totalPending   = computed(() => this.arService.collections().filter(c => c.status === 'Draft').reduce((s, c) => s + c.totalAmount, 0));
  readonly countPosted    = computed(() => this.arService.collections().filter(c => c.status === 'Posted').length);
  readonly countDraft     = computed(() => this.arService.collections().filter(c => c.status === 'Draft').length);

  // Allocatable invoices for modal
  readonly allocatableInvoices = computed(() => {
    const cid = this.formCustomerId();
    if (!cid) return [];
    return this.arService.customerInvoices()
      .filter(i => i.customerId === cid && i.outstandingAmount > 0 && !['Collected','Closed','Rejected'].includes(i.status));
  });

  readonly formCustomerName = computed(() => {
    const cid = this.formCustomerId();
    return this.arService.customers().find(c => c.id === cid)?.nameEn ?? '';
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
    const cols   = this.arService.collections();
    const nextNo = `CV-2025-${String(cols.length + 1).padStart(3, '0')}`;
    const newCol: ArCollection = {
      id:               `cv${Date.now()}`,
      voucherNumber:    nextNo,
      collectionDate:   this.formDate(),
      customerId:       this.formCustomerId(),
      customerName:     this.formCustomerName(),
      collectionMethod: this.formMethod(),
      bankName:         this.formBank(),
      chequeNumber:     '',
      referenceNumber:  this.formRef(),
      currency:         'SAR',
      totalAmount:      this.formTotal(),
      status:           'Draft',
      remarks:          this.formNotes(),
      createdBy:        'Current User',
      createdDate:      this.formDate(),
      approvedBy:       '',
      approvalDate:     '',
      allocations:      this.formAllocations(),
      attachments:      []
    };
    this.arService.collections.update(list => [...list, newCol]);
    this.selectedId.set(newCol.id);
    this.closeModal();
    this.notify.success('finance_v2.ar.col.saved', 'finance_v2.ar.col.saved_desc');
  }

  postCollection(col: ArCollection) {
    if (col.status !== 'Draft') return;
    this.arService.collections.update(list =>
      list.map(c => c.id === col.id ? { ...c, status: 'Posted' as CollectionStatus, approvedBy: 'Sara Al-Rasheed', approvalDate: '2025-07-01' } : c)
    );
    // Update invoice collected amounts
    col.allocations.forEach(a => {
      this.arService.customerInvoices.update(list =>
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
    this.arService.collections.update(list =>
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
  }
}
