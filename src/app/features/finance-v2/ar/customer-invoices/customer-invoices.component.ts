import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ArMockService } from '../../shared/ar-mock.service';
import { ArInvoice, ArInvoiceStatus, AgingBucket } from '../../shared/ar.interfaces';

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
  readonly arService          = inject(ArMockService);

  readonly searchQuery   = signal('');
  readonly statusFilter  = signal<ArInvoiceStatus | 'All'>('All');
  readonly agingFilter   = signal<AgingBucket | 'All'>('All');
  readonly sourceFilter  = signal('All');
  readonly selectedId    = signal<string | null>(null);
  readonly activeTab     = signal<'details' | 'traceability' | 'validation'>('details');
  readonly showRejectDlg = signal(false);
  readonly rejectionNote = signal('');

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
    return this.arService.customerInvoices()
      .filter(i => {
        const mq  = !q || i.invoiceNumber.toLowerCase().includes(q) ||
                    i.customerName.toLowerCase().includes(q) ||
                    i.projectCode.toLowerCase().includes(q) ||
                    i.contractNumber.toLowerCase().includes(q);
        const ms  = st  === 'All' || i.status === st;
        const ma  = ag  === 'All' || i.aging  === ag;
        const msr = src === 'All' || i.source === src;
        return mq && ms && ma && msr;
      })
      .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
  });

  readonly activeInvoice = computed(() => {
    const id = this.selectedId();
    return id ? (this.arService.customerInvoices().find(i => i.id === id) ?? null) : null;
  });

  // KPI cards
  readonly kpis = this.arService.kpis;

  readonly draftCount    = computed(() => this.arService.customerInvoices().filter(i => i.status === 'Draft').length);
  readonly reviewCount   = computed(() => this.arService.customerInvoices().filter(i => i.status === 'Under Review').length);
  readonly approvedCount = computed(() => this.arService.customerInvoices().filter(i => i.status === 'Approved').length);
  readonly overdueCount  = computed(() => {
    const now = new Date('2025-07-01');
    return this.arService.customerInvoices().filter(i => {
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
    this.updateStatus(inv.id, 'Under Review');
    this.notify.success('finance_v2.ar.inv.submitted', 'finance_v2.ar.inv.submitted_desc');
  }

  approveInvoice(inv: ArInvoice) {
    if (inv.status !== 'Under Review') return;
    this.updateStatus(inv.id, 'Approved', { approvedBy: 'Sara Al-Rasheed', approvalDate: '2025-07-01' });
    this.notify.success('finance_v2.ar.inv.approved', 'finance_v2.ar.inv.approved_desc');
  }

  sendToCustomer(inv: ArInvoice) {
    if (inv.status !== 'Approved') return;
    this.updateStatus(inv.id, 'Sent To Customer', { sentDate: '2025-07-01' });
    this.notify.info('finance_v2.ar.inv.sent', 'finance_v2.ar.inv.sent_desc');
  }

  openRejectDialog() { this.showRejectDlg.set(true); }
  closeRejectDialog() { this.showRejectDlg.set(false); this.rejectionNote.set(''); }

  rejectInvoice(inv: ArInvoice) {
    if (!this.rejectionNote().trim()) {
      this.notify.warning('finance_v2.ar.inv.reason_required', 'finance_v2.ar.inv.reason_required_msg');
      return;
    }
    this.updateStatus(inv.id, 'Rejected', { rejectionReason: this.rejectionNote() });
    this.closeRejectDialog();
    this.notify.warning('finance_v2.ar.inv.rejected', 'finance_v2.ar.inv.rejected_desc');
  }

  private updateStatus(id: string, status: ArInvoiceStatus, extra: Partial<ArInvoice> = {}) {
    this.arService.customerInvoices.update(list =>
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
  }
}
