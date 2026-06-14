import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { Equipment, AssetAssignment, AssetTransfer, AssetDisposal } from '../../shared/interfaces/assets.interface';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './assets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);

  readonly equipment = this.mockDataService.equipment;
  readonly assetAssignments = this.mockDataService.assetAssignments;
  readonly assetTransfers = this.mockDataService.assetTransfers;
  readonly assetDisposals = this.mockDataService.assetDisposals;
  readonly rigs = this.mockDataService.rigs;

  // UI State
  readonly activeTab = signal<'register' | 'assignments' | 'transfers' | 'disposal'>('register');

  // Modals / Form State
  readonly showAssignModal = signal<boolean>(false);
  readonly showTransferModal = signal<boolean>(false);
  readonly showDisposalModal = signal<boolean>(false);

  // Form inputs
  selectedAssetId = '';
  assignedToType: 'Project' | 'Rig' | 'Camp' | 'Driver' = 'Rig';
  assignedToId = 'rig1';
  assignedToName = 'Rig Alpha';
  conditionOnAssign: 'New' | 'Good' | 'Fair' | 'Poor' = 'Good';
  assignmentNotes = '';

  transferToLocation = 'Warehouse B';
  transferNotes = '';

  disposalMethod: 'Sale' | 'Scrap' | 'Write-off' | 'Donation' = 'Scrap';
  disposalCost = 0;
  revenueReceived = 0;
  disposalReason = '';

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.assets' },
      { label: 'navigation.asset_register' }
    ]);
  }

  getAssetName(assetId: string): string {
    const matched = this.equipment().find(e => e.id === assetId);
    return matched ? matched.equipmentName : assetId;
  }

  getAssetTag(assetId: string): string {
    const matched = this.equipment().find(e => e.id === assetId);
    return matched ? matched.assetNumber : '';
  }

  // Action Handlers
  openAssignModal(asset: Equipment) {
    this.selectedAssetId = asset.id;
    this.assignedToType = 'Rig';
    this.assignedToId = this.rigs()[0]?.id || '';
    this.assignedToName = this.rigs()[0]?.rigName || '';
    this.conditionOnAssign = 'Good';
    this.assignmentNotes = '';
    this.showAssignModal.set(true);
  }

  saveAssignment() {
    const asset = this.equipment().find(e => e.id === this.selectedAssetId);
    if (!asset) return;

    // Resolve target name
    if (this.assignedToType === 'Rig') {
      const rig = this.rigs().find(r => r.id === this.assignedToId);
      this.assignedToName = rig ? rig.rigName : '';
    }

    const newAssignment: AssetAssignment = {
      id: `asg-${Date.now()}`,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      equipmentName: asset.equipmentName,
      assignedToType: this.assignedToType,
      assignedToId: this.assignedToId,
      assignedToName: this.assignedToName,
      assignmentDate: new Date().toISOString().split('T')[0],
      conditionOnAssign: this.conditionOnAssign,
      notes: this.assignmentNotes
    };

    this.mockDataService.assetAssignments.update(list => [...list, newAssignment]);

    // Update equipment location & status
    this.mockDataService.updateEquipment(asset.id, {
      location: this.assignedToName,
      status: 'Active'
    });

    // Audit log
    this.mockDataService.addAssetHistory({
      assetId: asset.id,
      equipmentCode: asset.equipmentCode,
      changeType: 'Project Assignment',
      oldValue: asset.location,
      newValue: this.assignedToName,
      changedBy: 'System Admin',
      notes: `Assigned to ${this.assignedToType}: ${this.assignedToName}. Condition: ${this.conditionOnAssign}`
    });

    this.showAssignModal.set(false);
    this.notificationService.success('assets.assigned_success_title', 'assets.assigned_success_desc');
  }

  openTransferModal(asset: Equipment) {
    this.selectedAssetId = asset.id;
    this.transferToLocation = 'Warehouse B';
    this.transferNotes = '';
    this.showTransferModal.set(true);
  }

  saveTransfer() {
    const asset = this.equipment().find(e => e.id === this.selectedAssetId);
    if (!asset) return;

    const newTransfer: AssetTransfer = {
      id: `xf-${Date.now()}`,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      equipmentName: asset.equipmentName,
      fromLocation: asset.location,
      toLocation: this.transferToLocation,
      transferDate: new Date().toISOString().split('T')[0],
      authorizedBy: 'System Admin',
      status: 'Completed',
      notes: this.transferNotes
    };

    this.mockDataService.assetTransfers.update(list => [...list, newTransfer]);

    // Update equipment location
    this.mockDataService.updateEquipment(asset.id, {
      location: this.transferToLocation
    });

    // Audit log
    this.mockDataService.addAssetHistory({
      assetId: asset.id,
      equipmentCode: asset.equipmentCode,
      changeType: 'Location Change',
      oldValue: asset.location,
      newValue: this.transferToLocation,
      changedBy: 'System Admin',
      notes: this.transferNotes
    });

    this.showTransferModal.set(false);
    this.notificationService.success('assets.transfer_success_title', 'assets.transfer_success_desc');
  }

  openDisposalModal(asset: Equipment) {
    this.selectedAssetId = asset.id;
    this.disposalMethod = 'Scrap';
    this.disposalCost = 0;
    this.revenueReceived = 0;
    this.disposalReason = '';
    this.showDisposalModal.set(true);
  }

  saveDisposal() {
    const asset = this.equipment().find(e => e.id === this.selectedAssetId);
    if (!asset) return;

    const newDisposal: AssetDisposal = {
      id: `disp-${Date.now()}`,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      equipmentName: asset.equipmentName,
      disposalDate: new Date().toISOString().split('T')[0],
      disposalMethod: this.disposalMethod,
      disposalCost: this.disposalCost,
      revenueReceived: this.revenueReceived,
      reason: this.disposalReason,
      authorizedBy: 'System Admin',
      status: 'Approved'
    };

    this.mockDataService.assetDisposals.update(list => [...list, newDisposal]);

    // Set asset status to Out of service / retired
    this.mockDataService.updateEquipment(asset.id, {
      status: 'Out Of Service'
    });

    // Audit log
    this.mockDataService.addAssetHistory({
      assetId: asset.id,
      equipmentCode: asset.equipmentCode,
      changeType: 'Status Change',
      oldValue: asset.status,
      newValue: 'Out Of Service',
      changedBy: 'System Admin',
      notes: `Asset Disposed via ${this.disposalMethod}. Reason: ${this.disposalReason}`
    });

    this.showDisposalModal.set(false);
    this.notificationService.success('assets.disposal_success_title', 'assets.disposal_success_desc');
  }
}
