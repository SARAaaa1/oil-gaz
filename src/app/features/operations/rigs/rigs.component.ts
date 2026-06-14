import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditService } from '../../../core/services/audit.service';
import { Rig } from '../../../shared/interfaces/operations.interface';
import { Equipment } from '../../../shared/interfaces/assets.interface';

@Component({
  selector: 'app-rigs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './rigs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RigsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);
  private readonly translate = inject(TranslateService);

  readonly rigs = this.mockDataService.rigs;
  readonly equipment = this.mockDataService.equipment;
  readonly inventory = this.mockDataService.inventoryItems;

  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('ALL');

  // Selected Rig Details State
  readonly selectedRig = signal<Rig | null>(null);
  readonly detailsTab = signal<'assets' | 'components' | 'inventory' | 'readiness'>('assets');

  // Checklist form state for readiness
  readinessChecklist = signal({
    bopCertified: true,
    topDriveChecked: true,
    mudPumpsTested: true,
    drawworksLubricated: true,
    safetyGearVerified: true,
    fireSuppressionChecked: true
  });

  readonly activeCount = computed(() =>
    this.rigs().filter(r => r.status === 'Active').length
  );

  readonly maintenanceCount = computed(() =>
    this.rigs().filter(r => r.status === 'Maintenance').length
  );

  readonly standbyCount = computed(() =>
    this.rigs().filter(r => r.status === 'Standby').length
  );

  readonly filteredRigs = computed(() => {
    let list = this.rigs();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    if (status !== 'ALL') {
      list = list.filter(r => r.status === status);
    }

    if (query) {
      list = list.filter(r =>
        r.rigName.toLowerCase().includes(query) ||
        r.location.toLowerCase().includes(query) ||
        r.managerName.toLowerCase().includes(query)
      );
    }

    return list;
  });

  // Assets mapped to selected Rig
  readonly rigAssets = computed(() => {
    const rig = this.selectedRig();
    if (!rig) return [];
    
    // Match based on category or location name (e.g. if asset location matches rig location)
    // or if rig name is inside asset project/location
    const normalizedRigName = rig.rigName.toLowerCase();
    return this.equipment().filter(eq =>
      eq.location.toLowerCase().includes(normalizedRigName) ||
      eq.equipmentName.toLowerCase().includes(normalizedRigName.split(' ')[0])
    );
  });

  // Components list with mock details
  readonly rigComponents = computed(() => {
    const rig = this.selectedRig();
    if (!rig) return [];
    
    return [
      { name: 'Blowout Preventer (BOP) Stack', serial: 'BOP-55102', status: rig.status === 'Maintenance' ? 'Under Inspection' : 'Operational', certificationDate: '2025-11-20' },
      { name: 'Top Drive System', serial: 'TDS-2500HP', status: 'Operational', certificationDate: '2026-02-15' },
      { name: 'Main Mud Pumps', serial: 'MP-Gardner-1', status: rig.status === 'Maintenance' ? 'In Maintenance' : 'Operational', certificationDate: '2025-09-10' },
      { name: 'Drawworks Assembly', serial: 'DW-3000-AC', status: 'Operational', certificationDate: '2026-03-01' },
      { name: 'Crown Block & Traveling Block', serial: 'CB-500T', status: 'Operational', certificationDate: '2026-01-18' }
    ];
  });

  // Inventory consumed/stocked at the rig's warehouse yard
  readonly rigInventory = computed(() => {
    const rig = this.selectedRig();
    if (!rig) return [];
    
    // If rig name matches Warehouse A / B
    const whMap: Record<string, string> = {
      'Rig Alpha (Offshore)': 'Warehouse A',
      'Rig Beta (Land)': 'Warehouse B',
      'Rig Gamma (Deepwater)': 'Warehouse A',
      'Rig Delta (Land)': 'Pipe Yard 1'
    };
    const targetWH = whMap[rig.rigName] || 'Warehouse A';
    return this.inventory().filter(item => item.location === targetWH);
  });

  // Calculate readiness percentage based on checklist signals
  readonly readinessPercentage = computed(() => {
    const checks = this.readinessChecklist();
    const total = Object.keys(checks).length;
    const passed = Object.values(checks).filter(Boolean).length;
    return Math.round((passed / total) * 100);
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.rigs' }
    ]);
  }

  selectRig(rig: Rig) {
    this.selectedRig.set(rig);
    
    // Seed readiness checklist values based on status
    if (rig.status === 'Maintenance') {
      this.readinessChecklist.set({
        bopCertified: false,
        topDriveChecked: true,
        mudPumpsTested: false,
        drawworksLubricated: true,
        safetyGearVerified: false,
        fireSuppressionChecked: true
      });
    } else {
      this.readinessChecklist.set({
        bopCertified: true,
        topDriveChecked: true,
        mudPumpsTested: true,
        drawworksLubricated: true,
        safetyGearVerified: true,
        fireSuppressionChecked: true
      });
    }
  }

  closeRigDetails() {
    this.selectedRig.set(null);
  }

  toggleCheck(key: keyof ReturnType<typeof this.readinessChecklist>) {
    this.readinessChecklist.update(checks => ({
      ...checks,
      [key]: !checks[key]
    }));
  }

  submitSafetyAudit() {
    const rig = this.selectedRig();
    if (!rig) return;

    this.auditService.log({
      user: 'Operations Inspector',
      role: 'Operations Manager',
      module: 'Operations',
      entityName: 'RigReadiness',
      entityId: rig.id,
      action: 'Update',
      oldValue: `Readiness percentage check`,
      newValue: `Score: ${this.readinessPercentage()}%`,
      details: `Submitted Safety & Readiness Audit for ${rig.rigName}. Score: ${this.readinessPercentage()}%`
    });

    this.notificationService.success(
      'Audit Recorded',
      `Rig ${rig.rigName} safety review updated. Readiness status is: ${this.readinessPercentage()}%`
    );
  }

  deployRig() {
    const rig = this.selectedRig();
    if (!rig) return;

    if (this.readinessPercentage() < 100) {
      this.notificationService.warning(
        'Readiness Deficit',
        `Cannot deploy rig. Safety audit must be 100% complete. Current: ${this.readinessPercentage()}%`
      );
      return;
    }

    this.mockDataService.rigs.update(list =>
      list.map(r => r.id === rig.id ? { ...r, status: 'Active' as const } : r)
    );
    this.selectedRig.set({ ...rig, status: 'Active' });

    this.auditService.log({
      user: 'Operations Inspector',
      role: 'Operations Manager',
      module: 'Operations',
      entityName: 'Rig',
      entityId: rig.id,
      action: 'Status Change',
      oldValue: `Status: ${rig.status}`,
      newValue: 'Status: Active',
      details: `Deployed Rig ${rig.rigName} to active drilling operations.`
    });

    this.notificationService.success('Deployment Successful', `Rig ${rig.rigName} status updated to Active.`);
  }

  decommissionRig() {
    const rig = this.selectedRig();
    if (!rig) return;

    this.mockDataService.rigs.update(list =>
      list.map(r => r.id === rig.id ? { ...r, status: 'Maintenance' as const } : r)
    );
    this.selectedRig.set({ ...rig, status: 'Maintenance' });

    this.auditService.log({
      user: 'Operations Inspector',
      role: 'Operations Manager',
      module: 'Operations',
      entityName: 'Rig',
      entityId: rig.id,
      action: 'Status Change',
      oldValue: `Status: ${rig.status}`,
      newValue: 'Status: Maintenance',
      details: `Decommissioned Rig ${rig.rigName} for maintenance overhaul.`
    });

    this.notificationService.warning('Maintenance Order Issued', `Rig ${rig.rigName} moved to Maintenance status.`);
  }
}
