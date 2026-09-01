import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export type AssetCategory =
  | 'Rig' | 'Generator' | 'Crane' | 'Truck'
  | 'Pump' | 'Compressor' | 'Heavy Equipment' | 'Safety Equipment';

export type AssetStatus = 'Active' | 'Standby' | 'Maintenance' | 'Out Of Service';

// ─── Equipment Types ──────────────────────────────────────────────────────────

export interface Equipment {
  _id: string;
  assetNumber: string;
  equipmentCode: string;
  equipmentName: string;
  category: AssetCategory;
  manufacturer: string;
  modelName: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  depreciationMethod: string;
  location: string;
  projectAssignment?: string;
  costCenter: string;
  department: string;
  status: AssetStatus;
  operatingHours: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  createdAt?: string;
  // Compat aliases for legacy HTML templates
  id?: string;
  rigName?: string;
  drillDepthFt?: number;
  managerName?: string;
  crewCount?: number;
}

export interface EquipmentStats {
  total: number;
  active: number;
  standby: number;
  maintenance: number;
  outOfService: number;
}

export interface EquipmentListParams {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateEquipmentBody {
  assetNumber: string;
  equipmentCode: string;
  equipmentName: string;
  category: AssetCategory;
  manufacturer: string;
  modelName: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost?: number;
  currentValue?: number;
  depreciationMethod?: string;
  location: string;
  costCenter?: string;
  costCenterCode?: string;
  parentCostCenter?: string;
  department?: string;
  status?: AssetStatus;
  operatingHours?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

export interface UpdateEquipmentStatusBody {
  status: AssetStatus;
  location?: string;
  projectAssignment?: string | null;
}



// ─── Asset Assignment Types ───────────────────────────────────────────────────

export interface AssetAssignment {
  _id: string;
  assetId: string;
  assetNumber: string;
  equipmentName: string;
  assignedToType: 'Project' | 'Rig' | 'Camp' | 'Driver';
  assignedToId: string;
  assignedToName: string;
  assignmentDate: string;
  releaseDate?: string | null;
  conditionOnAssign?: string;
  notes?: string;
  createdAt?: string;
}

export interface CreateAssignmentBody {
  assetId: string;
  assignedToType: 'Project' | 'Rig' | 'Camp' | 'Driver';
  assignedToId: string;
  assignedToName: string;
  assignmentDate: string;
  conditionOnAssign?: string;
  notes?: string;
}

export interface ReleaseAssignmentBody {
  releaseDate?: string;
  notes?: string;
}

// ─── Asset Transfer Types ──────────────────────────────────────────────────────

export interface AssetTransfer {
  _id: string;
  assetId: string;
  assetNumber: string;
  equipmentName: string;
  fromLocation: string;
  toLocation: string;
  transferDate: string;
  authorizedBy: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  notes?: string;
}

export interface CreateTransferBody {
  assetId: string;
  toLocation: string;
  transferDate: string;
  authorizedBy: string;
  notes?: string;
}

// ─── Asset Disposal Types ──────────────────────────────────────────────────────

export interface AssetDisposal {
  _id: string;
  assetId: string;
  assetNumber: string;
  equipmentName: string;
  disposalDate: string;
  disposalMethod: 'Sale' | 'Scrap' | 'Write-off' | 'Donation';
  disposalCost?: number;
  revenueReceived?: number;
  reason: string;
  authorizedBy: string;
  status: 'Approved' | 'Pending';
}

export interface CreateDisposalBody {
  assetId: string;
  disposalDate: string;
  disposalMethod: 'Sale' | 'Scrap' | 'Write-off' | 'Donation';
  disposalCost?: number;
  revenueReceived?: number;
  reason: string;
  authorizedBy: string;
}

// ─── Asset History Types ───────────────────────────────────────────────────────

export interface AssetHistory {
  _id: string;
  assetId: string;
  equipmentCode: string;
  changeType: 'Project Assignment' | 'Location Change' | 'Status Change' | 'Maintenance';
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  date: string;
  notes?: string;
}

// ─── PM Schedule Types ─────────────────────────────────────────────────────────

export interface PMSchedule {
  _id: string;
  assetId: string;
  assetNumber: string;
  equipmentName: string;
  pmCode: string;
  taskDescription: string;
  frequencyDays: number;
  lastDoneDate?: string;
  nextDueDate: string;
  status: 'Active' | 'Paused';
}

export interface CreatePMScheduleBody {
  assetId: string;
  pmCode: string;
  taskDescription: string;
  frequencyDays: number;
  nextDueDate: string;
  status?: 'Active' | 'Paused';
}

// ─── Work Order Types ──────────────────────────────────────────────────────────

export interface SparePartUsed {
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice?: number;
}

export interface WorkOrder {
  _id: string;
  woNumber: string;
  assetNumber: string;
  equipmentName: string;
  type: 'Preventive' | 'Breakdown' | 'Calibration';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  issueDescription: string;
  assignedToTechnician?: string;
  pmScheduleId?: string;
  createdDate: string;
  startDate?: string | null;
  completedDate?: string | null;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  sparePartsUsed?: SparePartUsed[];
  laborHoursCost?: number;
}

export interface CreateWorkOrderBody {
  assetId: string;
  type: 'Preventive' | 'Breakdown' | 'Calibration';
  priority?: 'Low' | 'Medium' | 'High' | 'Emergency';
  issueDescription: string;
  assignedToTechnician?: string;
}

export interface UpdateWorkOrderStatusBody {
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  sparePartsUsed?: SparePartUsed[];
  laborHoursCost?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AssetsApiService {
  private readonly http = inject(HttpClient);

  private get apiRoot(): string {
    return environment.apiUrl;
  }

  private get baseUrl(): string {
    return `${this.apiRoot}/assets/equipment`;
  }

  /** POST /assets/equipment */
  createEquipment(body: CreateEquipmentBody): Observable<Equipment> {
    return this.http.post<any>(this.baseUrl, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /assets/equipment/:id */
  updateEquipment(id: string, body: Partial<CreateEquipmentBody>): Observable<Equipment> {
    return this.http.patch<any>(`${this.baseUrl}/${id}`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** DELETE /assets/equipment/:id */
  deleteEquipment(id: string): Observable<{ message: string }> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /assets/equipment */
  getEquipment(params: EquipmentListParams = {}): Observable<PaginatedResponse<Equipment>> {
    let p = new HttpParams();
    if (params.search)   p = p.set('search',   params.search);
    if (params.category) p = p.set('category', params.category);
    if (params.status)   p = p.set('status',   params.status);
    if (params.page)     p = p.set('page',     String(params.page));
    if (params.limit)    p = p.set('limit',    String(params.limit));

    return this.http.get<any>(this.baseUrl, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /assets/equipment/stats */
  getStats(): Observable<EquipmentStats> {
    return this.http.get<any>(`${this.baseUrl}/stats`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /assets/equipment/:id */
  getEquipmentById(id: string): Observable<Equipment> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /assets/equipment/:id/status */
  updateStatus(id: string, body: UpdateEquipmentStatusBody): Observable<Equipment> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }



  // ── Asset Assignments ─────────────────────────────────────────────────────

  /** GET /assets/assignments */
  getAssignments(params: { assetId?: string; assignedToType?: string; assignedToId?: string } = {}): Observable<AssetAssignment[]> {
    let p = new HttpParams();
    if (params.assetId)        p = p.set('assetId',        params.assetId);
    if (params.assignedToType) p = p.set('assignedToType', params.assignedToType);
    if (params.assignedToId)   p = p.set('assignedToId',   params.assignedToId);

    return this.http.get<any>(`${this.apiRoot}/assets/assignments`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /assets/assignments */
  createAssignment(body: CreateAssignmentBody): Observable<AssetAssignment> {
    return this.http.post<any>(`${this.apiRoot}/assets/assignments`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /assets/assignments/:id/release */
  releaseAssignment(id: string, body: ReleaseAssignmentBody = {}): Observable<{ message: string }> {
    return this.http.patch<any>(`${this.apiRoot}/assets/assignments/${id}/release`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Asset Transfers ───────────────────────────────────────────────────────

  /** GET /assets/transfers */
  getTransfers(params: { assetId?: string; status?: string } = {}): Observable<AssetTransfer[]> {
    let p = new HttpParams();
    if (params.assetId) p = p.set('assetId', params.assetId);
    if (params.status)  p = p.set('status',  params.status);

    return this.http.get<any>(`${this.apiRoot}/assets/transfers`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /assets/transfers */
  createTransfer(body: CreateTransferBody): Observable<AssetTransfer> {
    return this.http.post<any>(`${this.apiRoot}/assets/transfers`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Asset Disposals ───────────────────────────────────────────────────────

  /** GET /assets/disposals */
  getDisposals(params: { assetId?: string } = {}): Observable<AssetDisposal[]> {
    let p = new HttpParams();
    if (params.assetId) p = p.set('assetId', params.assetId);

    return this.http.get<any>(`${this.apiRoot}/assets/disposals`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /assets/disposals */
  createDisposal(body: CreateDisposalBody): Observable<AssetDisposal> {
    return this.http.post<any>(`${this.apiRoot}/assets/disposals`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Asset History ─────────────────────────────────────────────────────────

  /** GET /assets/history */
  getHistory(params: { assetId?: string; changeType?: string } = {}): Observable<AssetHistory[]> {
    let p = new HttpParams();
    if (params.assetId)    p = p.set('assetId',    params.assetId);
    if (params.changeType) p = p.set('changeType', params.changeType);

    return this.http.get<any>(`${this.apiRoot}/assets/history`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── PM Schedules ──────────────────────────────────────────────────────────

  /** GET /maintenance/pm-schedules */
  getPmSchedules(params: { assetId?: string; status?: string; dueBefore?: string } = {}): Observable<PMSchedule[]> {
    let p = new HttpParams();
    if (params.assetId)   p = p.set('assetId',   params.assetId);
    if (params.status)    p = p.set('status',    params.status);
    if (params.dueBefore) p = p.set('dueBefore', params.dueBefore);

    return this.http.get<any>(`${this.apiRoot}/maintenance/pm-schedules`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /maintenance/pm-schedules */
  createPmSchedule(body: CreatePMScheduleBody): Observable<PMSchedule> {
    return this.http.post<any>(`${this.apiRoot}/maintenance/pm-schedules`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /maintenance/pm-schedules/:id */
  updatePmSchedule(id: string, body: Partial<CreatePMScheduleBody>): Observable<PMSchedule> {
    return this.http.patch<any>(`${this.apiRoot}/maintenance/pm-schedules/${id}`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /maintenance/pm-schedules/:id/trigger */
  triggerPmSchedule(id: string, body: { assignedToTechnician?: string } = {}): Observable<{ message: string; workOrder: WorkOrder; updatedSchedule: Partial<PMSchedule> }> {
    return this.http.post<any>(`${this.apiRoot}/maintenance/pm-schedules/${id}/trigger`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Work Orders ───────────────────────────────────────────────────────────

  /** GET /maintenance/work-orders */
  getWorkOrders(params: { status?: string; type?: string; priority?: string; assetId?: string } = {}): Observable<WorkOrder[]> {
    let p = new HttpParams();
    if (params.status)   p = p.set('status',   params.status);
    if (params.type)     p = p.set('type',     params.type);
    if (params.priority) p = p.set('priority', params.priority);
    if (params.assetId)  p = p.set('assetId',  params.assetId);

    return this.http.get<any>(`${this.apiRoot}/maintenance/work-orders`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /maintenance/work-orders */
  createWorkOrder(body: CreateWorkOrderBody): Observable<WorkOrder> {
    return this.http.post<any>(`${this.apiRoot}/maintenance/work-orders`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /maintenance/work-orders/:id/status */
  updateWorkOrderStatus(id: string, body: UpdateWorkOrderStatusBody): Observable<WorkOrder> {
    return this.http.patch<any>(`${this.apiRoot}/maintenance/work-orders/${id}/status`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }
}

