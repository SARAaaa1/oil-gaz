import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FinanceApiService } from '../../../core/services/finance-api.service';
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
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);

  readonly vatSummary = signal<any>(null);
  readonly outputLines = signal<any[]>([]);
  readonly inputLines = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly isSettling = signal(false);

  readonly periodStart = signal(new Date().getFullYear() + '-01-01');
  readonly periodEnd = signal(new Date().toISOString().split('T')[0]);

  readonly searchQuery  = signal('');
  readonly statusFilter = signal<VatReturnStatus | 'All'>('All');
  readonly branchFilter = signal('All');
  readonly selectedId   = signal<string | null>(null);

  // Active tab inside return details
  readonly activeTab = signal<'transactions' | 'settlement'>('transactions');

  // Settlement Preview dialog
  readonly showSettlementDlg = signal(false);

  readonly filtered = computed(() => {
    // Returns list from outputLines + inputLines combined as "returns" for the table
    // When backend sends proper VatReturn[] use that; for now expose lines as return items
    const q  = this.searchQuery().toLowerCase();
    const st = this.statusFilter();
    const br = this.branchFilter();
    const summary = this.vatSummary();
    if (!summary) return [] as any[];
    // Wrap the single summary into a list for the @for loop
    const list: any[] = [summary];
    return list.filter(r => {
      const mq = !q || (r.returnNumber ?? r.id ?? '').toLowerCase().includes(q);
      const ms = st === 'All' || r.status === st;
      const mb = br === 'All' || (r.branchId || 'HeadOffice') === br;
      return mq && ms && mb;
    });
  });

  readonly activeReturn = computed(() => {
    return this.vatSummary();
  });

  // Calculate return details dynamically for preview / display
  readonly activeReturnKpis = computed(() => {
    const r = this.activeReturn();
    if (!r) return null;
    const sales     = r.transactions.filter((t: any) => t.type === 'Output').reduce((s: any, t: any) => s + t.taxableAmount, 0);
    const purchases = r.transactions.filter((t: any) => t.type === 'Input').reduce((s: any, t: any) => s + t.taxableAmount, 0);
    const output    = r.transactions.filter((t: any) => t.type === 'Output').reduce((s: any, t: any) => s + t.vatAmount, 0);
    const input     = r.transactions.filter((t: any) => t.type === 'Input').reduce((s: any, t: any) => s + t.vatAmount, 0);
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
    r.transactions.forEach((t: any) => {
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

  readonly kpis = computed(() => {
    const summary = this.vatSummary();
    const out = this.outputLines();
    const inp = this.inputLines();
    const totalSales     = out.reduce((s: number, l: any) => s + (l.taxableAmount ?? 0), 0);
    const totalPurchases = inp.reduce((s: number, l: any) => s + (l.taxableAmount ?? 0), 0);
    const vatOutput      = out.reduce((s: number, l: any) => s + (l.vatAmount ?? 0), 0);
    const vatInput       = inp.reduce((s: number, l: any) => s + (l.vatAmount ?? 0), 0);
    return {
      totalReturns: summary ? 1 : 0,
      payable:       summary?.netVatPayable ?? (vatOutput - vatInput),
      receivable:    vatInput > vatOutput ? vatInput - vatOutput : 0,
      totalSales,
      totalPurchases,
      vatOutput,
      vatInput
    };
  });

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
    this.isSettling.set(true);
    this.financeApi.postVatSettlement({ periodStart: this.periodStart(), periodEnd: this.periodEnd() }).subscribe({
      next: res => {
        this.notify.success('تم ترحيل التسوية', 'صافي الضريبة: ' + res.netVatPayable);
        this.isSettling.set(false);
        this.loadVatReport();
        this.closeSettlementDialog();
      },
      error: () => this.isSettling.set(false)
    });
  }

  private updateStatus(id: string, status: VatReturnStatus, extra: Partial<VatReturn> = {}) {
    // Mock local update disabled for api
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
    this.loadVatReport();
  }

  loadVatReport() {
    this.isLoading.set(true);
    this.financeApi.getVatReport(this.periodStart(), this.periodEnd()).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res;
        if (payload?.summary)     this.vatSummary.set(payload.summary);
        if (payload?.outputLines) this.outputLines.set(payload.outputLines);
        if (payload?.inputLines)  this.inputLines.set(payload.inputLines);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
