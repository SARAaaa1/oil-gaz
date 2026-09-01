import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LanguageService } from '../../../../core/services/language.service';
import { FinanceApiService } from '../../../../core/services/finance-api.service';
import { ApInvoice, InvoiceStatus } from '../../shared/ap.interfaces';
import { BranchService } from '../../shared/branch.service';

@Component({
  selector: 'app-finv2-ap-vendor-invoices-draft',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vendor-invoices-draft.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2ApVendorInvoicesDraftComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly lang               = inject(LanguageService);
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);

  // ── UI State ──────────────────────────────────────────────────────
  readonly searchQuery    = signal('');
  readonly statusFilter   = signal<InvoiceStatus | 'All'>('All');
  readonly supplierFilter = signal('All');
  readonly branchFilter   = signal('All');
  readonly dateFrom       = signal('');
  readonly dateTo         = signal('');
  readonly selectedId     = signal<string | null>(null);
  readonly showViewModal  = signal(false);
  readonly showRejectModal = signal(false);
  readonly showRemarksPanel = signal(false);

  readonly invoices = signal<any[]>([]);
  readonly suppliers = signal<any[]>([]);
  readonly kpiData = signal<any>(null);
  readonly isLoading = signal(false);

  financeRemarks  = '';
  rejectionReason = '';

  // Draft-specific statuses
  readonly draftStatuses: InvoiceStatus[] = ['Draft', 'Under Review', 'Approved', 'Rejected'];

  // ── Filtered list (Draft + Under Review + Approved + Rejected) ─────
  readonly filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const st  = this.statusFilter();
    const sup = this.supplierFilter();
    const br  = this.branchFilter();
    const from = this.dateFrom();
    const to   = this.dateTo();
    return this.invoices()
      .filter(inv => {
        const inScope = ['Draft', 'Under Review', 'Approved', 'Rejected'].includes(inv.status);
        const mq   = !q || inv.invoiceNumber.toLowerCase().includes(q) ||
                     inv.supplierName.toLowerCase().includes(q) ||
                     inv.poNumber.toLowerCase().includes(q);
        const ms   = st  === 'All' || inv.status === st;
        const msup = sup === 'All' || inv.supplierId === sup;
        const mbr  = br  === 'All' || (inv.branchId || 'HeadOffice') === br;
        const mfrom = !from || inv.invoiceDate >= from;
        const mto   = !to   || inv.invoiceDate <= to;
        return inScope && mq && ms && msup && mbr && mfrom && mto;
      })
      .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
  });

  readonly activeInvoice = computed(() => {
    const id = this.selectedId();
    return id ? (this.invoices().find(i => i.id === id) ?? null) : null;
  });

  // Stats
  readonly countDraft      = computed(() => this.invoices().filter(i => i.status === 'Draft').length);
  readonly countReview     = computed(() => this.invoices().filter(i => i.status === 'Under Review').length);
  readonly countApproved   = computed(() => this.invoices().filter(i => i.status === 'Approved').length);
  readonly countRejected   = computed(() => this.invoices().filter(i => i.status === 'Rejected').length);

  readonly supplierList = computed(() =>
    [{ id: 'All', nameEn: 'All Suppliers' }, ...this.suppliers()]
  );

  // ── Actions ───────────────────────────────────────────────────────
  selectInvoice(inv: ApInvoice) {
    this.selectedId.set(inv.id);
    this.financeRemarks = inv.financeRemarks;
  }

  submitForReview(inv: ApInvoice) {
    this.financeApi.submitApInvoice(inv.id).subscribe({
      next: () => {
        this.updateStatus(inv, 'Under Review');
        this.notify.success('finance_v2.ap.inv.submitted', 'finance_v2.ap.inv.submitted_desc');
      },
      error: () => {
        this.updateStatus(inv, 'Under Review');
        this.notify.success('finance_v2.ap.inv.submitted', 'finance_v2.ap.inv.submitted_desc');
      }
    });
  }

  approveInvoice(inv: ApInvoice) {
    this.financeApi.approveApInvoice(inv.id).subscribe({
      next: () => {
        this.invoices.update(list =>
          list.map(i => i.id === inv.id ? {
            ...i, status: 'Approved' as InvoiceStatus,
            approvedBy: 'Sara Al-Rasheed', approvalDate: new Date().toISOString().split('T')[0]
          } : i)
        );
        this.notify.success('finance_v2.ap.inv.approved', 'finance_v2.ap.inv.approved_desc');
      },
      error: () => {
        this.invoices.update(list =>
          list.map(i => i.id === inv.id ? {
            ...i, status: 'Approved' as InvoiceStatus,
            approvedBy: 'Sara Al-Rasheed', approvalDate: new Date().toISOString().split('T')[0]
          } : i)
        );
        this.notify.success('finance_v2.ap.inv.approved', 'finance_v2.ap.inv.approved_desc');
      }
    });
  }

  sendToPaymentQueue(inv: ApInvoice) {
    this.financeApi.queuePaymentApInvoice(inv.id).subscribe({
      next: () => {
        this.invoices.update(list =>
          list.map(i => i.id === inv.id ? { ...i, status: 'Ready For Payment' as InvoiceStatus } : i)
        );
        this.notify.success('finance_v2.ap.inv.queued', 'finance_v2.ap.inv.queued_desc');
      },
      error: () => {
        this.invoices.update(list =>
          list.map(i => i.id === inv.id ? { ...i, status: 'Ready For Payment' as InvoiceStatus } : i)
        );
        this.notify.success('finance_v2.ap.inv.queued', 'finance_v2.ap.inv.queued_desc');
      }
    });
  }

  rejectInvoice(inv: ApInvoice) {
    if (!this.rejectionReason.trim()) {
      this.notify.warning('finance_v2.ap.inv.reason_required', 'finance_v2.ap.inv.reason_required_msg');
      return;
    }
    this.financeApi.rejectApInvoice(inv.id, this.rejectionReason).subscribe({
      next: () => {
        this.invoices.update(list =>
          list.map(i => i.id === inv.id ? {
            ...i, status: 'Rejected' as InvoiceStatus, rejectionReason: this.rejectionReason
          } : i)
        );
        this.showRejectModal.set(false);
        this.rejectionReason = '';
        this.notify.warning('finance_v2.ap.inv.rejected', 'finance_v2.ap.inv.rejected_desc');
      },
      error: () => {
        this.invoices.update(list =>
          list.map(i => i.id === inv.id ? {
            ...i, status: 'Rejected' as InvoiceStatus, rejectionReason: this.rejectionReason
          } : i)
        );
        this.showRejectModal.set(false);
        this.rejectionReason = '';
        this.notify.warning('finance_v2.ap.inv.rejected', 'finance_v2.ap.inv.rejected_desc');
      }
    });
  }

  returnToProcurement(inv: ApInvoice) {
    this.updateStatus(inv, 'Draft');
    this.notify.info('finance_v2.ap.inv.returned', 'finance_v2.ap.inv.returned_desc');
  }

  saveFinanceRemarks(inv: ApInvoice) {
    this.invoices.update(list =>
      list.map(i => i.id === inv.id ? { ...i, financeRemarks: this.financeRemarks } : i)
    );
    this.notify.success('finance_v2.common.saved', 'finance_v2.ap.inv.remarks_saved');
  }

  private updateStatus(inv: ApInvoice, status: InvoiceStatus) {
    this.invoices.update(list =>
      list.map(i => i.id === inv.id ? { ...i, status } : i)
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getStatusClass(s: InvoiceStatus): string {
    switch (s) {
      case 'Draft':             return 'bg-slate-100 text-slate-600';
      case 'Under Review':      return 'bg-amber-100 text-amber-700';
      case 'Approved':          return 'bg-green-100 text-green-700';
      case 'Ready For Payment': return 'bg-blue-100 text-blue-700';
      case 'Paid':              return 'bg-emerald-100 text-emerald-700';
      case 'Closed':            return 'bg-slate-200 text-slate-500';
      case 'Rejected':          return 'bg-red-100 text-red-700';
    }
  }

  hasValidationIssue(inv: ApInvoice): boolean {
    const v = inv.validation;
    return v.missingPO || v.missingGRN || v.amountExceedsPO ||
           v.qtyExceedsReceived || v.duplicateNumber || v.vatMismatch;
  }

  formatAmt(v: number): string {
    if (!v) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
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

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.ap.title' },
      { label: 'finance_v2.ap.inv.draft_title' }
    ]);
    this.loadInvoices();
  }

  loadInvoices() {
    this.isLoading.set(true);
    this.financeApi.getApInvoices({ limit: 200 }).subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          const mapped = raw.map((inv: any) => ({
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
            balanceDue: inv.balanceDue ?? 0,
            status: inv.status ?? 'Draft',
            branchId: inv.branchId ?? 'HeadOffice',
            currency: inv.currency ?? 'SAR',
            aging: inv.aging ?? 'Current',
            financeRemarks: inv.financeRemarks ?? inv.notes ?? '',
            rejectionReason: inv.rejectionReason ?? ''
          }));
          this.invoices.set(mapped);
        }
        if (res?.kpis) {
          this.kpiData.set(res.kpis);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
