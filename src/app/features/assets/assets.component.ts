import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import {
  AssetsApiService,
  Equipment,
  CreateEquipmentBody,
  AssetCategory,
  AssetStatus
} from '../../core/services/assets-api.service';
import { OperationsApiService } from '../../core/services/operations-api.service';
import { CostCenterStoreService } from '../../core/services/cost-center-store.service';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './assets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetsComponent implements OnInit {
  private readonly assetsApi   = inject(AssetsApiService);
  private readonly opsApi      = inject(OperationsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly costCenterStore = inject(CostCenterStoreService);

  // ── Cost Center Hierarchy (2 Main Roots: Head Office & Free Zone) ────────────
  /** The 2 Main Root options (Head Office & Free Zone) */
  readonly parentCostCenters = computed(() =>
    this.costCenterStore.mainRoots()
  );

  // -- Add Equipment form CC state --
  readonly addFormParentCC = signal<string>('');
  readonly addChildCCs = computed(() => {
    const p = this.addFormParentCC();
    if (!p) return [];
    return this.costCenterStore.getDepartmentsByRoot(p);
  });
  onAddParentChange(parentCode: string) {
    this.addFormParentCC.set(parentCode);
    this.addForm.costCenter = '';  // reset child selection
  }

  // -- Edit Equipment form CC state --
  readonly editFormParentCC = signal<string>('');
  readonly editChildCCs = computed(() => {
    const p = this.editFormParentCC();
    if (!p) return [];
    return this.costCenterStore.getDepartmentsByRoot(p);
  });
  onEditParentChange(parentCode: string) {
    this.editFormParentCC.set(parentCode);
    this.editForm.costCenter = '';  // reset child selection
  }

  // ── State ──────────────────────────────────────────────────────────────────
  readonly equipment     = signal<Equipment[]>([]);
  readonly rigs          = signal<any[]>([]);
  readonly isLoading     = signal(false);
  readonly isSaving      = signal(false);

  readonly activeTab = signal<'register' | 'assignments' | 'transfers' | 'disposal'>('register');

  // Filters
  searchQuery    = '';
  categoryFilter = 'ALL';
  statusFilter   = 'ALL';

  // ── Modals ─────────────────────────────────────────────────────────────────
  readonly showAddModal       = signal(false);
  readonly showAssignModal    = signal(false);
  readonly showTransferModal  = signal(false);
  readonly showDisposalModal  = signal(false);
  readonly showEditModal      = signal(false);
  readonly showDeleteConfirm  = signal(false);
  readonly editingAsset       = signal<Equipment | null>(null);

  // Add Equipment Form
  addForm: Partial<CreateEquipmentBody> = this.emptyAddForm();
  
  // Edit Equipment Form
  editForm: Partial<CreateEquipmentBody> = {};

  // Action Inputs
  selectedEquipment: Equipment | null = null;

  // Assignment fields
  assignedToType: 'Project' | 'Rig' | 'Camp' | 'Driver' = 'Rig';
  assignedToId   = '';
  assignedToName = '';
  conditionOnAssign: 'New' | 'Good' | 'Fair' | 'Poor' = 'Good';
  assignmentNotes = '';

  // Transfer fields
  transferToLocation = '';
  transferNotes      = '';

  // Disposal fields
  disposalMethod:  'Sale' | 'Scrap' | 'Write-off' | 'Donation' = 'Scrap';
  disposalCost     = 0;
  revenueReceived  = 0;
  disposalReason   = '';

  // ── Computed ───────────────────────────────────────────────────────────────
  // History signals — populated from backend status-change audit trail
  readonly assetAssignments = signal<any[]>([]);
  readonly assetTransfers   = signal<any[]>([]);
  readonly assetDisposals   = signal<any[]>([]);

  readonly filteredEquipment = computed(() => {
    let list = this.equipment();
    if (this.statusFilter   !== 'ALL') list = list.filter(e => e.status   === this.statusFilter);
    if (this.categoryFilter !== 'ALL') list = list.filter(e => e.category === this.categoryFilter);
    const q = this.searchQuery.trim().toLowerCase();
    if (q) list = list.filter(e =>
      e.equipmentName?.toLowerCase().includes(q) ||
      e.equipmentCode?.toLowerCase().includes(q) ||
      e.assetNumber?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
    return list;
  });

  readonly stats = computed(() => {
    const list = this.equipment();
    return {
      total:        list.length,
      active:       list.filter(e => e.status === 'Active').length,
      standby:      list.filter(e => e.status === 'Standby').length,
      maintenance:  list.filter(e => e.status === 'Maintenance').length,
      outOfService: list.filter(e => e.status === 'Out Of Service').length
    };
  });

  readonly categories: AssetCategory[] = [
    'Rig', 'Generator', 'Crane', 'Truck', 'Pump',
    'Compressor', 'Heavy Equipment', 'Safety Equipment'
  ];

  readonly statuses: AssetStatus[] = ['Active', 'Standby', 'Maintenance', 'Out Of Service'];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.assets' },
      { label: 'navigation.asset_register' }
    ]);
    this.loadEquipment();
    this.loadRigs();
    this.loadHistoryRecords();
  }

  loadHistoryRecords() {
    this.assetsApi.getAssignments().subscribe({
      next: (res: any) => this.assetAssignments.set(Array.isArray(res) ? res : res.data ?? []),
      error: () => {}
    });
    this.assetsApi.getTransfers().subscribe({
      next: (res: any) => this.assetTransfers.set(Array.isArray(res) ? res : res.data ?? []),
      error: () => {}
    });
    this.assetsApi.getDisposals().subscribe({
      next: (res: any) => this.assetDisposals.set(Array.isArray(res) ? res : res.data ?? []),
      error: () => {}
    });
  }

  loadEquipment() {
    this.isLoading.set(true);
    this.assetsApi.getEquipment({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.equipment.set(res.items ?? res);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.danger('Error', 'Failed to load equipment');
        this.isLoading.set(false);
      }
    });
  }

  loadRigs() {
    this.opsApi.getRigs().subscribe({
      next: (data: any) => this.rigs.set(Array.isArray(data) ? data : data.items ?? []),
      error: () => {}
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getAssetName(id: string): string {
    return this.equipment().find(e => e._id === id)?.equipmentName ?? id;
  }
  getAssetTag(id: string): string {
    return this.equipment().find(e => e._id === id)?.assetNumber ?? '';
  }

  // ── Add Equipment ──────────────────────────────────────────────────────────
  openAddModal() {
    this.addForm = this.emptyAddForm();
    this.addFormParentCC.set('');   // reset CC state
    this.showAddModal.set(true);
  }

  saveEquipment() {
    if (!this.addForm.equipmentCode || !this.addForm.equipmentName || !this.addForm.category) {
      this.notificationService.danger('Validation', 'Please fill all required fields');
      return;
    }
    this.isSaving.set(true);

    const finalCC = this.addForm.costCenter || this.addFormParentCC();
    const payload: CreateEquipmentBody = {
      ...this.addForm as CreateEquipmentBody,
      costCenter: finalCC,
      costCenterCode: finalCC,
      parentCostCenter: this.addFormParentCC() || undefined
    };

    this.assetsApi.createEquipment(payload).subscribe({
      next: (created) => {
        this.equipment.update(list => [created, ...list]);
        this.showAddModal.set(false);
        this.notificationService.success('Created', `${created.equipmentName} registered successfully`);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to register equipment');
        this.isSaving.set(false);
      }
    });
  }

  // ── Assignment ─────────────────────────────────────────────────────────────
  openAssignModal(asset: Equipment) {
    this.selectedEquipment = asset;
    this.assignedToType  = 'Rig';
    this.assignedToId    = this.rigs()[0]?._id ?? '';
    this.assignedToName  = this.rigs()[0]?.equipmentName ?? '';
    this.conditionOnAssign = 'Good';
    this.assignmentNotes = '';
    this.showAssignModal.set(true);
  }

  onRigAssignChange() {
    const rig = this.rigs().find(r => r._id === this.assignedToId);
    this.assignedToName = rig?.equipmentName ?? '';
  }

  saveAssignment() {
    if (!this.selectedEquipment) return;
    this.isSaving.set(true);
    this.assetsApi.createAssignment({
      assetId: this.selectedEquipment._id,
      assignedToType: this.assignedToType,
      assignedToId: this.assignedToId,
      assignedToName: this.assignedToName,
      assignmentDate: new Date().toISOString().split('T')[0],
      conditionOnAssign: this.conditionOnAssign,
      notes: this.assignmentNotes
    }).subscribe({
      next: (asgn) => {
        this.assetAssignments.update(list => [asgn, ...list]);
        this.loadEquipment();
        this.showAssignModal.set(false);
        this.notificationService.success('Assigned', `${this.selectedEquipment?.equipmentName} assigned to ${this.assignedToName}`);
        this.isSaving.set(false);
      },
      error: () => {
        // Fallback to updateStatus if backend assignments endpoint returns error
        this.assetsApi.updateStatus(this.selectedEquipment!._id, {
          status: 'Active',
          location: this.assignedToName,
          projectAssignment: this.assignedToId || null
        }).subscribe({
          next: (updated) => {
            this.equipment.update(list => list.map(e => e._id === updated._id ? updated : e));
            this.showAssignModal.set(false);
            this.notificationService.success('Assigned', `${updated.equipmentName} assigned to ${this.assignedToName}`);
            this.isSaving.set(false);
          },
          error: (err) => {
            this.notificationService.danger('Error', err?.error?.message || 'Assignment failed');
            this.isSaving.set(false);
          }
        });
      }
    });
  }

  // ── Transfer ───────────────────────────────────────────────────────────────
  openTransferModal(asset: Equipment) {
    this.selectedEquipment = asset;
    this.transferToLocation = '';
    this.transferNotes      = '';
    this.showTransferModal.set(true);
  }

  saveTransfer() {
    if (!this.selectedEquipment || !this.transferToLocation) {
      this.notificationService.danger('Validation', 'Please specify a destination location');
      return;
    }
    this.isSaving.set(true);
    this.assetsApi.createTransfer({
      assetId: this.selectedEquipment._id,
      toLocation: this.transferToLocation,
      transferDate: new Date().toISOString().split('T')[0],
      authorizedBy: this.authService.currentUser()?.fullName || 'Operations Manager',
      notes: this.transferNotes
    }).subscribe({
      next: (tr) => {
        this.assetTransfers.update(list => [tr, ...list]);
        this.loadEquipment();
        this.showTransferModal.set(false);
        this.notificationService.success('Transferred', `${this.selectedEquipment?.equipmentName} moved to ${this.transferToLocation}`);
        this.isSaving.set(false);
      },
      error: () => {
        this.assetsApi.updateStatus(this.selectedEquipment!._id, {
          status: this.selectedEquipment!.status,
          location: this.transferToLocation
        }).subscribe({
          next: (updated) => {
            this.equipment.update(list => list.map(e => e._id === updated._id ? updated : e));
            this.showTransferModal.set(false);
            this.notificationService.success('Transferred', `${updated.equipmentName} moved to ${this.transferToLocation}`);
            this.isSaving.set(false);
          },
          error: (err) => {
            this.notificationService.danger('Error', err?.error?.message || 'Transfer failed');
            this.isSaving.set(false);
          }
        });
      }
    });
  }

  // ── Disposal ───────────────────────────────────────────────────────────────
  openDisposalModal(asset: Equipment) {
    this.selectedEquipment = asset;
    this.disposalMethod    = 'Scrap';
    this.disposalCost      = 0;
    this.revenueReceived   = 0;
    this.disposalReason    = '';
    this.showDisposalModal.set(true);
  }

  saveDisposal() {
    if (!this.selectedEquipment || !this.disposalReason) {
      this.notificationService.danger('Validation', 'Please provide a disposal reason');
      return;
    }
    this.isSaving.set(true);
    this.assetsApi.createDisposal({
      assetId: this.selectedEquipment._id,
      disposalDate: new Date().toISOString().split('T')[0],
      disposalMethod: this.disposalMethod,
      disposalCost: this.disposalCost,
      revenueReceived: this.revenueReceived,
      reason: this.disposalReason,
      authorizedBy: this.authService.currentUser()?.fullName || 'General Manager'
    }).subscribe({
      next: (disp) => {
        this.assetDisposals.update(list => [disp, ...list]);
        this.loadEquipment();
        this.showDisposalModal.set(false);
        this.notificationService.success('Disposed', `${this.selectedEquipment?.equipmentName} marked as Out Of Service`);
        this.isSaving.set(false);
      },
      error: () => {
        this.assetsApi.updateStatus(this.selectedEquipment!._id, {
          status: 'Out Of Service',
          projectAssignment: null
        }).subscribe({
          next: (updated) => {
            this.equipment.update(list => list.map(e => e._id === updated._id ? updated : e));
            this.showDisposalModal.set(false);
            this.notificationService.success('Disposed', `${updated.equipmentName} marked as Out Of Service`);
            this.isSaving.set(false);
          },
          error: (err) => {
            this.notificationService.danger('Error', err?.error?.message || 'Disposal failed');
            this.isSaving.set(false);
          }
        });
      }
    });
  }

  // ── Edit Equipment ─────────────────────────────────────────────────────────
  openEditModal(asset: Equipment) {
    this.editingAsset.set(asset);
    // Restore parent CC for the cascading dropdown
    const existingCC = this.costCenterStore.costCenters()
      .find(cc => cc.code === (asset.costCenter || ''));
    const parentCode = existingCC?.parentCode ?? asset.costCenter ?? '';
    this.editFormParentCC.set(parentCode);
    this.editForm = {
      equipmentName:   asset.equipmentName,
      manufacturer:    asset.manufacturer  || '',
      modelName:       asset.modelName     || '',
      location:        asset.location      || '',
      costCenter:      existingCC?.parentCode ? (asset.costCenter || '') : '',
      department:      asset.department    || '',
      notes:           asset.notes         || '',
      purchaseCost:    asset.purchaseCost  || 0,
      currentValue:    asset.currentValue  || 0,
    };
    this.showEditModal.set(true);
  }

  saveEditEquipment() {
    const asset = this.editingAsset();
    if (!asset) return;
    this.isSaving.set(true);

    const finalCC = this.editForm.costCenter || this.editFormParentCC();
    const payload: Partial<CreateEquipmentBody> = {
      ...this.editForm,
      costCenter: finalCC,
      costCenterCode: finalCC,
      parentCostCenter: this.editFormParentCC() || undefined
    };

    this.assetsApi.updateEquipment(asset._id, payload).subscribe({
      next: (updated) => {
        this.equipment.update(list => list.map(e => e._id === updated._id ? updated : e));
        this.showEditModal.set(false);
        this.editingAsset.set(null);
        this.notificationService.success('Updated', `${updated.equipmentName} updated successfully`);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to update equipment');
        this.isSaving.set(false);
      }
    });
  }

  // ── Delete Equipment ───────────────────────────────────────────────────────
  openDeleteConfirm(asset: Equipment) {
    this.selectedEquipment = asset;
    this.showDeleteConfirm.set(true);
  }

  confirmDelete() {
    if (!this.selectedEquipment) return;
    this.isSaving.set(true);
    this.assetsApi.deleteEquipment(this.selectedEquipment._id).subscribe({
      next: () => {
        this.equipment.update(list => list.filter(e => e._id !== this.selectedEquipment!._id));
        this.showDeleteConfirm.set(false);
        this.notificationService.success('Deleted', `${this.selectedEquipment?.equipmentName} removed`);
        this.selectedEquipment = null;
        this.isSaving.set(false);
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Cannot delete — asset may have active assignments');
        this.isSaving.set(false);
      }
    });
  }

  // ── Change Status Directly ─────────────────────────────────────────────────
  changeAssetStatus(asset: Equipment, status: AssetStatus) {
    this.assetsApi.updateStatus(asset._id, { status }).subscribe({
      next: (updated) => {
        this.equipment.update(list => list.map(e => e._id === updated._id ? updated : e));
        this.notificationService.success('Status Updated', `${asset.equipmentName} → ${status}`);
      },
      error: (err) => this.notificationService.danger('Error', err?.error?.message || 'Status update failed')
    });
  }



  // ── Helpers ───────────────────────────────────────────────────────────────
  private emptyAddForm(): Partial<CreateEquipmentBody> {
    return {
      assetNumber: '',
      equipmentCode: '',
      equipmentName: '',
      category: 'Rig',
      manufacturer: '',
      modelName: '',
      serialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 0,
      currentValue: 0,
      depreciationMethod: 'Straight Line',
      location: '',
      costCenter: '',
      department: 'Operations',
      status: 'Standby',
      operatingHours: 0,
      notes: ''
    };
  }
}
