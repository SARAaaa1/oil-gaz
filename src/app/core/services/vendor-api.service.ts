import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VendorFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  approvalStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class VendorApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vendors`;
  private readonly portalUrl = `${environment.apiUrl}/vendor-portal`;
  private readonly authUrl = `${environment.apiUrl}/auth/vendor`;

  // ── 1. Admin Console Endpoints ──────────────────────────────────────────

  getVendors(filters: VendorFilters = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const val = (filters as any)[key];
      if (val !== null && val !== undefined && val !== '') {
        params = params.set(key, String(val));
      }
    });
    return this.http.get<any>(this.baseUrl, { params });
  }

  getVendorKpis(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/summary/kpis`);
  }

  getLeaderboard(limit = 10): Observable<any> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<any>(`${this.baseUrl}/leaderboard`, { params });
  }

  createVendor(payload: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  updateVendor(id: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  updateVendorStatus(id: string, statusPayload: { status: string; approvalStatus?: string; reason?: string }): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, statusPayload);
  }

  getVendorTimeline(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/timeline`);
  }

  addTimelineEvent(id: string, event: { eventType: string; title: string; description: string; referenceNumber?: string; amount?: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/timeline`, event);
  }

  getVendorLedger(id: string, queryParams: { startDate?: string; endDate?: string; transactionType?: string } = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(queryParams).forEach(key => {
      const val = (queryParams as any)[key];
      if (val) params = params.set(key, String(val));
    });
    return this.http.get<any>(`${this.baseUrl}/${id}/ledger`, { params });
  }

  getVendorDocuments(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/documents`);
  }

  uploadVendorDocument(id: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/documents`, formData);
  }

  deleteVendorDocument(id: string, docId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}/documents/${docId}`);
  }

  submitEvaluation(id: string, payload: {
    deliveryScore: number;
    qualityScore: number;
    priceScore: number;
    communicationScore: number;
    period?: string;
    comments?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/evaluations`, payload);
  }

  getVendorPerformance(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/performance`);
  }

  // ── 2. Public Self-Registration ─────────────────────────────────────────

  registerPublicVendor(payload: any): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/register`, payload);
  }

  // ── 3. Vendor Portal (Authenticated as Vendor) ──────────────────────────

  getPortalDashboard(): Observable<any> {
    return this.http.get<any>(`${this.portalUrl}/dashboard`);
  }

  getPortalRFQs(status?: string, page = 1, limit = 20): Observable<any> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<any>(`${this.portalUrl}/rfqs`, { params });
  }

  getPortalRFQDetails(rfqId: string): Observable<any> {
    return this.http.get<any>(`${this.portalUrl}/rfqs/${rfqId}`);
  }

  submitPortalQuotation(rfqId: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.portalUrl}/rfqs/${rfqId}/quotations`, payload);
  }

  getPortalQuotationHistory(page = 1, limit = 20): Observable<any> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<any>(`${this.portalUrl}/history`, { params });
  }
}
