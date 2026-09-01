import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditService } from '../../../core/services/audit.service';
import { OperationsApiService } from '../../../core/services/operations-api.service';

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './fleet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FleetComponent implements OnInit {
  private readonly opsApi      = inject(OperationsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly vehicles  = signal<any[]>([]);
  readonly tripLogs  = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving  = signal(false);

  readonly isCompletingTrip = signal(false);
  readonly showCompleteTripModal = signal(false);
  readonly selectedTrip = signal<any | null>(null);

  // Complete trip form
  completeTripForm = { endOdometerKm: 0, fuelConsumedLiters: 0, driverNotes: '' };

  readonly activeTab       = signal<'vehicles' | 'logs'>('vehicles');
  readonly selectedVehicle = signal<any | null>(null);
  readonly searchQuery     = signal<string>('');

  readonly isVehicleModalOpen  = signal(false);
  readonly isTripModalOpen     = signal(false);

  // vehicleForm uses old field names so HTML binds correctly
  vehicleForm: any = this.emptyVehicleForm();

  // tripForm uses old field names so HTML binds correctly
  tripForm: any = this.emptyTripForm();

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly filteredVehicles = computed(() => {
    let list = this.vehicles();
    const q  = this.searchQuery().trim().toLowerCase();
    if (q) list = list.filter((v: any) =>
      v.plateNumber?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      (v.model || v.modelName)?.toLowerCase().includes(q) ||
      (v.assignedTo || v.assignedDriver)?.toLowerCase().includes(q)
    );
    return list;
  });

  readonly filteredTripLogs = computed(() => {
    const sel = this.selectedVehicle();
    if (!sel) return this.tripLogs();
    return this.tripLogs().filter((log: any) => log.vehicleId === (sel._id ?? sel.id));
  });

  readonly totalMilesLogged = computed(() =>
    this.tripLogs().reduce((s: number, log: any) =>
      s + Math.max(0, (log.endOdometer ?? 0) - (log.startOdometer ?? 0)), 0)
  );

  readonly totalFuelExpenses = computed(() =>
    this.tripLogs().reduce((s: number, log: any) => s + (log.fuelCost ?? 0), 0)
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.fleet' }
    ]);
    this.loadVehicles();
    this.loadTrips();
  }

  loadVehicles() {
    this.isLoading.set(true);
    this.opsApi.getVehicles().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data.items ?? []);
        // Normalize field names so HTML works with both old and new API shapes
        this.vehicles.set(list.map((v: any) => ({
          ...v,
          id:         v._id ?? v.id,
          model:      v.modelName ?? v.model ?? '',
          assignedTo: v.assignedDriver ?? v.assignedTo ?? '',
          fuelType:   v.fuelType ?? 'Diesel',
          status:     this.normalizeVehicleStatus(v.status)
        })));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadTrips(vehicleId?: string) {
    const params = vehicleId ? { vehicleId } : {};
    this.opsApi.getTrips(params).subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data.items ?? []);
        this.tripLogs.set(list.map((t: any) => ({ ...t, id: t._id ?? t.id })));
      },
      error: () => {}
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  selectVehicle(v: any) {
    this.selectedVehicle.set(v);
    this.loadTrips(v._id ?? v.id);
  }

  closeVehicleDetails() { this.selectedVehicle.set(null); }

  // ── Vehicle Modal ──────────────────────────────────────────────────────────
  openAddVehicle() {
    this.vehicleForm = this.emptyVehicleForm();
    this.isVehicleModalOpen.set(true);
  }

  saveVehicle() {
    if (!this.vehicleForm.plateNumber || !this.vehicleForm.make || !this.vehicleForm.model) {
      this.notificationService.danger('Validation', 'Please fill all required fields');
      return;
    }
    this.isSaving.set(true);
    const body = {
      vehicleCode:    `VH-${Date.now()}`,
      plateNumber:    this.vehicleForm.plateNumber,
      type:           'Pickup',
      make:           this.vehicleForm.make,
      modelName:      this.vehicleForm.model,
      year:           this.vehicleForm.year,
      color:          this.vehicleForm.color ?? '',
      currentOdometer: this.vehicleForm.currentOdometer,
      assignedDriver: this.vehicleForm.assignedTo,
      status:         this.vehicleForm.status ?? 'Available'
    };
    this.opsApi.createVehicle(body as any).subscribe({
      next: (created: any) => {
        const normalized = { ...created, id: created._id ?? created.id, model: created.modelName ?? created.model, assignedTo: created.assignedDriver ?? created.assignedTo, fuelType: created.fuelType ?? 'Diesel', status: this.normalizeVehicleStatus(created.status) };
        this.vehicles.update(list => [normalized, ...list]);
        this.isVehicleModalOpen.set(false);
        this.notificationService.success('Created', `${normalized.make} ${normalized.model} (${normalized.plateNumber}) added`);
        this.isSaving.set(false);
      },
      error: (err: any) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to add vehicle');
        this.isSaving.set(false);
      }
    });
  }

  // ── Trip Modal ─────────────────────────────────────────────────────────────
  openAddTrip() {
    this.tripForm = this.emptyTripForm();
    const sel = this.selectedVehicle();
    if (sel) {
      this.tripForm.vehicleId     = sel._id ?? sel.id;
      this.tripForm.startOdometer = sel.currentOdometer ?? 0;
    }
    this.isTripModalOpen.set(true);
  }

  saveTrip() {
    if (!this.tripForm.vehicleId || !this.tripForm.driverName) {
      this.notificationService.danger('Validation', 'Vehicle and Driver are required');
      return;
    }
    this.isSaving.set(true);
    const body = {
      vehicleId:      this.tripForm.vehicleId,
      driverName:     this.tripForm.driverName,
      startLocation:  '',
      endLocation:    '',
      startOdometer:  this.tripForm.startOdometer,
      endOdometer:    this.tripForm.endOdometer,
      purpose:        this.tripForm.purpose,
      startDate:      this.tripForm.tripDate ?? new Date().toISOString().split('T')[0],
      fuelAddedLiters: this.tripForm.fuelAddedLiters,
      fuelCost:        this.tripForm.fuelCost
    };
    this.opsApi.createTrip(body).subscribe({
      next: (created: any) => {
        const normalized = { ...created, id: created._id ?? created.id };
        this.tripLogs.update(list => [normalized, ...list]);
        this.isTripModalOpen.set(false);
        this.notificationService.success('Trip Logged', 'Trip recorded successfully');
        this.isSaving.set(false);
      },
      error: (err: any) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to log trip');
        this.isSaving.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getVehiclePlate(vehicleId: string): string {
    return this.vehicles().find((v: any) => (v._id ?? v.id) === vehicleId)?.plateNumber ?? vehicleId;
  }

  /** Map backend status values to values the HTML template expects */
  private normalizeVehicleStatus(status: string): string {
    const map: Record<string, string> = {
      'In Use':         'Assigned',
      'Decommissioned': 'Out Of Service'
    };
    return map[status] ?? status;
  }

  private emptyVehicleForm() {
    return {
      plateNumber: '', make: '', model: '', year: new Date().getFullYear(),
      fuelType: 'Diesel', assignedTo: '', currentOdometer: 0, status: 'Available', color: ''
    };
  }

  private emptyTripForm() {
    return {
      vehicleId: '', driverName: '', purpose: '',
      startOdometer: 0, endOdometer: 0,
      fuelAddedLiters: 0, fuelCost: 0,
      tripDate: new Date().toISOString().split('T')[0]
    };
  }

  // ── Complete Trip ─────────────────────────────────────────────────────────
  openCompleteTrip(trip: any) {
    this.selectedTrip.set(trip);
    const sel = this.selectedVehicle();
    this.completeTripForm = {
      endOdometerKm: sel?.currentOdometer ?? trip.startOdometer ?? 0,
      fuelConsumedLiters: 0,
      driverNotes: ''
    };
    this.showCompleteTripModal.set(true);
  }

  closeCompleteTripModal() {
    this.showCompleteTripModal.set(false);
    this.selectedTrip.set(null);
  }

  saveCompleteTrip() {
    const trip = this.selectedTrip();
    if (!trip) return;
    if (!this.completeTripForm.endOdometerKm || this.completeTripForm.endOdometerKm <= (trip.startOdometer ?? 0)) {
      this.notificationService.danger('Validation', 'End odometer must be greater than start odometer');
      return;
    }
    this.isCompletingTrip.set(true);
    const tripId = trip._id ?? trip.id;
    this.opsApi.completeTrip(tripId, {
      endOdometer: this.completeTripForm.endOdometerKm,
    }).subscribe({
      next: (updated: any) => {
        this.tripLogs.update(list =>
          list.map(t => (t._id ?? t.id) === tripId
            ? { ...t, status: 'Completed', endOdometer: updated.endOdometerKm ?? this.completeTripForm.endOdometerKm }
            : t
          )
        );
        // Update vehicle odometer
        const sel = this.selectedVehicle();
        if (sel) {
          const updatedVehicle = { ...sel, currentOdometer: this.completeTripForm.endOdometerKm };
          this.vehicles.update(list => list.map(v => (v._id ?? v.id) === (sel._id ?? sel.id) ? updatedVehicle : v));
          this.selectedVehicle.set(updatedVehicle);
        }
        this.showCompleteTripModal.set(false);
        this.isCompletingTrip.set(false);
        this.notificationService.success('Trip Completed', `Trip completed — ${updated.distanceTraveledKm ?? this.completeTripForm.endOdometerKm - (trip.startOdometer ?? 0)} km traveled`);
      },
      error: (err: any) => {
        this.isCompletingTrip.set(false);
        this.notificationService.danger('Error', err?.error?.message || 'Failed to complete trip');
      }
    });
  }
}
