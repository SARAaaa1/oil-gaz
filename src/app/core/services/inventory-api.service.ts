import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
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

  // ── Reports ────────────────────────────────────────────────────────────────

  /** GET /inventory/summary */
  getSummary(): Observable<InventorySummary> {
    return this.http.get<ApiResponse<InventorySummary>>(
      `${this.baseUrl}/summary`
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /inventory/valuation */
  getValuation(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/valuation`
    ).pipe(
      map(res => res.data ?? (res as any)),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /inventory/item-ledger/:itemCode */
  getItemLedger(itemCode: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/item-ledger/${itemCode}`
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }
}
