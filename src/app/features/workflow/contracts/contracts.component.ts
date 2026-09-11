import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { AssetsApiService } from '../../../core/services/assets-api.service';
import { OperationsApiService } from '../../../core/services/operations-api.service';
import {
  WorkflowApiService,
  Contract,
  ContractStatus,
  ContractAsset,
  CreateContractBody,
  PaginatedResponse
} from '../../../core/services/workflow-api.service';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';
import { CostCenterStoreService } from '../../../core/services/cost-center-store.service';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './contracts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractsComponent implements OnInit {
  private readonly workflowApi   = inject(WorkflowApiService);
  private readonly assetsApi     = inject(AssetsApiService);
  private readonly opsApi        = inject(OperationsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService   = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router        = inject(Router);
  private readonly translate     = inject(TranslateService);
  readonly exchangeRateService   = inject(ExchangeRateService);
  private readonly costCenterStore = inject(CostCenterStoreService);

  // ── Cost Center Hierarchy (3 Levels: Root → Dept → Sub/Project CC) ─────────
  readonly mainRoots = computed(() => this.costCenterStore.mainRoots());
  readonly contractParentCC = signal<string>('');   // Level 1: HeadOffice | FreeZone
  readonly contractLevel2CC = signal<string>('');   // Level 2: Department (e.g. C11)

  /** The 2 Main Root options (Head Office & Free Zone) */
  readonly parentCostCenters = computed(() =>
    this.costCenterStore.mainRoots()
  );

  /** Level-2: Departments under the selected Root */
  readonly childCostCenters = computed(() => {
    const parent = this.contractParentCC();
    if (!parent) return [];
    return this.costCenterStore.getDepartmentsByRoot(parent);
  });

  /** Level-3: Sub-departments / Project CCs under the selected Level-2 department */
  readonly grandchildCostCenters = computed(() => {
    const l2 = this.contractLevel2CC();
    if (!l2) return [];
    return this.costCenterStore.getChildren(l2);
  });

  onParentCCChange(parentCode: string) {
    this.contractParentCC.set(parentCode);
    this.contractLevel2CC.set('');
    this.formModel.parentCostCenter = parentCode;
    this.formModel.costCenterCode   = '';
    this.formModel.costCenterName   = '';
  }

  onChildCCChange(childCode: string) {
    this.contractLevel2CC.set(childCode);
    this.formModel.costCenterCode = childCode;
    // Reset level-3 selection when level-2 changes
    const l3list = this.costCenterStore.getChildren(childCode);
    if (l3list.length === 0) {
      // No level-3 children — resolve name from level-2
      const selected = this.costCenterStore.costCenters().find(cc => cc.code === childCode);
      this.formModel.costCenterName = selected?.nameEn || selected?.name || selected?.code || '';
    } else {
      // Has level-3 children — clear resolved name until user picks one
      this.formModel.costCenterName = '';
    }
  }

  onGrandchildCCChange(grandchildCode: string) {
    const selected = this.costCenterStore.costCenters().find(cc => cc.code === grandchildCode);
    if (selected) {
      this.formModel.costCenterCode = grandchildCode;
      this.formModel.costCenterName = selected.nameEn || selected.name || selected.code;
    } else {
      this.formModel.costCenterCode = this.contractLevel2CC();
      this.formModel.costCenterName = '';
    }
  }

  // ── State ──────────────────────────────────────────────────────────────────
  readonly contracts        = signal<Contract[]>([]);
  readonly allAssets        = signal<any[]>([]);          // ALL equipment (all categories)
  readonly selectedAssets   = signal<ContractAsset[]>([]); // multi-selected assets
  readonly isLoading        = signal(false);
  readonly selectedContract = signal<Contract | null>(null);

  // Asset picker UI state — must be signals so filteredAssets computed re-evaluates reactively
  readonly assetSearchQuery    = signal('');
  readonly assetCategoryFilter = signal('ALL');
  isAssetPickerOpen = signal(false);

  // Computed: assets filtered by search + category in the picker
  readonly filteredAssets = computed(() => {
    let list = this.allAssets();
    const q   = this.assetSearchQuery().trim().toLowerCase();
    const cat = this.assetCategoryFilter();
    if (cat !== 'ALL') list = list.filter((a: any) => a.category === cat);
    if (q) list = list.filter((a: any) =>
      (a.equipmentName || '').toLowerCase().includes(q) ||
      (a.equipmentCode || '').toLowerCase().includes(q) ||
      (a.assetNumber   || '').toLowerCase().includes(q) ||
      (a.location      || '').toLowerCase().includes(q)
    );
    return list;
  });

  readonly assetCategories = computed(() => {
    const cats = new Set<string>(this.allAssets().map((a: any) => a.category).filter(Boolean));
    return ['ALL', ...Array.from(cats).sort()];
  });

  searchQuery   = '';
  statusFilter  = 'ALL';
  typeFilter    = 'ALL';

  isModalOpen        = signal(false);
  isEditMode         = signal(false);
  editingContractId  = '';

  // Exchange rate state
  readonly liveRate      = signal<number | null>(null);
  readonly rateDate      = signal<string>('');
  readonly rateSource    = signal<string>('');
  readonly isFetchingRate = signal<boolean>(false);
  readonly rateError     = signal<boolean>(false);

  formModel: any = this.emptyForm();

  readonly filteredContracts = computed(() => {
    let list = this.contracts();
    const query  = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;
    const type   = this.typeFilter;

    if (status !== 'ALL') list = list.filter(c => c.status === status);
    if (type   !== 'ALL') list = list.filter(c => c.type === type);
    if (query) {
      list = list.filter(c =>
        c.contractNumber?.toLowerCase().includes(query) ||
        c.title?.toLowerCase().includes(query) ||
        c.clientName?.toLowerCase().includes(query) ||
        (c.rigName && c.rigName.toLowerCase().includes(query))
      );
    }
    return list;
  });

  readonly egpValuePreview = computed(() => {
    const rate  = this.liveRate();
    const value = this.formModel?.value ?? 0;
    if (!rate || !value) return null;
    return value * rate;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.contracts.breadcrumb') }
    ]);
    this.loadContracts();
    this.loadAllAssets();
  }

  loadContracts() {
    this.isLoading.set(true);
    this.workflowApi.getContracts({ limit: 100 }).subscribe({
      next: (res: PaginatedResponse<Contract>) => {
        const list = res.items ?? (res as any);
        this.contracts.set((Array.isArray(list) ? list : []).map(c => ({ ...c, id: c._id ?? c.id })));
        const filtered = this.filteredContracts();
        if (filtered.length > 0 && !this.selectedContract()) {
          this.selectedContract.set(filtered[0]);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.danger('Error', 'Failed to load contracts');
        this.isLoading.set(false);
      }
    });
  }

  loadAllAssets() {
    // Fetch from all 3 sources in parallel
    forkJoin({
      equipment: this.assetsApi.getEquipment({ limit: 200 }).pipe(catchError(() => of({items: [], data: []}))),
      vehicles:  this.opsApi.getVehicles().pipe(catchError(() => of([]))),
      camps:     this.opsApi.getCamps().pipe(catchError(() => of([])))
    }).subscribe(({ equipment, vehicles, camps }) => {

      // ── 1. Equipment (Rigs, Generators, Cranes, Pumps, etc.) ──────────────
      const equipRes   = (equipment as any);
      const equipList  = equipRes.items ?? equipRes.data ?? (Array.isArray(equipRes) ? equipRes : []);
      const equipNorm  = equipList.map((a: any) => ({
        _id:           a._id ?? a.id,
        id:            a._id ?? a.id,
        assetNumber:   a.assetNumber || a.equipmentCode || '',
        equipmentName: a.equipmentName || a.name || a.equipmentCode || 'Unknown',
        category:      a.category || 'Equipment',
        location:      a.location || a.projectAssignment || '',
        status:        a.status || 'Active',
        _source:       'equipment'
      }));

      // ── 2. Fleet Vehicles (Pickups, Trucks, Buses, Cranes, etc.) ─────────
      const vehicleList = Array.isArray(vehicles) ? vehicles : (vehicles as any).data ?? [];
      const vehicleNorm = vehicleList.map((v: any) => ({
        _id:           v._id ?? v.id,
        id:            v._id ?? v.id,
        assetNumber:   v.vehicleCode || v.plateNumber || '',
        equipmentName: `${v.make || ''} ${v.modelName || ''} (${v.plateNumber || ''})`.trim(),
        category:      `Vehicle`,
        subType:       v.type || '',
        location:      v.currentProjectCode || '',
        status:        v.status || 'Available',
        plateNumber:   v.plateNumber,
        _source:       'vehicle'
      }));

      // ── 3. Camps / Caravans ───────────────────────────────────────────────
      const campList = Array.isArray(camps) ? camps : (camps as any).data ?? [];
      const campNorm = campList.map((c: any) => ({
        _id:           c._id ?? c.id,
        id:            c._id ?? c.id,
        assetNumber:   c.campCode || '',
        equipmentName: c.name || c.campCode || 'Camp',
        category:      'Camp',
        location:      c.location || c.projectCode || '',
        status:        c.status || 'Active',
        totalBeds:     c.totalBeds,
        caravansCount: c.caravansCount,
        _source:       'camp'
      }));

      // Merge all sources — equipment first (primary), then vehicles, then camps
      const all = [...equipNorm, ...vehicleNorm, ...campNorm];
      this.allAssets.set(all);
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  selectContract(contract: Contract) { this.selectedContract.set(contract); }

  // ── Permissions ───────────────────────────────────────────────────────────
  canCreate() {
    const r = this.authService.currentUser()?.role;
    return r === 'Super Admin' || r === 'General Manager';
  }
  canEdit()    { return this.canCreate(); }
  canApprove() { return this.canCreate(); }

  // ── Exchange Rate ─────────────────────────────────────────────────────────
  async fetchExchangeRate() {
    this.isFetchingRate.set(true);
    this.rateError.set(false);
    try {
      const snap = await this.exchangeRateService.getUSDtoEGP();
      this.liveRate.set(snap.rate);
      this.rateDate.set(snap.fetchedAt);
      this.rateSource.set(snap.source);
      this.formModel.exchangeRateUSDtoEGP = snap.rate;
      this.formModel.rateSnapshotDate = snap.fetchedAt;
      this.recalcEGP();
      this.notificationService.success('Exchange Rate Updated', `1 USD = ${snap.rate.toFixed(4)} EGP (${snap.source})`);
    } catch {
      this.rateError.set(true);
    } finally {
      this.isFetchingRate.set(false);
    }
  }

  recalcEGP() {
    const rate  = this.formModel.exchangeRateUSDtoEGP;
    const value = this.formModel.value ?? 0;
    if (rate && value) this.formModel.contractValueEGP = parseFloat((value * rate).toFixed(2));
  }

  // ── Drag & Drop & Attachments ─────────────────────────────────────────────
  readonly isDragOver = signal(false);
  readonly pendingAttachments = signal<any[]>([]);

  onDragOver(e?: DragEvent)  { if (e) e.preventDefault(); this.isDragOver.set(true); }
  onDragLeave(e?: DragEvent) { if (e) e.preventDefault(); this.isDragOver.set(false); }
  onFileDrop(e?: DragEvent)  { if (e) e.preventDefault(); this.isDragOver.set(false); }
  onFileInputChange(event?: Event) {}

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  removeAttachment(id?: string) {
    if (this.formModel?.attachments) {
      this.formModel.attachments = this.formModel.attachments.filter((a: any) => a.id !== id);
    }
  }

  // ── Approve / Reject ──────────────────────────────────────────────────────
  approveContract(contractOrId?: Contract | string) {
    if (!contractOrId) return;
    const id = typeof contractOrId === 'string' ? contractOrId : contractOrId._id;
    this.workflowApi.updateContractStatus(id, 'Active').subscribe({
      next: (res) => {
        this.notificationService.success(
          'Contract Activated',
          `Project ${res.projectCode ?? ''} created successfully`
        );
        this.loadContracts();
        if (res.projectCode) {
          setTimeout(() =>
            this.router.navigate(['/operations/projects'], { queryParams: { project: res.projectCode } })
          , 1200);
        }
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to activate contract';
        this.notificationService.danger('Error', msg);
      }
    });
  }

  rejectContract(contractOrId?: Contract | string) {
    if (!contractOrId) return;
    const id = typeof contractOrId === 'string' ? contractOrId : contractOrId._id;
    this.workflowApi.updateContractStatus(id, 'Suspended').subscribe({
      next: () => {
        this.notificationService.success('Contract Suspended', 'Contract has been suspended');
        this.loadContracts();
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to update contract');
      }
    });
  }

  navigateToProject(projectCode: string) {
    this.router.navigate(['/operations/projects'], { queryParams: { project: projectCode } });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  async openCreateModal() {
    this.isEditMode.set(false);
    this.editingContractId = '';
    this.contractParentCC.set('');
    this.selectedAssets.set([]);
    this.assetSearchQuery.set('');
    this.assetCategoryFilter.set('ALL');
    this.formModel = {
      ...this.emptyForm(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 1000000,
      rateSheet: [
        { id: 'rs_1', description: 'Operating Day Rate', unit: 'Day', rate: 45000, currency: 'USD' },
        { id: 'rs_2', description: 'Standby Day Rate',   unit: 'Day', rate: 22500, currency: 'USD' }
      ],
      milestones: [
        { id: 'ms_1', title: 'Mobilization', dueDate: new Date().toISOString().split('T')[0], amount: 250000, status: 'Pending' }
      ]
    };
    this.isModalOpen.set(true);
    await this.fetchExchangeRate();
  }

  openEditModal(contract: Contract) {
    this.isEditMode.set(true);
    this.editingContractId = contract._id;
    this.assetSearchQuery.set('');
    this.assetCategoryFilter.set('ALL');

    // ── Restore 3-level CC hierarchy ──
    const savedCCCode = contract.costCenterCode || '';
    const existingCC  = this.costCenterStore.costCenters().find(cc => cc.code === savedCCCode);

    // Determine the root level (HeadOffice / FreeZone)
    const rootCode = existingCC?.branch === 'FreeZone' ? 'FreeZone' : 'HeadOffice';

    // The level-2 dept: if savedCC has a parentCode then savedCC is level-3
    // and parentCode is level-2; otherwise savedCC is itself level-2
    let level2Code = '';
    let resolvedCCCode = savedCCCode;
    if (existingCC && existingCC.parentCode && existingCC.level === 2) {
      level2Code = existingCC.parentCode;  // saved CC is level-3 child
    } else if (existingCC && existingCC.level === 1) {
      level2Code = savedCCCode;            // saved CC is level-2 dept itself
    } else {
      // fallback: use parentCostCenter from contract
      level2Code = contract.parentCostCenter || savedCCCode;
    }

    this.contractParentCC.set(rootCode);
    this.contractLevel2CC.set(level2Code);

    // Restore saved assets, or build from legacy rigId/rigName
    const savedAssets: ContractAsset[] = (contract as any).assets ?? [];
    if (savedAssets.length === 0 && contract.rigId) {
      savedAssets.push({
        assetId:       contract.rigId,
        equipmentName: contract.rigName || contract.rigId,
        category:      'Rig'
      });
    }
    this.selectedAssets.set(savedAssets);

    this.formModel = JSON.parse(JSON.stringify({
      ...contract,
      parentCostCenter: rootCode,
      costCenterCode:   resolvedCCCode,
      rigId:   contract.rigId   ?? '',
      rigName: contract.rigName ?? '',
      assets:  savedAssets
    }));
    this.isModalOpen.set(true);
    if (!(this.formModel as any).exchangeRateUSDtoEGP) this.fetchExchangeRate();
    else {
      this.liveRate.set((this.formModel as any).exchangeRateUSDtoEGP);
      this.rateSource.set('saved snapshot');
    }
  }

  closeModal() { this.isModalOpen.set(false); }

  // ── Asset Multi-Select ────────────────────────────────────────────────────
  isAssetSelected(asset: any): boolean {
    return this.selectedAssets().some(a => a.assetId === (asset._id ?? asset.id));
  }

  toggleAsset(asset: any) {
    const id = asset._id ?? asset.id;
    const current = this.selectedAssets();
    const idx = current.findIndex(a => a.assetId === id);
    if (idx === -1) {
      // Add
      const entry: ContractAsset = {
        assetId:       id,
        assetNumber:   asset.assetNumber ?? asset.equipmentCode ?? '',
        equipmentName: asset.equipmentName || asset.rigName || asset.name || '',
        category:      asset.category || 'Unknown',
        location:      asset.location || ''
      };
      this.selectedAssets.set([...current, entry]);
    } else {
      // Remove
      this.selectedAssets.set(current.filter((_, i) => i !== idx));
    }
    // Keep legacy rigId/rigName in sync: use the first Rig-category asset
    const firstRig = this.selectedAssets().find(a => a.category === 'Rig');
    this.formModel.rigId   = firstRig?.assetId   ?? '';
    this.formModel.rigName = firstRig?.equipmentName ?? '';
    this.formModel.assets  = this.selectedAssets();
  }

  removeSelectedAsset(assetId: string) {
    this.selectedAssets.set(this.selectedAssets().filter(a => a.assetId !== assetId));
    const firstRig = this.selectedAssets().find(a => a.category === 'Rig');
    this.formModel.rigId   = firstRig?.assetId   ?? '';
    this.formModel.rigName = firstRig?.equipmentName ?? '';
    this.formModel.assets  = this.selectedAssets();
  }

  // legacy compat – kept for older usages
  onRigChange() {
    this.formModel.assets = this.selectedAssets();
  }

  addRateSheetRow()     { this.formModel.rateSheet.push({ id: `rs_${Date.now()}`, description: '', unit: 'Day', rate: 0, currency: 'USD' }); }
  removeRateSheetRow(i: number) { this.formModel.rateSheet.splice(i, 1); }
  addMilestoneRow()     { this.formModel.milestones.push({ id: `ms_${Date.now()}`, title: '', dueDate: new Date().toISOString().split('T')[0], amount: 0, status: 'Pending' }); }
  removeMilestoneRow(i: number) { this.formModel.milestones.splice(i, 1); }

  // ── Save ──────────────────────────────────────────────────────────────────
  saveContract() {
    if (!this.formModel.title || !this.formModel.clientName || !this.formModel.startDate) {
      this.notificationService.danger('Validation', 'Please fill all required fields');
      return;
    }
    this.recalcEGP();

    const finalCCCode = this.formModel.costCenterCode || this.contractParentCC();
    const resolvedCC = this.costCenterStore.costCenters().find(cc => cc.code === finalCCCode);
    const ccName = resolvedCC?.nameEn || resolvedCC?.name || this.formModel.costCenterName || '';

    const body: CreateContractBody = {
      title:              this.formModel.title,
      clientName:         this.formModel.clientName,
      clientContact:      this.formModel.clientContact,
      clientEmail:        this.formModel.clientEmail,
      type:               this.formModel.type,
      startDate:          this.formModel.startDate,
      endDate:            this.formModel.endDate,
      value:              Number(this.formModel.value),
      currency:           this.formModel.currency || 'USD',
      contractValueEGP:   Number(this.formModel.contractValueEGP) || (Number(this.formModel.value) * (this.liveRate() || 50)),
      // exchangeRateUSDtoEGP: Number(this.formModel.exchangeRateUSDtoEGP) || (this.liveRate() || 50),
      rateSnapshotDate:   this.formModel.rateSnapshotDate || this.rateDate() || new Date().toISOString(),
      scope:              this.formModel.scope,
      rigId:              this.formModel.rigId || undefined,
      rigName:            this.formModel.rigName || undefined,
      assets:             this.selectedAssets().length > 0 ? this.selectedAssets() : undefined,
      projectManager:     this.formModel.projectManager,
      retentionPercent:   Number(this.formModel.retentionPercent) || 10,
      vatRate:            Number(this.formModel.vatRate) || 15,
      withholdingRate:    Number(this.formModel.withholdingRate) || 5,
      paymentTerms:       this.formModel.paymentTerms || 'Net 30',
      country:            this.formModel.country,
      region:             this.formModel.region,
      siteName:           this.formModel.siteName,
      gpsCoordinates:     this.formModel.gpsCoordinates,
      costCenterCode:     finalCCCode,
      costCenterName:     ccName,
      parentCostCenter:   this.contractParentCC() || undefined,
      preferredWarehouse: this.formModel.preferredWarehouse,
      nearestWarehouse:   this.formModel.nearestWarehouse,
      distanceKm:         Number(this.formModel.distanceKm) || 0,
      estimatedTransportationCost: Number(this.formModel.estimatedTransportationCost) || 0,
      rateSheet:          this.formModel.rateSheet || [],
      milestones:         this.formModel.milestones || []
    };

    if (this.isEditMode()) {
      this.workflowApi.updateContract(this.editingContractId, body).subscribe({
        next: () => {
          this.notificationService.success('Saved', 'Contract updated successfully');
          this.isModalOpen.set(false);
          this.loadContracts();
        },
        error: (err) => this.notificationService.danger('Error', err?.error?.message || 'Update failed')
      });
    } else {
      this.workflowApi.createContract(body).subscribe({
        next: (created) => {
          this.notificationService.success('Created', `Contract ${created.contractNumber} created`);
          this.isModalOpen.set(false);
          this.loadContracts();
          this.selectedContract.set(created);
        },
        error: (err) => this.notificationService.danger('Error', err?.error?.message || 'Create failed')
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private emptyForm() {
    return {
      title: '', clientName: '', clientContact: '', clientEmail: '',
      type: 'Daily Rate', startDate: '', endDate: '', value: 0,
      currency: 'USD', scope: '', rigId: '', rigName: '',
      assets: [] as ContractAsset[],
      projectManager: '', retentionPercent: 10, vatRate: 15, withholdingRate: 5,
      paymentTerms: 'Net 30', country: '', region: '', siteName: '',
      rateSheet: [], milestones: [],
      exchangeRateUSDtoEGP: null, contractValueEGP: null, rateSnapshotDate: null
    };
  }

  getFileIcon(fileType: string): string {
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word'))       return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.startsWith('image/'))   return '🖼️';
    return '📎';
  }
}
