import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

// ─── DAR Types ────────────────────────────────────────────────────────────────

export type DarStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
export type DarShift = 'Day' | 'Night' | 'Full Day';

export interface DarMaterialUsed {
  itemName: string;
  quantity: number;
  uom: string;
  id?: string;
}

export interface Dar {
  _id: string;
  contractId: string;
  contractNumber: string;
  rigId: string;
  rigName: string;
  reportDate: string;
  shift: DarShift;
  operatingHours: number;
  standbyHours: number;
  repairHours: number;
  downtimeHours: number;
  fuelConsumption: number;
  activitiesPerformed: string;
  hseIncidents?: string;
  weatherConditions?: string;
  preparedBy?: string;
  materialsUsed: DarMaterialUsed[];
  status: DarStatus;
  projectCode: string;
  costCenterCode: string;
  clientRepName?: string;
  approvedAt?: string;

  // Compat fields for legacy template bindings
  id?: string;
  darNumber?: string;
  approvalWorkflow?: any[];
}

export interface CreateDarBody {
  contractId: string;
  rigId: string;
  reportDate: string;
  shift?: DarShift;
  operatingHours?: number;
  standbyHours?: number;
  repairHours?: number;
  downtimeHours?: number;
  fuelConsumption?: number;
  activitiesPerformed?: string;
  hseIncidents?: string;
  weatherConditions?: string;
  preparedBy?: string;
  materialsUsed?: DarMaterialUsed[];
}

export interface DarListParams {
  contractId?: string;
  rigId?: string;
  status?: DarStatus | string;
  projectCode?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface ApproveDarBody {
  clientRepName?: string;
  clientSignature?: string;
}

// ─── WCC Types ────────────────────────────────────────────────────────────────

export type WccStatus = 'Draft' | 'Submitted' | 'Approved' | 'Invoiced' | 'Rejected';

export interface Wcc {
  _id: string;
  wccNumber: string;
  contractNumber: string;
  clientName: string;
  projectCode: string;
  periodFrom: string;
  periodTo: string;
  approvedDarIds: string[];
  totalOperatingHours: number;
  totalStandbyHours: number;
  totalOperatingDays: number;
  totalStandbyDays: number;
  operatingDayRate: number;
  standbyDayRate: number;
  operatingAmount: number;
  standbyAmount: number;
  mobilizationFee: number;
  subtotal: number;
  retentionPercent: number;
  status: WccStatus;

  // Compat fields for legacy template bindings
  id?: string;
  rigName?: string;
  darNumbers?: string[];
  approvalWorkflow?: any[];
  preparedBy?: string;
  lineItems?: any[];
}

export interface GenerateWccBody {
  contractId: string;
  periodFrom: string;
  periodTo: string;
}

// ─── Invoice Types ────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'Draft' | 'Sent' | 'Partially_Paid' | 'Paid' | 'Cancelled' | 'Overdue'
  | 'Fully Collected' | 'Partially Collected' | 'Pending' | 'Partially Paid' | 'Approved';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  wccNumber: string;
  contractNumber: string;
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  vatPercent: number;
  vatAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  withholdingTaxPercent: number;
  withholdingTaxAmount: number;
  netPayable: number;
  totalCollected: number;
  balanceDue: number;
  status: InvoiceStatus;
  glEntryNumber: string;

  // Compat fields for legacy template bindings
  id?: string;
  collectionNumber?: string;
  agingDays?: number;
  currency?: string;
  invoiceAmount?: number;
  outstandingBalance?: number;
  payments?: any[];
  issueDate?: string;
  paidAmount?: number;
  paymentTerms?: string;
  isEquipmentTransfer?: boolean;
  equipmentTransferNumber?: string;
  netPayableEGP?: number;
  exchangeRateUSDtoEGP?: number;
  costCenterCode?: string;
  notes?: string;
  approvalWorkflow?: any[];
}

export interface CreateInvoiceFromWccBody {
  wccId: string;
  vatPercent?: number;
  withholdingTaxPercent?: number;
  dueDate: string;
}

// ─── GL Journal Entry Types ───────────────────────────────────────────────────

export interface GlLine {
  accountCode: string;
  accountName: string;
  type: 'Debit' | 'Credit';
  amount: number;
}

export interface JournalEntry {
  _id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  reference: string;
  sourceType: 'Invoice' | 'Collection' | 'Manual' | 'Adjustment';
  totalDebit: number;
  totalCredit: number;
  status: 'Posted' | 'Voided';
  lines: GlLine[];
}

// ─── Collection Types ─────────────────────────────────────────────────────────

export interface Collection {
  _id: string;
  collectionNumber: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  date: string;
  method: 'Wire Transfer' | 'Cheque' | 'Cash' | 'Bank Transfer';
  reference?: string;
  glEntryNumber: string;
}

export interface CreateCollectionBody {
  amount: number;
  date: string;
  method: 'Wire Transfer' | 'Cheque' | 'Cash' | 'Bank Transfer';
  reference?: string;
  remarks?: string;
}

export interface AgingEntry {
  invoiceNumber: string;
  clientName: string;
  contractNumber: string;
  dueDate: string;
  netPayable: number;
  totalCollected: number;
  balanceDue: number;
  status: InvoiceStatus;
  daysOverdue: number;
  agingBucket: 'Current' | '1-30 Days' | '31-60 Days' | '61-90 Days' | 'Over 90 Days';
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private readonly http = inject(HttpClient);

  private get apiUrl(): string {
    return environment.apiUrl;
  }

  // ── DAR ───────────────────────────────────────────────────────────────────

  /** POST /workflow/dars */
  createDar(body: CreateDarBody): Observable<Dar> {
    return this.http.post<any>(`${this.apiUrl}/workflow/dars`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/dars */
  getDars(params: DarListParams = {}): Observable<PaginatedResponse<Dar>> {
    let p = new HttpParams();
    if (params.contractId)  p = p.set('contractId',  params.contractId);
    if (params.rigId)       p = p.set('rigId',       params.rigId);
    if (params.status)      p = p.set('status',      params.status);
    if (params.projectCode) p = p.set('projectCode', params.projectCode);
    if (params.from)        p = p.set('from',        params.from);
    if (params.to)          p = p.set('to',          params.to);
    if (params.page)        p = p.set('page',        String(params.page));
    if (params.limit)       p = p.set('limit',       String(params.limit));

    return this.http.get<any>(`${this.apiUrl}/workflow/dars`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/dars/:id */
  getDarById(id: string): Observable<Dar> {
    return this.http.get<any>(`${this.apiUrl}/workflow/dars/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /workflow/dars/:id/approve */
  approveDar(id: string, body?: ApproveDarBody): Observable<Dar> {
    return this.http.patch<any>(`${this.apiUrl}/workflow/dars/${id}/approve`, body ?? {}).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /workflow/dars/:id/submit */
  submitDar(id: string): Observable<Dar> {
    return this.http.patch<any>(`${this.apiUrl}/workflow/dars/${id}/submit`, {}).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /workflow/dars/:id/reject */
  rejectDar(id: string, reason: string): Observable<Dar> {
    return this.http.patch<any>(`${this.apiUrl}/workflow/dars/${id}/reject`, { reason }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── WCC ───────────────────────────────────────────────────────────────────

  /** POST /workflow/wccs/generate ⚡ Auto-Engine */
  generateWcc(body: GenerateWccBody): Observable<Wcc> {
    return this.http.post<any>(`${this.apiUrl}/workflow/wccs/generate`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/wccs */
  getWccs(params: { contractId?: string; status?: WccStatus | string; page?: number; limit?: number } = {}): Observable<PaginatedResponse<Wcc>> {
    let p = new HttpParams();
    if (params.contractId) p = p.set('contractId', params.contractId);
    if (params.status)     p = p.set('status',     params.status);
    if (params.page)       p = p.set('page',       String(params.page));
    if (params.limit)      p = p.set('limit',      String(params.limit));

    return this.http.get<any>(`${this.apiUrl}/workflow/wccs`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/wccs/:id */
  getWccById(id: string): Observable<Wcc> {
    return this.http.get<any>(`${this.apiUrl}/workflow/wccs/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /workflow/wccs/:id/approve */
  approveWcc(id: string): Observable<Wcc> {
    return this.http.patch<any>(`${this.apiUrl}/workflow/wccs/${id}/approve`, {}).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Invoices ──────────────────────────────────────────────────────────────

  /** POST /workflow/invoices/create-from-wcc ⚡ Auto Transaction */
  createInvoiceFromWcc(body: CreateInvoiceFromWccBody): Observable<{ invoice: Invoice; glEntry: JournalEntry }> {
    return this.http.post<any>(`${this.apiUrl}/workflow/invoices/create-from-wcc`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/invoices */
  getInvoices(params: { status?: string; contractId?: string; page?: number; limit?: number } = {}): Observable<PaginatedResponse<Invoice>> {
    let p = new HttpParams();
    if (params.status)     p = p.set('status',     params.status);
    if (params.contractId) p = p.set('contractId', params.contractId);
    if (params.page)       p = p.set('page',       String(params.page));
    if (params.limit)      p = p.set('limit',      String(params.limit));

    return this.http.get<any>(`${this.apiUrl}/workflow/invoices`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/invoices/:id */
  getInvoiceById(id: string): Observable<Invoice> {
    return this.http.get<any>(`${this.apiUrl}/workflow/invoices/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /workflow/invoices/:id/post-gl */
  postGlInvoice(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/workflow/invoices/${id}/post-gl`, {}).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── GL Journal Entries ────────────────────────────────────────────────────

  /** GET /workflow/journal-entries */
  getJournalEntries(params: { sourceType?: string; page?: number; limit?: number } = {}): Observable<PaginatedResponse<JournalEntry>> {
    let p = new HttpParams();
    if (params.sourceType) p = p.set('sourceType', params.sourceType);
    if (params.page)       p = p.set('page',       String(params.page));
    if (params.limit)      p = p.set('limit',      String(params.limit));

    return this.http.get<any>(`${this.apiUrl}/workflow/journal-entries`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Collections ───────────────────────────────────────────────────────────

  /** POST /workflow/collections/:invoiceId/payments ⚡ AR Settlement */
  createPayment(invoiceId: string, body: CreateCollectionBody): Observable<{
    collection: Collection;
    glEntry: JournalEntry;
    newBalanceDue: number;
    invoiceStatus: InvoiceStatus;
  }> {
    return this.http.post<any>(`${this.apiUrl}/workflow/collections/${invoiceId}/payments`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/collections */
  getCollections(params: { invoiceId?: string; page?: number; limit?: number } = {}): Observable<PaginatedResponse<Collection>> {
    let p = new HttpParams();
    if (params.invoiceId) p = p.set('invoiceId', params.invoiceId);
    if (params.page)      p = p.set('page',      String(params.page));
    if (params.limit)     p = p.set('limit',     String(params.limit));

    return this.http.get<any>(`${this.apiUrl}/workflow/collections`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/collections/aging ⚡ AR Aging Report */
  getAgingReport(): Observable<AgingEntry[]> {
    return this.http.get<any>(`${this.apiUrl}/workflow/collections/aging`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }
}
