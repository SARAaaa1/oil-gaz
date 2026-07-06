import { Injectable, signal, computed } from '@angular/core';
import { VatReturn, VatTransaction, VatReturnStatus, VatDashboardKpi } from './vat.interfaces';

@Injectable({ providedIn: 'root' })
export class VatMockService {

  // ── VAT Returns Signal ─────────────────────────────────────────────
  readonly vatReturns = signal<VatReturn[]>([
    {
      id: 'vr01',
      vatReturnNumber: 'VAT-2025-Q1',
      taxPeriod: 'Q1 2025',
      company: 'PetroFlow Services KSA',
      branch: 'Riyadh HQ',
      currency: 'SAR',
      status: 'Settled',
      preparedBy: 'Sara Al-Rasheed',
      reviewedBy: 'Faisal Al-Qahtani',
      approvedBy: 'Abdullah Al-Harbi',
      submissionDate: '2025-04-20',
      settlementDate: '2025-04-25',
      totalSales: 12_000_000,
      totalPurchases: 8_000_000,
      vatOutput: 1_800_000,
      vatInput: 1_200_000,
      netVat: 600_000, // Output - Input (Payable)
      transactions: this._buildTransactions('Q1')
    },
    {
      id: 'vr02',
      vatReturnNumber: 'VAT-2025-Q2',
      taxPeriod: 'Q2 2025',
      company: 'PetroFlow Services KSA',
      branch: 'Riyadh HQ',
      currency: 'SAR',
      status: 'Submitted',
      preparedBy: 'Sara Al-Rasheed',
      reviewedBy: 'Faisal Al-Qahtani',
      approvedBy: 'Abdullah Al-Harbi',
      submissionDate: '2025-07-02',
      settlementDate: '',
      totalSales: 14_500_000,
      totalPurchases: 9_200_000,
      vatOutput: 2_175_000,
      vatInput: 1_380_000,
      netVat: 795_000, // Output - Input (Payable)
      transactions: this._buildTransactions('Q2')
    },
    {
      id: 'vr03',
      vatReturnNumber: 'VAT-2025-Q3',
      taxPeriod: 'Q3 2025',
      company: 'PetroFlow Services KSA',
      branch: 'Riyadh HQ',
      currency: 'SAR',
      status: 'Draft',
      preparedBy: 'Sara Al-Rasheed',
      reviewedBy: '',
      approvedBy: '',
      submissionDate: '',
      settlementDate: '',
      totalSales: 0,
      totalPurchases: 0,
      vatOutput: 0,
      vatInput: 0,
      netVat: 0,
    }
  ].map((vr, idx) => ({
    ...vr,
    branchId: idx === 1 ? 'FreeZone' : 'HeadOffice',
    branchName: idx === 1 ? 'Free Zone' : 'Head Office',
    branchCode: idx === 1 ? 'FreeZone' : 'HeadOffice',
    // Inject branch to transaction list inside return
    transactions: (vr.transactions || []).map(t => ({
      ...t,
      branchId: idx === 1 ? 'FreeZone' : 'HeadOffice',
      branchName: idx === 1 ? 'Free Zone' : 'Head Office',
      branchCode: idx === 1 ? 'FreeZone' : 'HeadOffice'
    }))
  } as VatReturn)));

  // ── Global VAT Transactions Ledger (All matching items) ─────────────
  readonly transactions = signal<VatTransaction[]>([
    ...this._buildTransactions('Q1'),
    ...this._buildTransactions('Q2'),
    ...this._buildTransactions('Q3_unlinked')
  ].map((t, idx) => {
    const isFZ = idx % 3 === 0;
    return {
      ...t,
      branchId: isFZ ? 'FreeZone' : 'HeadOffice',
      branchName: isFZ ? 'Free Zone' : 'Head Office',
      branchCode: isFZ ? 'FreeZone' : 'HeadOffice'
    };
  }));

  // ── Dashboard KPIs computed from current transactions/returns ──────
  readonly kpis = computed(() => {
    // Sum of Q2 (current unsubmitted or recently submitted tax period)
    const q2Tx = this.transactions().filter(t => t.transactionDate.includes('-04-') || t.transactionDate.includes('-05-') || t.transactionDate.includes('-06-'));
    const sales = q2Tx.filter(t => t.type === 'Output').reduce((s, t) => s + t.taxableAmount, 0);
    const purchases = q2Tx.filter(t => t.type === 'Input').reduce((s, t) => s + t.taxableAmount, 0);
    const output = q2Tx.filter(t => t.type === 'Output').reduce((s, t) => s + t.vatAmount, 0);
    const input = q2Tx.filter(t => t.type === 'Input').reduce((s, t) => s + t.vatAmount, 0);
    const net = output - input;

    return {
      totalSales: sales,
      totalPurchases: purchases,
      vatOutput: output,
      vatInput: input,
      netVat: Math.abs(net),
      isPayable: net >= 0,
      pendingCount: this.transactions().filter(t => t.status === 'Pending').length
    };
  });

  // ── Helpers to build transaction arrays ───────────────────────────
  private _buildTransactions(period: 'Q1' | 'Q2' | 'Q3_unlinked'): VatTransaction[] {
    const list: VatTransaction[] = [];
    const datePrefix = period === 'Q1' ? '2025-02-' : period === 'Q2' ? '2025-05-' : '2025-08-';
    
    // Add 8 Sales Invoices (VAT Output - 15%)
    for (let i = 1; i <= 8; i++) {
      const taxable = 500_000 + (i * 100_000);
      list.push({
        id: `tx-sale-${period}-${i}`,
        transactionDate: `${datePrefix}${String(i * 3).padStart(2, '0')}`,
        documentNumber: `INV-SL-${period}-${100 + i}`,
        module: 'AR',
        partyName: i % 2 === 0 ? 'Saudi Aramco' : 'SABIC Industries',
        projectCode: 'PRJ-001',
        projectName: 'Saudi Aramco Pipeline',
        taxableAmount: taxable,
        vatPct: 15,
        vatAmount: taxable * 0.15,
        type: 'Output',
        status: period === 'Q1' ? 'Settled' : 'Pending',
        notes: `Standard contract progress billing ${i}`
      });
    }

    // Add 8 Purchase Invoices (VAT Input - 15%)
    for (let i = 1; i <= 8; i++) {
      const taxable = 200_000 + (i * 50_000);
      list.push({
        id: `tx-pur-${period}-${i}`,
        transactionDate: `${datePrefix}${String(i * 3 + 1).padStart(2, '0')}`,
        documentNumber: `INV-PR-${period}-${200 + i}`,
        module: 'AP',
        partyName: i % 2 === 0 ? 'Saudi Steel Corp' : 'Khobar Logistics Ltd',
        projectCode: 'PRJ-001',
        projectName: 'Saudi Aramco Pipeline',
        taxableAmount: taxable,
        vatPct: 15,
        vatAmount: taxable * 0.15,
        type: 'Input',
        status: period === 'Q1' ? 'Settled' : 'Pending',
        notes: `Materials supply voucher ${i}`
      });
    }

    // Add Credit/Debit note adjustments
    list.push({
      id: `tx-adj-${period}-1`,
      transactionDate: `${datePrefix}26`,
      documentNumber: `CRN-${period}-01`,
      module: 'GL',
      partyName: 'Saudi Steel Corp',
      projectCode: 'PRJ-001',
      projectName: 'Saudi Aramco Pipeline',
      taxableAmount: -50_000,
      vatPct: 15,
      vatAmount: -7_500,
      type: 'Input',
      status: period === 'Q1' ? 'Settled' : 'Pending',
      notes: 'Steel items returned to vendor - Adjustment'
    });

    return list;
  }
}
