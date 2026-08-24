import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  BillingApiService,
  Invoice,
  Collection,
  AgingEntry,
  CreateCollectionBody
} from '../../../core/services/billing-api.service';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionsComponent implements OnInit {
  private readonly billingApi  = inject(BillingApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate   = inject(TranslateService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly invoices    = signal<Invoice[]>([]);
  readonly collections = signal<Collection[]>([]);
  readonly agingReport = signal<AgingEntry[]>([]);
  readonly isLoading   = signal(false);
  readonly isProcessing = signal(false);
  readonly selectedInvoice = signal<Invoice | null>(null);
  readonly activeTab   = signal<'ar' | 'collections' | 'aging'>('ar');

  searchQuery  = '';
  statusFilter = 'ALL';
  isModalOpen  = signal(false);
  formModel: any = this.emptyForm();

  // ── Compat aliases for old HTML template ───────────────────────────────────
  readonly totalAR = computed(() => this.totalOutstanding());
  readonly selectedCollection = this.selectedInvoice;

  readonly filteredCollections = computed<Invoice[]>(() => {
    let list = this.invoices();
    const query  = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;

    if (query) list = list.filter(i =>
      i.invoiceNumber?.toLowerCase().includes(query) ||
      i.clientName?.toLowerCase().includes(query) ||
      i.contractNumber?.toLowerCase().includes(query)
    );

    return list.map(i => {
      const due = i.dueDate ? new Date(i.dueDate).getTime() : Date.now();
      const diff = Math.max(0, Math.floor((Date.now() - due) / (1000 * 60 * 60 * 24)));

      let statusStr: any = i.status;
      if ((i.status as string) === 'Paid') statusStr = 'Fully Collected';
      else if ((i.status as string) === 'Partially_Paid') statusStr = 'Partially Collected';
      else if ((i.status as string) === 'Sent' || (i.status as string) === 'Draft') statusStr = 'Pending';

      if (status !== 'ALL' && statusStr !== status) return null;

      return {
        ...i,
        id:                 i._id,
        collectionNumber:   i.invoiceNumber,
        invoiceNumber:      i.invoiceNumber,
        clientName:         i.clientName,
        contractNumber:     i.contractNumber,
        outstandingBalance: i.balanceDue ?? 0,
        totalCollected:     i.totalCollected ?? 0,
        invoiceAmount:      i.netPayable ?? 0,
        currency:           'USD',
        agingDays:          diff,
        status:             statusStr
      } as Invoice;
    }).filter(Boolean) as Invoice[];
  });

  selectCollection(col: any) { this.selectedInvoice.set(col); }

  readonly overdueCount = computed(() =>
    this.agingReport().filter(a => a.agingBucket !== 'Current').length
  );

  readonly totalOutstanding = computed(() =>
    this.invoices().reduce((sum, i) => sum + (i.balanceDue ?? 0), 0)
  );
  readonly totalCollected = computed(() =>
    this.invoices().reduce((sum, i) => sum + (i.totalCollected ?? 0), 0)
  );
  readonly filteredInvoices = computed(() => {
    let list = this.invoices();
    const query  = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;

    if (status !== 'ALL') list = list.filter(i => i.status === status);
    if (query) list = list.filter(i =>
      i.invoiceNumber?.toLowerCase().includes(query) ||
      i.clientName?.toLowerCase().includes(query) ||
      i.contractNumber?.toLowerCase().includes(query)
    );
    return list;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.collections.breadcrumb') }
    ]);
    this.loadOutstandingInvoices();
    this.loadAgingReport();
    this.loadCollections();
  }

  loadOutstandingInvoices() {
    this.isLoading.set(true);
    // Load invoices that are not fully paid
    this.billingApi.getInvoices({ limit: 100 }).subscribe({
      next: (res: any) => {
        const all = res.items ?? res;
        this.invoices.set(all.filter((i: Invoice) => i.status !== 'Paid' && i.status !== 'Cancelled'));
        const list = this.filteredInvoices();
        if (list.length > 0 && !this.selectedInvoice()) this.selectedInvoice.set(list[0]);
        this.isLoading.set(false);
      },
      error: () => { this.notificationService.danger('Error', 'Failed to load AR'); this.isLoading.set(false); }
    });
  }

  loadCollections() {
    this.billingApi.getCollections({ limit: 100 }).subscribe({
      next: (res: any) => this.collections.set(res.items ?? res),
      error: () => {}
    });
  }

  loadAgingReport() {
    this.billingApi.getAgingReport().subscribe({
      next: (data) => this.agingReport.set(data),
      error: () => {}
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  selectInvoice(inv: Invoice) {
    this.selectedInvoice.set(inv);
    this.loadInvoiceCollections(inv._id);
  }

  loadInvoiceCollections(invoiceId: string) {
    this.billingApi.getCollections({ invoiceId }).subscribe({
      next: (res: any) => this.collections.set(res.items ?? res),
      error: () => {}
    });
  }

  // ── Permissions ───────────────────────────────────────────────────────────
  canRegister() {
    const r = this.authService.currentUser()?.role;
    return r === 'Super Admin' || r === 'Finance Manager' || r === 'General Manager';
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openPaymentModal() {
    const inv = this.selectedInvoice();
    if (!inv) return;
    this.formModel = {
      ...this.emptyForm(),
      amount: inv.balanceDue
    };
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  // ── Save Payment ⚡ ───────────────────────────────────────────────────────
  savePayment() {
    const inv = this.selectedInvoice();
    if (!inv) return;

    const amt = Number(this.formModel.amount) || 0;
    if (amt <= 0) {
      this.notificationService.danger('Validation', 'Amount must be greater than zero');
      return;
    }
    if (amt > inv.balanceDue) {
      this.notificationService.danger('Validation', `Amount ($${amt}) exceeds balance due ($${inv.balanceDue})`);
      return;
    }

    const body: CreateCollectionBody = {
      amount:    amt,
      date:      this.formModel.date || new Date().toISOString().split('T')[0],
      method:    this.formModel.method,
      reference: this.formModel.reference,
      remarks:   this.formModel.remarks
    };

    this.isProcessing.set(true);
    this.billingApi.createPayment(inv._id, body).subscribe({
      next: ({ collection, glEntry, newBalanceDue, invoiceStatus }) => {
        this.notificationService.success(
          'Payment Recorded',
          `${collection.collectionNumber} posted. GL: ${glEntry.entryNumber}. Balance: $${newBalanceDue.toLocaleString()}`
        );
        // Update the invoice in the local list
        this.invoices.update(list => list.map(i => {
          if (i._id === inv._id) {
            return { ...i, balanceDue: newBalanceDue, totalCollected: i.totalCollected + amt, status: invoiceStatus };
          }
          return i;
        }));
        // Update selected invoice
        const updated = this.invoices().find(i => i._id === inv._id);
        if (updated) this.selectedInvoice.set(updated);

        this.collections.update(list => [collection, ...list]);
        this.isModalOpen.set(false);
        this.isProcessing.set(false);
        this.loadAgingReport(); // refresh aging
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Payment failed');
        this.isProcessing.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getBucketClass(bucket: string): string {
    if (bucket === 'Current')       return 'badge-success';
    if (bucket === '1-30 Days')     return 'badge-warning';
    if (bucket === '31-60 Days')    return 'badge-warning';
    if (bucket === '61-90 Days')    return 'badge-danger';
    if (bucket === 'Over 90 Days')  return 'badge-danger';
    return '';
  }

  private emptyForm() {
    return {
      date:      new Date().toISOString().split('T')[0],
      amount:    0,
      method:    'Wire Transfer' as const,
      reference: '',
      remarks:   ''
    };
  }
}
