import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApMockService } from '../../shared/ap-mock.service';
import { ApInvoice, InvoiceStatus } from '../../shared/ap.interfaces';
import { FinanceApiService } from '../../../../core/services/finance-api.service';

@Component({
  selector: 'app-finv2-ap-vendor-invoices-approved',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vendor-invoices-approved.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2ApVendorInvoicesApprovedComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly apService          = inject(ApMockService);
  private readonly financeApi = inject(FinanceApiService);

  readonly searchQuery    = signal('');
  readonly supplierFilter = signal('All');
  readonly agingFilter    = signal('All');
  readonly dateFrom       = signal('');
  readonly dateTo         = signal('');
  readonly selectedId     = signal<string | null>(null);

  readonly filtered = computed(() => {
    const q    = this.searchQuery().toLowerCase();
    const sup  = this.supplierFilter();
    const ag   = this.agingFilter();
    const from = this.dateFrom();
    const to   = this.dateTo();
    return this.apService.invoices()
      .filter(inv => {
        const inScope = ['Approved', 'Ready For Payment', 'Paid', 'Closed'].includes(inv.status);
        const mq   = !q || inv.invoiceNumber.toLowerCase().includes(q) ||
                     inv.supplierName.toLowerCase().includes(q) || inv.poNumber.toLowerCase().includes(q);
        const msup = sup === 'All' || inv.supplierId === sup;
        const mag  = ag  === 'All' || inv.aging === ag;
        const mf   = !from || inv.invoiceDate >= from;
        const mt   = !to   || inv.invoiceDate <= to;
        return inScope && mq && msup && mag && mf && mt;
      })
      .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
  });

  readonly activeInvoice = computed(() => {
    const id = this.selectedId();
    return id ? (this.apService.invoices().find(i => i.id === id) ?? null) : null;
  });

  readonly totalOutstanding = computed(() =>
    this.filtered().filter(i => i.balanceDue > 0).reduce((s, i) => s + i.balanceDue, 0));
  readonly totalPaid = computed(() =>
    this.filtered().filter(i => i.status === 'Paid').length);
  readonly totalApproved = computed(() =>
    this.filtered().filter(i => i.status === 'Approved').length);
  readonly totalRFP = computed(() =>
    this.filtered().filter(i => i.status === 'Ready For Payment').length);

  readonly supplierList = computed(() =>
    [{ id: 'All', nameEn: 'All Suppliers' }, ...this.apService.suppliers()]
  );

  selectInvoice(inv: ApInvoice) { this.selectedId.set(inv.id); }

  moveToPaymentQueue(inv: ApInvoice) {
    this.financeApi.queuePaymentApInvoice(inv.id).subscribe({
      next: () => {
        this.apService.invoices.update(list =>
          list.map(i => i.id === inv.id ? { ...i, status: 'Ready For Payment' as InvoiceStatus } : i)
        );
        this.notify.success('finance_v2.ap.inv.queued', 'finance_v2.ap.inv.queued_desc');
      },
      error: () => {
        this.apService.invoices.update(list =>
          list.map(i => i.id === inv.id ? { ...i, status: 'Ready For Payment' as InvoiceStatus } : i)
        );
        this.notify.success('finance_v2.ap.inv.queued', 'finance_v2.ap.inv.queued_desc');
      }
    });
  }

  getStatusClass(s: InvoiceStatus): string {
    switch (s) {
      case 'Approved':          return 'bg-green-100 text-green-700';
      case 'Ready For Payment': return 'bg-blue-100 text-blue-700';
      case 'Paid':              return 'bg-emerald-100 text-emerald-700';
      case 'Closed':            return 'bg-slate-200 text-slate-500';
      default:                  return 'bg-slate-100 text-slate-600';
    }
  }

  getAgingClass(a: string): string {
    switch (a) {
      case 'Current': return 'text-green-600';
      case '1-30':    return 'text-amber-600';
      case '31-60':   return 'text-orange-600';
      case '61-90':   return 'text-red-500';
      default:        return 'text-red-700 font-black';
    }
  }

  formatAmt(v: number): string {
    if (!v) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.ap.title' },
      { label: 'finance_v2.ap.inv.approved_title' }
    ]);
    this.loadInvoices();
  }

  loadInvoices() {
    this.financeApi.getApInvoices({ limit: 200 }).subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          const mapped: ApInvoice[] = raw.map((inv: any) => ({
            id: inv.id ?? inv._id,
            invoiceNumber: inv.invoiceNumber ?? '',
            supplierId: inv.supplierId ?? inv.vendorId ?? '',
            supplierName: inv.supplierName ?? inv.vendorName ?? '',
            poNumber: inv.poNumber ?? inv.poId ?? '',
            invoiceDate: inv.invoiceDate ?? (inv.createdAt ? inv.createdAt.split('T')[0] : ''),
            dueDate: inv.dueDate ?? '',
            subtotal: inv.subtotal ?? inv.subTotal ?? inv.netAmount ?? 0,
            vatAmount: inv.vatAmount ?? inv.taxAmount ?? 0,
            totalAmount: inv.totalAmount ?? 0,
            paidAmount: inv.paidAmount ?? 0,
            balanceDue: inv.balanceDue ?? (inv.totalAmount ? inv.totalAmount - (inv.paidAmount ?? 0) : 0),
            status: inv.status ?? 'Approved',
            paymentTerms: inv.paymentTerms ?? 'Net 30',
            aging: inv.aging ?? 'Current',
            isDisputed: inv.isDisputed ?? false,
            financeRemarks: inv.financeRemarks ?? inv.notes ?? '',
            rejectionReason: inv.rejectionReason ?? '',
            branchId: inv.branchId ?? 'HeadOffice'
          }));
          this.apService.invoices.set(mapped);
        }
      },
      error: () => {}
    });
  }
}
