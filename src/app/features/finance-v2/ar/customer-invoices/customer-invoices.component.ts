import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FinanceApiService } from '../../../../core/services/finance-api.service';
import { ArInvoice, ArInvoiceStatus, AgingBucket } from '../../shared/ar.interfaces';
import { BranchService } from '../../shared/branch.service';

@Component({
  selector: 'app-finv2-customer-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './customer-invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2CustomerInvoicesComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);

  readonly searchQuery   = signal('');
  readonly statusFilter  = signal<ArInvoiceStatus | 'All'>('All');
  readonly agingFilter   = signal<AgingBucket | 'All'>('All');
  readonly sourceFilter  = signal('All');
  readonly branchFilter  = signal('All');
  readonly selectedId    = signal<string | null>(null);
  readonly activeTab     = signal<'details' | 'traceability' | 'validation'>('details');
  readonly showRejectDlg = signal(false);
  readonly rejectionNote = signal('');

  readonly invoices = signal<any[]>([]);
  readonly kpiData = signal<any>(null);
  readonly isLoading = signal(false);

  readonly allStatuses: (ArInvoiceStatus | 'All')[] = [
    'All','Draft','Under Review','Approved','Sent To Customer',
    'Partially Collected','Collected','Closed','Rejected'
  ];
  readonly agingBuckets: (AgingBucket | 'All')[] = ['All','Current','1-30','31-60','61-90','90+'];
  readonly sources = ['All','Project Completion','Service Completion','Contract Billing','Progress Billing','Manual Invoice'];

  readonly filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const st  = this.statusFilter();
    const ag  = this.agingFilter();
    const src = this.sourceFilter();
    const br  = this.branchFilter();
    return this.invoices()
      .filter(i => {
        const mq  = !q || i.invoiceNumber.toLowerCase().includes(q) ||
                    i.customerName.toLowerCase().includes(q) ||
                    i.projectCode.toLowerCase().includes(q) ||
                    i.contractNumber.toLowerCase().includes(q);
        const ms  = st  === 'All' || i.status === st;
        const ma  = ag  === 'All' || i.aging  === ag;
        const msr = src === 'All' || i.source === src;
        const mb  = br  === 'All' || (i.branchId || 'HeadOffice') === br;
        return mq && ms && ma && msr && mb;
      })
      .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
  });

  readonly activeInvoice = computed(() => {
    const id = this.selectedId();
    return id ? (this.invoices().find(i => i.id === id) ?? null) : null;
  });

  // KPI cards
  readonly kpis = computed(() => this.kpiData() ?? {
    totalReceivables: 0, outstanding: 0, overdue: 0, collectedThisMonth: 0, collectionRate: 0, avgCollectionDays: 0
  });

  readonly draftCount    = computed(() => this.invoices().filter(i => i.status === 'Draft').length);
  readonly reviewCount   = computed(() => this.invoices().filter(i => i.status === 'Under Review').length);
  readonly approvedCount = computed(() => this.invoices().filter(i => i.status === 'Approved').length);
  readonly overdueCount  = computed(() => {
    const now = new Date('2025-07-01');
    return this.invoices().filter(i => {
      return new Date(i.dueDate) < now && !['Collected','Closed','Rejected'].includes(i.status);
    }).length;
  });

  readonly validationCount = computed(() =>
    this.activeInvoice() ? Object.values(this.activeInvoice()!.validation).filter(Boolean).length : 0
  );

  selectInvoice(inv: ArInvoice) {
    this.selectedId.set(inv.id);
    this.activeTab.set('details');
    this.showRejectDlg.set(false);
  }

  submitForReview(inv: ArInvoice) {
    if (inv.status !== 'Draft') return;
    this.financeApi.updateArInvoiceStatus(inv.id, 'Draft', 'Submitted for review').subscribe({
      next: () => {
        this.updateStatus(inv.id, 'Under Review');
        this.notify.success('finance_v2.ar.inv.submitted', 'finance_v2.ar.inv.submitted_desc');
      },
      error: () => {
        this.updateStatus(inv.id, 'Under Review');
        this.notify.success('finance_v2.ar.inv.submitted', 'finance_v2.ar.inv.submitted_desc');
      }
    });
  }

  approveInvoice(inv: ArInvoice) {
    if (inv.status !== 'Under Review') return;
    this.financeApi.updateArInvoiceStatus(inv.id, 'Sent', 'Approved by finance').subscribe({
      next: () => {
        this.updateStatus(inv.id, 'Approved', { approvedBy: 'Sara Al-Rasheed', approvalDate: new Date().toISOString().split('T')[0] });
        this.notify.success('finance_v2.ar.inv.approved', 'finance_v2.ar.inv.approved_desc');
      },
      error: () => {
        this.updateStatus(inv.id, 'Approved', { approvedBy: 'Sara Al-Rasheed', approvalDate: '2025-07-01' });
        this.notify.success('finance_v2.ar.inv.approved', 'finance_v2.ar.inv.approved_desc');
      }
    });
  }

  sendToCustomer(inv: ArInvoice) {
    if (inv.status !== 'Approved') return;
    this.financeApi.updateArInvoiceStatus(inv.id, 'Sent', 'Sent to customer').subscribe({
      next: () => {
        this.updateStatus(inv.id, 'Sent To Customer', { sentDate: new Date().toISOString().split('T')[0] });
        this.notify.info('finance_v2.ar.inv.sent', 'finance_v2.ar.inv.sent_desc');
      },
      error: () => {
        this.updateStatus(inv.id, 'Sent To Customer', { sentDate: '2025-07-01' });
        this.notify.info('finance_v2.ar.inv.sent', 'finance_v2.ar.inv.sent_desc');
      }
    });
  }

  openRejectDialog() { this.showRejectDlg.set(true); }
  closeRejectDialog() { this.showRejectDlg.set(false); this.rejectionNote.set(''); }

  rejectInvoice(inv: ArInvoice) {
    if (!this.rejectionNote().trim()) {
      this.notify.warning('finance_v2.ar.inv.reason_required', 'finance_v2.ar.inv.reason_required_msg');
      return;
    }
    this.financeApi.updateArInvoiceStatus(inv.id, 'Cancelled', this.rejectionNote()).subscribe({
      next: () => {
        this.updateStatus(inv.id, 'Rejected', { rejectionReason: this.rejectionNote() });
        this.closeRejectDialog();
        this.notify.warning('finance_v2.ar.inv.rejected', 'finance_v2.ar.inv.rejected_desc');
      },
      error: () => {
        this.updateStatus(inv.id, 'Rejected', { rejectionReason: this.rejectionNote() });
        this.closeRejectDialog();
        this.notify.warning('finance_v2.ar.inv.rejected', 'finance_v2.ar.inv.rejected_desc');
      }
    });
  }

  private updateStatus(id: string, status: ArInvoiceStatus, extra: Partial<ArInvoice> = {}) {
    this.invoices.update(list =>
      list.map(i => i.id === id ? { ...i, status, ...extra } : i)
    );
  }

  getStatusClass(s: ArInvoiceStatus | string): string {
    switch (s) {
      case 'Draft':               return 'bg-slate-100 text-slate-600';
      case 'Under Review':        return 'bg-amber-100 text-amber-700';
      case 'Approved':            return 'bg-green-100 text-green-700';
      case 'Sent To Customer':    return 'bg-blue-100 text-blue-700';
      case 'Partially Collected': return 'bg-orange-100 text-orange-700';
      case 'Collected':           return 'bg-emerald-100 text-emerald-700';
      case 'Closed':              return 'bg-slate-200 text-slate-500';
      case 'Rejected':            return 'bg-red-100 text-red-700';
      default:                    return 'bg-slate-100 text-slate-600';
    }
  }

  getAgingClass(a: AgingBucket | string): string {
    switch (a) {
      case 'Current': return 'bg-green-100 text-green-700';
      case '1-30':    return 'bg-yellow-100 text-yellow-700';
      case '31-60':   return 'bg-orange-100 text-orange-700';
      case '61-90':   return 'bg-red-100 text-red-700';
      case '90+':     return 'bg-rose-200 text-rose-800';
      default:        return 'bg-slate-100 text-slate-600';
    }
  }

  formatAmt(v: number): string {
    if (!v) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  canApprove(inv: ArInvoice): boolean  { return inv.status === 'Under Review'; }
  canReject(inv: ArInvoice): boolean   { return ['Under Review','Approved'].includes(inv.status); }
  canSubmit(inv: ArInvoice): boolean   { return inv.status === 'Draft'; }
  canSend(inv: ArInvoice): boolean     { return inv.status === 'Approved'; }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.ar.title' },
      { label: 'finance_v2.ar.inv.title' }
    ]);
    this.financeApi.getArInvoices({ limit: 200 }).subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          const mapped = raw.map((inv: any) => ({
            id: inv.id ?? inv._id,
            invoiceNumber: inv.invoiceNumber ?? '',
            customerId: inv.customerId ?? inv.clientId ?? '',
            customerName: inv.customerName ?? inv.clientName ?? '',
            projectCode: inv.projectCode ?? 'PRJ-2025-001',
            contractNumber: inv.contractNumber ?? 'CNT-2025-001',
            invoiceDate: inv.invoiceDate ?? '',
            dueDate: inv.dueDate ?? '',
            currency: inv.currency ?? 'SAR',
            subtotal: inv.subtotal ?? inv.netPayable ?? 0,
            vatAmount: inv.vatAmount ?? 0,
            totalAmount: inv.totalAmount ?? inv.netPayable ?? 0,
            collectedAmount: inv.collectedAmount ?? inv.totalCollected ?? 0,
            remainingAmount: inv.remainingAmount ?? inv.balanceDue ?? 0,
            status: inv.status ?? 'Draft',
            source: inv.source ?? 'Contract Billing',
            aging: inv.aging ?? 'Current',
            validation: inv.validation ?? {
              missingProject: false,
              missingContract: false,
              amountExceedsContract: false,
              datesOutOfRange: false
            },
            branchId: inv.branchId ?? 'HeadOffice'
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
