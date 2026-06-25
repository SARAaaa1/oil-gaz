import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MockDataService } from '../../../core/services/mock-data.service';

export interface TimelineStep {
  key: string;
  title: string;
  date?: string;
  status: 'completed' | 'current' | 'pending';
  description?: string;
  documentNumber?: string;
  id?: string;
  type?: string;
  amount?: number;
}

@Component({
  selector: 'app-procurement-timeline',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './procurement-timeline.component.html',
  styles: []
})
export class ProcurementTimelineComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  @Input() set documentNumber(val: string) {
    this._documentNumber.set(val);
  }
  get documentNumber(): string {
    return this._documentNumber();
  }
  private readonly _documentNumber = signal<string>('');

  readonly timelineSteps = computed<TimelineStep[]>(() => {
    const docNum = this._documentNumber();
    if (!docNum) return [];

    // Parse the document number (supports PR, RFQ, QT, PO, MRV, etc.)
    const parts = docNum.split('-');
    if (parts.length < 3) return [];

    const year = parts[1];
    const prSegment = parts[2]; // PR sequence (e.g. 0002)
    const rfqSegment = parts.length > 3 ? parts[3] : undefined;
    const quoteSegment = parts.length > 4 ? parts[4] : undefined;
    const poSegment = parts.length > 5 ? parts[5] : undefined;

    // Resolve entities from the mock store
    const prNum = `PR-${year}-${prSegment}`;
    const pr = this.mockData.purchaseRequests().find(p => p.documentNumber === prNum || p.requestNumber === prNum || p.procurementChain === prSegment);

    let rfq: any = null;
    let rfqNum = '';
    if (rfqSegment) {
      rfqNum = `RFQ-${year}-${prSegment}-${rfqSegment}`;
      rfq = this.mockData.rfqs().find(r => r.documentNumber === rfqNum || r.rfqNumber === rfqNum || r.procurementChain === `${prSegment}-${rfqSegment}`);
    } else if (pr) {
      rfq = this.mockData.rfqs().find(r => r.purchaseRequestId === pr.id);
      if (rfq) rfqNum = rfq.documentNumber;
    }

    let winningQuote: any = null;
    let quotesCount = 0;
    if (rfq) {
      quotesCount = rfq.quotations?.length || 0;
      winningQuote = rfq.quotations?.find((q: any) => q.status === 'Accepted' || q.status === 'Awarded');
      if (!winningQuote && rfq.status === 'Awarded' && rfq.awardedQuotationNumber) {
        winningQuote = rfq.quotations?.find((q: any) => q.quotationNumber === rfq.awardedQuotationNumber);
      }
      if (!winningQuote && quoteSegment) {
        const qtnNum = `QT-${year}-${prSegment}-${rfqSegment}-${quoteSegment}`;
        winningQuote = rfq.quotations?.find((q: any) => q.quotationNumber === qtnNum || q.procurementChain === `${prSegment}-${rfqSegment}-${quoteSegment}`);
      }
    }

    let po: any = null;
    let poNum = '';
    if (poSegment) {
      poNum = `PO-${year}-${prSegment}-${rfqSegment}-${quoteSegment}-${poSegment}`;
      po = this.mockData.purchaseOrders().find(p => p.documentNumber === poNum || p.poNumber === poNum || p.procurementChain === `${prSegment}-${rfqSegment}-${quoteSegment}-${poSegment}`);
    } else if (winningQuote) {
      po = this.mockData.purchaseOrders().find(p => p.quotationNumber === winningQuote.quotationNumber || p.parentDocumentId === rfq?.id);
      if (po) poNum = po.documentNumber;
    }

    let mrv: any = null;
    if (po) {
      mrv = this.mockData.mrvs().find(m => m.poId === po.id || m.poNumber === po.poNumber);
    }

    let invoice: any = null;
    if (po) {
      invoice = this.mockData.supplierInvoices().find(si => si.poId === po.id || si.poNumber === po.poNumber);
    }

    let payment: any = null;
    if (invoice) {
      payment = this.mockData.paymentVouchers().find(pv => pv.invoicesPaid.some((ip: any) => ip.invoiceId === invoice.id));
    }

    // Determine what type of document we are currently looking at to highlight the "current" step
    const currentDocPrefix = parts[0];

    const steps: TimelineStep[] = [];

    // 1. PR Created
    steps.push({
      key: 'pr_created',
      title: 'procurement.timeline.pr_created',
      date: pr?.requestDate,
      status: pr ? (currentDocPrefix === 'PR' && !rfq ? 'current' : 'completed') : 'pending',
      description: pr ? `Requisition filed by ${pr.requestedBy} for ${pr.department}` : undefined,
      documentNumber: pr?.documentNumber,
      id: pr?.id,
      type: 'PR'
    });

    // 2. PR Approved
    const isPRApproved = pr && (pr.status === 'Approved' || pr.status === 'RFQ Created' || !!rfq);
    steps.push({
      key: 'pr_approved',
      title: 'procurement.timeline.pr_approved',
      date: isPRApproved ? pr?.requestDate : undefined,
      status: isPRApproved 
        ? (currentDocPrefix === 'PR' && pr.status === 'Approved' ? 'current' : 'completed') 
        : 'pending',
      description: isPRApproved ? 'Authorized by Department Manager' : undefined,
      documentNumber: pr?.documentNumber,
      id: pr?.id,
      type: 'PR'
    });

    // 3. RFQ Generated
    steps.push({
      key: 'rfq_generated',
      title: 'procurement.timeline.rfq_generated',
      date: rfq?.createdDate,
      status: rfq 
        ? (currentDocPrefix === 'RFQ' && rfq.status === 'Draft' ? 'current' : 'completed') 
        : 'pending',
      description: rfq ? `RFQ ${rfq.rfqNumber} generated from approved request` : undefined,
      documentNumber: rfq?.documentNumber,
      id: rfq?.id,
      type: 'RFQ'
    });

    // 4. RFQ Sent
    const isRFQSent = rfq && rfq.status !== 'Draft' && rfq.status !== 'Cancelled';
    steps.push({
      key: 'rfq_sent',
      title: 'procurement.timeline.rfq_sent',
      date: isRFQSent ? rfq?.createdDate : undefined,
      status: isRFQSent 
        ? (currentDocPrefix === 'RFQ' && rfq.status === 'Sent' ? 'current' : 'completed') 
        : 'pending',
      description: isRFQSent ? `RFQ dispatched to ${rfq.vendors?.length} invited suppliers` : undefined,
      documentNumber: rfq?.documentNumber,
      id: rfq?.id,
      type: 'RFQ'
    });

    // 5. Quotation Received
    const hasQuotes = quotesCount > 0;
    const latestQuoteDate = rfq?.quotations?.[rfq.quotations.length - 1]?.submissionDate;
    steps.push({
      key: 'quotation_received',
      title: 'procurement.timeline.quotation_received',
      date: hasQuotes ? latestQuoteDate : undefined,
      status: hasQuotes 
        ? (currentDocPrefix === 'RFQ' && (rfq.status === 'Partially Responded' || rfq.status === 'Fully Responded') ? 'current' : 'completed') 
        : 'pending',
      description: hasQuotes ? `Received ${quotesCount} vendor quotation responses` : undefined,
      documentNumber: rfq?.documentNumber,
      id: rfq?.id,
      type: 'RFQ'
    });

    // 6. Vendor Awarded
    const isAwarded = rfq && (rfq.status === 'Awarded' || !!po);
    const awardDate = winningQuote?.submissionDate || rfq?.createdDate;
    steps.push({
      key: 'vendor_awarded',
      title: 'procurement.timeline.vendor_awarded',
      date: isAwarded ? awardDate : undefined,
      status: isAwarded 
        ? (currentDocPrefix === 'RFQ' && rfq.status === 'Awarded' && !po ? 'current' : 'completed') 
        : 'pending',
      description: isAwarded && winningQuote ? `Awarded to ${winningQuote.vendorName} (${winningQuote.quotationNumber})` : undefined,
      documentNumber: winningQuote?.quotationNumber || rfq?.documentNumber,
      id: rfq?.id,
      type: 'RFQ'
    });

    // 7. PO Issued
    steps.push({
      key: 'po_issued',
      title: 'procurement.timeline.po_issued',
      date: po?.date,
      status: po 
        ? (currentDocPrefix === 'PO' && po.status !== 'Approved' && po.status !== 'Issued' ? 'current' : 'completed') 
        : 'pending',
      description: po ? `Purchase Order ${po.poNumber} issued ($${po.totalAmount.toLocaleString()})` : undefined,
      documentNumber: po?.documentNumber,
      id: po?.id,
      type: 'PO',
      amount: po?.totalAmount
    });

    // 8. Goods Received
    steps.push({
      key: 'goods_received',
      title: 'procurement.timeline.goods_received',
      date: mrv?.receivedDate,
      status: mrv ? 'completed' : 'pending',
      description: mrv ? `Receipt voucher ${mrv.voucherNumber} logged at Main Warehouse` : undefined,
      documentNumber: mrv?.voucherNumber,
      id: mrv?.id,
      type: 'MRV'
    });

    // 9. Invoice Received
    steps.push({
      key: 'invoice_received',
      title: 'procurement.timeline.invoice_received',
      date: invoice?.invoiceDate,
      status: invoice ? 'completed' : 'pending',
      description: invoice ? `Supplier Invoice ${invoice.invoiceNumber} recorded ($${invoice.totalAmount.toLocaleString()})` : undefined,
      documentNumber: invoice?.invoiceNumber,
      id: invoice?.id,
      type: 'SINV'
    });

    // 10. Payment Released
    steps.push({
      key: 'payment_released',
      title: 'procurement.timeline.payment_released',
      date: payment?.paymentDate,
      status: payment ? 'completed' : 'pending',
      description: payment ? `Payment ${payment.voucherNumber} released via Bank Transfer` : undefined,
      documentNumber: payment?.voucherNumber,
      id: payment?.id,
      type: 'PV',
      amount: payment?.amount
    });

    return steps;
  });

  getBulletClass(step: TimelineStep): string {
    if (step.status === 'completed') {
      return 'bg-emerald-500 border-emerald-100';
    } else if (step.status === 'current') {
      return 'bg-indigo-600 border-indigo-100 ring-4 ring-indigo-50';
    } else {
      return 'bg-slate-100 border-slate-55';
    }
  }

  getCardClass(step: TimelineStep): string {
    if (step.status === 'current') {
      return 'bg-indigo-50/40 border-indigo-200/60 shadow-sm shadow-indigo-100/30';
    } else if (step.status === 'completed') {
      return 'bg-white border-slate-100 hover:border-slate-200 shadow-xs';
    } else {
      return 'bg-slate-50/20 border-slate-100 border-dashed opacity-50';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'PR': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'RFQ': return 'bg-sky-50 text-sky-700 border border-sky-100';
      case 'PO': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'MRV': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'SINV': return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'PV': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  viewDocument(type: string, id: string) {
    if (!id) return;
    if (type === 'PR') {
      this.router.navigate(['/procurement/purchase-requests'], { queryParams: { prId: id } });
    } else if (type === 'RFQ') {
      this.router.navigate(['/procurement/rfqs'], { queryParams: { rfqId: id } });
    } else if (type === 'PO') {
      this.router.navigate(['/procurement/purchase-orders'], { queryParams: { poId: id } });
    } else if (type === 'MRV') {
      this.router.navigate(['/inventory/mrvs'], { queryParams: { mrvId: id } });
    } else if (type === 'SINV') {
      this.router.navigate(['/finance/supplier-invoices'], { queryParams: { invoiceId: id } });
    } else if (type === 'PV') {
      this.router.navigate(['/finance/payment-vouchers'], { queryParams: { voucherId: id } });
    }
  }
}
