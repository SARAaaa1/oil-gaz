import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditService } from '../../../core/services/audit.service';
import { AssetsApiService, Equipment } from '../../../core/services/assets-api.service';
import { OperationsApiService } from '../../../core/services/operations-api.service';

@Component({
  selector: 'app-rigs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './rigs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RigsComponent implements OnInit {
  private readonly assetsApi   = inject(AssetsApiService);
  private readonly opsApi      = inject(OperationsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);
  private readonly translate   = inject(TranslateService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly rigs      = signal<Equipment[]>([]);
  readonly equipment = signal<Equipment[]>([]);
  readonly isLoading = signal(false);

  readonly searchQuery  = signal<string>('');
  readonly statusFilter = signal<string>('ALL');

  readonly selectedRig  = signal<Equipment | null>(null);
  readonly detailsTab   = signal<'assets' | 'components' | 'readiness' | 'inventory'>('assets');
  readonly rigInventory  = signal<any[]>([]);
  readonly readinessChecklist = signal<Record<string, boolean>>({
    bopCertified: true, topDriveChecked: true, mudPumpsTested: true,
    drawworksLubricated: true, safetyGearVerified: true, fireSuppressionChecked: true
  });

  // ── Modals & Add Rig / Component State ─────────────────────────────────────
  readonly showAddRigModal       = signal(false);
  readonly showAddComponentModal = signal(false);
  readonly isSubmittingRig       = signal(false);
  readonly isSubmittingComponent = signal(false);

  newRigForm = {
    rigName: '',
    equipmentCode: '',
    assetNumber: '',
    rigType: 'Land Rig',
    horsepower: 2000,
    drillDepthFt: 20000,
    location: '',
    managerName: '',
    crewCount: 25,
    bopRatingPsi: 10000,
    topDriveModel: 'TDS-11SA 500 Ton',
    mudPumpSpecs: '3x 1600 HP Triplex',
    purchaseCost: 12000000
  };

  newComponentForm = {
    name: '',
    serial: '',
    status: 'Operational',
    certificationDate: new Date().toISOString().split('T')[0]
  };

  readonly customComponentsMap = signal<Record<string, any[]>>({});

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly activeCount = computed(() => this.rigs().filter(r => r.status === 'Active').length);

  readonly fleetUtilization = computed(() => {
    const total = this.rigs().length || 1;
    return Math.round((this.activeCount() / total) * 100);
  });

  readonly maintenanceCount = computed(() => this.rigs().filter(r => r.status === 'Maintenance').length);
  readonly standbyCount     = computed(() => this.rigs().filter(r => r.status === 'Standby').length);

  readonly equipmentStats = computed(() => {
    const list  = this.equipment();
    const total = list.length || 1;
    const active       = list.filter(e => e.status === 'Active').length;
    const maintenance  = list.filter(e => e.status === 'Maintenance').length;
    const standby      = list.filter(e => e.status === 'Standby').length;
    const outOfService = list.filter(e => e.status === 'Out Of Service').length;
    const circ = 251.32;
    const activeStroke  = (active / total) * circ;
    const maintStroke   = (maintenance / total) * circ;
    const standbyStroke = (standby / total) * circ;
    const outStroke     = (outOfService / total) * circ;
    return {
      total, active, maintenance, standby, outOfService,
      activePct:       Math.round((active / total) * 100),
      maintenancePct:  Math.round((maintenance / total) * 100),
      standbyPct:      Math.round((standby / total) * 100),
      outOfServicePct: Math.round((outOfService / total) * 100),
      totalHours: list.reduce((s, e) => s + (e.operatingHours || 0), 0),
      circ, activeStroke, maintStroke, standbyStroke, outStroke,
      activeOffset:  0,
      maintOffset:   circ - activeStroke,
      standbyOffset: circ - activeStroke - maintStroke,
      outOffset:     circ - activeStroke - maintStroke - standbyStroke
    };
  });

  readonly detailedEquipmentMetrics = computed(() => {
    const lifespanLimits: Record<string, number> = {
      'Rig': 100000, 'Generator': 50000, 'Crane': 40000, 'Truck': 20000,
      'Pump': 30000, 'Compressor': 35000, 'Heavy Equipment': 45000, 'Safety Equipment': 10000
    };
    return this.equipment().map(eq => {
      const limit = lifespanLimits[eq.category] || 30000;
      const hours = eq.operatingHours || 0;
      const consumedPct = Math.min(100, Math.round((hours / limit) * 100));
      let health = 100 - Math.round(consumedPct * 0.15);
      if (eq.status === 'Maintenance')   health = Math.min(65, health - 25);
      if (eq.status === 'Out Of Service') health = Math.min(25, health - 60);
      health = Math.max(5, health);
      const idCode = (eq._id || '').charCodeAt((eq._id || '').length - 1) || 0;
      const activityHistory = Array.from({ length: 7 }, (_, i) => {
        const seed = (idCode + i) % 10;
        const dayStatus: Equipment['status'] =
          eq.status === 'Maintenance'   ? (i <= 2 ? 'Maintenance' : seed > 3 ? 'Active' : 'Standby') :
          eq.status === 'Out Of Service' ? (i <= 1 ? 'Out Of Service' : 'Active') :
          (seed > 7 ? 'Standby' : seed === 0 ? 'Maintenance' : 'Active');
        return { dayOffset: i, status: dayStatus };
      });
      return { ...eq, maxLifespan: limit, consumedPct, remainingPct: 100 - consumedPct, healthScore: health, activityHistory };
    });
  });

  readonly equipmentPowerData = computed(() => {
    const powerMap: Record<string, { value: number; unit: string; color: string }> = {
      'Rig':       { value: 3000, unit: 'HP',   color: '#6366f1' },
      'Generator': { value: 1500, unit: 'kW',   color: '#10b981' },
      'Crane':     { value: 150,  unit: 'Tons', color: '#f59e0b' },
      'Truck':     { value: 500,  unit: 'HP',   color: '#64748b' },
      'Pump':      { value: 1600, unit: 'HP',   color: '#06b6d4' }
    };
    return this.equipment().map(eq => {
      const power = powerMap[eq.category] || { value: 1000, unit: 'HP', color: '#6366f1' };
      return { name: eq.equipmentName, code: eq.equipmentCode, category: eq.category,
               powerValue: power.value, powerUnit: power.unit, color: power.color,
               percent: Math.round((power.value / 3000) * 100) };
    });
  });

  readonly filteredRigs = computed(() => {
    let list  = this.rigs();
    const q   = this.searchQuery().trim().toLowerCase();
    const st  = this.statusFilter();
    if (st !== 'ALL') list = list.filter(r => r.status === st);
    if (q)  list = list.filter(r =>
      r.equipmentName?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q)
    );
    return list;
  });

  readonly rigAssets = computed(() => {
    const rig = this.selectedRig();
    if (!rig) return [];
    const name = rig.equipmentName.toLowerCase();
    return this.equipment().filter(eq =>
      eq.location?.toLowerCase().includes(name.split(' ')[0]) ||
      eq.projectAssignment === rig._id
    );
  });

  readonly rigComponents = computed(() => {
    const rig = this.selectedRig();
    if (!rig) return [];
    const defaults = [
      { name: 'Blowout Preventer (BOP) Stack', serial: 'BOP-55102', status: rig.status === 'Maintenance' ? 'Under Inspection' : 'Operational', certificationDate: '2025-11-20' },
      { name: 'Top Drive System', serial: 'TDS-2500HP', status: 'Operational', certificationDate: '2026-02-15' },
      { name: 'Main Mud Pumps', serial: 'MP-Gardner-1', status: rig.status === 'Maintenance' ? 'In Maintenance' : 'Operational', certificationDate: '2025-09-10' },
      { name: 'Drawworks Assembly', serial: 'DW-3000-AC', status: 'Operational', certificationDate: '2026-03-01' },
      { name: 'Crown Block & Traveling Block', serial: 'CB-500T', status: 'Operational', certificationDate: '2026-01-18' }
    ];
    const rigId = rig._id || rig.id || '';
    const custom = this.customComponentsMap()[rigId] || [];
    return [...custom, ...defaults];
  });

  readonly readinessPercentage = computed(() => {
    const checks = this.readinessChecklist();
    const total  = Object.keys(checks).length;
    const passed = Object.values(checks).filter(Boolean).length;
    return Math.round((passed / total) * 100);
  });

  // ── Modal Action Methods ──────────────────────────────────────────────────
  openAddRigModal() {
    const nextNum = this.rigs().length + 1;
    this.newRigForm = {
      rigName: `RIG-${3000 + nextNum} Desert Star`,
      equipmentCode: `RIG-${3000 + nextNum}`,
      assetNumber: `AST-RIG-00${nextNum}`,
      rigType: 'Land Rig',
      horsepower: 2000,
      drillDepthFt: 22000,
      location: 'Ghawar Sector 4',
      managerName: 'Eng. Salem Al-Hajri',
      crewCount: 28,
      bopRatingPsi: 10000,
      topDriveModel: 'TDS-11SA 500 Ton',
      mudPumpSpecs: '3x 1600 HP Triplex',
      purchaseCost: 15000000
    };
    this.showAddRigModal.set(true);
  }

  closeAddRigModal() {
    this.showAddRigModal.set(false);
  }

  submitAddRig() {
    if (!this.newRigForm.rigName || !this.newRigForm.equipmentCode) {
      this.notificationService.danger('خطأ في البيانات', 'يرجى إدخال اسم وكود الحفارة');
      return;
    }

    this.isSubmittingRig.set(true);

    this.assetsApi.createEquipment({
      assetNumber: this.newRigForm.assetNumber || `AST-RIG-${Date.now().toString().slice(-4)}`,
      equipmentCode: this.newRigForm.equipmentCode,
      equipmentName: this.newRigForm.rigName,
      category: 'Rig',
      manufacturer: 'NOV / Honghua',
      modelName: `${this.newRigForm.rigType} ${this.newRigForm.horsepower}HP`,
      serialNumber: `SN-${this.newRigForm.equipmentCode}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: Number(this.newRigForm.purchaseCost) || 0,
      currentValue: Number(this.newRigForm.purchaseCost) || 0,
      location: this.newRigForm.location || 'Main Storage Yard',
      department: this.newRigForm.managerName || 'Operations',
      status: 'Standby',
      notes: `BOP: ${this.newRigForm.bopRatingPsi} PSI | TopDrive: ${this.newRigForm.topDriveModel} | Depth: ${this.newRigForm.drillDepthFt} ft | Crew: ${this.newRigForm.crewCount}`
    }).subscribe({
      next: (created: any) => {
        this.isSubmittingRig.set(false);
        const normalized = {
          ...created,
          id: created._id ?? created.id,
          rigName: created.equipmentName,
          managerName: this.newRigForm.managerName,
          drillDepthFt: this.newRigForm.drillDepthFt,
          crewCount: this.newRigForm.crewCount
        };
        this.rigs.update(list => [normalized, ...list]);
        this.showAddRigModal.set(false);
        this.notificationService.success('تمت الإضافة بنجاح', `تم إضافة الحفارة ${normalized.rigName} إلى الأسطول`);
        this.auditService.log({
          user: 'Operations Admin', role: 'Operations Manager',
          module: 'Operations', entityName: 'Rig', entityId: normalized.id,
          action: 'Create', oldValue: '', newValue: normalized.rigName,
          details: `Created new rig ${normalized.rigName} with ${this.newRigForm.horsepower} HP`
        });
      },
      error: (err: any) => {
        this.isSubmittingRig.set(false);
        this.notificationService.danger('خطأ في الحفظ', err?.error?.message || 'فشل في حفظ بيانات الحفارة');
      }
    });
  }

  openAddComponentModal() {
    if (!this.selectedRig()) return;
    this.newComponentForm = {
      name: '',
      serial: `COMP-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'Operational',
      certificationDate: new Date().toISOString().split('T')[0]
    };
    this.showAddComponentModal.set(true);
  }

  closeAddComponentModal() {
    this.showAddComponentModal.set(false);
  }

  submitAddComponent() {
    const rig = this.selectedRig();
    if (!rig) return;
    if (!this.newComponentForm.name) {
      this.notificationService.danger('بيانات ناقصة', 'يرجى إدخال اسم الجزء/المكون');
      return;
    }

    const rigId = rig._id || rig.id || '';
    const newComp = { ...this.newComponentForm };

    this.customComponentsMap.update(map => ({
      ...map,
      [rigId]: [newComp, ...(map[rigId] || [])]
    }));

    this.showAddComponentModal.set(false);
    this.notificationService.success('تم إضافة المكون', `تم ربط المكون ${newComp.name} بالحفارة ${rig.equipmentName}`);
    this.auditService.log({
      user: 'Operations Inspector', role: 'Operations Manager',
      module: 'Operations', entityName: 'RigComponent', entityId: rigId,
      action: 'Create', oldValue: '', newValue: newComp.name,
      details: `Added sub-component ${newComp.name} (SN: ${newComp.serial}) to ${rig.equipmentName}`
    });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.rigs' }
    ]);
    this.loadRigs();
    this.loadAllEquipment();
  }

  loadRigs() {
    this.isLoading.set(true);
    this.opsApi.getRigs().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data.items ?? []);
        this.rigs.set(list.map((r: any) => ({
          ...r,
          id:        r._id ?? r.id,
          rigName:   r.rigName ?? r.equipmentName ?? r.name,
          managerName: r.managerName ?? r.department ?? ''
        })));
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.danger('Error', 'Failed to load rigs');
        this.isLoading.set(false);
      }
    });
  }

  loadAllEquipment() {
    this.assetsApi.getEquipment({ limit: 200 }).subscribe({
      next: (res: any) => {
        const list = res.items ?? res;
        this.equipment.set(list.map((e: any) => ({ ...e, id: e._id ?? e.id })));
      },
      error: () => {}
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  selectRig(rig: Equipment) {
    this.selectedRig.set(rig);
    this.readinessChecklist.set(rig.status === 'Maintenance'
      ? { bopCertified: false, topDriveChecked: true, mudPumpsTested: false, drawworksLubricated: true, safetyGearVerified: false, fireSuppressionChecked: true }
      : { bopCertified: true,  topDriveChecked: true, mudPumpsTested: true,  drawworksLubricated: true, safetyGearVerified: true,  fireSuppressionChecked: true }
    );
  }

  closeRigDetails() { this.selectedRig.set(null); }

  toggleCheck(key: string) {
    this.readinessChecklist.update(checks => ({ ...checks, [key]: !checks[key as keyof typeof checks] }));
  }

  getCheck(key: string): boolean {
    return this.readinessChecklist()[key as keyof ReturnType<typeof this.readinessChecklist>] ?? false;
  }

  toggleCheckByKey(key: string) { this.toggleCheck(key); }

  submitSafetyAudit() {
    const rig = this.selectedRig();
    if (!rig) return;
    this.auditService.log({
      user: 'Operations Inspector', role: 'Operations Manager',
      module: 'Operations', entityName: 'RigReadiness', entityId: rig._id,
      action: 'Update', oldValue: 'Readiness check',
      newValue: `Score: ${this.readinessPercentage()}%`,
      details: `Safety Audit submitted for ${rig.equipmentName}. Score: ${this.readinessPercentage()}%`
    });
    this.notificationService.success('Audit Recorded', `${rig.equipmentName} readiness: ${this.readinessPercentage()}%`);
  }

  deployRig() {
    const rig = this.selectedRig();
    if (!rig) return;
    if (this.readinessPercentage() < 100) {
      this.notificationService.warning('Readiness Deficit', `Cannot deploy. Audit must be 100%. Current: ${this.readinessPercentage()}%`);
      return;
    }
    this.opsApi.updateRigStatus(rig._id, 'Active').subscribe({
      next: (updated: any) => {
        this.rigs.update(list => list.map(r => r._id === updated._id ? { ...r, status: 'Active' } : r));
        this.selectedRig.set({ ...rig, status: 'Active' });
        this.notificationService.success('Deployed', `${rig.equipmentName} is now Active`);
      },
      error: (err: any) => this.notificationService.danger('Error', err?.error?.message || 'Deploy failed')
    });
  }

  decommissionRig() {
    const rig = this.selectedRig();
    if (!rig) return;
    this.opsApi.updateRigStatus(rig._id, 'Maintenance').subscribe({
      next: (updated: any) => {
        this.rigs.update(list => list.map(r => r._id === updated._id ? { ...r, status: 'Maintenance' } : r));
        this.selectedRig.set({ ...rig, status: 'Maintenance' });
        this.notificationService.warning('Maintenance Order', `${rig.equipmentName} moved to Maintenance`);
      },
      error: (err: any) => this.notificationService.danger('Error', err?.error?.message || 'Failed')
    });
  }
}
