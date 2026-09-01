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
import { WorkflowApiService } from '../../core/services/workflow-api.service';
import { RoleDirective } from '../../shared/directives/role.directive';
import { Project, EquipmentAssignment, AssetAssignment, MaterialConsumption, EquipmentTransfer, LaborRecord } from '../../shared/interfaces/project.interface';
import { CostCenterStoreService } from '../../core/services/cost-center-store.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RoleDirective],
  templateUrl: './projects.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translateService = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly workflowApi = inject(WorkflowApiService);
  readonly workflowService = inject(WorkflowService);
  readonly mockDataService = inject(MockDataService);
  readonly authService = inject(AuthService);
  readonly auditService = inject(AuditService);
  readonly notificationService = inject(NotificationService);
  private readonly costCenterStore = inject(CostCenterStoreService);

  // --- COST CENTER HIERARCHY (2 Main Roots: Head Office & Free Zone) ---
  /** Signal that drives child CC list — updated by onParentCCChange() */
  readonly selectedParentCCCode = signal<string>('');

  /** The 2 Main Root options (Head Office & Free Zone) */
  readonly parentCostCenters = computed(() =>
    this.costCenterStore.mainRoots()
  );

  /** Cost Centers / Departments under the selected Main Root */
  readonly childCostCenters = computed(() => {
    const parentCode = this.selectedParentCCCode();
    if (!parentCode) return [];
    return this.costCenterStore.getDepartmentsByRoot(parentCode);
  });

  /** Called when the parent CC dropdown changes */
  onParentCCChange() {
    this.selectedParentCCCode.set(this.newProjectForm.parentCostCenterCode);
    // Reset child selection when parent changes
    this.newProjectForm.costCenterCode = '';
    this.newProjectForm.costCenterName = '';
  }

  /** Called when the child CC dropdown changes — syncs the name */
  onChildCCChange() {
    const selected = this.costCenterStore.costCenters()
      .find(cc => cc.code === this.newProjectForm.costCenterCode);
    if (selected) {
      this.newProjectForm.costCenterName = selected.nameEn || selected.name || selected.code;
    } else {
      this.newProjectForm.costCenterName = '';
    }
  }

  // --- STATE SIGNALS ---
  readonly projectsList = signal<any[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly editingProjectCode = signal<string>('');

  // --- BACKEND SUB-RESOURCE SIGNALS PER PROJECT ---
  readonly backendEquipment = signal<any[]>([]);
  readonly backendMaterials = signal<any[]>([]);
  readonly backendLabor = signal<any[]>([]);
  readonly backendTransfers = signal<any[]>([]);
  readonly backendCostSummary = signal<any>(null);

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
    parentCostCenterCode: '',   // Level-1 CC (main cost center)
    costCenterCode: '',          // Level-2+ CC (sub department) — may be empty if using parent
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

    this.loadProjects();
  }

  loadProjects() {
    this.isLoading.set(true);
    this.workflowApi.getProjects({ limit: 100 }).subscribe({
      next: (res: any) => {
        const rawList = res.items ?? res.data ?? (Array.isArray(res) ? res : []);
        const apiProjects = rawList.map((p: any) => ({
          ...p,
          code: p.code ?? p.projectCode ?? p._id,
          name: p.name ?? p.projectName ?? p.title ?? 'Project',
          customer: p.customer ?? p.clientName ?? 'Client',
          contractValue: Number(p.contractValue ?? p.value ?? 0),
          consumedValue: Number(p.consumedValue ?? 0),
          remainingValue: Number(p.remainingValue ?? p.contractValue ?? p.value ?? 0),
          progressPercent: Number(p.progressPercent ?? 0),
          status: p.status ?? 'Active'
        }));

        // Merge with local workflowService projects if needed
        const localProjects = this.workflowService.projects();
        const mergedMap = new Map<string, any>();
        localProjects.forEach(p => mergedMap.set(p.code, p));
        apiProjects.forEach((p: any) => mergedMap.set(p.code, p));
        const combined = Array.from(mergedMap.values());

        this.projectsList.set(combined);

        // Auto-select project from query param or default
        const queryCode = this.route.snapshot.queryParams['project'];
        const selectedCode = queryCode && combined.some((p: any) => p.code === queryCode)
          ? queryCode
          : (this.selectedProjectCode() || combined[0]?.code || null);

        if (selectedCode) {
          this.selectedProjectCode.set(selectedCode);
          this.loadProjectSubResources(selectedCode);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.projectsList.set(this.workflowService.projects());
        this.isLoading.set(false);
      }
    });
  }

  loadProjectSubResources(code: string) {
    if (!code) return;

    this.workflowApi.getProjectEquipment(code).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        this.backendEquipment.set(list.map((e: any) => ({
          id: e._id ?? e.id ?? e.equipmentId,
          equipmentId: e.equipmentId ?? e._id,
          equipmentName: e.equipmentName ?? e.name ?? 'Equipment',
          serialNumber: e.serialNumber ?? 'SN-UNKNOWN',
          projectCode: code,
          siteName: e.siteName ?? 'Site',
          assignedDate: e.assignedDate ? new Date(e.assignedDate).toISOString().split('T')[0] : '',
          status: e.status ?? 'Assigned',
          hoursUsed: e.hoursUsed ?? 0,
          daysUsed: e.daysUsed ?? 1,
          costCenterCode: e.costCenterCode
        })));
      },
      error: () => this.backendEquipment.set([])
    });

    this.workflowApi.getProjectMaterials(code).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        this.backendMaterials.set(list.map((m: any) => ({
          id: m._id ?? m.id,
          projectCode: code,
          materialCode: m.materialCode,
          materialName: m.materialName,
          warehouse: m.warehouse,
          issuedQuantity: m.issuedQuantity ?? 0,
          consumedQuantity: m.consumedQuantity ?? 0,
          remainingQuantity: (m.issuedQuantity ?? 0) - (m.consumedQuantity ?? 0),
          costCenterCode: m.costCenterCode,
          issueDate: m.issueDate ? new Date(m.issueDate).toISOString().split('T')[0] : '',
          docRef: m.docRef,
          unitPrice: m.unitPrice ?? 0
        })));
      },
      error: () => this.backendMaterials.set([])
    });

    this.workflowApi.getProjectLabor(code).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        this.backendLabor.set(list.map((l: any) => ({
          id: l._id ?? l.id,
          projectCode: code,
          employeeName: l.employeeName,
          role: l.role,
          regularHours: l.regularHours ?? 0,
          overtimeHours: l.overtimeHours ?? 0,
          hourlyRate: l.hourlyRate ?? 0,
          overtimeRate: l.overtimeRate ?? 0,
          totalCost: l.totalCost ?? ((l.regularHours ?? 0) * (l.hourlyRate ?? 0) + (l.overtimeHours ?? 0) * (l.overtimeRate ?? 0)),
          date: l.date ? new Date(l.date).toISOString().split('T')[0] : ''
        })));
      },
      error: () => this.backendLabor.set([])
    });

    this.workflowApi.getProjectTransfers(code).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        this.backendTransfers.set(list.map((t: any) => ({
          transferNumber: t.transferNumber ?? t._id,
          equipmentId: t.equipmentId,
          equipmentName: t.equipmentName,
          fromLocation: t.fromLocation,
          toLocation: t.toLocation,
          projectCode: code,
          costCenterCode: t.costCenterCode,
          startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
          transportationHours: t.transportationHours ?? 0,
          transportationCost: t.transportationCost ?? 0,
          reason: t.reason ?? '',
          status: t.status ?? 'Requested'
        })));
      },
      error: () => this.backendTransfers.set([])
    });

    this.workflowApi.getProjectCostSummary(code).subscribe({
      next: (res: any) => this.backendCostSummary.set(res.data ?? res),
      error: () => this.backendCostSummary.set(null)
    });
  }

  // --- COMPUTED DATA FOR PROJECTS ---
  readonly filteredProjects = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const customer = this.customerFilter();
    const list = this.projectsList();

    return list.filter(p => {
      const matchesQuery = !query || 
                           (p.code && p.code.toLowerCase().includes(query)) ||
                           (p.name && p.name.toLowerCase().includes(query)) ||
                           (p.customer && p.customer.toLowerCase().includes(query)) ||
                           (p.costCenterCode && p.costCenterCode.toLowerCase().includes(query));
      const matchesStatus = status === 'All' || p.status === status;
      const matchesCustomer = customer === 'All' || p.customer === customer;
      return matchesQuery && matchesStatus && matchesCustomer;
    });
  });

  readonly uniqueCustomers = computed(() => {
    const list = this.projectsList();
    return Array.from(new Set(list.map(p => p.customer).filter(Boolean)));
  });

  readonly selectedProject = computed(() => {
    const code = this.selectedProjectCode();
    if (!code) return null;
    return this.projectsList().find(p => p.code === code) || null;
  });

  // --- KPI CALCULATIONS ---
  readonly totalProjectsCount = computed(() => this.projectsList().length);
  readonly activeProjectsCount = computed(() => this.projectsList().filter(p => p.status === 'Active').length);
  readonly totalBudgetSum = computed(() => this.projectsList().reduce((sum, p) => sum + (p.contractValue || 0), 0));
  readonly totalConsumedSum = computed(() => this.projectsList().reduce((sum, p) => sum + (p.consumedValue || 0), 0));
  readonly avgProgress = computed(() => {
    const list = this.projectsList();
    if (list.length === 0) return 0;
    const totalProgress = list.reduce((sum, p) => sum + (p.progressPercent || 0), 0);
    return Math.round(totalProgress / list.length);
  });

  // --- TAB SUB-RESOURCES (STRICTLY SCOPED TO SELECTED PROJECT) ---
  readonly projectEquipmentAssignments = computed(() => {
    const code = this.selectedProjectCode();
    if (!code) return [];
    const backend = this.backendEquipment();
    const local = this.workflowService.equipmentAssignments().filter(a => a.projectCode === code);
    const map = new Map<string, any>();
    local.forEach(item => map.set(item.id, item));
    backend.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  });

  readonly projectAssetAssignments = computed(() => {
    const code = this.selectedProjectCode();
    if (!code) return [];
    return this.workflowService.assetAssignments().filter(a => a.projectCode === code);
  });

  readonly projectMaterialConsumptions = computed(() => {
    const code = this.selectedProjectCode();
    if (!code) return [];
    const backend = this.backendMaterials();
    const local = this.workflowService.materialConsumptions().filter(m => m.projectCode === code);
    const map = new Map<string, any>();
    local.forEach(item => map.set(item.materialCode + item.issueDate, item));
    backend.forEach(item => map.set(item.materialCode + item.issueDate, item));
    return Array.from(map.values());
  });

  readonly projectTransfers = computed(() => {
    const code = this.selectedProjectCode();
    if (!code) return [];
    const backend = this.backendTransfers();
    const local = this.workflowService.equipmentTransfers().filter(t => t.projectCode === code);
    const map = new Map<string, any>();
    local.forEach(item => map.set(item.transferNumber, item));
    backend.forEach(item => map.set(item.transferNumber, item));
    return Array.from(map.values());
  });

  readonly projectLaborRecords = computed(() => {
    const code = this.selectedProjectCode();
    if (!code) return [];
    const backend = this.backendLabor();
    const local = this.workflowService.laborRecords().filter(l => l.projectCode === code);
    const map = new Map<string, any>();
    local.forEach(item => map.set(item.employeeName + item.date, item));
    backend.forEach(item => map.set(item.employeeName + item.date, item));
    return Array.from(map.values());
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

    const summary = this.backendCostSummary();
    if (summary) {
      return {
        eqCost: summary.consumedValue ? Math.round(summary.consumedValue * 0.4) : 0,
        assetCost: summary.consumedValue ? Math.round(summary.consumedValue * 0.1) : 0,
        matCost: summary.consumedValue ? Math.round(summary.consumedValue * 0.3) : 0,
        laborCost: summary.consumedValue ? Math.round(summary.consumedValue * 0.15) : 0,
        transCost: summary.consumedValue ? Math.round(summary.consumedValue * 0.05) : 0,
        totalActual: summary.consumedValue ?? 0,
        remaining: summary.remainingValue ?? ((p.contractValue || 0) - (summary.consumedValue || 0)),
        progress: summary.progressPercent ?? p.progressPercent ?? 0
      };
    }

    const eqCost = this.projectEquipmentAssignments().reduce((sum, a) => sum + ((a.daysUsed || 1) * 300), 0);
    const assetCost = this.projectAssetAssignments().length * 1500;
    const matCost = this.projectMaterialConsumptions().reduce((sum, mc) => sum + ((mc.consumedQuantity || 0) * (mc.unitPrice || 0)), 0);
    const laborCost = this.projectLaborRecords().reduce((sum, l) => sum + (l.totalCost || 0), 0);
    const transCost = this.projectTransfers().reduce((sum, t) => sum + (t.transportationCost || 0), 0) + (p.estimatedTransportationCost || 0);

    const totalActual = eqCost + assetCost + matCost + laborCost + transCost;
    const remaining = (p.contractValue || 0) - totalActual;
    const progress = (p.contractValue || 0) > 0 ? Math.round((totalActual / p.contractValue) * 100) : (p.progressPercent || 0);

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
    this.loadProjectSubResources(code);
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
      this.workflowApi.updateProjectStatus(code, status as any).subscribe({
        next: () => {
          this.workflowService.updateProject(code, { status });
          this.notificationService.success(
            this.translateService.instant('projects.status_updated_title'),
            this.translateService.instant('projects.status_updated_desc', { code, status })
          );
          this.loadProjects();
        },
        error: () => {
          this.workflowService.updateProject(code, { status });
          this.loadProjects();
        }
      });
    }
  }

  // --- CRUD ACTIONS & MODAL SAVES ---
  openCreateProjectModal() {
    this.isEditMode.set(false);
    this.editingProjectCode.set('');
    this.selectedParentCCCode.set('');
    this.newProjectForm = {
      code: 'PROJ-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      name: '',
      customer: '',
      contractValue: 1000000,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      country: 'Egypt',
      region: 'Red Sea',
      siteName: '',
      gpsCoordinates: '28.3N, 33.1E',
      parentCostCenterCode: '',
      costCenterCode: '',
      costCenterName: '',
      preferredWarehouse: 'Warehouse A',
      nearestWarehouse: 'Warehouse A',
      distanceKm: 25,
      estimatedTransportationCost: 1500
    };
    this.showCreateProjectModal.set(true);
  }

  openEditProjectModal(project: any) {
    if (!project) return;
    this.isEditMode.set(true);
    this.editingProjectCode.set(project.code);
    // Restore parent CC from existing costCenterCode
    const existingCC = this.costCenterStore.costCenters()
      .find(cc => cc.code === (project.costCenterCode || ''));
    const parentCode = existingCC?.parentCode ?? project.costCenterCode ?? '';
    this.selectedParentCCCode.set(parentCode);
    this.newProjectForm = {
      code: project.code,
      name: project.name,
      customer: project.customer,
      contractValue: project.contractValue || 0,
      startDate: project.startDate || new Date().toISOString().split('T')[0],
      endDate: project.endDate || new Date().toISOString().split('T')[0],
      country: project.country || 'Egypt',
      region: project.region || 'Red Sea',
      siteName: project.siteName || '',
      gpsCoordinates: project.gpsCoordinates || '',
      parentCostCenterCode: parentCode,
      costCenterCode: existingCC?.parentCode ? (project.costCenterCode || '') : '',
      costCenterName: project.costCenterName || '',
      preferredWarehouse: project.preferredWarehouse || 'Warehouse A',
      nearestWarehouse: project.nearestWarehouse || 'Warehouse A',
      distanceKm: project.distanceKm || 0,
      estimatedTransportationCost: project.estimatedTransportationCost || 0
    };
    this.showCreateProjectModal.set(true);
  }

  saveNewProject() {
    if (!this.newProjectForm.name || !this.newProjectForm.customer) {
      this.notificationService.danger('Validation Error', 'Please complete all required fields.');
      return;
    }
    if (!this.newProjectForm.parentCostCenterCode && !this.newProjectForm.costCenterCode) {
      this.notificationService.danger('Validation Error', 'Please select a Cost Center.');
      return;
    }

    // Resolve final CC: child CC takes priority; if none, use parent CC directly
    const ccCode = this.newProjectForm.costCenterCode
      || this.newProjectForm.parentCostCenterCode
      || `CC-${this.newProjectForm.code}`;
    const resolvedCC = this.costCenterStore.costCenters().find(cc => cc.code === ccCode);
    const ccName = resolvedCC?.nameEn || resolvedCC?.name || this.newProjectForm.costCenterName || `${this.newProjectForm.name} Cost Center`;

    const parentCC = this.newProjectForm.parentCostCenterCode || undefined;
    const projData = {
      code: this.newProjectForm.code,
      name: this.newProjectForm.name,
      customer: this.newProjectForm.customer,
      contractValue: Number(this.newProjectForm.contractValue),
      startDate: this.newProjectForm.startDate,
      endDate: this.newProjectForm.endDate,
      country: this.newProjectForm.country,
      region: this.newProjectForm.region,
      siteName: this.newProjectForm.siteName,
      gpsCoordinates: this.newProjectForm.gpsCoordinates,
      costCenterCode: ccCode,
      costCenterName: ccName,
      parentCostCenter: parentCC,
      parentCostCenterCode: parentCC,
      preferredWarehouse: this.newProjectForm.preferredWarehouse,
      nearestWarehouse: this.newProjectForm.nearestWarehouse,
      distanceKm: Number(this.newProjectForm.distanceKm),
      estimatedTransportationCost: Number(this.newProjectForm.estimatedTransportationCost)
    };

    if (this.isEditMode()) {
      this.workflowApi.updateProject(this.editingProjectCode(), projData).subscribe({
        next: () => {
          this.workflowService.updateProject(this.editingProjectCode(), projData);
          this.showCreateProjectModal.set(false);
          this.notificationService.success('Success', `Project ${this.editingProjectCode()} updated successfully.`);
          this.loadProjects();
        },
        error: () => {
          this.workflowService.updateProject(this.editingProjectCode(), projData);
          this.showCreateProjectModal.set(false);
          this.loadProjects();
        }
      });
    } else {
      this.workflowApi.createProject(projData).subscribe({
        next: (created: any) => {
          this.workflowService.createProject(created ?? projData);
          this.showCreateProjectModal.set(false);
          this.notificationService.success('Success', `Project ${this.newProjectForm.code} created successfully.`);
          this.loadProjects();
        },
        error: () => {
          this.workflowService.createProject(projData as any);
          this.showCreateProjectModal.set(false);
          this.loadProjects();
        }
      });
    }
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

    // 1. Sync local workflow service
    this.workflowService.createEquipmentAssignment(assignment);

    // 2. Call backend API
    this.workflowApi.assignEquipmentToProject(proj.code, {
      equipmentId: equip.id,
      siteName: this.equipmentForm.siteName,
      assignedDate: this.equipmentForm.assignedDate
    }).subscribe({
      next: () => {},
      error: () => {}
    });

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

    // 1. Sync local workflow service
    this.workflowService.createMaterialConsumption(consumption);

    // 2. Call backend API
    this.workflowApi.addProjectMaterial(proj.code, {
      materialCode: item.itemCode,
      materialName: item.itemName,
      warehouse: this.materialForm.warehouse,
      issuedQuantity: Number(this.materialForm.issuedQuantity),
      consumedQuantity: Number(this.materialForm.consumedQuantity),
      unitPrice: item.unitPrice,
      docRef: this.materialForm.docRef,
      issueDate: this.materialForm.issueDate
    }).subscribe({
      next: () => {},
      error: () => {}
    });

    // Reduce inventory stock automatically
    this.mockDataService.inventoryItems.update(list =>
      list.map(i => i.itemCode === item.itemCode ? { ...i, quantity: Math.max(0, i.quantity - consumption.issuedQuantity) } : i)
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
      regularHours: Number(this.laborForm.regularHours),
      overtimeHours: Number(this.laborForm.overtimeHours),
      hourlyRate: Number(this.laborForm.hourlyRate),
      overtimeRate: Number(this.laborForm.overtimeRate),
      totalCost: (Number(this.laborForm.regularHours) * Number(this.laborForm.hourlyRate)) + (Number(this.laborForm.overtimeHours) * Number(this.laborForm.overtimeRate)),
      date: this.laborForm.date
    };

    // 1. Sync local workflow service
    this.workflowService.createLaborRecord(labor);

    // 2. Call backend API
    this.workflowApi.addProjectLabor(proj.code, {
      employeeName: this.laborForm.employeeName,
      role: this.laborForm.role,
      date: this.laborForm.date,
      regularHours: Number(this.laborForm.regularHours),
      overtimeHours: Number(this.laborForm.overtimeHours),
      hourlyRate: Number(this.laborForm.hourlyRate),
      overtimeRate: Number(this.laborForm.overtimeRate)
    }).subscribe({
      next: () => {},
      error: () => {}
    });

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
      transportationHours: Number(this.transferForm.transportationHours),
      transportationCost: Number(this.transferForm.transportationCost),
      reason: this.transferForm.reason,
      status: 'Requested'
    };

    // 1. Sync local workflow service
    this.workflowService.createEquipmentTransfer(transfer);

    // 2. Call backend API
    this.workflowApi.addProjectTransfer(proj.code, {
      equipmentId: equip.id,
      fromLocation: this.transferForm.fromLocation,
      toLocation: this.transferForm.toLocation,
      startDate: this.transferForm.startDate,
      transportationHours: Number(this.transferForm.transportationHours),
      transportationCost: Number(this.transferForm.transportationCost),
      reason: this.transferForm.reason
    }).subscribe({
      next: () => {},
      error: () => {}
    });

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
