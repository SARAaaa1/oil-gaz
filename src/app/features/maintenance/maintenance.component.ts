import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { AssetsApiService } from '../../core/services/assets-api.service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './maintenance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceComponent implements OnInit {
  private readonly assetsApi = inject(AssetsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);

  // Real API signals
  readonly pmSchedules = signal<any[]>([]);
  readonly workOrders  = signal<any[]>([]);
  readonly equipment   = signal<any[]>([]);
  readonly isLoading   = signal(false);
  readonly isSaving    = signal(false);

  // UI State
  readonly activeTab = signal<'schedules' | 'orders' | 'create'>('orders');
  readonly searchQuery = signal('');
  readonly statusFilter = signal('All');

  // Computed: filter work orders
  readonly filteredOrders = computed(() => {
    let list = this.workOrders();
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    if (s !== 'All') list = list.filter(w => w.status === s);
    if (q) list = list.filter(w =>
      w.title?.toLowerCase().includes(q) ||
      w.assetName?.toLowerCase().includes(q) ||
      w.workOrderNumber?.toLowerCase().includes(q) ||
      // legacy field names from mock
      w.issueDescription?.toLowerCase().includes(q) ||
      w.equipmentName?.toLowerCase().includes(q) ||
      w.woNumber?.toLowerCase().includes(q)
    );
    return list;
  });

  readonly filteredSchedules = computed(() => {
    let list = this.pmSchedules();
    const s = this.statusFilter();
    if (s !== 'All') list = list.filter(p => p.status === s);
    return list;
  });

  // KPI computed
  readonly kpis = computed(() => ({
    open:       this.workOrders().filter(w => w.status === 'Open').length,
    inProgress: this.workOrders().filter(w => w.status === 'In Progress').length,
    completed:  this.workOrders().filter(w => w.status === 'Completed').length,
    overdue:    this.pmSchedules().filter(p => p.status === 'Overdue').length,
  }));

  // Form State
  selectedAssetId = '';
  woType: 'Preventive' | 'Breakdown' | 'Calibration' = 'Breakdown';
  woPriority: 'Low' | 'Medium' | 'High' | 'Emergency' = 'Medium';
  woDescription = '';
  woTitle = '';
  assignedTechnician = '';
  estimatedCost: number | null = null;
  estimatedHours: number | null = null;

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.assets' },
      { label: 'navigation.maintenance_orders' }
    ]);
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);

    // Load work orders
    this.assetsApi.getWorkOrders().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        this.workOrders.set(list.map((w: any) => ({
          ...w,
          id: w._id ?? w.id,
          // legacy compat aliases for HTML template
          woNumber: w.workOrderNumber ?? w.woNumber,
          equipmentName: w.assetName ?? w.equipmentName,
          issueDescription: w.description ?? w.issueDescription,
          assignedToTechnician: w.assignedTo ?? w.assignedToTechnician,
          createdDate: w.startDate ?? w.createdDate,
        })));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    // Load PM schedules
    this.assetsApi.getPmSchedules().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        this.pmSchedules.set(list.map((p: any) => ({
          ...p,
          id: p._id ?? p.id,
          // legacy compat aliases
          assetNumber: p.assetNumber ?? p.assetId,
          taskDescription: p.title ?? p.taskDescription,
          frequencyDays: p.frequencyValue ?? p.frequencyDays ?? 30,
          lastDoneDate: p.lastCompletedDate ?? p.lastDoneDate,
        })));
      },
      error: () => {}
    });

    // Load equipment for the create form selector
    this.assetsApi.getEquipment().subscribe({
      next: (res: any) => {
        const list = res.items ?? res.data ?? (Array.isArray(res) ? res : []);
        this.equipment.set(list.map((e: any) => ({ ...e, id: e._id ?? e.id })));
        if (list.length > 0 && !this.selectedAssetId) {
          this.selectedAssetId = list[0]._id ?? list[0].id;
        }
      },
      error: () => {}
    });
  }

  // Trigger WO from PM schedule
  triggerPM(pm: any) {
    this.isSaving.set(true);
    const pmId = pm._id ?? pm.id;
    this.assetsApi.triggerPmSchedule(pmId, {
      assignedToTechnician: 'Automated Dispatch'
    }).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        this.activeTab.set('orders');
        this.notificationService.success('maintenance.triggered_success_title', 'maintenance.triggered_success_desc');
        this.loadAll(); // refresh all data
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.notificationService.danger('maintenance.triggered_success_title', err?.error?.message || 'Failed to trigger PM');
      }
    });
  }

  // Create breakdown/corrective Work Order manually
  createWorkOrder() {
    if (!this.woTitle && !this.woDescription) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }
    if (!this.selectedAssetId) {
      this.notificationService.danger('common.validation_error', 'Please select an asset');
      return;
    }

    this.isSaving.set(true);
    this.assetsApi.createWorkOrder({
      assetId: this.selectedAssetId,
      type: this.woType,
      priority: this.woPriority,
      issueDescription: this.woDescription || this.woTitle,
      assignedToTechnician: this.assignedTechnician || undefined,
    }).subscribe({
      next: (created: any) => {
        const normalized = {
          ...created,
          id: created._id ?? created.id,
          woNumber: created.workOrderNumber ?? created.woNumber,
          equipmentName: created.assetName ?? created.equipmentName,
          issueDescription: created.description ?? created.issueDescription,
          assignedToTechnician: created.assignedTo ?? created.assignedToTechnician,
          createdDate: created.startDate ?? created.createdDate,
        };
        this.workOrders.update(list => [normalized, ...list]);
        // Reset Form
        this.woTitle = '';
        this.woDescription = '';
        this.assignedTechnician = '';
        this.estimatedCost = null;
        this.estimatedHours = null;
        this.activeTab.set('orders');
        this.isSaving.set(false);
        this.notificationService.success('maintenance.created_success_title', 'maintenance.created_success_desc');
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.notificationService.danger('maintenance.created_success_title', err?.error?.message || 'Failed to create work order');
      }
    });
  }

  // Update Work Order status
  updateStatus(wo: any, status: 'In Progress' | 'Completed' | 'Cancelled') {
    const woId = wo._id ?? wo.id;
    const body: any = { status };
    if (status === 'Completed') {
      body.actualDurationHours = wo.estimatedDurationHours ?? 1;
      body.completionNotes = 'Completed';
    }
    this.assetsApi.updateWorkOrderStatus(woId, body).subscribe({
      next: (updated: any) => {
        this.workOrders.update(list =>
          list.map(w => (w._id ?? w.id) === woId
            ? {
                ...w,
                status: updated.status,
                completedDate: updated.completionDate ?? w.completedDate,
                startDate: updated.startDate ?? w.startDate,
              }
            : w
          )
        );
        this.notificationService.success('maintenance.status_updated_title', 'maintenance.status_updated_desc');
      },
      error: (err: any) => {
        this.notificationService.danger('maintenance.status_updated_title', err?.error?.message || 'Failed to update status');
      }
    });
  }
}
