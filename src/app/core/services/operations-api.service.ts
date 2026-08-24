import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ─── Timesheets ────────────────────────────────────────────────────────────────

export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved';

export interface TimesheetDay {
  dayNumber: number;
  date: string;
  operatingHours: number;
  standbyHours: number;
  repairHours: number;
  downtimeHours: number;
  rigMoveHours: number;
  totalHours: number;
  comments: string;
  // Compat alias
  day?: number;
}

export interface Timesheet {
  _id: string;
  rigId: string;
  rigName: string;
  month: string;
  projectCode: string;
  status: TimesheetStatus;
  days: TimesheetDay[];
  totalOperatingHours: number;
  totalStandbyHours: number;
  totalRepairHours: number;
  totalDowntimeHours: number;
  totalRigMoveHours: number;
  // Compat aliases for legacy HTML templates
  id?: string;
  utilizationRate?: number;
  downtimePercent?: number;
}

export interface CreateTimesheetBody {
  rigId: string;
  month: string;
  projectCode?: string;
}

export interface UpdateDayBody {
  operatingHours?: number;
  standbyHours?: number;
  repairHours?: number;
  downtimeHours?: number;
  rigMoveHours?: number;
  comments?: string;
}

// ─── Fuel Types ───────────────────────────────────────────────────────────────

export type FuelType = 'Diesel' | 'Petrol' | 'LPG';
export type TankStatus = 'Active' | 'Inactive' | 'Maintenance';

export interface FuelTank {
  _id: string;
  tankCode: string;
  name: string;
  projectCode: string;
  costCenterCode: string;
  location: string;
  fuelType: FuelType;
  capacityLiters: number;
  currentLevelLiters: number;
  minimumLevelLiters: number;
  unitCost: number;
  status: TankStatus;
  lastRefillDate?: string;
  // Compat aliases for legacy HTML templates
  id?: string;
  tankName?: string;
}

export interface CreateTankBody {
  tankCode: string;
  name: string;
  projectCode: string;
  costCenterCode?: string;
  location?: string;
  fuelType: FuelType;
  capacityLiters: number;
  currentLevelLiters?: number;
  minimumLevelLiters?: number;
  unitCost?: number;
}

export interface FuelReceiptBody {
  tankId: string;
  quantityLiters: number;
  unitCost?: number;
  supplierName?: string;
  deliveryDate?: string;
  receivedBy?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface FuelIssueBody {
  tankId: string;
  quantityLiters: number;
  issuedTo: 'Rig' | 'Vehicle' | 'Generator' | 'Camp';
  issuedToId?: string;
  issuedToName?: string;
  costCenterCode?: string;
  issueDate?: string;
  issuedBy?: string;
  runningHours?: number;
  notes?: string;
}

// ─── Fleet Types ──────────────────────────────────────────────────────────────

export type VehicleType = 'Pickup' | 'Crane' | 'Forklift' | 'Bus' | 'Tanker' | 'Heavy Truck' | 'Other';
export type VehicleStatus = 'Available' | 'In Use' | 'Maintenance' | 'Decommissioned';

export interface Vehicle {
  _id: string;
  vehicleCode: string;
  plateNumber: string;
  type: VehicleType;
  make: string;
  modelName: string;
  year: number;
  color?: string;
  currentProjectCode?: string;
  costCenterCode?: string;
  currentOdometer: number;
  assignedDriver?: string;
  status: VehicleStatus;
  // Compat aliases for legacy HTML templates
  id?: string;
  model?: string;
  assignedTo?: string;
  fuelType?: string;
}

export interface CreateVehicleBody {
  vehicleCode: string;
  plateNumber: string;
  type: VehicleType;
  make: string;
  modelName: string;
  year: number;
  color?: string;
  currentProjectCode?: string;
  costCenterCode?: string;
  currentOdometer?: number;
  assignedDriver?: string;
  // Compat aliases
  model?: string;
  assignedTo?: string;
  fuelType?: string;
  status?: VehicleStatus | string;
}

export interface TripBody {
  vehicleId: string;
  projectCode?: string;
  costCenterCode?: string;
  driverName: string;
  startLocation: string;
  endLocation: string;
  startDate?: string;
  startOdometer: number;
  purpose?: string;
}

export interface CompleteTripBody {
  endOdometer: number;
  endDate?: string;
}

// ─── Camps Types ──────────────────────────────────────────────────────────────

export interface Camp {
  _id: string;
  campCode: string;
  name: string;
  projectCode: string;
  location: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  amenities?: string[];
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Closed';
  caravansCount?: number;
}

export interface CreateCampBody {
  campCode: string;
  name: string;
  projectCode: string;
  location?: string;
  totalBeds: number;
  amenities?: string[];
  status?: 'Active' | 'Inactive' | 'Maintenance' | 'Closed';
}

export interface CampAllocationBody {
  campId: string;
  projectCode?: string;
  occupantName: string;
  role?: string;
  bedNumber?: string;
  checkInDate?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class OperationsApiService {
  private readonly http = inject(HttpClient);

  private get apiUrl(): string {
    return environment.apiUrl;
  }

  // ── Rigs (Equipment filtered by category: Rig) ────────────────────────────

  /** GET /operations/rigs */
  getRigs(params: { status?: string; projectCode?: string } = {}): Observable<any[]> {
    let p = new HttpParams();
    if (params.status)      p = p.set('status',      params.status);
    if (params.projectCode) p = p.set('projectCode', params.projectCode);

    return this.http.get<any>(`${this.apiUrl}/operations/rigs`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /operations/rigs/:id/status */
  updateRigStatus(id: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/operations/rigs/${id}/status`, { status }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Timesheets ────────────────────────────────────────────────────────────

  /** POST /operations/timesheets */
  createTimesheet(body: CreateTimesheetBody): Observable<Timesheet> {
    return this.http.post<any>(`${this.apiUrl}/operations/timesheets`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /operations/timesheets */
  getTimesheets(params: { rigId?: string; projectCode?: string; month?: string; page?: number; limit?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.rigId)       p = p.set('rigId',       params.rigId);
    if (params.projectCode) p = p.set('projectCode', params.projectCode);
    if (params.month)       p = p.set('month',       params.month);
    if (params.page)        p = p.set('page',        String(params.page));
    if (params.limit)       p = p.set('limit',       String(params.limit));

    return this.http.get<any>(`${this.apiUrl}/operations/timesheets`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /operations/timesheets/:id */
  getTimesheetById(id: string): Observable<Timesheet> {
    return this.http.get<any>(`${this.apiUrl}/operations/timesheets/${id}`).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /operations/timesheets/:id/day/:dayNumber ⚡ 24h Rule */
  updateTimesheetDay(id: string, dayNumber: number, body: UpdateDayBody): Observable<Timesheet> {
    return this.http.patch<any>(
      `${this.apiUrl}/operations/timesheets/${id}/day/${dayNumber}`, body
    ).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /operations/timesheets/:id/status */
  updateTimesheetStatus(id: string, status: TimesheetStatus): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/operations/timesheets/${id}/status`, { status }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Fuel Tanks ────────────────────────────────────────────────────────────

  /** POST /operations/fuel/tanks */
  createTank(body: CreateTankBody): Observable<FuelTank> {
    return this.http.post<any>(`${this.apiUrl}/operations/fuel/tanks`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /operations/fuel/tanks */
  getTanks(params: { projectCode?: string; fuelType?: string; status?: string } = {}): Observable<FuelTank[]> {
    let p = new HttpParams();
    if (params.projectCode) p = p.set('projectCode', params.projectCode);
    if (params.fuelType)    p = p.set('fuelType',    params.fuelType);
    if (params.status)      p = p.set('status',      params.status);

    return this.http.get<any>(`${this.apiUrl}/operations/fuel/tanks`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /operations/fuel/receipts */
  getFuelReceipts(params: { tankId?: string; projectCode?: string } = {}): Observable<any[]> {
    let p = new HttpParams();
    if (params.tankId)      p = p.set('tankId',      params.tankId);
    if (params.projectCode) p = p.set('projectCode', params.projectCode);

    return this.http.get<any>(`${this.apiUrl}/operations/fuel/receipts`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /operations/fuel/receipts ⚡ Adds to tank */
  addFuelReceipt(body: FuelReceiptBody): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/operations/fuel/receipts`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /operations/fuel/issues */
  getFuelIssues(params: { tankId?: string; projectCode?: string } = {}): Observable<any[]> {
    let p = new HttpParams();
    if (params.tankId)      p = p.set('tankId',      params.tankId);
    if (params.projectCode) p = p.set('projectCode', params.projectCode);

    return this.http.get<any>(`${this.apiUrl}/operations/fuel/issues`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /operations/fuel/issues ⚡ Deducts from tank */
  addFuelIssue(body: FuelIssueBody): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/operations/fuel/issues`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Fleet Vehicles ────────────────────────────────────────────────────────

  /** POST /operations/fleet/vehicles */
  createVehicle(body: CreateVehicleBody): Observable<Vehicle> {
    return this.http.post<any>(`${this.apiUrl}/operations/fleet/vehicles`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /operations/fleet/vehicles */
  getVehicles(params: { status?: string; projectCode?: string; type?: string } = {}): Observable<Vehicle[]> {
    let p = new HttpParams();
    if (params.status)      p = p.set('status',      params.status);
    if (params.projectCode) p = p.set('projectCode', params.projectCode);
    if (params.type)        p = p.set('type',        params.type);

    return this.http.get<any>(`${this.apiUrl}/operations/fleet/vehicles`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /operations/fleet/trips */
  createTrip(body: TripBody): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/operations/fleet/trips`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /operations/fleet/trips */
  getTrips(params: { vehicleId?: string; projectCode?: string } = {}): Observable<any[]> {
    let p = new HttpParams();
    if (params.vehicleId)   p = p.set('vehicleId',   params.vehicleId);
    if (params.projectCode) p = p.set('projectCode', params.projectCode);

    return this.http.get<any>(`${this.apiUrl}/operations/fleet/trips`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /operations/fleet/trips/:id/complete ⚡ */
  completeTrip(id: string, body: CompleteTripBody): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/operations/fleet/trips/${id}/complete`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  // ── Camps ─────────────────────────────────────────────────────────────────

  /** POST /operations/camps */
  createCamp(body: CreateCampBody): Observable<Camp> {
    return this.http.post<any>(`${this.apiUrl}/operations/camps`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /operations/camps */
  getCamps(params: { projectCode?: string; status?: string } = {}): Observable<Camp[]> {
    let p = new HttpParams();
    if (params.projectCode) p = p.set('projectCode', params.projectCode);
    if (params.status)      p = p.set('status',      params.status);

    return this.http.get<any>(`${this.apiUrl}/operations/camps`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** POST /operations/camps/allocations ⚡ Updates bed count */
  createAllocation(body: CampAllocationBody): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/operations/camps/allocations`, body).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** GET /operations/camps/allocations/list */
  getAllocations(params: { campId?: string; projectCode?: string } = {}): Observable<any[]> {
    let p = new HttpParams();
    if (params.campId)      p = p.set('campId',      params.campId);
    if (params.projectCode) p = p.set('projectCode', params.projectCode);

    return this.http.get<any>(`${this.apiUrl}/operations/camps/allocations/list`, { params: p }).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }

  /** PATCH /operations/camps/allocations/:id/release */
  releaseAllocation(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/operations/camps/allocations/${id}/release`, {}).pipe(
      map(res => res.data ?? res),
      catchError(err => throwError(() => err))
    );
  }
}
