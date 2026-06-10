import { Component, OnInit, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../core/services/workflow.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { AuditService } from '../../core/services/audit.service';
import { NotificationService } from '../../core/services/notification.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { Project, EquipmentAssignment, AssetAssignment, MaterialConsumption, EquipmentTransfer, LaborRecord } from '../../shared/interfaces/project.interface';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './projects.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translateService = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  readonly workflowService = inject(WorkflowService);
  readonly mockDataService = inject(MockDataService);
  readonly authService = inject(AuthService);
  readonly auditService = inject(AuditService);
  readonly notificationService = inject(NotificationService);

  // --- STATE SIGNALS ---
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('All');
  readonly customerFilter = signal<string>('All');
  readonly selectedProjectCode = signal<string | null>(null);
  readonly activeTab = signal<string>('overview');

  // --- MODAL CONTROLS ---
  readonly showCreateProjectModal = signal<boolean>(false);
  readonly showAssignEquipmentModal = signal<boolean>(false);
  readonly showAssignAssetModal = signal<boolean>(false);
  readonly showRecordMaterialModal = signal<boolean>(false);
  readonly showLogLaborModal = signal<boolean>(false);
  readonly showInitiateTransferModal = signal<boolean>(false);

  // --- FORM STATES ---
  newProjectForm = {
    code: '',
    name: '',
    customer: '',
    contractValue: 0,
    startDate: '',
    endDate: '',
    country: '',
    region: '',
    siteName: '',
    gpsCoordinates: '',
    costCenterCode: '',
    costCenterName: '',
    preferredWarehouse: 'Warehouse A',
    nearestWarehouse: 'Warehouse A',
    distanceKm: 0,
    estimatedTransportationCost: 0
  };

  equipmentForm = {
    equipmentId: '',
    siteName: '',
    assignedDate: ''
  };

  assetForm = {
    assetId: '',
    assignedTo: '',
    location: '',
    assignedDate: ''
  };

  materialForm = {
    materialCode: '',
    warehouse: 'Warehouse A',
    issuedQuantity: 0,
    consumedQuantity: 0,
    docRef: '',
    issueDate: ''
  };

  laborForm = {
    employeeName: '',
    role: '',
    regularHours: 0,
    overtimeHours: 0,
    hourlyRate: 0,
    overtimeRate: 0,
    date: ''
  };

  transferForm = {
    equipmentId: '',
    fromLocation: '',
    toLocation: '',
    startDate: '',
    transportationHours: 0,
    transportationCost: 0,
    reason: ''
  };

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.projects' }
    ]);

    // Auto-select project from query param (e.g. navigated from contract approval)
    this.route.queryParams.subscribe(params => {
      const projectCode = params['project'];
      if (projectCode) {
        // Wait for data to be loaded then select
        const match = this.workflowService.projects().find(p => p.code === projectCode);
        if (match) {
          this.selectedProjectCode.set(match.code);
          this.activeTab.set('overview');
        }
      } else if (!this.selectedProjectCode()) {
        // Default: select first project
        const list = this.workflowService.projects();
        if (list.length > 0) {
          this.selectedProjectCode.set(list[0].code);
        }
      }
    });
  }

  // --- COMPUTED DATA FOR PROJECTS ---
  readonly filteredProjects = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const customer = this.customerFilter();
    const list = this.workflowService.projects();

    return list.filter(p => {
      const matchesQuery = !query || 
                           p.code.toLowerCase().includes(query) ||
                           p.name.toLowerCase().includes(query) ||
                           p.customer.toLowerCase().includes(query) ||
                           (p.costCenterCode && p.costCenterCode.toLowerCase().includes(query));
      const matchesStatus = status === 'All' || p.status === status;
      const matchesCustomer = customer === 'All' || p.customer === customer;
      return matchesQuery && matchesStatus && matchesCustomer;
    });
  });

  readonly uniqueCustomers = computed(() => {
    const list = this.workflowService.projects();
    return Array.from(new Set(list.map(p => p.customer)));
  });

  readonly selectedProject = computed(() => {
    const code = this.selectedProjectCode();
    if (!code) return null;
    return this.workflowService.projects().find(p => p.code === code) || null;
  });

  // --- KPI CALCULATIONS ---
  readonly totalProjectsCount = computed(() => this.workflowService.projects().length);
  readonly activeProjectsCount = computed(() => this.workflowService.projects().filter(p => p.status === 'Active').length);
  readonly totalBudgetSum = computed(() => this.workflowService.projects().reduce((sum, p) => sum + p.contractValue, 0));
  readonly totalConsumedSum = computed(() => this.workflowService.projects().reduce((sum, p) => sum + (p.consumedValue || 0), 0));
  readonly avgProgress = computed(() => {
    const list = this.workflowService.projects();
    if (list.length === 0) return 0;
    const totalProgress = list.reduce((sum, p) => sum + (p.progressPercent || 0), 0);
    return Math.round(totalProgress / list.length);
  });

  // --- TAB SUB-RESOURCES (FILTERED BY SELECTED PROJECT) ---
  readonly projectEquipmentAssignments = computed(() => {
    const code = this.selectedProjectCode();
    return this.workflowService.equipmentAssignments().filter(a => a.projectCode === code);
  });

  readonly projectAssetAssignments = computed(() => {
    const code = this.selectedProjectCode();
    return this.workflowService.assetAssignments().filter(a => a.projectCode === code);
  });

  readonly projectMaterialConsumptions = computed(() => {
    const code = this.selectedProjectCode();
    return this.workflowService.materialConsumptions().filter(m => m.projectCode === code);
  });

  readonly projectTransfers = computed(() => {
    const code = this.selectedProjectCode();
    return this.workflowService.equipmentTransfers().filter(t => t.projectCode === code);
  });

  readonly projectLaborRecords = computed(() => {
    const code = this.selectedProjectCode();
    return this.workflowService.laborRecords().filter(l => l.projectCode === code);
  });

  readonly projectAuditHistory = computed(() => {
    const code = this.selectedProjectCode();
    if (!code) return [];
    return this.auditService.logs().filter(log => 
      log.entityId === code || 
      (log.details && log.details.includes(code))
    );
  });

  // --- SPECIFIC COSTS FOR THE SELECTED PROJECT ---
  readonly projectCostMetrics = computed(() => {
    const p = this.selectedProject();
    if (!p) return null;

    // 1. Equipment Cost: hours used * daily rate / 24, or standard assignment cost
    // Let's estimate equipment cost: sum (daysUsed * 500)
    const eqCost = this.projectEquipmentAssignments().reduce((sum, a) => sum + (a.daysUsed * 300), 0);

    // 2. Asset Cost: fixed simulation
    const assetCost = this.projectAssetAssignments().length * 1500;

    // 3. Material Cost: consumed Qty * unit price
    const matCost = this.projectMaterialConsumptions().reduce((sum, mc) => sum + (mc.consumedQuantity * mc.unitPrice), 0);

    // 4. Labor Cost: labor record sum totalCost
    const laborCost = this.projectLaborRecords().reduce((sum, l) => sum + (l.totalCost || 0), 0);

    // 5. Transfer transportation costs
    const transCost = this.projectTransfers().reduce((sum, t) => sum + (t.transportationCost || 0), 0) + (p.estimatedTransportationCost || 0);

    const totalActual = eqCost + assetCost + matCost + laborCost + transCost;
    const remaining = p.contractValue - totalActual;
    const progress = p.contractValue > 0 ? Math.round((totalActual / p.contractValue) * 100) : 0;

    return {
      eqCost,
      assetCost,
      matCost,
      laborCost,
      transCost,
      totalActual,
      remaining,
      progress
    };
  });

  // --- TAB CONTROL ACTIONS ---
  selectProject(code: string) {
    this.selectedProjectCode.set(code);
    this.activeTab.set('overview');
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.projects', url: '/projects' },
      { label: code }
    ]);
  }

  clearSelection() {
    this.selectedProjectCode.set(null);
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.projects' }
    ]);
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  // --- STATE ACTION BUTTONS ---
  updateProjectStatus(status: 'Active' | 'Completed' | 'Suspended' | 'Delayed') {
    const code = this.selectedProjectCode();
    if (code) {
      this.workflowService.updateProject(code, { status });
      this.notificationService.success(
        this.translateService.instant('projects.status_updated_title'),
        this.translateService.instant('projects.status_updated_desc', { code, status })
      );
    }
  }

  // --- CRUD ACTIONS & MODAL SAVES ---
  openCreateProjectModal() {
    this.newProjectForm = {
      code: 'PROJ-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      name: '',
      customer: '',
      contractValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      country: 'Iraq',
      region: 'Basra',
      siteName: '',
      gpsCoordinates: '30.5N, 47.8E',
      costCenterCode: '',
      costCenterName: '',
      preferredWarehouse: 'Warehouse A',
      nearestWarehouse: 'Warehouse A',
      distanceKm: 25,
      estimatedTransportationCost: 1500
    };
    this.showCreateProjectModal.set(true);
  }

  saveNewProject() {
    if (!this.newProjectForm.name || !this.newProjectForm.customer) {
      this.notificationService.danger('Validation Error', 'Please complete all required fields.');
      return;
    }

    const ccCode = this.newProjectForm.costCenterCode || `CC-${this.newProjectForm.code}`;
    const ccName = this.newProjectForm.costCenterName || `${this.newProjectForm.name} Cost Center`;

    // 1. Create Cost Center
    this.workflowService.createCostCenter({
      code: ccCode,
      name: ccName,
      type: 'Project',
      parentCode: 'CC-DRILL-01',
      status: 'Active',
      description: `${this.newProjectForm.name} Cost Center`
    });

    // 2. Create Project
    const proj: Project = {
      code: this.newProjectForm.code,
      name: this.newProjectForm.name,
      contractId: 'con_manual',
      contractNumber: 'CON-MANUAL',
      customer: this.newProjectForm.customer,
      contractValue: this.newProjectForm.contractValue,
      consumedValue: 0,
      remainingValue: this.newProjectForm.contractValue,
      progressPercent: 0,
      status: 'Active',
      startDate: this.newProjectForm.startDate,
      endDate: this.newProjectForm.endDate,
      country: this.newProjectForm.country,
      region: this.newProjectForm.region,
      siteName: this.newProjectForm.siteName,
      gpsCoordinates: this.newProjectForm.gpsCoordinates,
      costCenterCode: ccCode,
      preferredWarehouse: this.newProjectForm.preferredWarehouse,
      nearestWarehouse: this.newProjectForm.nearestWarehouse,
      distanceKm: this.newProjectForm.distanceKm,
      estimatedTransportationCost: this.newProjectForm.estimatedTransportationCost
    };

    this.workflowService.createProject(proj);
    this.showCreateProjectModal.set(false);
    this.notificationService.success('Success', `Project ${proj.code} and linked Cost Center created successfully.`);
  }

  // --- EQUIPMENT METHODS ---
  openAssignEquipmentModal() {
    this.equipmentForm = {
      equipmentId: '',
      siteName: this.selectedProject()?.siteName || '',
      assignedDate: new Date().toISOString().split('T')[0]
    };
    this.showAssignEquipmentModal.set(true);
  }

  saveEquipmentAssignment() {
    const equip = this.mockDataService.equipment().find(e => e.id === this.equipmentForm.equipmentId);
    const proj = this.selectedProject();
    if (!equip || !proj) {
      this.notificationService.danger('Error', 'Please select a valid equipment unit.');
      return;
    }

    const assignment: Omit<EquipmentAssignment, 'id'> = {
      equipmentId: equip.id,
      equipmentName: equip.equipmentName,
      serialNumber: equip.serialNumber,
      projectCode: proj.code,
      siteName: this.equipmentForm.siteName,
      assignedDate: this.equipmentForm.assignedDate,
      status: 'Assigned',
      hoursUsed: 0,
      daysUsed: 1,
      costCenterCode: proj.costCenterCode
    };

    this.workflowService.createEquipmentAssignment(assignment);

    // Update equipment status in mock dataset
    this.mockDataService.equipment.update(list =>
      list.map(e => e.id === equip.id ? { ...e, status: 'Active', projectAssignment: proj.name } : e)
    );

    this.showAssignEquipmentModal.set(false);
    this.notificationService.success('Success', `Equipment ${equip.equipmentName} assigned successfully.`);
  }

  returnEquipment(assignment: EquipmentAssignment) {
    const today = new Date().toISOString().split('T')[0];
    this.workflowService.updateEquipmentAssignment(assignment.id, {
      returnedDate: today,
      status: 'Returned'
    });

    // Update equipment status to standby
    this.mockDataService.equipment.update(list =>
      list.map(e => e.id === assignment.equipmentId ? { ...e, status: 'Standby', projectAssignment: 'None' } : e)
    );

    this.notificationService.success('Success', `Equipment returned to warehouse storage successfully.`);
  }

  // --- ASSET METHODS ---
  openAssignAssetModal() {
    this.assetForm = {
      assetId: '',
      assignedTo: '',
      location: this.selectedProject()?.siteName || '',
      assignedDate: new Date().toISOString().split('T')[0]
    };
    this.showAssignAssetModal.set(true);
  }

  saveAssetAssignment() {
    const equip = this.mockDataService.equipment().find(e => e.id === this.assetForm.assetId);
    const proj = this.selectedProject();
    if (!equip || !proj) {
      this.notificationService.danger('Error', 'Please select a valid asset.');
      return;
    }

    const assignment: Omit<AssetAssignment, 'id'> = {
      assetId: equip.id,
      assetName: equip.equipmentName,
      serialNumber: equip.serialNumber,
      projectCode: proj.code,
      assignedDate: this.assetForm.assignedDate,
      assignedTo: this.assetForm.assignedTo,
      location: this.assetForm.location,
      costCenterCode: proj.costCenterCode,
      status: 'Active'
    };

    this.workflowService.createAssetAssignment(assignment);
    this.showAssignAssetModal.set(false);
    this.notificationService.success('Success', `Asset assigned to ${assignment.assignedTo} successfully.`);
  }

  // --- MATERIAL METHODS ---
  openRecordMaterialModal() {
    this.materialForm = {
      materialCode: '',
      warehouse: this.selectedProject()?.preferredWarehouse || 'Warehouse A',
      issuedQuantity: 0,
      consumedQuantity: 0,
      docRef: 'MIV-' + Math.floor(1000 + Math.random() * 9000),
      issueDate: new Date().toISOString().split('T')[0]
    };
    this.showRecordMaterialModal.set(true);
  }

  saveMaterialConsumption() {
    const item = this.mockDataService.inventoryItems().find(i => i.itemCode === this.materialForm.materialCode);
    const proj = this.selectedProject();
    if (!item || !proj) {
      this.notificationService.danger('Error', 'Please select a valid material item.');
      return;
    }

    if (this.materialForm.issuedQuantity <= 0 || this.materialForm.consumedQuantity <= 0) {
      this.notificationService.danger('Validation Error', 'Quantities must be positive.');
      return;
    }

    // Check inventory stock
    if (item.quantity < this.materialForm.issuedQuantity) {
      this.notificationService.danger('Stock Shortage', `Only ${item.quantity} units available in ${this.materialForm.warehouse}.`);
      return;
    }

    const consumption: Omit<MaterialConsumption, 'id'> = {
      projectCode: proj.code,
      materialCode: item.itemCode,
      materialName: item.itemName,
      warehouse: this.materialForm.warehouse,
      issuedQuantity: this.materialForm.issuedQuantity,
      consumedQuantity: this.materialForm.consumedQuantity,
      remainingQuantity: this.materialForm.issuedQuantity - this.materialForm.consumedQuantity,
      costCenterCode: proj.costCenterCode,
      issueDate: this.materialForm.issueDate,
      docRef: this.materialForm.docRef,
      unitPrice: item.unitPrice
    };

    this.workflowService.createMaterialConsumption(consumption);

    // Reduce inventory stock automatically
    this.mockDataService.inventoryItems.update(list =>
      list.map(i => i.itemCode === item.itemCode ? { ...i, quantity: i.quantity - consumption.issuedQuantity } : i)
    );

    this.showRecordMaterialModal.set(false);
    this.notificationService.success('Success', 'Material consumption recorded and stock level reduced.');
  }

  // --- LABOR METHODS ---
  openLogLaborModal() {
    this.laborForm = {
      employeeName: '',
      role: '',
      regularHours: 0,
      overtimeHours: 0,
      hourlyRate: 0,
      overtimeRate: 0,
      date: new Date().toISOString().split('T')[0]
    };
    this.showLogLaborModal.set(true);
  }

  saveLaborRecord() {
    const proj = this.selectedProject();
    if (!proj || !this.laborForm.employeeName || !this.laborForm.role) {
      this.notificationService.danger('Validation Error', 'Please complete employee details.');
      return;
    }

    const labor: Omit<LaborRecord, 'id'> = {
      projectCode: proj.code,
      employeeName: this.laborForm.employeeName,
      role: this.laborForm.role,
      regularHours: this.laborForm.regularHours,
      overtimeHours: this.laborForm.overtimeHours,
      hourlyRate: this.laborForm.hourlyRate,
      overtimeRate: this.laborForm.overtimeRate,
      totalCost: (this.laborForm.regularHours * this.laborForm.hourlyRate) + (this.laborForm.overtimeHours * this.laborForm.overtimeRate),
      date: this.laborForm.date
    };

    this.workflowService.createLaborRecord(labor);
    this.showLogLaborModal.set(false);
    this.notificationService.success('Success', `Labor hours recorded for ${labor.employeeName}.`);
  }

  // --- TRANSFER METHODS ---
  openInitiateTransferModal() {
    this.transferForm = {
      equipmentId: '',
      fromLocation: 'Warehouse A',
      toLocation: this.selectedProject()?.siteName || '',
      startDate: new Date().toISOString().split('T')[0],
      transportationHours: 4,
      transportationCost: 800,
      reason: ''
    };
    this.showInitiateTransferModal.set(true);
  }

  saveEquipmentTransfer() {
    const equip = this.mockDataService.equipment().find(e => e.id === this.transferForm.equipmentId);
    const proj = this.selectedProject();
    if (!equip || !proj) {
      this.notificationService.danger('Error', 'Please select a valid equipment unit.');
      return;
    }

    const transfer: EquipmentTransfer = {
      transferNumber: 'TRF-' + Math.floor(1000 + Math.random() * 9000),
      equipmentId: equip.id,
      equipmentName: equip.equipmentName,
      fromLocation: this.transferForm.fromLocation,
      toLocation: this.transferForm.toLocation,
      projectCode: proj.code,
      costCenterCode: proj.costCenterCode,
      startDate: this.transferForm.startDate,
      transportationHours: this.transferForm.transportationHours,
      transportationCost: this.transferForm.transportationCost,
      reason: this.transferForm.reason,
      status: 'Requested'
    };

    this.workflowService.createEquipmentTransfer(transfer);

    // Update equipment to in-transit
    this.mockDataService.equipment.update(list =>
      list.map(e => e.id === equip.id ? { ...e, status: 'Standby', location: 'In Transit' } : e)
    );

    this.showInitiateTransferModal.set(false);
    this.notificationService.success('Success', `Equipment transfer ${transfer.transferNumber} requested.`);
  }

  completeTransfer(transfer: EquipmentTransfer) {
    const today = new Date().toISOString().split('T')[0];
    this.workflowService.updateEquipmentTransfer(transfer.transferNumber, {
      status: 'Completed',
      arrivalDate: today
    });

    // Update equipment location & status
    this.mockDataService.equipment.update(list =>
      list.map(e => e.id === transfer.equipmentId ? { ...e, location: transfer.toLocation, status: 'Active' } : e)
    );

    this.notificationService.success('Success', `Transfer marked as completed. Equipment deployed to site.`);
  }

  getBarHeight(value: number): number {
    if (!value) return 0;
    return Math.min(150, (value / 1000) * 1.5);
  }
}
