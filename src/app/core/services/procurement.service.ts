import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─── Procurement Types ────────────────────────────────────────────────────────

export interface PrListParams {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

// ─── Purchase Request ─────────────────────────────────────────────────────────

export interface CreatePRBody {
  department: string;
  costCenter: string;
  chargeType: string;
  projectId?: string;
  projectName?: string;
  assetId?: string;
  assetName?: string;
  requiredDate: string;
  description: string;
  requestedBy: string;
  items: any[];
}

export interface UpdatePRStatusBody {
  status: string;
  approvedBy?: string;
  comments?: string;
}

// ─── RFQ ─────────────────────────────────────────────────────────────────────

export interface CreateRFQBody {
  purchaseRequestId: string;
  title: string;
  deadlineDate: string;
  requiredDeliveryDate?: string;
  vendors: { vendorId: string; vendorName: string; contactEmail?: string }[];
}

export interface AddQuotationBody {
  vendorId: string;
  vendorName: string;
  validityDate?: string;
  paymentTerms?: string;
  price: number;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  deliveryWeeks: number;
  items: any[];
  notes?: string;
  attachments?: any[];
}

export interface AwardRFQBody {
  vendorId: string;
  quotationId: string;
}

export interface InviteVendorsBody {
  vendors: { vendorId: string; vendorName: string; contactEmail?: string }[];
}

export interface UpdateQuotationStatusBody {
  status: string;
}

// ─── Purchase Order ───────────────────────────────────────────────────────────

export interface ApprovePOBody {
  role: string;
  approverName: string;
  comments?: string;
}

export interface CreatePOBody {
  vendorId: string;
  vendorName: string;
  totalValue: number;
  paymentTerms?: string;
  deliveryDate?: string;
  items: any[];
}

// ─── Inspection / NCR ────────────────────────────────────────────────────────

export interface SubmitInspectionBody {
  inspectorName: string;
  inspectionDate: string;
  status: 'Accepted' | 'Rejected' | 'Conditional';
  notes?: string;
  items: any[];
}

export interface CreateNCRBody {
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  rootCause?: string;
  correctiveAction?: string;
}

export interface ResolveNCRBody {
  resolvedBy: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProcurementService {
  private readonly http = inject(HttpClient);

  /**
   * الـ base URL للـ procurement endpoints.
   * الـ environment.apiUrl = 'https://erp-production-586b.up.railway.app/api/v1'
   * فيكون المسار الكامل: /api/v1/procurement/...
   */
  private get baseUrl(): string {
    return `${environment.apiUrl}/procurement`;
  }

  // ── Purchase Requests ──────────────────────────────────────────────────────

  /** POST /procurement/purchase-requests */
  createPR(body: CreatePRBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/purchase-requests`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /procurement/purchase-requests */
  getPRs(params: PrListParams = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page)       httpParams = httpParams.set('page', String(params.page));
    if (params.limit)      httpParams = httpParams.set('limit', String(params.limit));
    if (params.status)     httpParams = httpParams.set('status', params.status);
    if (params.department) httpParams = httpParams.set('department', params.department);
    if (params.search)     httpParams = httpParams.set('search', params.search);
    if (params.sortBy)     httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder)  httpParams = httpParams.set('sortOrder', params.sortOrder);

    return this.http.get<any>(
      `${this.baseUrl}/purchase-requests`,
      { params: httpParams }
    ).pipe(catchError(err => throwError(() => err)));
  }

  /** GET /procurement/purchase-requests/:id */
  getPRById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/purchase-requests/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /procurement/purchase-requests/:id/status */
  updatePRStatus(id: string, body: UpdatePRStatusBody): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/purchase-requests/${id}/status`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** DELETE /procurement/purchase-requests/:id */
  deletePR(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/purchase-requests/${id}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  // ── RFQs ───────────────────────────────────────────────────────────────────

  /** POST /procurement/rfqs */
  createRFQ(body: CreateRFQBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/rfqs`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /procurement/rfqs */
  getRFQs(page = 1, limit = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/rfqs`,
      { params }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /procurement/rfqs/:id */
  getRFQById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/rfqs/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /procurement/rfqs/:id/quotations */
  addQuotation(rfqId: string, body: AddQuotationBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/rfqs/${rfqId}/quotations`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /procurement/rfqs/:id/award */
  awardRFQ(rfqId: string, body: AwardRFQBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/rfqs/${rfqId}/award`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /procurement/rfqs/:id/invite-vendors */
  inviteVendors(rfqId: string, body: InviteVendorsBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/rfqs/${rfqId}/invite-vendors`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /procurement/rfqs/:id/quotations/:qId/status */
  updateQuotationStatus(rfqId: string, qId: string, body: UpdateQuotationStatusBody): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/rfqs/${rfqId}/quotations/${qId}/status`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Quotation Comparison ───────────────────────────────────────────────────

  /** GET /procurement/quotation-comparison */
  getQuotationComparisons(page = 1, limit = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/quotation-comparison`,
      { params }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /procurement/quotation-comparison/:rfqId */
  getQuotationComparisonByRFQ(rfqId: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/quotation-comparison/${rfqId}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Purchase Orders ────────────────────────────────────────────────────────

  /** GET /procurement/purchase-orders */
  getPOs(page = 1, limit = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/purchase-orders`,
      { params }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /procurement/purchase-orders/:id */
  getPOById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/purchase-orders/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /procurement/purchase-orders */
  createManualPO(body: CreatePOBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/purchase-orders`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /procurement/purchase-orders/:id/approve */
  approvePO(id: string, body: ApprovePOBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/purchase-orders/${id}/approve`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /procurement/purchase-orders/:id/download */
  downloadPOContract(id: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/purchase-orders/${id}/download`,
      { responseType: 'blob', observe: 'response' }
    ).pipe(catchError(err => throwError(() => err)));
  }

  // ── Inspection / NCR ──────────────────────────────────────────────────────

  /** POST /procurement/inspection/:id/submit */
  submitInspection(poId: string, body: SubmitInspectionBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/inspection/${poId}/submit`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /procurement/inspection/:id/ncr */
  createNCR(poId: string, body: CreateNCRBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/inspection/${poId}/ncr`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /procurement/inspection/ncrs/:id/resolve */
  resolveNCR(ncrId: string, body: ResolveNCRBody): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/inspection/ncrs/${ncrId}/resolve`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /procurement/inspection */
  getInspections(page = 1, limit = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/inspection`,
      { params }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /procurement/inspection/ncrs */
  getNCRs(page = 1, limit = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/inspection/ncrs`,
      { params }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /procurement/inspection/:id */
  getInspectionById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/inspection/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── v3.0 Approval Workflow Endpoints ──────────────────────────────────────

  /**
   * PATCH /procurement/purchase-requests/:id/approve
   * اعتماد أو رفض طلب الشراء — Action: 'approve' | 'reject'
   */
  approvePR(id: string, body: { action: 'approve' | 'reject'; comments?: string }): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/purchase-requests/${id}/approve`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * POST /procurement/rfqs/:id/send
   * إرسال طلب عروض الأسعار للموردين
   */
  sendRfqToVendors(rfqId: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/rfqs/${rfqId}/send`,
      {}
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * PATCH /procurement/purchase-orders/:id/approve
   * اعتماد أمر الشراء عبر PATCH (بديل للـ POST الموجود)
   */
  approvePOPatch(id: string, body: ApprovePOBody): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/purchase-orders/${id}/approve`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }
}
