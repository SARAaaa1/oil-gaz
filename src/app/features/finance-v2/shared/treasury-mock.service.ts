import { Injectable, signal, computed, inject } from '@angular/core';
import {
  CashBox, BankAccount, TreasuryTransfer, TreasuryMovement, ReconciliationSession,
  StatementTransaction, SystemTransaction, TreasuryDashboardKpi,
  CashBoxStatus, BankAccountStatus, TransferStatus, ReconciliationStatus, AccountType
} from './treasury.interfaces';
import { ApMockService } from './ap-mock.service';
import { ArMockService } from './ar-mock.service';

@Injectable({ providedIn: 'root' })
export class TreasuryMockService {
  private readonly apService = inject(ApMockService);
  private readonly arService = inject(ArMockService);

  // ── Cash Boxes (8) ──────────────────────────────────────────────────
  readonly cashBoxes = signal<CashBox[]>([
    { id: 'cb01', code: 'CSH-001', name: 'Main HQ Safe - SAR', currency: 'SAR', currentBalance: 450_000, responsibleEmployee: 'Abdullah Al-Harbi', status: 'Open', openingBalance: 400_000, todayReceipts: 65_000, todayPayments: 15_000, closingBalance: 450_000 },
    { id: 'cb02', code: 'CSH-002', name: 'Main HQ Safe - USD', currency: 'USD', currentBalance: 120_000, responsibleEmployee: 'Abdullah Al-Harbi', status: 'Open', openingBalance: 100_000, todayReceipts: 25_000, todayPayments: 5_000, closingBalance: 120_000 },
    { id: 'cb03', code: 'CSH-003', name: 'Khobar Branch Box', currency: 'SAR', currentBalance: 85_000, responsibleEmployee: 'Jamil Al-Saeed', status: 'Open', openingBalance: 80_000, todayReceipts: 8_000, todayPayments: 3_000, closingBalance: 85_000 },
    { id: 'cb04', code: 'CSH-004', name: 'Jeddah Branch Box', currency: 'SAR', currentBalance: 95_000, responsibleEmployee: 'Yaser Al-Qahtani', status: 'Open', openingBalance: 90_000, todayReceipts: 12_000, todayPayments: 7_000, closingBalance: 95_000 },
    { id: 'cb05', code: 'CSH-005', name: 'PetroFlow Project Site Box A', currency: 'SAR', currentBalance: 35_000, responsibleEmployee: 'Fahad Al-Malki', status: 'Open', openingBalance: 35_000, todayReceipts: 0, todayPayments: 0, closingBalance: 35_000 },
    { id: 'cb06', code: 'CSH-006', name: 'PetroFlow Project Site Box B', currency: 'SAR', currentBalance: 20_000, responsibleEmployee: 'Sultan Al-Otaibi', status: 'Open', openingBalance: 25_000, todayReceipts: 0, todayPayments: 5_000, closingBalance: 20_000 },
    { id: 'cb07', code: 'CSH-007', name: 'HQ Petty Cash Box', currency: 'SAR', currentBalance: 8_500, responsibleEmployee: 'Sara Al-Rasheed', status: 'Open', openingBalance: 10_000, todayReceipts: 0, todayPayments: 1_500, closingBalance: 8_500 },
    { id: 'cb08', code: 'CSH-008', name: 'Yanbu Warehouse Box', currency: 'SAR', currentBalance: 0, responsibleEmployee: 'Ahmad Al-Subaie', status: 'Closed', openingBalance: 0, todayReceipts: 0, todayPayments: 0, closingBalance: 0 }
  ].map(c => {
    const isFZ = ['cb07', 'cb08'].includes(c.id);
    return {
      ...c,
      branchId: isFZ ? 'FreeZone' : 'HeadOffice',
      branchName: isFZ ? 'Free Zone' : 'Head Office',
      branchCode: isFZ ? 'FreeZone' : 'HeadOffice'
    } as CashBox;
  }));

  // ── Bank Accounts (12) ──────────────────────────────────────────────
  readonly bankAccounts = signal<BankAccount[]>([
    { id: 'ba01', bankName: 'SAB Bank', branch: 'Olaya Corporate Branch', iban: 'SA1280000000112111234501', accountNumber: '10801121001', swiftCode: 'SABBRIYXXX', currency: 'SAR', openingBalance: 12_500_000, currentBalance: 14_250_000, availableBalance: 14_250_000, status: 'Active' },
    { id: 'ba02', bankName: 'Riyad Bank', branch: 'King Abdullah Road', iban: 'SA2380000000223222345602', accountNumber: '20802232002', swiftCode: 'RYADRIYXXX', currency: 'SAR', openingBalance: 8_900_000, currentBalance: 9_350_000, availableBalance: 9_350_000, status: 'Active' },
    { id: 'ba03', bankName: 'Al Rajhi Bank', branch: 'Main HQ Branch', iban: 'SA4420000001234567891103', accountNumber: '30804424003', swiftCode: 'RJHIRIYXXX', currency: 'SAR', openingBalance: 18_400_000, currentBalance: 21_120_000, availableBalance: 21_120_000, status: 'Active' },
    { id: 'ba04', bankName: 'SAB Bank - USD', branch: 'Olaya Corporate Branch', iban: 'SA1280000000112111234502', accountNumber: '10801121002', swiftCode: 'SABBRIYXXX', currency: 'USD', openingBalance: 3_200_000, currentBalance: 3_850_000, availableBalance: 3_850_000, status: 'Active' },
    { id: 'ba05', bankName: 'NCB (SNB)', branch: 'Tahlia Street Branch', iban: 'SA3680000000608010167505', accountNumber: '40806080005', swiftCode: 'NCBKRIYXXX', currency: 'SAR', openingBalance: 6_800_000, currentBalance: 7_150_000, availableBalance: 7_150_000, status: 'Active' },
    { id: 'ba06', bankName: 'HSBC Saudi Arabia', branch: 'Jeddah Corporate', iban: 'SA8880000000608010167506', accountNumber: '50808880006', swiftCode: 'HSBCRIYXXX', currency: 'USD', openingBalance: 1_500_000, currentBalance: 1_250_000, availableBalance: 1_250_000, status: 'Active' },
    { id: 'ba07', bankName: 'Citibank KSA', branch: 'Riyadh Hub', iban: 'SA5510000000608010167507', accountNumber: '60805510007', swiftCode: 'CITIRIYXXX', currency: 'USD', openingBalance: 4_500_000, currentBalance: 4_500_000, availableBalance: 4_500_000, status: 'Active' },
    { id: 'ba08', bankName: 'Riyad Bank - EUR', branch: 'King Abdullah Road', iban: 'SA2380000000223222345608', accountNumber: '20802232008', swiftCode: 'RYADRIYXXX', currency: 'EUR', openingBalance: 900_000, currentBalance: 920_000, availableBalance: 920_000, status: 'Active' },
    { id: 'ba09', bankName: 'Banque Saudi Fransi', branch: 'Al Khobar Main', iban: 'SA5820000000608010167509', accountNumber: '70805820009', swiftCode: 'BSFRRIYXXX', currency: 'SAR', openingBalance: 5_200_000, currentBalance: 5_200_000, availableBalance: 5_200_000, status: 'Active' },
    { id: 'ba10', bankName: 'Arab National Bank', branch: 'Jubail Industrial', iban: 'SA6630000000608010167510', accountNumber: '80806630010', swiftCode: 'ARABRIYXXX', currency: 'SAR', openingBalance: 3_800_000, currentBalance: 3_800_000, availableBalance: 3_800_000, status: 'Active' },
    { id: 'ba11', bankName: 'Alinma Bank', branch: 'Diriyah Branch', iban: 'SA9940000000608010167511', accountNumber: '90809940011', swiftCode: 'ALINRIYXXX', currency: 'SAR', openingBalance: 2_100_000, currentBalance: 2_100_000, availableBalance: 2_100_000, status: 'Active' },
    { id: 'ba12', bankName: 'Saudi Investment Bank', branch: 'HQ Riyadh', iban: 'SA7750000000608010167512', accountNumber: '99807750012', swiftCode: 'SAIBRIYXXX', currency: 'SAR', openingBalance: 1_500_000, currentBalance: 1_500_000, availableBalance: 1_500_000, status: 'Inactive' }
  ].map(b => {
    const isFZ = ['ba11', 'ba12'].includes(b.id);
    return {
      ...b,
      branchId: isFZ ? 'FreeZone' : 'HeadOffice',
      branchName: isFZ ? 'Free Zone' : 'Head Office',
      branchCode: isFZ ? 'FreeZone' : 'HeadOffice'
    } as BankAccount;
  }));

  // ── Cash & Bank Transfers (40) ──────────────────────────────────────
  readonly transfers = signal<TreasuryTransfer[]>(this._buildTransfers().map(t => {
    const fromFZ = ['ba11', 'ba12', 'cb07', 'cb08'].includes(t.fromAccountId);
    const toFZ = ['ba11', 'ba12', 'cb07', 'cb08'].includes(t.toAccountId);
    const fromBranchId = fromFZ ? 'FreeZone' : 'HeadOffice';
    const toBranchId = toFZ ? 'FreeZone' : 'HeadOffice';
    return {
      ...t,
      branchId: fromBranchId,
      branchCode: fromBranchId,
      branchName: fromBranchId === 'FreeZone' ? 'Free Zone' : 'Head Office',
      fromBranchId,
      fromBranchName: fromBranchId === 'FreeZone' ? 'Free Zone' : 'Head Office',
      toBranchId,
      toBranchName: toBranchId === 'FreeZone' ? 'Free Zone' : 'Head Office',
      isCrossBranch: fromBranchId !== toBranchId
    } as TreasuryTransfer;
  }));

  // ── Deposits (30) & Withdrawals (30) + Movement ledger ─────────────
  readonly movements = signal<TreasuryMovement[]>(this._buildMovements().map(m => {
    const isFZ = ['ba11', 'ba12', 'cb07', 'cb08'].includes(m.accountId);
    return {
      ...m,
      branchId: isFZ ? 'FreeZone' : 'HeadOffice',
      branchName: isFZ ? 'Free Zone' : 'Head Office',
      branchCode: isFZ ? 'FreeZone' : 'HeadOffice'
    } as TreasuryMovement;
  }));

  // ── Bank Reconciliation Sessions (20) ──────────────────────────────
  readonly reconciliationSessions = signal<ReconciliationSession[]>(this._buildReconciliationSessions().map(r => {
    const isFZ = ['ba11', 'ba12'].includes(r.bankAccountId);
    return {
      ...r,
      branchId: isFZ ? 'FreeZone' : 'HeadOffice',
      branchName: isFZ ? 'Free Zone' : 'Head Office',
      branchCode: isFZ ? 'FreeZone' : 'HeadOffice'
    } as ReconciliationSession;
  }));

  // ── Dashboard KPIs ─────────────────────────────────────────────────
  readonly kpis = computed<TreasuryDashboardKpi>(() => {
    const cashTotal = this.cashBoxes().filter(c => c.status === 'Open').reduce((s, c) => s + (c.currency === 'USD' ? c.currentBalance * 3.75 : c.currentBalance), 0);
    const bankTotal = this.bankAccounts().filter(b => b.status === 'Active').reduce((s, b) => s + (b.currency === 'USD' ? b.currentBalance * 3.75 : b.currency === 'EUR' ? b.currentBalance * 4.0 : b.currentBalance), 0);
    
    // Today movements
    const todayStr = '2025-07-01';
    const movs = this.movements().filter(m => m.date === todayStr);
    const incoming = movs.filter(m => ['Deposit', 'Receipt', 'Transfer In'].includes(m.type)).reduce((s, m) => s + (m.currency === 'USD' ? m.amount * 3.75 : m.amount), 0);
    const outgoing = movs.filter(m => ['Withdrawal', 'Payment', 'Transfer Out'].includes(m.type)).reduce((s, m) => s + (m.currency === 'USD' ? m.amount * 3.75 : m.amount), 0);
    
    const pendingTransfers = this.transfers().filter(t => t.status === 'Draft' || t.status === 'Approved').length;
    const pendingReconciliation = this.reconciliationSessions().filter(r => r.status === 'Draft').length;

    return {
      totalCash: cashTotal,
      totalBankBalance: bankTotal,
      incomingToday: incoming,
      outgoingToday: outgoing,
      pendingTransfers,
      pendingReconciliation,
      cashFlowToday: incoming - outgoing
    };
  });

  // ── Helper builders ───────────────────────────────────────────────
  private _buildTransfers(): TreasuryTransfer[] {
    const list: TreasuryTransfer[] = [];
    const reasons = ['Liquidity balancing', 'Payroll funding', 'Petty cash replenishment', 'Investment deposit', 'Branch funding', 'Project site funding'];
    for (let i = 1; i <= 40; i++) {
      const isCashFrom = i % 2 === 0;
      const isCashTo   = i % 3 === 0;
      const amount     = 5_000 * (i % 8 + 1) + 1_000 * i;
      const status: TransferStatus = i === 1 ? 'Draft' : i === 2 ? 'Approved' : i % 8 === 0 ? 'Cancelled' : 'Executed';
      list.push({
        id: `tr${i}`,
        transferNumber: `TRF-2025-${String(i).padStart(3, '0')}`,
        date: `2025-06-${String((i % 28) + 1).padStart(2, '0')}`,
        fromAccountType: isCashFrom ? 'Cash' : 'Bank',
        fromAccountId: isCashFrom ? 'cb01' : 'ba01',
        fromAccountName: isCashFrom ? 'Main HQ Safe - SAR' : 'SAB Bank',
        toAccountType: isCashTo ? 'Cash' : 'Bank',
        toAccountId: isCashTo ? 'cb03' : 'ba02',
        toAccountName: isCashTo ? 'Khobar Branch Box' : 'Riyad Bank',
        amount,
        currency: 'SAR',
        exchangeRate: 1,
        reference: `REF-TR-${1000 + i}`,
        reason: reasons[i % reasons.length],
        remarks: `Auto transfer sequence ${i}`,
        status,
        attachments: i % 4 === 0 ? ['receipt.pdf'] : []
      });
    }
    return list;
  }

  private _buildMovements(): TreasuryMovement[] {
    const list: TreasuryMovement[] = [];
    
    // Add 30 Deposits
    for (let i = 1; i <= 30; i++) {
      list.push({
        id: `mov-dep-${i}`,
        accountType: 'Bank',
        accountId: i % 2 === 0 ? 'ba01' : 'ba02',
        accountName: i % 2 === 0 ? 'SAB Bank' : 'Riyad Bank',
        type: 'Deposit',
        date: `2025-06-${String((i % 28) + 1).padStart(2, '0')}`,
        amount: 10_000 * (i % 5 + 1) + 500 * i,
        currency: 'SAR',
        reference: `DEP-REF-${2000 + i}`,
        description: `Direct deposit cash collection - Part ${i}`,
        matched: i % 3 !== 0
      });
    }

    // Add 30 Withdrawals
    for (let i = 1; i <= 30; i++) {
      list.push({
        id: `mov-wth-${i}`,
        accountType: 'Cash',
        accountId: 'cb01',
        accountName: 'Main HQ Safe - SAR',
        type: 'Withdrawal',
        date: `2025-06-${String((i % 28) + 1).padStart(2, '0')}`,
        amount: 2_000 * (i % 4 + 1) + 100 * i,
        currency: 'SAR',
        reference: `WTH-REF-${3000 + i}`,
        description: `Cash withdrawal petty cash replenish - Part ${i}`,
        matched: true
      });
    }

    // Link AP payments (Payments automatically create Treasury Payments)
    const apPayments = this.apService.payments();
    apPayments.forEach((p, idx) => {
      list.push({
        id: `mov-ap-${p.id}`,
        accountType: 'Bank',
        accountId: 'ba01',
        accountName: 'SAB Bank',
        type: 'Payment',
        date: p.paymentDate,
        amount: p.totalAmount,
        currency: p.currency,
        reference: p.voucherNumber,
        description: `Supplier payment to ${p.allocations[0]?.supplierName || 'vendor'}`,
        matched: idx % 5 !== 0 // Some unmatched for reconciliation testing
      });
    });

    // Link AR collections (AR Collection automatically creates Treasury Receipt)
    const arCollections = this.arService.collections();
    arCollections.forEach((c, idx) => {
      list.push({
        id: `mov-ar-${c.id}`,
        accountType: 'Bank',
        accountId: 'ba03',
        accountName: 'Al Rajhi Bank',
        type: 'Receipt',
        date: c.collectionDate,
        amount: c.totalAmount,
        currency: c.currency,
        reference: c.voucherNumber,
        description: `Client collection from ${c.customerName}`,
        matched: idx % 6 !== 0
      });
    });

    return list;
  }

  private _buildReconciliationSessions(): ReconciliationSession[] {
    const list: ReconciliationSession[] = [];
    for (let i = 1; i <= 20; i++) {
      const bankId = i % 2 === 0 ? 'ba01' : 'ba03';
      const bankName = i % 2 === 0 ? 'SAB Bank' : 'Al Rajhi Bank';
      const status: ReconciliationStatus = i <= 5 ? 'Approved' : 'Draft';
      
      // Build 5 Bank Statement Transactions and 5 System Transactions per session
      const statementTransactions: StatementTransaction[] = [];
      const systemTransactions: SystemTransaction[] = [];

      for (let j = 1; j <= 5; j++) {
        const amt = 10_000 * j + 250 * i;
        const matched = j <= 3;
        
        statementTransactions.push({
          id: `stmt-t-${i}-${j}`,
          date: `2025-06-${String(j * 5).padStart(2, '0')}`,
          description: `Bank txn ref ${j * 100}`,
          reference: `TXN-${1000 + i * 10 + j}`,
          amount: amt,
          type: j % 2 === 0 ? 'Debit' : 'Credit',
          matched
        });

        systemTransactions.push({
          id: `sys-t-${i}-${j}`,
          date: `2025-06-${String(j * 5).padStart(2, '0')}`,
          description: `System ledger txn ${j * 100}`,
          reference: j === 5 ? `TXN-MISMATCH` : `TXN-${1000 + i * 10 + j}`,
          amount: j === 4 ? amt + 100 : amt, // Trigger mismatch on 4 and 5
          type: j % 2 === 0 ? 'Debit' : 'Credit',
          matched: j <= 3
        });
      }

      list.push({
        id: `rec-${i}`,
        bankAccountId: bankId,
        bankAccountName: bankName,
        statementDate: `2025-06-${String((i * 1) % 28 + 1).padStart(2, '0')}`,
        statementBalance: 5_000_000 + 100_000 * i,
        bookBalance: 5_000_000 + 100_000 * i - 250,
        difference: 250,
        status,
        matchedCount: 3,
        unmatchedCount: 2,
        statementTransactions,
        systemTransactions
      });
    }
    return list;
  }
}
