import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─── 1. Chart of Accounts Types ────────────────────────────────────────────────

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface ChartOfAccount {
  _id: string;
  code: string;
  name: string;
  type: AccountType;
  parentCode: string | null;
  description: string | null;
  balance: number;
  isActive: boolean;
  isReconciliation: boolean;
  costCenterCode: string | null;
  children?: ChartOfAccount[];
  createdAt?: string;
  // Compat field
  id?: string;
}

export interface CreateCoaBody {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string | null;
  description?: string | null;
  isActive?: boolean;
  isReconciliation?: boolean;
  costCenterCode?: string | null;
}

export interface UpdateCoaBody {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

// ─── 2. General Ledger Types ───────────────────────────────────────────────────

export interface JournalLine {
  accountCode: string;
  accountName: string;
  type: 'Debit' | 'Credit';
  amount: number;
  costCenterCode?: string;
  notes?: string;
}

export interface JournalEntry {
  _id: string;
  journalNumber: string;
  date: string;
  reference?: string;
  description: string;
  sourceType: 'Invoice' | 'Collection' | 'Manual' | 'Adjustment' | 'AP_Invoice' | 'AP_Payment' | 'AR_Collection' | 'Depreciation' | 'VAT_Settlement';
  status: 'Draft' | 'Posted' | 'Voided';
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdBy?: string;
  createdAt: string;
  id?: string;
}

export interface CreateJournalEntryLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  projectCode?: string;
  costCenterCode?: string;
}

export interface CreateJournalEntryBody {
  date: string;
  reference?: string;
  description: string;
  lines: CreateJournalEntryLine[];
}

// ─── 3. Accounts Payable Types ─────────────────────────────────────────────────

export interface SupplierInvoice {
  _id: string;
  invoiceNumber: string;
  poId?: string;
  poNumber?: string;
  vendorId?: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Cancelled';
  paymentTerms?: string;
  chargeType?: string;
  chargeAccountCode?: string;
  projectId?: string;
  projectCode?: string;
  costCenter?: string;
  glEntryId?: string;
  glEntryNumber?: string;
  createdAt?: string;
  id?: string;
}

export interface CreateSupplierInvoiceBody {
  invoiceNumber?: string;
  poId?: string;
  poNumber?: string;
  vendorId?: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  taxAmount: number;
  paymentTerms?: string;
  chargeType?: string;
  chargeAccountCode?: string;
  projectId?: string;
  projectCode?: string;
  costCenter?: string;
}

export interface InvoicePaidItem {
  invoiceId: string;
  invoiceNumber: string;
  amountPaid: number;
}

export interface PaymentVoucher {
  _id: string;
  voucherNumber: string;
  paymentDate: string;
  vendorId?: string;
  vendorName: string;
  bankAccountId?: string;
  bankAccountName?: string;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash';
  referenceNumber?: string;
  amount: number;
  status: 'Draft' | 'Posted' | 'Cancelled';
  invoicesPaid: InvoicePaidItem[];
  glEntryId?: string;
  glEntryNumber?: string;
  id?: string;
}

export interface CreatePaymentVoucherBody {
  paymentDate: string;
  vendorId?: string;
  vendorName: string;
  bankAccountId: string;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash';
  referenceNumber?: string;
  invoicesPaid: InvoicePaidItem[];
}

export interface APAgingEntry {
  vendorId?: string;
  vendorName: string;
  totalDue: number;
  current: number;
  thirtyToSixty: number;
  sixtyToNinety: number;
  overNinety: number;
}

// ─── 4. Accounts Receivable Types ──────────────────────────────────────────────

export interface SalesInvoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  contractNumber?: string;
  invoiceDate: string;
  dueDate: string;
  netPayable: number;
  totalCollected: number;
  balanceDue: number;
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Cancelled';
  id?: string;
}

export interface ARAgingEntry {
  clientName: string;
  totalDue: number;
  current: number;
  thirtyToSixty: number;
  sixtyToNinety: number;
  overNinety: number;
}

export interface InvoiceCollectedItem {
  invoiceId: string;
  invoiceNumber: string;
  amountCollected: number;
}

export interface CollectionVoucher {
  _id: string;
  voucherNumber: string;
  collectionDate: string;
  customerName: string;
  bankAccountId?: string;
  bankAccountName?: string;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash';
  referenceNumber?: string;
  amount: number;
  status: 'Draft' | 'Posted' | 'Cancelled';
  invoicesCollected: InvoiceCollectedItem[];
  glEntryId?: string;
  glEntryNumber?: string;
  id?: string;
}

export interface CreateCollectionVoucherBody {
  collectionDate: string;
  customerName: string;
  bankAccountId: string;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash';
  referenceNumber?: string;
  invoicesCollected: InvoiceCollectedItem[];
}

// ─── 5. Cash & Bank Types ──────────────────────────────────────────────────────

export interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  iban?: string;
  currency: 'SAR' | 'USD' | 'EUR';
  balance: number;
  coaCode: string;
  status: 'Active' | 'Inactive';
  id?: string;
}

export interface CreateBankAccountBody {
  bankName: string;
  accountNumber: string;
  iban?: string;
  currency?: 'SAR' | 'USD' | 'EUR';
  balance?: number;
}

export interface CashAccount {
  _id: string;
  officeLocation: string;
  custodianName: string;
  currency: 'SAR' | 'USD' | 'EUR';
  balance: number;
  coaCode: string;
  status: 'Active' | 'Inactive';
  id?: string;
}

export interface CreateCashAccountBody {
  officeLocation: string;
  custodianName: string;
  currency?: string;
  balance?: number;
}

export interface BankReconciliation {
  _id: string;
  bankAccountId: string;
  statementPeriod: string;
  statementEndDate: string;
  bookBalance: number;
  statementBalance: number;
  difference: number;
  status: 'Reconciled' | 'Unreconciled';
  reconciledDate?: string;
  reconciledBy?: string;
  id?: string;
}

export interface CreateReconciliationBody {
  bankAccountId: string;
  statementPeriod: string;
  statementEndDate: string;
  statementBalance: number;
}

// ─── 6. Budget Types ───────────────────────────────────────────────────────────

export interface BudgetLine {
  category: 'Materials' | 'Labor' | 'Equipment' | 'Subcontractors' | 'Transportation' | 'G&A' | 'Contingency';
  budgetAmount: number;
  actualAmount: number;
  committedAmount: number;
}

export interface ProjectBudget {
  _id: string;
  projectCode: string;
  projectName?: string;
  fiscalYear: number;
  totalBudget: number;
  status: 'Draft' | 'Active' | 'Approved';
  lines: BudgetLine[];
  totalActual: number;
  totalCommitted: number;
  totalUsed: number;
  totalVariance: number;
  totalUtilPct: number;
  isOverBudget: boolean;
  alertLevel: 'ok' | 'warning' | 'danger';
  id?: string;
}

export interface CreateBudgetBody {
  projectCode: string;
  fiscalYear: number;
  status?: 'Draft' | 'Active' | 'Approved';
  lines: Record<string, number>;
}

// ─── 7. Cost Center Types ──────────────────────────────────────────────────────

export interface CostCenter {
  _id: string;
  code: string;
  name: string;
  type: 'Project' | 'Department' | 'Division' | 'Overhead' | 'General';
  parentCode?: string;
  status: 'Active' | 'Inactive';
  description?: string;
  projectCode?: string;
  contractNumber?: string;
  level?: number;
  projectsCount?: number;
  totalBudget?: number;
  totalSpent?: number;
  remaining?: number;
  materialCost?: number;
  laborCost?: number;
  transferCost?: number;
  id?: string;
}

export interface CreateCostCenterBody {
  code: string;
  name: string;
  type: string;
  parentCode?: string;
  status?: 'Active' | 'Inactive';
  description?: string;
}

// ─── 8. Asset Depreciation Types ───────────────────────────────────────────────

export interface DepreciationEntry {
  asset: {
    _id: string;
    assetNumber: string;
    equipmentName: string;
    category: string;
    purchaseCost: number;
    purchaseDate: string;
    status: string;
  };
  usefulLifeYears: number;
  salvageValue: number;
  annualDepreciation: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  monthsElapsed: number;
  depreciationPercent: number;
  fullyDepreciated: boolean;
}

export interface DepreciationTotals {
  totalCost: number;
  totalAccumulated: number;
  totalNBV: number;
  totalAnnualCharge: number;
  totalMonthlyCharge: number;
  activeAssets: number;
  fullyDepreciatedCount: number;
}

// ─── 9. VAT Types ──────────────────────────────────────────────────────────────

export interface VATLine {
  ref: string;
  date: string;
  party: string;
  description: string;
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  type: 'output' | 'input';
}

export interface VATSummary {
  totalOutputNet: number;
  totalOutputVat: number;
  totalInputNet: number;
  totalInputVat: number;
  netVatPayable: number;
  effectiveOutputRate: number;
  effectiveInputRate: number;
}

export interface VATReportResponse {
  summary: VATSummary;
  outputLines: VATLine[];
  inputLines: VATLine[];
}

// ─── 10. Statements Types ──────────────────────────────────────────────────────

export interface TrialBalanceLine {
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
  isParent: boolean;
  level: number;
}

export interface BalanceSheetSection {
  total: number;
  items: { code: string; name: string; amount: number }[];
}

export interface BalanceSheetResponse {
  assets: {
    current: BalanceSheetSection;
    nonCurrent: BalanceSheetSection;
    totalAssets: number;
  };
  liabilities: {
    current: BalanceSheetSection;
    nonCurrent: BalanceSheetSection;
    totalLiabilities: number;
  };
  equity: {
    total: number;
    retainedEarnings: number;
    statedCapital: number;
  };
  isBalanced: boolean;
}

// ─── FinanceApiService ─────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FinanceApiService {
  private readonly http = inject(HttpClient);

  private get apiRoot(): string {
    return `${environment.apiUrl}/finance`;
  }

  // ── 1. Chart of Accounts (/finance/coa) ──────────────────────────────────

  getCoa(params: { type?: string; isActive?: boolean; parentCode?: string; leafOnly?: boolean } = {}): Observable<ChartOfAccount[]> {
    let p = new HttpParams();
    if (params.type)       p = p.set('type', params.type);
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    if (params.parentCode) p = p.set('parentCode', params.parentCode);
    if (params.leafOnly !== undefined) p = p.set('leafOnly', String(params.leafOnly));

    return this.http.get<any>(`${this.apiRoot}/coa`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  createCoa(body: CreateCoaBody): Observable<ChartOfAccount> {
    return this.http.post<any>(`${this.apiRoot}/coa`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  updateCoa(id: string, body: UpdateCoaBody): Observable<ChartOfAccount> {
    return this.http.patch<any>(`${this.apiRoot}/coa/${id}`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  deleteCoa(id: string): Observable<{ message: string }> {
    return this.http.delete<any>(`${this.apiRoot}/coa/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  seedCoa(): Observable<{ message: string }> {
    return this.http.post<any>(`${this.apiRoot}/coa/seed`, {}).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 2. General Ledger (/finance/gl) ──────────────────────────────────────

  getJournalEntries(params: { status?: string; dateFrom?: string; dateTo?: string; reference?: string; accountCode?: string; page?: number; limit?: number } = {}): Observable<{ data: JournalEntry[]; total: number; page: number }> {
    let p = new HttpParams();
    if (params.status)      p = p.set('status', params.status);
    if (params.dateFrom)    p = p.set('dateFrom', params.dateFrom);
    if (params.dateTo)      p = p.set('dateTo', params.dateTo);
    if (params.reference)   p = p.set('reference', params.reference);
    if (params.accountCode) p = p.set('accountCode', params.accountCode);
    if (params.page)        p = p.set('page', String(params.page));
    if (params.limit)       p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/gl/journal-entries`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        total: res.total ?? 0,
        page: res.page ?? 1
      })),
      catchError(err => throwError(() => err))
    );
  }

  getJournalEntryById(id: string): Observable<JournalEntry> {
    return this.http.get<any>(`${this.apiRoot}/gl/journal-entries/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  createJournalEntry(body: CreateJournalEntryBody): Observable<JournalEntry> {
    return this.http.post<any>(`${this.apiRoot}/gl/journal-entries`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  voidJournalEntry(id: string): Observable<{ message: string; data: JournalEntry; reversalEntry: JournalEntry }> {
    return this.http.post<any>(`${this.apiRoot}/gl/journal-entries/${id}/void`, {}).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 3. Accounts Payable (/finance/ap) ─────────────────────────────────────

  getApInvoices(params: { status?: string; vendorId?: string; search?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number } = {}): Observable<{ data: SupplierInvoice[]; kpis?: any }> {
    let p = new HttpParams();
    if (params.status)   p = p.set('status', params.status);
    if (params.vendorId) p = p.set('vendorId', params.vendorId);
    if (params.search)   p = p.set('search', params.search);
    if (params.dateFrom) p = p.set('dateFrom', params.dateFrom);
    if (params.dateTo)   p = p.set('dateTo', params.dateTo);
    if (params.page)     p = p.set('page', String(params.page));
    if (params.limit)    p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/ap/invoices`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        kpis: res.kpis
      })),
      catchError(err => throwError(() => err))
    );
  }

  createApInvoice(body: CreateSupplierInvoiceBody): Observable<SupplierInvoice> {
    return this.http.post<any>(`${this.apiRoot}/ap/invoices`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  getApAging(): Observable<APAgingEntry[]> {
    return this.http.get<any>(`${this.apiRoot}/ap/aging`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  getApVouchers(params: { vendorId?: string; status?: string } = {}): Observable<PaymentVoucher[]> {
    let p = new HttpParams();
    if (params.vendorId) p = p.set('vendorId', params.vendorId);
    if (params.status)   p = p.set('status', params.status);

    return this.http.get<any>(`${this.apiRoot}/ap/vouchers`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  createApVoucher(body: CreatePaymentVoucherBody): Observable<PaymentVoucher> {
    return this.http.post<any>(`${this.apiRoot}/ap/vouchers`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 4. Accounts Receivable (/finance/ar) ──────────────────────────────────

  getArInvoices(params: { status?: string; clientName?: string; search?: string; page?: number; limit?: number } = {}): Observable<{ data: SalesInvoice[]; kpis?: any }> {
    let p = new HttpParams();
    if (params.status)     p = p.set('status', params.status);
    if (params.clientName) p = p.set('clientName', params.clientName);
    if (params.search)     p = p.set('search', params.search);
    if (params.page)       p = p.set('page', String(params.page));
    if (params.limit)      p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/ar/invoices`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        kpis: res.kpis
      })),
      catchError(err => throwError(() => err))
    );
  }

  getArAging(): Observable<ARAgingEntry[]> {
    return this.http.get<any>(`${this.apiRoot}/ar/aging`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  getArVouchers(params: { page?: number; limit?: number } = {}): Observable<CollectionVoucher[]> {
    let p = new HttpParams();
    if (params.page)  p = p.set('page', String(params.page));
    if (params.limit) p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/ar/collection-vouchers`, { params: p }).pipe(
      map(res => res.data ?? (Array.isArray(res) ? res : [])),
      catchError(err => throwError(() => err))
    );
  }

  createArVoucher(body: CreateCollectionVoucherBody): Observable<CollectionVoucher> {
    return this.http.post<any>(`${this.apiRoot}/ar/collection-vouchers`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 5. Cash & Bank (/finance/cash-bank) ──────────────────────────────────

  getBankAccounts(): Observable<{ data: BankAccount[]; kpis?: any }> {
    return this.http.get<any>(`${this.apiRoot}/cash-bank/bank-accounts`).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        kpis: res.kpis
      })),
      catchError(err => throwError(() => err))
    );
  }

  createBankAccount(body: CreateBankAccountBody): Observable<BankAccount> {
    return this.http.post<any>(`${this.apiRoot}/cash-bank/bank-accounts`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  getCashAccounts(): Observable<CashAccount[]> {
    return this.http.get<any>(`${this.apiRoot}/cash-bank/cash-accounts`).pipe(
      map(res => res.data ?? (Array.isArray(res) ? res : [])),
      catchError(err => throwError(() => err))
    );
  }

  createCashAccount(body: CreateCashAccountBody): Observable<CashAccount> {
    return this.http.post<any>(`${this.apiRoot}/cash-bank/cash-accounts`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  getReconciliations(bankAccountId?: string): Observable<BankReconciliation[]> {
    let p = new HttpParams();
    if (bankAccountId) p = p.set('bankAccountId', bankAccountId);

    return this.http.get<any>(`${this.apiRoot}/cash-bank/reconciliations`, { params: p }).pipe(
      map(res => res.data ?? (Array.isArray(res) ? res : [])),
      catchError(err => throwError(() => err))
    );
  }

  createReconciliation(body: CreateReconciliationBody): Observable<BankReconciliation> {
    return this.http.post<any>(`${this.apiRoot}/cash-bank/reconciliations`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  adjustBankBalance(id: string, body: { operation: 'credit' | 'debit'; amount: number; reference: string }): Observable<{ message: string; newBalance: number }> {
    return this.http.patch<any>(`${this.apiRoot}/cash-bank/bank-accounts/${id}/balance`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 6. Budget (/finance/budget) ──────────────────────────────────────────

  getBudgets(params: { fiscalYear?: number; projectCode?: string; status?: string; page?: number; limit?: number } = {}): Observable<{ data: ProjectBudget[]; portfolioTotals?: any }> {
    let p = new HttpParams();
    if (params.fiscalYear)  p = p.set('fiscalYear', String(params.fiscalYear));
    if (params.projectCode) p = p.set('projectCode', params.projectCode);
    if (params.status)      p = p.set('status', params.status);
    if (params.page)        p = p.set('page', String(params.page));
    if (params.limit)       p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/budget`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        portfolioTotals: res.portfolioTotals
      })),
      catchError(err => throwError(() => err))
    );
  }

  createBudget(body: CreateBudgetBody): Observable<ProjectBudget> {
    return this.http.post<any>(`${this.apiRoot}/budget`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  updateBudget(id: string, body: CreateBudgetBody): Observable<ProjectBudget> {
    return this.http.put<any>(`${this.apiRoot}/budget/${id}`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  deleteBudget(id: string): Observable<{ message: string }> {
    return this.http.delete<any>(`${this.apiRoot}/budget/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 7. Cost Centers (/finance/cost-centers) ──────────────────────────────

  getCostCenters(params: { type?: string; status?: string; search?: string; page?: number; limit?: number } = {}): Observable<{ data: CostCenter[]; financeTotals?: any }> {
    let p = new HttpParams();
    if (params.type)   p = p.set('type', params.type);
    if (params.status) p = p.set('status', params.status);
    if (params.search) p = p.set('search', params.search);
    if (params.page)   p = p.set('page', String(params.page));
    if (params.limit)  p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/cost-centers`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        financeTotals: res.financeTotals
      })),
      catchError(err => throwError(() => err))
    );
  }

  createCostCenter(body: CreateCostCenterBody): Observable<CostCenter> {
    return this.http.post<any>(`${this.apiRoot}/cost-centers`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  updateCostCenter(code: string, body: Partial<CreateCostCenterBody>): Observable<CostCenter> {
    return this.http.put<any>(`${this.apiRoot}/cost-centers/${code}`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  deleteCostCenter(code: string): Observable<{ message: string }> {
    return this.http.delete<any>(`${this.apiRoot}/cost-centers/${code}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  toggleCostCenterStatus(code: string): Observable<{ message: string; status: 'Active' | 'Inactive'; data: CostCenter }> {
    return this.http.patch<any>(`${this.apiRoot}/cost-centers/${code}/toggle-status`, {}).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 8. Asset Depreciation (/finance/depreciation) ─────────────────────────

  getDepreciation(asOfDate?: string, search?: string): Observable<{ data: DepreciationEntry[]; totals: DepreciationTotals }> {
    let p = new HttpParams();
    if (asOfDate) p = p.set('asOfDate', asOfDate);
    if (search)   p = p.set('search', search);

    return this.http.get<any>(`${this.apiRoot}/depreciation`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? [],
        totals: res.totals ?? {
          totalCost: 0, totalAccumulated: 0, totalNBV: 0,
          totalAnnualCharge: 0, totalMonthlyCharge: 0, activeAssets: 0, fullyDepreciatedCount: 0
        }
      })),
      catchError(err => throwError(() => err))
    );
  }

  getDepreciationSchedule(assetId: string): Observable<any> {
    return this.http.get<any>(`${this.apiRoot}/depreciation/${assetId}/schedule`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  postMonthlyDepreciation(postingMonth: string): Observable<{ message: string; postingMonth: string; assetsCount: number; totalCharge: number; glEntry: JournalEntry }> {
    return this.http.post<any>(`${this.apiRoot}/depreciation/post-monthly`, { postingMonth }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 9. VAT Report (/finance/vat) ──────────────────────────────────────────

  getVatReport(periodStart?: string, periodEnd?: string): Observable<VATReportResponse> {
    let p = new HttpParams();
    if (periodStart) p = p.set('periodStart', periodStart);
    if (periodEnd)   p = p.set('periodEnd', periodEnd);

    return this.http.get<any>(`${this.apiRoot}/vat/report`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  postVatSettlement(body: { periodStart: string; periodEnd: string }): Observable<{ message: string; netVatPayable: number; type: 'payable' | 'receivable'; glEntry: JournalEntry }> {
    return this.http.post<any>(`${this.apiRoot}/vat/post-settlement`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 10. Financial Statements (/finance/statements) ────────────────────────

  getTrialBalance(asOfDate?: string): Observable<{ data: TrialBalanceLine[]; totals: { totalDebit: number; totalCredit: number; isBalanced: boolean } }> {
    let p = new HttpParams();
    if (asOfDate) p = p.set('asOfDate', asOfDate);

    return this.http.get<any>(`${this.apiRoot}/statements/trial-balance`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? [],
        totals: res.totals ?? { totalDebit: 0, totalCredit: 0, isBalanced: true }
      })),
      catchError(err => throwError(() => err))
    );
  }

  getIncomeStatement(periodStart?: string, asOfDate?: string): Observable<any[]> {
    let p = new HttpParams();
    if (periodStart) p = p.set('periodStart', periodStart);
    if (asOfDate)    p = p.set('asOfDate', asOfDate);

    return this.http.get<any>(`${this.apiRoot}/statements/income-statement`, { params: p }).pipe(
      map(res => res.data ?? (Array.isArray(res) ? res : [])),
      catchError(err => throwError(() => err))
    );
  }

  getBalanceSheet(asOfDate?: string): Observable<BalanceSheetResponse> {
    let p = new HttpParams();
    if (asOfDate) p = p.set('asOfDate', asOfDate);

    return this.http.get<any>(`${this.apiRoot}/statements/balance-sheet`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }
}
