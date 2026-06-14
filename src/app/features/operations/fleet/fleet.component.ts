import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditService } from '../../../core/services/audit.service';
import { Vehicle, TripLog } from '../../../shared/interfaces/assets.interface';

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './fleet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FleetComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);
  private readonly translate = inject(TranslateService);

  // Core signals from central store
  readonly vehicles = this.mockDataService.vehicles;
  readonly tripLogs = this.mockDataService.tripLogs;

  // View States
  readonly activeTab = signal<'vehicles' | 'logs'>('vehicles');
  readonly selectedVehicle = signal<Vehicle | null>(null);
  readonly searchQuery = signal<string>('');

  // Modal States
  readonly isVehicleModalOpen = signal<boolean>(false);
  readonly isTripModalOpen = signal<boolean>(false);

  // Form states
  vehicleForm = {
    plateNumber: '',
    make: '',
    model: '',
    year: 2024,
    assignedTo: '',
    fuelType: 'Diesel' as 'Diesel' | 'Petrol',
    status: 'Available' as 'Available' | 'Assigned' | 'Maintenance' | 'Out Of Service',
    currentOdometer: 0
  };

  tripForm = {
    vehicleId: '',
    driverName: '',
    purpose: '',
    startOdometer: 0,
    endOdometer: 0,
    fuelAddedLiters: 0,
    fuelCost: 0,
    tripDate: new Date().toISOString().split('T')[0]
  };

  // Computed properties
  readonly filteredVehicles = computed(() => {
    let list = this.vehicles();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(v =>
        v.plateNumber.toLowerCase().includes(query) ||
        v.make.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query) ||
        v.assignedTo.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly filteredTripLogs = computed(() => {
    const selected = this.selectedVehicle();
    if (!selected) return this.tripLogs();
    return this.tripLogs().filter(log => log.vehicleId === selected.id);
  });

  readonly totalFuelExpenses = computed(() =>
    this.tripLogs().reduce((sum, log) => sum + (log.fuelCost || 0), 0)
  );

  readonly totalMilesLogged = computed(() =>
    this.tripLogs().reduce((sum, log) => sum + (log.endOdometer - log.startOdometer), 0)
  );

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.fleet' }
    ]);
  }

  // --- VEHICLE ACTIONS ---
  openAddVehicle() {
    this.vehicleForm = {
      plateNumber: '',
      make: '',
      model: '',
      year: 2024,
      assignedTo: '',
      fuelType: 'Diesel',
      status: 'Available',
      currentOdometer: 0
    };
    this.isVehicleModalOpen.set(true);
  }

  saveVehicle() {
    if (!this.vehicleForm.plateNumber || !this.vehicleForm.make || !this.vehicleForm.model) {
      this.notificationService.danger('common.err_validation_title', 'Please complete all required fields.');
      return;
    }

    const created = this.mockDataService.addVehicle({
      plateNumber: this.vehicleForm.plateNumber,
      make: this.vehicleForm.make,
      model: this.vehicleForm.model,
      year: this.vehicleForm.year,
      assignedTo: this.vehicleForm.assignedTo,
      fuelType: this.vehicleForm.fuelType,
      status: this.vehicleForm.status,
      currentOdometer: this.vehicleForm.currentOdometer
    });

    this.auditService.log({
      user: 'Admin User',
      role: 'Super Admin',
      module: 'Operations',
      entityName: 'Vehicle',
      entityId: created.plateNumber,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(created),
      details: `Registered new Vehicle: ${created.make} ${created.model} (${created.plateNumber})`
    });

    this.isVehicleModalOpen.set(false);
    this.notificationService.success('common.success', 'Vehicle registered successfully.');
  }

  selectVehicle(vehicle: Vehicle) {
    this.selectedVehicle.set(vehicle);
    this.tripForm.startOdometer = vehicle.currentOdometer;
  }

  closeVehicleDetails() {
    this.selectedVehicle.set(null);
  }

  // --- TRIP LOG ACTIONS ---
  openAddTrip() {
    this.tripForm = {
      vehicleId: this.selectedVehicle()?.id || '',
      driverName: this.selectedVehicle()?.assignedTo || '',
      purpose: '',
      startOdometer: this.selectedVehicle()?.currentOdometer || 0,
      endOdometer: (this.selectedVehicle()?.currentOdometer || 0) + 50,
      fuelAddedLiters: 0,
      fuelCost: 0,
      tripDate: new Date().toISOString().split('T')[0]
    };
    this.isTripModalOpen.set(true);
  }

  saveTrip() {
    if (!this.tripForm.vehicleId || !this.tripForm.driverName || this.tripForm.endOdometer <= this.tripForm.startOdometer) {
      this.notificationService.danger('common.err_validation_title', 'Please select a vehicle, enter driver, and ensure end odometer is greater than start.');
      return;
    }

    const createdLog = this.mockDataService.addTripLog({
      vehicleId: this.tripForm.vehicleId,
      driverName: this.tripForm.driverName,
      purpose: this.tripForm.purpose,
      startOdometer: this.tripForm.startOdometer,
      endOdometer: this.tripForm.endOdometer,
      fuelAddedLiters: this.tripForm.fuelAddedLiters || undefined,
      fuelCost: this.tripForm.fuelCost || undefined,
      tripDate: this.tripForm.tripDate
    });

    // Update vehicle's current odometer
    const vehicleId = this.tripForm.vehicleId;
    this.mockDataService.vehicles.update(list =>
      list.map(v => v.id === vehicleId ? { ...v, currentOdometer: createdLog.endOdometer } : v)
    );

    // Update locally selected vehicle odometer if matched
    const sel = this.selectedVehicle();
    if (sel && sel.id === vehicleId) {
      this.selectedVehicle.set({
        ...sel,
        currentOdometer: createdLog.endOdometer
      });
    }

    this.auditService.log({
      user: createdLog.driverName,
      role: 'Operations Staff',
      module: 'Operations',
      entityName: 'TripLog',
      entityId: createdLog.id,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(createdLog),
      details: `Logged trip of ${(createdLog.endOdometer - createdLog.startOdometer)} miles. Odometer updated to ${createdLog.endOdometer}`
    });

    this.isTripModalOpen.set(false);
    this.notificationService.success('common.success', 'Trip log recorded successfully.');
  }

  getVehiclePlate(id: string): string {
    return this.vehicles().find(v => v.id === id)?.plateNumber || id;
  }
}
