import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { ChartOfAccount, JournalEntry, JournalLine } from '../../../shared/interfaces/finance.interface';

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
  private readonly financeApi = inject(FinanceApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly langService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  // Period filter
  readonly periodStart = signal<string>('2026-01-01');
  readonly periodEnd   = signal<string>(new Date().toISOString().split('T')[0]);
  readonly activeTab   = signal<'output' | 'input' | 'summary'>('summary');

  // API-fetched data signals
  readonly apiOutputLines = signal<any[]>([]);
  readonly apiInputLines  = signal<any[]>([]);
  readonly apiSummary     = signal<any>(null);
  readonly isLoading      = signal(false);
  readonly isSettling     = signal(false);
  readonly useApiData     = signal(false);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.vat_report' }
    ]);
    this.loadVatReport();
  }

  loadVatReport() {
    this.isLoading.set(true);
    this.financeApi.getVatReport(this.periodStart(), this.periodEnd()).subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        if (data && (data.outputLines || data.inputLines)) {
          this.apiOutputLines.set(data.outputLines ?? []);
          this.apiInputLines.set(data.inputLines ?? []);
          this.apiSummary.set(data.summary ?? null);
          this.useApiData.set(true);
        }
        this.isLoading.set(false);
      },
      error: () => {
        // Fallback to local computation
        this.useApiData.set(false);
        this.isLoading.set(false);
      }
    });
  }

  // ─── OUTPUT VAT (from API or local fallback) ──────────────────────────
  readonly outputVatLines = computed<any[]>(() => {
    if (this.useApiData()) return this.apiOutputLines();

    // Local fallback: derive from GL journal entries
    const start = this.periodStart();
    const end   = this.periodEnd();
    const lines: any[] = [];

    const postedEntries: JournalEntry[] = this.financeService.journalEntries()
      .filter((e: JournalEntry) => e.status === 'Posted' && e.date >= start && e.date <= end);

    for (const entry of postedEntries) {
      const revenueLines = entry.lines.filter((l: JournalLine) => {
        const acc = this.financeService.accounts().find((a: ChartOfAccount) => a.code === l.accountCode);
        return acc?.type === 'Revenue' && l.credit > 0;
      });
      if (revenueLines.length > 0) {
        const netAmount = revenueLines.reduce((s: number, l: JournalLine) => s + l.credit, 0);
        const vatAmount = +(netAmount * 0.15).toFixed(2);
        lines.push({ ref: entry.journalNumber, date: entry.date, party: entry.reference || '', description: entry.description, netAmount, vatAmount, vatRate: 15, type: 'output' });
      }
    }
    return lines.sort((a, b) => b.date.localeCompare(a.date));
  });

  // ─── INPUT VAT (from API or local fallback) ─────────────────────────
  readonly inputVatLines = computed<any[]>(() => {
    if (this.useApiData()) return this.apiInputLines();

    // Local fallback: derive from AP supplier invoices
    const start = this.periodStart();
    const end   = this.periodEnd();
    const lines: any[] = [];
    const invoices = this.mockDataService.supplierInvoices();
    for (const inv of invoices) {
      if (inv.invoiceDate >= start && inv.invoiceDate <= end && inv.status !== 'Cancelled') {
        lines.push({
          ref: inv.invoiceNumber, date: inv.invoiceDate, party: inv.vendorName,
          description: inv.poNumber ? `PO: ${inv.poNumber}` : 'Supplier Invoice',
          netAmount: inv.subTotal, vatAmount: inv.taxAmount,
          vatRate: inv.taxAmount > 0 ? +((inv.taxAmount / inv.subTotal) * 100).toFixed(0) : 15,
          type: 'input'
        });
      }
    }
    return lines.sort((a, b) => b.date.localeCompare(a.date));
  });

  // ─── SUMMARY COMPUTED ────────────────────────────────────────────────
  readonly totalOutputVat = computed(() =>
    this.useApiData() && this.apiSummary()
      ? this.apiSummary().totalOutputVat
      : this.outputVatLines().reduce((s: number, l: any) => s + l.vatAmount, 0)
  );
  readonly totalOutputNet = computed(() =>
    this.useApiData() && this.apiSummary()
      ? this.apiSummary().totalOutputNet
      : this.outputVatLines().reduce((s: number, l: any) => s + l.netAmount, 0)
  );
  readonly totalInputVat = computed(() =>
    this.useApiData() && this.apiSummary()
      ? this.apiSummary().totalInputVat
      : this.inputVatLines().reduce((s: number, l: any) => s + l.vatAmount, 0)
  );
  readonly totalInputNet = computed(() =>
    this.useApiData() && this.apiSummary()
      ? this.apiSummary().totalInputNet
      : this.inputVatLines().reduce((s: number, l: any) => s + l.netAmount, 0)
  );
  readonly netVatPayable = computed(() =>
    this.useApiData() && this.apiSummary()
      ? this.apiSummary().netVatPayable
      : +(this.totalOutputVat() - this.totalInputVat()).toFixed(2)
  );
  readonly effectiveOutputRate = computed(() => {
    if (this.useApiData() && this.apiSummary()) return this.apiSummary().effectiveOutputRate;
    const net = this.totalOutputNet();
    return net > 0 ? +((this.totalOutputVat() / net) * 100).toFixed(1) : 0;
  });
  readonly effectiveInputRate = computed(() => {
    if (this.useApiData() && this.apiSummary()) return this.apiSummary().effectiveInputRate;
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

    this.isSettling.set(true);
    this.financeApi.postVatSettlement({
      periodStart: this.periodStart(),
      periodEnd: this.periodEnd()
    }).subscribe({
      next: (res: any) => {
        this.isSettling.set(false);
        const d = res.data ?? res;
        this.notificationService.success(
          this.translate.instant('finance.vat.posted_title'),
          this.translate.instant('finance.vat.posted_desc', {
            amount: Math.abs(d.netVatPayable ?? net).toFixed(2),
            type: (d.type === 'payable' || net > 0)
              ? this.translate.instant('finance.vat.payable')
              : this.translate.instant('finance.vat.refundable')
          })
        );
        this.loadVatReport();
      },
      error: (err: any) => {
        this.isSettling.set(false);
        this.notificationService.danger(
          this.translate.instant('common.error'),
          err?.error?.message || 'Failed to post VAT settlement'
        );
      }
    });
  }

  printReport() {
    window.print();
  }
}
