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

  readonly fleetUtilization = computed(() => {
    const total = this.rigs().length || 1;
    return Math.round((this.activeCount() / total) * 100);
  });

  readonly maintenanceCount = computed(() =>
    this.rigs().filter(r => r.status === 'Maintenance').length
  );

  readonly standbyCount = computed(() =>
    this.rigs().filter(r => r.status === 'Standby').length
  );

  // Dynamic Equipment Statistics & Donut Chart calculations
  readonly equipmentStats = computed(() => {
    const list = this.equipment();
    const total = list.length || 1;
    
    const active = list.filter(e => e.status === 'Active').length;
    const maintenance = list.filter(e => e.status === 'Maintenance').length;
    const standby = list.filter(e => e.status === 'Standby').length;
    const outOfService = list.filter(e => e.status === 'Out Of Service').length;
    
    const activePct = Math.round((active / total) * 100);
    const maintenancePct = Math.round((maintenance / total) * 100);
    const standbyPct = Math.round((standby / total) * 100);
    const outOfServicePct = Math.round((outOfService / total) * 100);
    
    const totalHours = list.reduce((sum, e) => sum + (e.operatingHours || 0), 0);
    
    // Circumference of SVG circle with r=40 is 2 * pi * 40 = 251.32
    const circ = 251.32;
    
    // Stroke lengths
    const activeStroke = (active / total) * circ;
    const maintStroke = (maintenance / total) * circ;
    const standbyStroke = (standby / total) * circ;
    const outStroke = (outOfService / total) * circ;
    
    // Cumulative offsets (SVG strokes start from 3 o'clock and go clockwise, we adjust via stroke-dashoffset)
    // To stack them:
    const activeOffset = 0;
    const maintOffset = circ - activeStroke;
    const standbyOffset = circ - activeStroke - maintStroke;
    const outOffset = circ - activeStroke - maintStroke - standbyStroke;
    
    return {
      total,
      active,
      maintenance,
      standby,
      outOfService,
      activePct,
      maintenancePct,
      standbyPct,
      outOfServicePct,
      totalHours,
      circ,
      activeStroke,
      maintStroke,
      standbyStroke,
      outStroke,
      activeOffset,
      maintOffset,
      standbyOffset,
      outOffset
    };
  });

  // Detailed lifecycle & activity metrics for each heavy equipment
  readonly detailedEquipmentMetrics = computed(() => {
    const list = this.equipment();
    
    // Define max lifespan hours per category
    const lifespanLimits: Record<string, number> = {
      'Rig': 100000,
      'Generator': 50000,
      'Crane': 40000,
      'Truck': 20000,
      'Pump': 30000,
      'Compressor': 35000,
      'Heavy Equipment': 45000,
      'Safety Equipment': 10000
    };

    return list.map(eq => {
      const limit = lifespanLimits[eq.category] || 30000;
      const hours = eq.operatingHours || 0;
      
      // Calculate consumed lifespan percentage
      const consumedPct = Math.min(100, Math.round((hours / limit) * 100));
      const remainingPct = 100 - consumedPct;

      // Calculate health score based on status & lifespan consumption
      let health = 100;
      // Subtract based on age
      health -= Math.round(consumedPct * 0.15);
      
      // Subtract or set based on current status
      if (eq.status === 'Maintenance') {
        health = Math.min(65, health - 25);
      } else if (eq.status === 'Out Of Service') {
        health = Math.min(25, health - 60);
      }

      health = Math.max(5, health); // minimum 5%

      // Generate simulated 7-day activity history (Active, Standby, Maintenance, Out of Service)
      // We seed a pseudo-random sequence based on equipment ID hash
      const activityHistory = [];
      const idCode = eq.id.charCodeAt(eq.id.length - 1) || 0;
      
      for (let i = 6; i >= 0; i--) {
        const seed = (idCode + i) % 10;
        let dayStatus: 'Active' | 'Standby' | 'Maintenance' | 'Out Of Service' = 'Active';
        
        if (eq.status === 'Maintenance') {
          // If in maintenance, last few days might be maintenance
          dayStatus = i <= 2 ? 'Maintenance' : seed > 3 ? 'Active' : 'Standby';
        } else if (eq.status === 'Out Of Service') {
          dayStatus = i <= 1 ? 'Out Of Service' : 'Active';
        } else {
          // Normal operations
          dayStatus = seed > 7 ? 'Standby' : seed === 0 ? 'Maintenance' : 'Active';
        }

        activityHistory.push({
          dayOffset: i,
          status: dayStatus
        });
      }

      return {
        ...eq,
        maxLifespan: limit,
        consumedPct,
        remainingPct,
        healthScore: health,
        activityHistory
      };
    });
  });

  // Power & Capacity specifications for each equipment to display in the power bar chart
  readonly equipmentPowerData = computed(() => {
    const list = this.equipment();
    
    const powerMap: Record<string, { value: number, unit: string, color: string }> = {
      'Rig': { value: 3000, unit: 'HP', color: '#6366f1' },       // Indigo
      'Generator': { value: 1500, unit: 'kW', color: '#10b981' }, // Emerald
      'Crane': { value: 150, unit: 'Tons', color: '#f59e0b' },    // Amber
      'Truck': { value: 500, unit: 'HP', color: '#64748b' },      // Slate
      'Pump': { value: 1600, unit: 'HP', color: '#06b6d4' }       // Cyan
    };

    return list.map(eq => {
      const power = powerMap[eq.category] || { value: 1000, unit: 'HP', color: '#6366f1' };
      return {
        name: eq.equipmentName,
        code: eq.equipmentCode,
        category: eq.category,
        powerValue: power.value,
        powerUnit: power.unit,
        color: power.color,
        // Calculate relative width percentage (Max power in fleet is 3000)
        percent: Math.round((power.value / 3000) * 100)
      };
    });
  });

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

  getCheck(key: string): boolean {
    const checks = this.readinessChecklist();
    return checks[key as keyof typeof checks] ?? false;
  }

  toggleCheckByKey(key: string) {
    this.toggleCheck(key as keyof ReturnType<typeof this.readinessChecklist>);
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
