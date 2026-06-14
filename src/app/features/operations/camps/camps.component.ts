import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditService } from '../../../core/services/audit.service';
import { Camp, Caravan, CampAllocation } from '../../../shared/interfaces/assets.interface';

@Component({
  selector: 'app-camps',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './camps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);
  private readonly translate = inject(TranslateService);

  // Core signals from central store
  readonly camps = this.mockDataService.camps;
  readonly caravans = this.mockDataService.caravans;

  // View States
  readonly activeTab = signal<'list' | 'allocations'>('list');
  readonly selectedCamp = signal<Camp | null>(null);
  readonly searchQuery = signal<string>('');

  // Modal States
  readonly isCampModalOpen = signal<boolean>(false);
  readonly isAllocationModalOpen = signal<boolean>(false);

  // Form states
  campForm = {
    campCode: '',
    campName: '',
    location: '',
    totalBeds: 50,
    status: 'Active' as 'Active' | 'Maintenance' | 'Closed'
  };

  allocations = signal<CampAllocation[]>([
    { id: 'al1', campId: 'c1', caravanId: 'car1', allocatedToUser: 'Drilling Team A Lead', allocationDate: '2026-06-01' },
    { id: 'al2', campId: 'c1', caravanId: 'car2', allocatedToUser: 'Sven Larson', allocationDate: '2026-06-05' },
    { id: 'al3', campId: 'c2', caravanId: 'car3', allocatedToUser: 'Drilling Crew Beta', allocationDate: '2026-06-08' }
  ]);

  allocationForm = {
    campId: '',
    caravanId: '',
    allocatedToUser: '',
    allocationDate: new Date().toISOString().split('T')[0]
  };

  // Computed properties
  readonly filteredCamps = computed(() => {
    let list = this.camps();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(c =>
        c.campCode.toLowerCase().includes(query) ||
        c.campName.toLowerCase().includes(query) ||
        c.location.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly filteredCaravans = computed(() => {
    const selected = this.selectedCamp();
    if (!selected) return [];
    return this.caravans().filter(c => c.assignedCampId === selected.id);
  });

  readonly totalBeds = computed(() =>
    this.camps().reduce((sum, c) => sum + c.totalBeds, 0)
  );

  readonly occupiedBeds = computed(() =>
    this.camps().reduce((sum, c) => sum + c.occupiedBeds, 0)
  );

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.camps' }
    ]);
  }

  // --- CAMP ACTIONS ---
  openAddCamp() {
    this.campForm = {
      campCode: '',
      campName: '',
      location: '',
      totalBeds: 50,
      status: 'Active'
    };
    this.isCampModalOpen.set(true);
  }

  saveCamp() {
    if (!this.campForm.campCode || !this.campForm.campName || !this.campForm.location) {
      this.notificationService.danger('common.err_validation_title', 'Please complete all required fields.');
      return;
    }

    const created = this.mockDataService.addCamp({
      campCode: this.campForm.campCode,
      campName: this.campForm.campName,
      location: this.campForm.location,
      totalBeds: this.campForm.totalBeds,
      occupiedBeds: 0,
      caravansCount: 0,
      status: this.campForm.status
    });

    this.auditService.log({
      user: 'Admin User',
      role: 'Super Admin',
      module: 'Operations',
      entityName: 'Camp',
      entityId: created.campCode,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(created),
      details: `Created new Camp: ${created.campName} (${created.campCode})`
    });

    this.isCampModalOpen.set(false);
    this.notificationService.success('common.success', 'Camp registered successfully.');
  }

  selectCamp(camp: Camp) {
    this.selectedCamp.set(camp);
  }

  closeCampDetails() {
    this.selectedCamp.set(null);
  }

  // --- ALLOCATION ACTIONS ---
  openAddAllocation() {
    this.allocationForm = {
      campId: this.selectedCamp()?.id || '',
      caravanId: '',
      allocatedToUser: '',
      allocationDate: new Date().toISOString().split('T')[0]
    };
    this.isAllocationModalOpen.set(true);
  }

  saveAllocation() {
    if (!this.allocationForm.campId || !this.allocationForm.caravanId || !this.allocationForm.allocatedToUser) {
      this.notificationService.danger('common.err_validation_title', 'Please select a camp, caravan, and enter the assignee.');
      return;
    }

    const newAlloc: CampAllocation = {
      id: `al${this.allocations().length + 1}`,
      campId: this.allocationForm.campId,
      caravanId: this.allocationForm.caravanId,
      allocatedToUser: this.allocationForm.allocatedToUser,
      allocationDate: this.allocationForm.allocationDate
    };

    // Update allocations
    this.allocations.update(val => [...val, newAlloc]);

    // Update Caravan status and occupied bed counter
    const caravanId = this.allocationForm.caravanId;
    const caravan = this.caravans().find(c => c.id === caravanId);
    if (caravan) {
      this.mockDataService.caravans.update(list =>
        list.map(c => c.id === caravanId ? { ...c, status: 'Full' as const } : c)
      );

      // Increment occupied bed counter in camp
      const campId = this.allocationForm.campId;
      this.mockDataService.camps.update(list =>
        list.map(c => c.id === campId ? { ...c, occupiedBeds: Math.min(c.totalBeds, c.occupiedBeds + caravan.capacityBeds) } : c)
      );
    }

    this.auditService.log({
      user: 'Admin User',
      role: 'Super Admin',
      module: 'Operations',
      entityName: 'CampAllocation',
      entityId: newAlloc.id,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newAlloc),
      details: `Allocated caravan ${caravan?.caravanNumber || caravanId} to ${newAlloc.allocatedToUser}`
    });

    this.isAllocationModalOpen.set(false);
    this.notificationService.success('common.success', 'Caravan allocated successfully.');
  }

  releaseAllocation(alloc: CampAllocation) {
    // Update occupied beds in camp
    const caravan = this.caravans().find(c => c.id === alloc.caravanId);
    if (caravan) {
      this.mockDataService.caravans.update(list =>
        list.map(c => c.id === caravan.id ? { ...c, status: 'Available' as const } : c)
      );

      this.mockDataService.camps.update(list =>
        list.map(c => c.id === alloc.campId ? { ...c, occupiedBeds: Math.max(0, c.occupiedBeds - caravan.capacityBeds) } : c)
      );
    }

    // Remove allocation
    this.allocations.update(val => val.filter(a => a.id !== alloc.id));

    this.auditService.log({
      user: 'Admin User',
      role: 'Super Admin',
      module: 'Operations',
      entityName: 'CampAllocation',
      entityId: alloc.id,
      action: 'Delete',
      oldValue: JSON.stringify(alloc),
      newValue: '',
      details: `Released caravan allocation for ${alloc.allocatedToUser}`
    });

    this.notificationService.success('common.success', 'Allocation released successfully.');
  }

  getCaravanNumber(id: string): string {
    return this.caravans().find(c => c.id === id)?.caravanNumber || id;
  }

  getCampName(id: string): string {
    return this.camps().find(c => c.id === id)?.campName || id;
  }
}
