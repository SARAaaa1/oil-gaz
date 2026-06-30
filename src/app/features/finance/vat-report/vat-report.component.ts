import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';

interface VatLine {
  ref: string;
  date: string;
  party: string;
  description: string;
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  type: 'output' | 'input';
}

@Component({
  selector: 'app-vat-report',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vat-report.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VatReportComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly financeService = inject(FinanceCoreService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly langService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  // Period filter
  readonly periodStart = signal<string>('2026-01-01');
  readonly periodEnd   = signal<string>(new Date().toISOString().split('T')[0]);
  readonly activeTab   = signal<'output' | 'input' | 'summary'>('summary');

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.vat_report' }
    ]);
  }

  // ─── OUTPUT VAT (from AR / Customer Invoices) ────────────────────────
  readonly outputVatLines = computed<VatLine[]>(() => {
    const start = this.periodStart();
    const end   = this.periodEnd();
    const lines: VatLine[] = [];

    // From supplier-facing AR (workflow invoices if exists)
    // We pull from supplierInvoices treated as "sales" — in reality AR invoices
    // Main source: journal entries with Revenue accounts
    const postedEntries = this.financeService.journalEntries()
      .filter(e => e.status === 'Posted' && e.date >= start && e.date <= end);

    for (const entry of postedEntries) {
      const revenueLines = entry.lines.filter(l => {
        const acc = this.financeService.accounts().find(a => a.code === l.accountCode);
        return acc?.type === 'Revenue' && l.credit > 0;
      });
      if (revenueLines.length > 0) {
        const netAmount = revenueLines.reduce((s, l) => s + l.credit, 0);
        const vatAmount = +(netAmount * 0.15).toFixed(2);
        lines.push({
          ref: entry.journalNumber,
          date: entry.date,
          party: entry.reference,
          description: entry.description,
          netAmount,
          vatAmount,
          vatRate: 15,
          type: 'output'
        });
      }
    }

    // Also pull from collection vouchers (AR)
    const collections = this.mockDataService.collectionVouchers();
    for (const cv of collections) {
      if (cv.collectionDate >= start && cv.collectionDate <= end && cv.status === 'Posted') {
        const net = +(cv.amount / 1.15).toFixed(2);
        const vat = +(cv.amount - net).toFixed(2);
        lines.push({
          ref: cv.voucherNumber,
          date: cv.collectionDate,
          party: cv.customerName,
          description: `Collection — ${cv.paymentMethod}`,
          netAmount: net,
          vatAmount: vat,
          vatRate: 15,
          type: 'output'
        });
      }
    }

    return lines.sort((a, b) => b.date.localeCompare(a.date));
  });

  // ─── INPUT VAT (from AP / Supplier Invoices) ─────────────────────────
  readonly inputVatLines = computed<VatLine[]>(() => {
    const start = this.periodStart();
    const end   = this.periodEnd();
    const lines: VatLine[] = [];

    const invoices = this.mockDataService.supplierInvoices();
    for (const inv of invoices) {
      if (inv.invoiceDate >= start && inv.invoiceDate <= end && inv.status !== 'Cancelled') {
        lines.push({
          ref: inv.invoiceNumber,
          date: inv.invoiceDate,
          party: inv.vendorName,
          description: inv.poNumber ? `PO: ${inv.poNumber}` : 'Supplier Invoice',
          netAmount: inv.subTotal,
          vatAmount: inv.taxAmount,
          vatRate: inv.taxAmount > 0 ? +((inv.taxAmount / inv.subTotal) * 100).toFixed(0) : 15,
          type: 'input'
        });
      }
    }

    // Also from purchase orders (committed tax)
    const pos = this.mockDataService.purchaseOrders();
    const invoicedPoIds = new Set(invoices.map(i => i.poId).filter(Boolean));
    for (const po of pos) {
      if (!invoicedPoIds.has(po.id) && po.date >= start && po.date <= end
          && (po.status === 'Issued' || po.status === 'Approved' || po.status === 'Completed')) {
        if (po.taxAmount > 0) {
          lines.push({
            ref: po.poNumber,
            date: po.date,
            party: po.vendorName,
            description: `PO — ${po.paymentTerms}`,
            netAmount: po.subtotal,
            vatAmount: po.taxAmount,
            vatRate: po.taxPercent,
            type: 'input'
          });
        }
      }
    }

    return lines.sort((a, b) => b.date.localeCompare(a.date));
  });

  // ─── SUMMARY COMPUTED ────────────────────────────────────────────────
  readonly totalOutputVat = computed(() =>
    this.outputVatLines().reduce((s, l) => s + l.vatAmount, 0)
  );
  readonly totalOutputNet = computed(() =>
    this.outputVatLines().reduce((s, l) => s + l.netAmount, 0)
  );

  readonly totalInputVat = computed(() =>
    this.inputVatLines().reduce((s, l) => s + l.vatAmount, 0)
  );
  readonly totalInputNet = computed(() =>
    this.inputVatLines().reduce((s, l) => s + l.netAmount, 0)
  );

  readonly netVatPayable = computed(() =>
    +(this.totalOutputVat() - this.totalInputVat()).toFixed(2)
  );

  readonly effectiveOutputRate = computed(() => {
    const net = this.totalOutputNet();
    return net > 0 ? +((this.totalOutputVat() / net) * 100).toFixed(1) : 0;
  });

  readonly effectiveInputRate = computed(() => {
    const net = this.totalInputNet();
    return net > 0 ? +((this.totalInputVat() / net) * 100).toFixed(1) : 0;
  });

  // ─── ACTIONS ─────────────────────────────────────────────────────────
  postVatEntry() {
    const net = this.netVatPayable();
    if (net === 0) {
      this.notificationService.danger(
        this.translate.instant('finance.vat.no_vat_title'),
        this.translate.instant('finance.vat.no_vat_desc')
      );
      return;
    }

    try {
      if (net > 0) {
        // VAT payable: Dr. VAT Receivable/Input → Cr. VAT Payable
        this.financeService.postJournalEntry({
          date: this.periodEnd(),
          reference: `VAT-${this.periodEnd().slice(0, 7)}`,
          description: `VAT Settlement — ${this.periodStart()} to ${this.periodEnd()}`,
          lines: [
            {
              id: `vl_${Date.now()}_1`,
              accountCode: '214000',
              accountName: 'VAT Payable',
              debit: 0,
              credit: net,
              description: `Net VAT Payable for period ${this.periodStart()} — ${this.periodEnd()}`
            },
            {
              id: `vl_${Date.now()}_2`,
              accountCode: '521000',
              accountName: 'General & Administrative Costs',
              debit: net,
              credit: 0,
              description: 'VAT Settlement Adjustment'
            }
          ]
        });
      } else {
        // VAT refundable: Dr. VAT Receivable
        const abs = Math.abs(net);
        this.financeService.postJournalEntry({
          date: this.periodEnd(),
          reference: `VAT-REFUND-${this.periodEnd().slice(0, 7)}`,
          description: `VAT Refund Receivable — ${this.periodStart()} to ${this.periodEnd()}`,
          lines: [
            {
              id: `vl_${Date.now()}_1`,
              accountCode: '121000',
              accountName: 'Accounts Receivable (A/R)',
              debit: abs,
              credit: 0,
              description: 'VAT Refund Receivable'
            },
            {
              id: `vl_${Date.now()}_2`,
              accountCode: '214000',
              accountName: 'VAT Payable',
              debit: 0,
              credit: abs,
              description: 'VAT Refundable from Authority'
            }
          ]
        });
      }

      this.notificationService.success(
        this.translate.instant('finance.vat.posted_title'),
        this.translate.instant('finance.vat.posted_desc', {
          amount: Math.abs(net).toFixed(2),
          type: net > 0
            ? this.translate.instant('finance.vat.payable')
            : this.translate.instant('finance.vat.refundable')
        })
      );
    } catch (e: any) {
      this.notificationService.danger(
        this.translate.instant('common.error'),
        e.message
      );
    }
  }

  printReport() {
    window.print();
  }
}
