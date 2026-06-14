import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { PMSchedule, WorkOrder } from '../../shared/interfaces/maintenance.interface';
import { Equipment } from '../../shared/interfaces/assets.interface';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './maintenance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);

  readonly pmSchedules = this.mockDataService.pmSchedules;
  readonly workOrders = this.mockDataService.workOrders;
  readonly equipment = this.mockDataService.equipment;

  // UI State
  readonly activeTab = signal<'schedules' | 'orders' | 'create'>('orders');

  // Form State
  selectedAssetId = '';
  woType: WorkOrder['type'] = 'Preventive';
  woPriority: WorkOrder['priority'] = 'Medium';
  woDescription = '';
  assignedTechnician = '';

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.assets' },
      { label: 'navigation.maintenance_orders' }
    ]);
    if (this.equipment().length > 0) {
      this.selectedAssetId = this.equipment()[0].id;
    }
  }

  // Trigger WO from PM schedule
  triggerPM(pm: PMSchedule) {
    const woNum = `WO-PM-${Date.now().toString().slice(-4)}`;
    const newWo: WorkOrder = {
      id: `wo-${Date.now()}`,
      woNumber: woNum,
      assetId: pm.assetId,
      assetNumber: pm.assetNumber,
      equipmentName: pm.equipmentName,
      type: 'Preventive',
      priority: 'Medium',
      issueDescription: `Scheduled PM: ${pm.taskDescription}`,
      assignedToTechnician: 'Automated Dispatch',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Open'
    };

    this.mockDataService.workOrders.update(list => [newWo, ...list]);

    // Update PM last/next dates
    this.mockDataService.pmSchedules.update(list => 
      list.map(p => p.id === pm.id ? { 
        ...p, 
        lastDoneDate: new Date().toISOString().split('T')[0],
        nextDueDate: new Date(Date.now() + p.frequencyDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      } : p)
    );

    // Update equipment status
    this.mockDataService.updateEquipment(pm.assetId, {
      status: 'Maintenance'
    });

    this.activeTab.set('orders');
    this.notificationService.success('maintenance.triggered_success_title', 'maintenance.triggered_success_desc');
  }

  // Create breakdown Work Order manually
  createWorkOrder() {
    if (!this.woDescription) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const asset = this.equipment().find(e => e.id === this.selectedAssetId);
    if (!asset) return;

    const woNum = `WO-BD-${Date.now().toString().slice(-4)}`;
    const newWo: WorkOrder = {
      id: `wo-${Date.now()}`,
      woNumber: woNum,
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      equipmentName: asset.equipmentName,
      type: this.woType,
      priority: this.woPriority,
      issueDescription: this.woDescription,
      assignedToTechnician: this.assignedTechnician || 'General Maintenance Pool',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Open'
    };

    this.mockDataService.workOrders.update(list => [newWo, ...list]);

    // Update asset status if breakdown/emergency
    if (this.woType === 'Breakdown' || this.woPriority === 'Emergency') {
      this.mockDataService.updateEquipment(asset.id, {
        status: 'Maintenance'
      });
    }

    // Reset Form
    this.woDescription = '';
    this.assignedTechnician = '';
    this.activeTab.set('orders');
    this.notificationService.success('maintenance.created_success_title', 'maintenance.created_success_desc');
  }

  // Update Work Order status (e.g. In Progress, Completed)
  updateStatus(wo: WorkOrder, status: WorkOrder['status']) {
    this.mockDataService.workOrders.update(list => 
      list.map(w => {
        if (w.id !== wo.id) return w;
        
        const updated = { ...w, status };
        if (status === 'Completed') {
          updated.completedDate = new Date().toISOString().split('T')[0];
        } else if (status === 'In Progress') {
          updated.startDate = new Date().toISOString().split('T')[0];
        }
        return updated;
      })
    );

    // If completed, restore asset status back to standby/active
    if (status === 'Completed') {
      this.mockDataService.updateEquipment(wo.assetId, {
        status: 'Active'
      });
    }

    this.notificationService.success('maintenance.status_updated_title', 'maintenance.status_updated_desc');
  }
}
