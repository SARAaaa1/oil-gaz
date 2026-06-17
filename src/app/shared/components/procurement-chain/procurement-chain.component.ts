import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MockDataService } from '../../../core/services/mock-data.service';

@Component({
  selector: 'app-procurement-chain',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './procurement-chain.component.html',
  styles: []
})
export class ProcurementChainComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  @Input() set documentNumber(val: string) {
    this._documentNumber.set(val);
  }
  get documentNumber(): string {
    return this._documentNumber();
  }
  private readonly _documentNumber = signal<string>('');

  readonly chainSteps = computed(() => {
    const docNum = this._documentNumber();
    if (!docNum) return [];

    // Parse the document number (e.g., PO-2026-0002-0001-0002-0001)
    const parts = docNum.split('-');
    if (parts.length < 3) return [];

    const year = parts[1];
    const s0 = parts[2]; // PR segment
    const s1 = parts.length > 3 ? parts[3] : undefined; // RFQ segment
    const s2 = parts.length > 4 ? parts[4] : undefined; // QTN segment
    const s3 = parts.length > 5 ? parts[5] : undefined; // PO segment

    const steps: any[] = [];

    // 1. Purchase Request (PR)
    const prNum = `PR-${year}-${s0}`;
    const pr = this.mockData.purchaseRequests().find(p => p.documentNumber === prNum || p.requestNumber === prNum || p.procurementChain === s0);
    steps.push({
      type: 'PR',
      label: prNum,
      documentNumber: pr?.documentNumber || prNum,
      exists: !!pr,
      id: pr?.id,
      status: pr ? (docNum.startsWith('PR-') ? 'current' : 'completed') : 'pending',
      badgeText: pr?.status
    });

    // 2. RFQ
    let rfqNum = '';
    let rfq: any = null;
    if (s1) {
      rfqNum = `RFQ-${year}-${s0}-${s1}`;
      rfq = this.mockData.rfqs().find(r => r.documentNumber === rfqNum || r.rfqNumber === rfqNum || r.procurementChain === `${s0}-${s1}`);
    } else {
      rfq = this.mockData.rfqs().find(r => r.purchaseRequestId === pr?.id);
      if (rfq) {
        rfqNum = rfq.documentNumber;
      }
    }
    steps.push({
      type: 'RFQ',
      label: rfqNum || 'RFQ pending',
      documentNumber: rfq?.documentNumber,
      exists: !!rfq,
      id: rfq?.id,
      status: rfq ? (docNum.startsWith('RFQ-') ? 'current' : (docNum.startsWith('PR-') ? 'pending' : 'completed')) : 'pending',
      badgeText: rfq?.status
    });

    // 3. Quotation (QTN)
    let qtnNum = '';
    let qtn: any = null;
    if (s2 && rfq) {
      qtnNum = `QTN-${year}-${s0}-${s1}-${s2}`;
      qtn = rfq.quotations?.find((q: any) => q.quotationNumber === qtnNum || q.procurementChain === `${s0}-${s1}-${s2}`);
    } else if (rfq) {
      qtn = rfq.quotations?.find((q: any) => q.status === 'Accepted');
      if (!qtn && rfq.quotations?.length > 0) {
        qtn = rfq.quotations[0];
      }
      if (qtn) {
        qtnNum = qtn.quotationNumber;
      }
    }
    steps.push({
      type: 'QTN',
      label: qtnNum || 'Quotation pending',
      documentNumber: qtn?.quotationNumber,
      exists: !!qtn,
      id: rfq?.id, // Quotations are viewed within RFQ view details
      status: qtn ? (docNum.startsWith('QTN-') ? 'current' : (docNum.startsWith('PR-') || docNum.startsWith('RFQ-') ? 'pending' : 'completed')) : 'pending',
      badgeText: qtn?.status
    });

    // 4. Purchase Order (PO)
    let poNum = '';
    let po: any = null;
    if (s3) {
      poNum = `PO-${year}-${s0}-${s1}-${s2}-${s3}`;
      po = this.mockData.purchaseOrders().find(p => p.documentNumber === poNum || p.poNumber === poNum || p.procurementChain === `${s0}-${s1}-${s2}-${s3}`);
    } else if (qtn) {
      po = this.mockData.purchaseOrders().find(p => p.quotationNumber === qtn.quotationNumber || p.chainId === pr?.chainId);
      if (po) {
        poNum = po.documentNumber;
      }
    }
    steps.push({
      type: 'PO',
      label: poNum || 'PO pending',
      documentNumber: po?.documentNumber,
      exists: !!po,
      id: po?.id,
      status: po ? (docNum.startsWith('PO-') ? 'current' : (docNum.startsWith('PR-') || docNum.startsWith('RFQ-') || docNum.startsWith('QTN-') ? 'pending' : 'completed')) : 'pending',
      badgeText: po?.status
    });

    // 5. Material Receipt Voucher (MRV)
    let mrv: any = null;
    if (po) {
      mrv = this.mockData.mrvs().find(m => m.poId === po.id || m.poNumber === po.poNumber);
    }
    steps.push({
      type: 'MRV',
      label: mrv?.voucherNumber || 'MRV pending',
      documentNumber: mrv?.voucherNumber,
      exists: !!mrv,
      id: mrv?.id,
      status: mrv ? (docNum.startsWith('MRV-') ? 'current' : 'completed') : 'pending',
      badgeText: mrv?.status
    });

    // 6. Supplier Invoice (SINV)
    let invoice: any = null;
    if (po) {
      invoice = this.mockData.supplierInvoices().find(si => si.poId === po.id || si.poNumber === po.poNumber);
    }
    steps.push({
      type: 'SINV',
      label: invoice?.invoiceNumber || 'Invoice pending',
      documentNumber: invoice?.invoiceNumber,
      exists: !!invoice,
      id: invoice?.id,
      status: invoice ? (docNum.startsWith('SINV-') ? 'current' : 'completed') : 'pending',
      badgeText: invoice?.status
    });

    // 7. Payment Voucher (PV)
    let payment: any = null;
    if (invoice) {
      payment = this.mockData.paymentVouchers().find(pv => pv.invoicesPaid.some((ip: any) => ip.invoiceId === invoice.id));
    }
    steps.push({
      type: 'PV',
      label: payment?.voucherNumber || 'Payment pending',
      documentNumber: payment?.voucherNumber,
      exists: !!payment,
      id: payment?.id,
      status: payment ? (docNum.startsWith('PV-') ? 'current' : 'completed') : 'pending',
      badgeText: payment?.status
    });

    return steps;
  });

  getBulletClass(step: any): string {
    if (step.status === 'completed') {
      return 'bg-emerald-500 border-emerald-100';
    } else if (step.status === 'current') {
      return 'bg-indigo-600 border-indigo-100 ring-4 ring-indigo-50';
    } else {
      return 'bg-slate-100 border-slate-50';
    }
  }

  getCardClass(step: any): string {
    if (step.status === 'current') {
      return 'bg-indigo-50/40 border-indigo-200/60 shadow-sm shadow-indigo-100/30';
    } else if (step.status === 'completed') {
      return 'bg-white border-slate-100 hover:border-slate-200 shadow-xs';
    } else {
      return 'bg-slate-50/20 border-slate-100 border-dashed';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'PR': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'RFQ': return 'bg-sky-50 text-sky-700 border border-sky-100';
      case 'QTN': return 'bg-teal-50 text-teal-700 border border-teal-100';
      case 'PO': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'MRV': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'SINV': return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'PV': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  viewDocument(type: string, id: string) {
    if (type === 'PR') {
      this.router.navigate(['/procurement/purchase-requests'], { queryParams: { prId: id } });
    } else if (type === 'RFQ' || type === 'QTN') {
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
