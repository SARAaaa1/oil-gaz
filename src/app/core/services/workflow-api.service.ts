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

// ─── Contract Types ───────────────────────────────────────────────────────────

export type ContractType = 'Daily Rate' | 'Lump Sum' | 'Unit Rate' | 'Time & Material';
export type ContractStatus = 'Draft' | 'Active' | 'Completed' | 'Suspended' | 'Terminated';

export interface RateSheetItem {
  id: string;
  description: string;
  unit: string;
  rate: number;
  currency: string;
}

export interface ContractMilestone {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface Contract {
  _id: string;
  contractNumber: string;
  title: string;
  clientName: string;
  clientContact?: string;
  clientEmail?: string;
  type: ContractType;
  startDate: string;
  endDate: string;
  value: number;
  currency: string;
  scope?: string;
  rigId?: string;
  rigName?: string;
  projectManager?: string;
  retentionPercent: number;
  vatRate: number;
  withholdingRate: number;
  paymentTerms: string;
  country?: string;
  region?: string;
  siteName?: string;
  rateSheet: RateSheetItem[];
  milestones: ContractMilestone[];
  status: ContractStatus;
  projectCode?: string;
  costCenterCode?: string;
  createdAt?: string;

  // Compat fields for legacy template bindings
  id?: string;
  contractValueEGP?: number;

  rateSnapshotDate?: string;
  projectName?: string;
  gpsCoordinates?: string;
  preferredWarehouse?: string;
  attachments?: any[];
}

export interface ContractListParams {
  search?: string;
  status?: ContractStatus | string;
  clientName?: string;
  page?: number;
  limit?: number;
}

export interface CreateContractBody {
  title: string;
  clientName: string;
  clientContact?: string;
  clientEmail?: string;
  type: ContractType;
  startDate: string;
  endDate: string;
  value: number;
  currency?: string;
  contractValueEGP?: number;
  rateSnapshotDate?: string;
  scope?: string;
  rigId?: string;
  rigName?: string;
  projectManager?: string;
  retentionPercent?: number;
  vatRate?: number;
  withholdingRate?: number;
  paymentTerms?: string;
  country?: string;
  region?: string;
  siteName?: string;
  gpsCoordinates?: string;
  costCenterCode?: string;
  costCenterName?: string;
  parentCostCenter?: string;
  preferredWarehouse?: string;
  nearestWarehouse?: string;
  distanceKm?: number;
  estimatedTransportationCost?: number;
  rateSheet?: RateSheetItem[];
  milestones?: ContractMilestone[];
}

export interface ContractStatusUpdateResponse {
  message: string;
  contractNumber: string;
  projectCode?: string;
  costCenterCode?: string;
  projectId?: string;
  costCenterId?: string;
}

// ─── Project Types ────────────────────────────────────────────────────────────

export type ProjectStatus =
  | 'Active' | 'On_Hold' | 'Completed' | 'Cancelled' | 'Suspended' | 'Delayed';

export interface Project {
  _id: string;
  code: string;
  name: string;
  contractNumber: string;
  costCenterCode: string;
  customer: string;
  rigName?: string;
  contractValue: number;
  budgetValue: number;
  consumedValue: number;
  remainingValue: number;
  progressPercent: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
}

export interface ProjectCostSummary {
  projectCode: string;
  projectName: string;
  contractValue: number;
  budgetValue: number;
  consumedValue: number;
  remainingValue: number;
  progressPercent: number;
  utilizationPercent: number;
}

export interface ProjectListParams {
  search?: string;
  status?: ProjectStatus | string;
  customer?: string;
  page?: number;
  limit?: number;
}

// ─── Project Resource Types ───────────────────────────────────────────────────

export interface ProjectEquipment {
  _id: string;
  equipmentCode: string;
  equipmentName: string;
  projectCode: string;
  siteName: string;
  assignedDate: string;
  status: string;
  hoursUsed: number;
  daysUsed: number;
  costCenterCode: string;
}

export interface AssignEquipmentBody {
  equipmentId: string;
  siteName?: string;
  assignedDate?: string;
  dailyRate?: number;
}

export interface AddMaterialBody {
  materialCode: string;
  materialName: string;
  warehouse: string;
  issuedQuantity: number;
  consumedQuantity: number;
  unit?: string;
  unitPrice?: number;
  docRef?: string;
  issueDate?: string;
  notes?: string;
}

export interface AddLaborBody {
  employeeName: string;
  role: string;
  date: string;
  regularHours: number;
  overtimeHours?: number;
  hourlyRate: number;
  overtimeRate?: number;
  notes?: string;
}

export interface AddTransferBody {
  equipmentId: string;
  fromLocation: string;
  toLocation: string;
  startDate?: string;
  transportationHours?: number;
  transportationCost?: number;
  reason?: string;
}

// ─── Cost Center Types ────────────────────────────────────────────────────────

export type CostCenterType = 'Project' | 'Department' | 'Overhead' | 'General';

export interface CostCenter {
  _id: string;
  code: string;
  name: string;
  type: CostCenterType;
  parentCode?: string;
  description?: string;
  isActive: boolean;
}

export interface CreateCostCenterBody {
  code: string;
  name: string;
  type: CostCenterType;
  parentCode?: string;
  description?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class WorkflowApiService {
  private readonly http = inject(HttpClient);

  private get apiUrl(): string {
    return environment.apiUrl;
  }

  // ── Contracts ───────────────────────────────────────────────────────────────

  /** POST /workflow/contracts */
  createContract(body: CreateContractBody): Observable<Contract> {
    return this.http.post<any>(`${this.apiUrl}/workflow/contracts`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/contracts */
  getContracts(params: ContractListParams = {}): Observable<PaginatedResponse<Contract>> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search',     params.search);
    if (params.status)     p = p.set('status',     params.status);
    if (params.clientName) p = p.set('clientName', params.clientName);
    if (params.page)       p = p.set('page',       String(params.page));
    if (params.limit)      p = p.set('limit',      String(params.limit));

    return this.http.get<any>(`${this.apiUrl}/workflow/contracts`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /workflow/contracts/:id */
  getContractById(id: string): Observable<Contract> {
    return this.http.get<any>(`${this.apiUrl}/workflow/contracts/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /workflow/contracts/:id — تعديل (Draft فقط) */
  updateContract(id: string, body: Partial<CreateContractBody>): Observable<Contract> {
    return this.http.patch<any>(`${this.apiUrl}/workflow/contracts/${id}`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /workflow/contracts/:id/status ⚡ Auto-Engine */
  updateContractStatus(id: string, status: ContractStatus): Observable<ContractStatusUpdateResponse> {
    return this.http.patch<any>(`${this.apiUrl}/workflow/contracts/${id}/status`, { status }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Projects ─────────────────────────────────────────────────────────────────

  /** GET /projects */
  getProjects(params: ProjectListParams = {}): Observable<PaginatedResponse<Project>> {
    let p = new HttpParams();
    if (params.search)   p = p.set('search',   params.search);
    if (params.status)   p = p.set('status',   params.status);
    if (params.customer) p = p.set('customer', params.customer);
    if (params.page)     p = p.set('page',     String(params.page));
    if (params.limit)    p = p.set('limit',    String(params.limit));

    return this.http.get<any>(`${this.apiUrl}/projects`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /projects/:code */
  getProjectByCode(code: string): Observable<Project> {
    return this.http.get<any>(`${this.apiUrl}/projects/${code}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /projects/:code/cost-summary */
  getProjectCostSummary(code: string): Observable<ProjectCostSummary> {
    return this.http.get<any>(`${this.apiUrl}/projects/${code}/cost-summary`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /projects/:code/status */
  updateProjectStatus(code: string, status: ProjectStatus, progressPercent?: number): Observable<Project> {
    return this.http.patch<any>(`${this.apiUrl}/projects/${code}/status`, {
      status,
      ...(progressPercent !== undefined ? { progressPercent } : {})
    }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /projects */
  createProject(body: any): Observable<Project> {
    return this.http.post<any>(`${this.apiUrl}/projects`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /projects/:code */
  updateProject(code: string, body: any): Observable<Project> {
    return this.http.patch<any>(`${this.apiUrl}/projects/${code}`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Project Resources ─────────────────────────────────────────────────────

  /** GET /projects/:code/equipment */
  getProjectEquipment(code: string): Observable<ProjectEquipment[]> {
    return this.http.get<any>(`${this.apiUrl}/projects/${code}/equipment`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /projects/:code/equipment */
  assignEquipmentToProject(code: string, body: AssignEquipmentBody): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/projects/${code}/equipment`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /projects/:code/materials */
  getProjectMaterials(code: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/projects/${code}/materials`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /projects/:code/materials ⚡ Auto Cost Update */
  addProjectMaterial(code: string, body: AddMaterialBody): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/projects/${code}/materials`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /projects/:code/labor */
  getProjectLabor(code: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/projects/${code}/labor`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /projects/:code/labor ⚡ Auto Cost Update */
  addProjectLabor(code: string, body: AddLaborBody): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/projects/${code}/labor`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /projects/:code/transfers */
  getProjectTransfers(code: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/projects/${code}/transfers`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /projects/:code/transfers ⚡ Auto Cost Update */
  addProjectTransfer(code: string, body: AddTransferBody): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/projects/${code}/transfers`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /projects/transfers/:id/status */
  updateTransferStatus(id: string, status: 'Pending' | 'In Transit' | 'Completed'): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/projects/transfers/${id}/status`, { status }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Cost Centers ──────────────────────────────────────────────────────────

  /** GET /cost-centers */
  getCostCenters(params: { type?: string; isActive?: boolean; page?: number; limit?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.type)     p = p.set('type',     params.type);
    if (params.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    if (params.page)     p = p.set('page',     String(params.page));
    if (params.limit)    p = p.set('limit',    String(params.limit));

    return this.http.get<any>(`${this.apiUrl}/cost-centers`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /cost-centers */
  createCostCenter(body: CreateCostCenterBody): Observable<CostCenter> {
    return this.http.post<any>(`${this.apiUrl}/cost-centers`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }
}
