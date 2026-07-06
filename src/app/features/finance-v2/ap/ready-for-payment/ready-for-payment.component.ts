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

@Component({
  selector: 'app-finv2-ap-ready-for-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './ready-for-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2ApReadyForPaymentComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly apService          = inject(ApMockService);

  readonly searchQuery  = signal('');
  readonly branchFilter = signal('All');
  readonly selectedIds  = signal<Set<string>>(new Set());

  readonly rfpInvoices = computed(() =>
    this.apService.invoices()
      .filter(i => i.status === 'Ready For Payment')
      .filter(i => {
        const br = this.branchFilter();
        return br === 'All' || i.branchId === br;
      })
      .filter(i => {
        const q = this.searchQuery().toLowerCase();
        return !q || i.invoiceNumber.toLowerCase().includes(q) ||
               i.supplierName.toLowerCase().includes(q);
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  );

  readonly overdueCount   = computed(() => this.rfpInvoices().filter(i => i.aging !== 'Current').length);
  readonly dueTodayAmt    = computed(() => this.rfpInvoices().filter(i => i.dueDate === '2025-07-01').reduce((s,i) => s+i.balanceDue, 0));
  readonly totalDue       = computed(() => this.rfpInvoices().reduce((s, i) => s + i.balanceDue, 0));
  readonly selectedTotal  = computed(() =>
    this.rfpInvoices().filter(i => this.selectedIds().has(i.id)).reduce((s,i) => s+i.balanceDue, 0)
  );

  toggleSelect(inv: ApInvoice) {
    const set = new Set(this.selectedIds());
    if (set.has(inv.id)) set.delete(inv.id);
    else set.add(inv.id);
    this.selectedIds.set(set);
  }

  selectAll() {
    this.selectedIds.set(new Set(this.rfpInvoices().map(i => i.id)));
  }
  clearAll() { this.selectedIds.set(new Set()); }

  approvePaymentBatch() {
    if (this.selectedIds().size === 0) {
      this.notify.warning('finance_v2.ap.rfp.no_selection', 'finance_v2.ap.rfp.no_selection_desc');
      return;
    }
    const ids = new Set(this.selectedIds());
    this.apService.invoices.update(list =>
      list.map(i => ids.has(i.id) ? { ...i, status: 'Paid' as InvoiceStatus, paidAmount: i.grandTotal, balanceDue: 0 } : i)
    );
    this.selectedIds.set(new Set());
    this.notify.success('finance_v2.ap.rfp.batch_approved', 'finance_v2.ap.rfp.batch_approved_desc');
  }

  getAgingClass(a: string): string {
    switch (a) {
      case 'Current': return 'bg-green-50 text-green-600';
      case '1-30':    return 'bg-amber-50 text-amber-600';
      case '31-60':   return 'bg-orange-50 text-orange-600';
      case '61-90':   return 'bg-red-50 text-red-500';
      default:        return 'bg-red-100 text-red-700';
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
      { label: 'finance_v2.ap.rfp.title' }
    ]);
  }
}
