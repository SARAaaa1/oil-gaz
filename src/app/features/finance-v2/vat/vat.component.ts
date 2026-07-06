import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { VatMockService } from '../shared/vat-mock.service';
import { VatReturn, VatTransaction, VatReturnStatus, VatType } from '../shared/vat.interfaces';
import { BranchService } from '../shared/branch.service';

@Component({
  selector: 'app-finv2-vat',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2VatComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly vatService         = inject(VatMockService);
  readonly branchService      = inject(BranchService);

  readonly searchQuery  = signal('');
  readonly statusFilter = signal<VatReturnStatus | 'All'>('All');
  readonly branchFilter = signal('All');
  readonly selectedId   = signal<string | null>(null);

  // Active tab inside return details
  readonly activeTab = signal<'transactions' | 'settlement'>('transactions');

  // Settlement Preview dialog
  readonly showSettlementDlg = signal(false);

  readonly filtered = computed(() => {
    const q  = this.searchQuery().toLowerCase();
    const st = this.statusFilter();
    const br = this.branchFilter();
    return this.vatService.vatReturns()
      .filter(r => {
        const mq = !q || r.vatReturnNumber.toLowerCase().includes(q) ||
                   r.taxPeriod.toLowerCase().includes(q);
        const ms = st === 'All' || r.status === st;
        const mb = br === 'All' || (r.branchId || 'HeadOffice') === br;
        return mq && ms && mb;
      })
      .sort((a, b) => b.vatReturnNumber.localeCompare(a.vatReturnNumber));
  });

  readonly activeReturn = computed(() => {
    const id = this.selectedId();
    return id ? (this.vatService.vatReturns().find(r => r.id === id) ?? null) : null;
  });

  // Calculate return details dynamically for preview / display
  readonly activeReturnKpis = computed(() => {
    const r = this.activeReturn();
    if (!r) return null;
    const sales     = r.transactions.filter(t => t.type === 'Output').reduce((s, t) => s + t.taxableAmount, 0);
    const purchases = r.transactions.filter(t => t.type === 'Input').reduce((s, t) => s + t.taxableAmount, 0);
    const output    = r.transactions.filter(t => t.type === 'Output').reduce((s, t) => s + t.vatAmount, 0);
    const input     = r.transactions.filter(t => t.type === 'Input').reduce((s, t) => s + t.vatAmount, 0);
    const net       = output - input;

    return {
      sales,
      purchases,
      output,
      input,
      net,
      isPayable: net >= 0
    };
  });

  // Warnings / Validation Engine
  readonly warnings = computed(() => {
    const r = this.activeReturn();
    if (!r) return [];
    const list: string[] = [];

    // Trigger warning on negative taxable amounts or mismatch VAT calculations
    r.transactions.forEach(t => {
      if (t.taxableAmount < 0 && t.documentNumber.startsWith('INV')) {
        list.push(`finance_v2.vat.alerts.negative_amount||${t.documentNumber}`);
      }
      const expected = Math.round(t.taxableAmount * (t.vatPct / 100));
      const actual   = Math.round(t.vatAmount);
      if (Math.abs(expected - actual) > 5) {
        list.push(`finance_v2.vat.alerts.vat_mismatch||${t.documentNumber}`);
      }
    });

    if (r.status === 'Draft') {
      list.push('finance_v2.vat.alerts.unsubmitted_return');
    }

    return list;
  });

  // KPIs
  readonly kpis = this.vatService.kpis;

  selectReturn(r: VatReturn) {
    this.selectedId.set(r.id);
    this.activeTab.set('transactions');
  }

  // Workflows
  calculateVat(r: VatReturn) {
    if (r.status !== 'Draft') return;
    this.updateStatus(r.id, 'Calculated');
    this.notify.success('finance_v2.vat.msg.calculated', 'finance_v2.vat.msg.calculated_desc');
  }

  reviewVat(r: VatReturn) {
    if (r.status !== 'Calculated') return;
    this.updateStatus(r.id, 'Reviewed', { reviewedBy: 'Faisal Al-Qahtani' });
    this.notify.success('finance_v2.vat.msg.reviewed', 'finance_v2.vat.msg.reviewed_desc');
  }

  approveVat(r: VatReturn) {
    if (r.status !== 'Reviewed') return;
    this.updateStatus(r.id, 'Approved', { approvedBy: 'Abdullah Al-Harbi' });
    this.notify.success('finance_v2.vat.msg.approved', 'finance_v2.vat.msg.approved_desc');
  }

  submitVat(r: VatReturn) {
    if (r.status !== 'Approved') return;
    this.updateStatus(r.id, 'Submitted', { submissionDate: '2025-07-02' });
    this.notify.success('finance_v2.vat.msg.submitted', 'finance_v2.vat.msg.submitted_desc');
  }

  openSettlementDialog() {
    this.showSettlementDlg.set(true);
  }

  closeSettlementDialog() {
    this.showSettlementDlg.set(false);
  }

  postSettlement() {
    const r = this.activeReturn();
    if (!r || r.status !== 'Submitted') return;

    // Update return status to Settled
    this.updateStatus(r.id, 'Settled', { settlementDate: '2025-07-02' });

    // Update return transactions status to Settled
    const updatedTx = r.transactions.map(t => ({ ...t, status: 'Settled' as const }));
    this.vatService.vatReturns.update(list =>
      list.map(item => item.id === r.id ? { ...item, transactions: updatedTx } : item)
    );

    // Update global transactions ledger
    this.vatService.transactions.update(list =>
      list.map(t => {
        const match = r.transactions.find(rt => rt.id === t.id);
        return match ? { ...t, status: 'Settled' as const } : t;
      })
    );

    this.closeSettlementDialog();
    this.notify.success('finance_v2.vat.msg.settled', 'finance_v2.vat.msg.settled_desc');
  }

  private updateStatus(id: string, status: VatReturnStatus, extra: Partial<VatReturn> = {}) {
    this.vatService.vatReturns.update(list =>
      list.map(r => r.id === id ? { ...r, status, ...extra } : r)
    );
  }

  // Helpers
  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  getStatusClass(s: VatReturnStatus): string {
    switch (s) {
      case 'Draft':      return 'bg-slate-100 text-slate-600';
      case 'Calculated': return 'bg-amber-100 text-amber-700';
      case 'Reviewed':   return 'bg-blue-100 text-blue-700';
      case 'Approved':   return 'bg-teal-100 text-teal-700';
      case 'Submitted':  return 'bg-indigo-100 text-indigo-700';
      case 'Settled':    return 'bg-green-100 text-green-700';
      case 'Closed':     return 'bg-slate-200 text-slate-500';
      default:           return 'bg-slate-100 text-slate-500';
    }
  }

  getAlertTranslate(alert: string): string {
    const parts = alert.split('||');
    return parts[0];
  }

  getAlertItem(alert: string): string {
    const parts = alert.split('||');
    return parts[1] || '';
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.vat.title' }
    ]);
  }
}
