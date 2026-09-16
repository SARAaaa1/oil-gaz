import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  CreateOpeningStockDto, 
  OpeningStockImportResponse,
  ItemLedgerReportResponse,
  StockSummaryReportResponse,
  ValuationReportResponse,
  ReorderAlertsReportResponse,
  StockAgingReportResponse,
  ConsumptionByProjectReportResponse,
  StockCountVarianceReportResponse
} from '../../shared/interfaces/inventory.interface';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export function extractApiArray<T = any>(res: any): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.docs)) return res.docs;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (res.data && Array.isArray(res.data.docs)) return res.data.docs;
  return [];
}

export interface ItemsListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  location?: string;
}

export interface CreateItemBody {
  itemCode: string;
  itemName: string;
  uom: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  itemType?: string;
  category?: string;
  location?: string;
}

export interface UpdateItemBody {
  itemName?: string;
  unitPrice?: number;
  minQuantity?: number;
  location?: string;
  quantity?: number;
  category?: string;
  uom?: string;
}

export interface CreateWarehouseBody {
  code: string;
  name: string;
  location?: string;
  status?: 'Active' | 'Inactive';
}

export interface UpdateWarehouseBody {
  name?: string;
  location?: string;
  status?: 'Active' | 'Inactive';
}

export interface InventorySummary {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingMRVs: number;
  pendingMIVs: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly http = inject(HttpClient);

  /**
   * الـ environment.apiUrl = 'https://erp-production-586b.up.railway.app/api/v1'
   *
   * - Items, Warehouses, Counts, Reports   → /api/v1/inventory/...
   * - MIVs, MRVs, Adjustments, Transfers   → /api/v1/inventory/... (نفس الـ prefix)
   */
  private get baseUrl(): string {
    return `${environment.apiUrl}/inventory`;
  }

  // ── Items ──────────────────────────────────────────────────────────────────

  /** POST /inventory/items */
  createItem(body: CreateItemBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/items`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /inventory/items */
  getItems(params: ItemsListParams = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.page)     httpParams = httpParams.set('page',     String(params.page));
    if (params.limit)    httpParams = httpParams.set('limit',    String(params.limit));
    if (params.search)   httpParams = httpParams.set('search',   params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.status)   httpParams = httpParams.set('status',   params.status);
    if (params.location) httpParams = httpParams.set('location', params.location);

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/items`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /inventory/items/:id */
  getItemById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/items/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /inventory/items/:id */
  updateItem(id: string, body: UpdateItemBody): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/items/${id}`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** DELETE /inventory/items/:id */
  deleteItem(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/items/${id}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  /** GET /inventory/items/:itemCode/availability */
  getItemAvailability(itemCode: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/items/${itemCode}/availability`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Warehouses ─────────────────────────────────────────────────────────────

  /** POST /inventory/warehouses */
  createWarehouse(body: CreateWarehouseBody): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/warehouses`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /inventory/warehouses */
  getWarehouses(page = 1): Observable<any> {
    const params = new HttpParams().set('page', String(page));
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/warehouses`,
      { params }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /inventory/warehouses/:id */
  updateWarehouse(id: string, body: UpdateWarehouseBody): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/warehouses/${id}`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** DELETE /inventory/warehouses/:id */
  deleteWarehouse(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/warehouses/${id}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  // ── MIVs — سندات الصرف ────────────────────────────────────────────────────

  /** POST /api/v1/inventory/mivs */
  createMIV(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/mivs`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /api/v1/inventory/mivs */
  getMIVs(query: Record<string, any> = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/mivs`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /api/v1/inventory/mivs/:id */
  getMIVById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/mivs/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /api/v1/inventory/mivs/:id */
  updateMIV(id: string, body: any): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/mivs/${id}`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** DELETE /api/v1/inventory/mivs/:id */
  deleteMIV(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/mivs/${id}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  // ── MRVs — سندات الاستلام ─────────────────────────────────────────────────

  /** POST /api/v1/inventory/mrvs */
  createMRV(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/mrvs`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /api/v1/inventory/mrvs */
  getMRVs(query: Record<string, any> = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/mrvs`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /api/v1/inventory/mrvs/:id */
  getMRVById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/mrvs/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /api/v1/inventory/mrvs/:id */
  updateMRV(id: string, body: any): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/mrvs/${id}`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /api/v1/inventory/mrvs/:id/post — Posts MRV and updates stock & PO status */
  postMRV(id: string, body: { postedBy?: string; postingDate?: string } = {}): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/mrvs/${id}/post`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /api/v1/inventory/item-ledger/:itemCode */
  getItemLedgerByCode(itemCode: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/item-ledger/${encodeURIComponent(itemCode)}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** DELETE /api/v1/inventory/mrvs/:id */
  deleteMRV(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/mrvs/${id}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  // ── Adjustments — تسويات المخزون ─────────────────────────────────────────

  /** POST /api/v1/inventory/adjustments */
  createAdjustment(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/adjustments`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /api/v1/inventory/adjustments */
  getAdjustments(query: Record<string, any> = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/adjustments`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /api/v1/inventory/adjustments/:id */
  getAdjustmentById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/adjustments/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /api/v1/inventory/adjustments/:id */
  updateAdjustment(id: string, body: any): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/adjustments/${id}`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** DELETE /api/v1/inventory/adjustments/:id */
  deleteAdjustment(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/adjustments/${id}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  // ── Transfers — تحويلات بين المستودعات ───────────────────────────────────

  /** POST /api/v1/inventory/transfers */
  createTransfer(body: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/transfers`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /api/v1/inventory/transfers */
  getTransfers(query: Record<string, any> = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/transfers`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /api/v1/inventory/transfers/:id */
  getTransferById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/transfers/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /api/v1/inventory/transfers/:id */
  updateTransfer(id: string, body: any): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/transfers/${id}`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** DELETE /api/v1/inventory/transfers/:id */
  deleteTransfer(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/transfers/${id}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  // ── Counts — الجرد الدوري ──────────────────────────────────────────────────

  /** POST /inventory/counts */
  createCount(body: { warehouseId: string; countedBy: string; items: any[] }): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/counts`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /inventory/counts/:id/complete */
  completeCount(id: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/counts/${id}/complete`,
      {}
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Reports (Legacy & Enterprise v1 Endpoints) ───────────────────────────

  /** GET /inventory/summary */
  getSummary(): Observable<InventorySummary> {
    return this.http.get<ApiResponse<InventorySummary>>(
      `${this.baseUrl}/summary`
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /inventory/valuation (Legacy) */
  getValuation(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/valuation`
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /inventory/item-ledger/:itemCode (Legacy) */
  getItemLedger(itemCode: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/item-ledger/${itemCode}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Enterprise Reporting Engine Endpoints (/inventory/reports/*) ──────────

  /**
   * 1. GET /inventory/reports/item-ledger
   * كارت حركة الصنف التاريخي مع رصيد افتتاحي وحركات ورصيد إغلاق
   */
  getReportItemLedger(params: {
    itemId: string;
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<ItemLedgerReportResponse> {
    let httpParams = new HttpParams().set('itemId', params.itemId);
    if (params.warehouseId && params.warehouseId !== 'all') httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http.get<ApiResponse<ItemLedgerReportResponse>>(
      `${this.baseUrl}/reports/item-ledger`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * 2. GET /inventory/reports/stock-summary
   * مصفوفة أرصدة المخزون وحركاته (افتتاحي، مشتريات، منصرف، تحويلات، رصيد ختامي) + مؤشرات KPIs
   */
  getReportStockSummary(params: {
    warehouseId?: string;
    categoryId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<StockSummaryReportResponse> {
    let httpParams = new HttpParams();
    if (params.warehouseId && params.warehouseId !== 'all') httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params.categoryId && params.categoryId !== 'all') httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http.get<ApiResponse<StockSummaryReportResponse>>(
      `${this.baseUrl}/reports/stock-summary`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * 3. GET /inventory/reports/valuation
   * تقرير تقييم أصول المخزون المالي بنظامي WAVG أو FIFO
   */
  getReportValuation(params: {
    warehouseId?: string;
    asOfDate?: string;
    valuationMethod?: 'WAVG' | 'FIFO';
  } = {}): Observable<ValuationReportResponse> {
    let httpParams = new HttpParams();
    if (params.warehouseId && params.warehouseId !== 'all') httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params.asOfDate) httpParams = httpParams.set('asOfDate', params.asOfDate);
    if (params.valuationMethod) httpParams = httpParams.set('valuationMethod', params.valuationMethod);

    return this.http.get<ApiResponse<ValuationReportResponse>>(
      `${this.baseUrl}/reports/valuation`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * 4. GET /inventory/reports/reorder-alerts
   * تنبيهات إعادة الطلب ونفاد المخزون (حرجة وتحذيرية) مع كميات أوامر الشراء المفتوحة
   */
  getReportReorderAlerts(params: {
    warehouseId?: string;
    urgency?: 'critical' | 'warning';
  } = {}): Observable<ReorderAlertsReportResponse> {
    let httpParams = new HttpParams();
    if (params.warehouseId && params.warehouseId !== 'all') httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params.urgency) httpParams = httpParams.set('urgency', params.urgency);

    return this.http.get<ApiResponse<ReorderAlertsReportResponse>>(
      `${this.baseUrl}/reports/reorder-alerts`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * 5. GET /inventory/reports/aging
   * أعمار المخزون والركود (Aging Brackets) وتحديد الأصناف الراكدة (Dead Stock)
   */
  getReportAging(params: {
    warehouseId?: string;
    asOfDate?: string;
  } = {}): Observable<StockAgingReportResponse> {
    let httpParams = new HttpParams();
    if (params.warehouseId && params.warehouseId !== 'all') httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params.asOfDate) httpParams = httpParams.set('asOfDate', params.asOfDate);

    return this.http.get<ApiResponse<StockAgingReportResponse>>(
      `${this.baseUrl}/reports/aging`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * 6. GET /inventory/reports/consumption-by-project
   * استهلاك المواد موزعة حسب المشروع أو مركز التكلفة
   */
  getReportConsumptionByProject(params: {
    projectId?: string;
    costCenter?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<ConsumptionByProjectReportResponse> {
    let httpParams = new HttpParams();
    if (params.projectId && params.projectId !== 'all') httpParams = httpParams.set('projectId', params.projectId);
    if (params.costCenter) httpParams = httpParams.set('costCenter', params.costCenter);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http.get<ApiResponse<ConsumptionByProjectReportResponse>>(
      `${this.baseUrl}/reports/consumption-by-project`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * 7. GET /inventory/reports/stock-count-variance
   * فروقات الجرد الفعلي للمخزون مقارنة بالنظام مع التقييم المالي
   */
  getReportStockCountVariance(params: {
    warehouseId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<StockCountVarianceReportResponse> {
    let httpParams = new HttpParams();
    if (params.warehouseId && params.warehouseId !== 'all') httpParams = httpParams.set('warehouseId', params.warehouseId);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http.get<ApiResponse<StockCountVarianceReportResponse>>(
      `${this.baseUrl}/reports/stock-count-variance`,
      { params: httpParams }
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * تنزيل تقرير بصيغة CSV مباشرة من خادم الباك إند
   */
  downloadReportCsv(endpointName: string, params: Record<string, any>, filename: string): Observable<Blob> {
    let httpParams = new HttpParams().set('format', 'csv');
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '' && params[k] !== 'all') {
        httpParams = httpParams.set(k, String(params[k]));
      }
    });

    return this.http.get(`${this.baseUrl}/reports/${endpointName}`, {
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      map(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return blob;
      }),
      catchError(err => throwError(() => err))
    );
  }

  // ── Opening Stock — الرصيد الافتتاحي (v3.1 Auto-Posting & Reversal) ──────────

  /** GET /inventory/opening-stock */
  getOpeningStocks(params: {
    status?: string;
    warehouseCode?: string;
    itemCode?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params.status && params.status !== 'ALL') httpParams = httpParams.set('status', params.status);
    if (params.warehouseCode && params.warehouseCode !== 'ALL') httpParams = httpParams.set('warehouseCode', params.warehouseCode);
    if (params.itemCode) httpParams = httpParams.set('itemCode', params.itemCode);
    if (params.page) httpParams = httpParams.set('page', String(params.page));
    if (params.limit) httpParams = httpParams.set('limit', String(params.limit));

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/opening-stock`,
      { params: httpParams }
    ).pipe(
      map(res => extractApiArray(res)),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /inventory/opening-stock */
  createOpeningStock(body: CreateOpeningStockDto): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/opening-stock`,
      body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * POST /inventory/opening-stock/import
   * Auto-Posts opening stock and updates inventory balances automatically!
   */
  importOpeningStock(file: File): Observable<OpeningStockImportResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<OpeningStockImportResponse>(
      `${this.baseUrl}/opening-stock/import`,
      formData
    ).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /inventory/opening-stock/:id/post */
  postOpeningStock(id: string): Observable<any> {
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/opening-stock/${id}/post`,
      {}
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * DELETE /inventory/opening-stock/:id
   * Cancels/deletes opening stock and automatically reverses stock impact if POSTED!
   */
  deleteOpeningStock(id: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/opening-stock/${id}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }
}

