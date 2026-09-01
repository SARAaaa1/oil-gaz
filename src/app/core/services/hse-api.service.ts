// HSE API Service — PetroFlow ERP v3.0
// Path: src/app/core/services/hse-api.service.ts
// Connects all HSE module pages to the real backend API.
// Falls back to existing mock signals when the API is unavailable.

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─── Incident Types ────────────────────────────────────────────────────────────

export type IncidentType     = 'LTI' | 'Near Miss' | 'First Aid' | 'Environmental' | 'Property Damage';
export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus   = 'Investigating' | 'Action Required' | 'Closed';

export interface HseIncidentApi {
  _id: string;
  id?: string;
  incidentNumber: string;
  type: IncidentType;
  severity: IncidentSeverity;
  date: string;
  location: string;
  description: string;
  immediateActionTaken: string;
  reportedBy: string;
  status: IncidentStatus;
  rootCause?: string;
  correctiveAction?: string;
  createdAt?: string;
}

export interface CreateIncidentBody {
  type: IncidentType;
  severity: IncidentSeverity;
  date: string;
  location: string;
  description: string;
  immediateActionTaken: string;
  reportedBy: string;
}

export interface UpdateIncidentBody {
  status?: IncidentStatus;
  rootCause?: string;
  correctiveAction?: string;
}

export interface HseIncidentListResponse {
  data: HseIncidentApi[];
  total: number;
  page: number;
  ltiCount?: number;
  nearMissCount?: number;
  openCount?: number;
}

// ─── PTW Types ─────────────────────────────────────────────────────────────────

export type PtwType   = 'Cold Work' | 'Hot Work' | 'Confined Space' | 'Electrical Isolation' | 'Working at Height';
export type PtwStatus = 'Pending Approval' | 'Approved' | 'Active' | 'Closed' | 'Cancelled';

export interface PtwApi {
  _id: string;
  id?: string;
  permitNumber: string;
  type: PtwType;
  requestDate: string;
  validFrom: string;
  validTo: string;
  location: string;
  applicantName: string;
  assignedProjectCode?: string;
  status: PtwStatus;
  gasTestRequired: boolean;
  gasTestResults?: string;
  safetyOfficerApproved: boolean;
  operationsManagerApproved: boolean;
  createdAt?: string;
}

export interface CreatePtwBody {
  type: PtwType;
  location: string;
  applicantName: string;
  validFrom: string;
  validTo: string;
  assignedProjectCode?: string;
  gasTestRequired?: boolean;
}

export interface ApprovePtwBody {
  gasTestResults?: string;
  approvalNotes?: string;
}

// ─── Safety Inspection Types ────────────────────────────────────────────────────

export type InspectionStatus = 'Closed' | 'Action Required';

export interface SafetyInspectionApi {
  _id: string;
  id?: string;
  inspectionNumber: string;
  date: string;
  location: string;
  inspectorName: string;
  itemsAuditedCount: number;
  violationsCount: number;
  scorePercentage: number;
  status: InspectionStatus;
  createdAt?: string;
}

export interface CreateInspectionBody {
  location: string;
  inspectorName: string;
  itemsAuditedCount: number;
  violationsCount: number;
  scorePercentage: number;
}

// ─── Risk Register Types ────────────────────────────────────────────────────────

export type RiskSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskStatus   = 'Open' | 'Mitigated' | 'Closed';

export interface SafetyRiskApi {
  _id: string;
  id?: string;
  riskCode: string;
  activityDescription: string;
  hazardDescription: string;
  initialSeverity: RiskSeverity;
  controlMeasures: string;
  residualSeverity: 'Low' | 'Medium' | 'High';
  status: RiskStatus;
  createdAt?: string;
}

export interface CreateRiskBody {
  activityDescription: string;
  hazardDescription: string;
  initialSeverity: RiskSeverity;
  controlMeasures: string;
  residualSeverity: 'Low' | 'Medium' | 'High';
}

// ─── HSE API Service ───────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class HseApiService {
  private readonly http = inject(HttpClient);

  private get apiRoot(): string {
    return `${environment.apiUrl}/hse`;
  }

  // ── 1. Incidents (/hse/incidents) ──────────────────────────────────────────

  getIncidents(params: { status?: IncidentStatus; type?: IncidentType; search?: string; page?: number; limit?: number } = {}): Observable<HseIncidentListResponse> {
    let p = new HttpParams();
    if (params.status) p = p.set('status', params.status);
    if (params.type)   p = p.set('type', params.type);
    if (params.search) p = p.set('search', params.search);
    if (params.page)   p = p.set('page', String(params.page));
    if (params.limit)  p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/incidents`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        total: res.total ?? 0,
        page: res.page ?? 1,
        ltiCount: res.ltiCount,
        nearMissCount: res.nearMissCount,
        openCount: res.openCount
      })),
      catchError(err => throwError(() => err))
    );
  }

  createIncident(body: CreateIncidentBody): Observable<HseIncidentApi> {
    return this.http.post<any>(`${this.apiRoot}/incidents`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  updateIncident(id: string, body: UpdateIncidentBody): Observable<HseIncidentApi> {
    return this.http.patch<any>(`${this.apiRoot}/incidents/${id}`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 2. Permit to Work (/hse/ptws) ─────────────────────────────────────────

  getPtws(params: { status?: PtwStatus; type?: PtwType; search?: string; page?: number; limit?: number } = {}): Observable<{ data: PtwApi[]; total: number; page: number }> {
    let p = new HttpParams();
    if (params.status) p = p.set('status', params.status);
    if (params.type)   p = p.set('type', params.type);
    if (params.search) p = p.set('search', params.search);
    if (params.page)   p = p.set('page', String(params.page));
    if (params.limit)  p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/ptws`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        total: res.total ?? 0,
        page: res.page ?? 1
      })),
      catchError(err => throwError(() => err))
    );
  }

  createPtw(body: CreatePtwBody): Observable<PtwApi> {
    return this.http.post<any>(`${this.apiRoot}/ptws`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  approvePtw(id: string, body: ApprovePtwBody = {}): Observable<PtwApi> {
    return this.http.patch<any>(`${this.apiRoot}/ptws/${id}/approve`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 3. Safety Inspections (/hse/safety-inspections) ───────────────────────

  getSafetyInspections(params: { status?: InspectionStatus; search?: string; page?: number; limit?: number } = {}): Observable<{ data: SafetyInspectionApi[]; total: number; page: number }> {
    let p = new HttpParams();
    if (params.status) p = p.set('status', params.status);
    if (params.search) p = p.set('search', params.search);
    if (params.page)   p = p.set('page', String(params.page));
    if (params.limit)  p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/safety-inspections`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        total: res.total ?? 0,
        page: res.page ?? 1
      })),
      catchError(err => throwError(() => err))
    );
  }

  createSafetyInspection(body: CreateInspectionBody): Observable<SafetyInspectionApi> {
    return this.http.post<any>(`${this.apiRoot}/safety-inspections`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── 4. Risk Register (/hse/risks) ─────────────────────────────────────────

  getRisks(params: { status?: RiskStatus; severity?: RiskSeverity; search?: string; page?: number; limit?: number } = {}): Observable<{ data: SafetyRiskApi[]; total: number; page: number }> {
    let p = new HttpParams();
    if (params.status)   p = p.set('status', params.status);
    if (params.severity) p = p.set('severity', params.severity);
    if (params.search)   p = p.set('search', params.search);
    if (params.page)     p = p.set('page', String(params.page));
    if (params.limit)    p = p.set('limit', String(params.limit));

    return this.http.get<any>(`${this.apiRoot}/risks`, { params: p }).pipe(
      map(res => ({
        data: res.data ?? (Array.isArray(res) ? res : []),
        total: res.total ?? 0,
        page: res.page ?? 1
      })),
      catchError(err => throwError(() => err))
    );
  }

  createRisk(body: CreateRiskBody): Observable<SafetyRiskApi> {
    return this.http.post<any>(`${this.apiRoot}/risks`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }
}
