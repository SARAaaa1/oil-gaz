import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditService } from '../../../core/services/audit.service';
import {
  OperationsApiService,
  Camp,
  CreateCampBody,
  CampAllocationBody
} from '../../../core/services/operations-api.service';

@Component({
  selector: 'app-camps',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './camps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampsComponent implements OnInit {
  private readonly opsApi      = inject(OperationsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly camps       = signal<Camp[]>([]);
  readonly allocations = signal<any[]>([]);
  readonly isLoading   = signal(false);
  readonly isSaving    = signal(false);

  readonly activeTab    = signal<'list' | 'allocations'>('list');
  readonly selectedCamp = signal<Camp | null>(null);
  readonly searchQuery  = signal<string>('');

  readonly isCampModalOpen       = signal(false);
  readonly isAllocationModalOpen = signal(false);

  campForm: Partial<CreateCampBody> = this.emptyCampForm();
  allocationForm: any = this.emptyAllocationForm();

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly filteredCamps = computed(() => {
    let list = this.camps();
    const q  = this.searchQuery().trim().toLowerCase();
    if (q) list = list.filter(c =>
      c.campCode?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q)
    );
    return list;
  });

  readonly selectedCampAllocations = computed(() => {
    const sel = this.selectedCamp();
    if (!sel) return this.allocations();
    return this.allocations().filter(a => a.campId === sel._id);
  });

  readonly totalBeds     = computed(() => this.camps().reduce((s, c) => s + (c.totalBeds ?? 0), 0));
  readonly totalOccupied = computed(() => this.camps().reduce((s, c) => s + (c.occupiedBeds ?? 0), 0));
  readonly totalAvailable = computed(() => this.camps().reduce((s, c) => s + (c.availableBeds ?? 0), 0));

  readonly occupancyRate = computed(() => {
    const total = this.totalBeds();
    return total > 0 ? Math.round((this.totalOccupied() / total) * 100) : 0;
  });

  // ── Compat: old template selects via camp.id — alias to _id ─────────────
  readonly caravans = signal<any[]>([]); // not used by new API — kept for template

  readonly filteredCaravans = computed(() => {
    const sel = this.selectedCamp();
    if (!sel) return [];
    return this.caravans().filter((c: any) => c.assignedCampId === sel._id);
  });

  closeCampDetails() { this.selectedCamp.set(null); }
  openAddAllocation() { this.openAllocationModal(); }

  getCampName(campId: string): string {
    return this.camps().find(c => c._id === campId)?.name ?? campId;
  }
  getCaravanNumber(caravanId: string): string { return caravanId; }

  /** Overload for template passing full alloc object */
  releaseAllocationObj(alloc: any) {
    this.releaseAllocation(alloc._id ?? alloc.id, alloc.occupantName ?? alloc.allocatedToUser ?? '');
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.camps' }
    ]);
    this.loadCamps();
    this.loadAllocations();
  }

  loadCamps() {
    this.isLoading.set(true);
    this.opsApi.getCamps().subscribe({
      next: (data: any) => { this.camps.set(Array.isArray(data) ? data : data.items ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  loadAllocations() {
    this.opsApi.getAllocations().subscribe({
      next: (data: any) => this.allocations.set(Array.isArray(data) ? data : data.items ?? []),
      error: () => {}
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  selectCamp(camp: Camp) {
    this.selectedCamp.set(camp);
    this.opsApi.getAllocations({ campId: camp._id }).subscribe({
      next: (data: any) => this.allocations.set(Array.isArray(data) ? data : data.items ?? []),
      error: () => {}
    });
  }

  // ── Camp CRUD ──────────────────────────────────────────────────────────────
  openCampModal() {
    this.campForm = this.emptyCampForm();
    this.isCampModalOpen.set(true);
  }

  saveCamp() {
    if (!this.campForm.campCode || !this.campForm.name) {
      this.notificationService.danger('Validation', 'Please fill all required fields');
      return;
    }
    this.isSaving.set(true);
    this.opsApi.createCamp(this.campForm as CreateCampBody).subscribe({
      next: (created) => {
        this.camps.update(list => [created, ...list]);
        this.isCampModalOpen.set(false);
        this.notificationService.success('Created', `Camp ${created.name} created successfully`);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to create camp');
        this.isSaving.set(false);
      }
    });
  }

  // ── Allocation ─────────────────────────────────────────────────────────────
  openAllocationModal() {
    const camp = this.selectedCamp();
    if (!camp) { this.notificationService.warning('Select Camp', 'Please select a camp first'); return; }
    this.allocationForm = { ...this.emptyAllocationForm(), campId: camp._id };
    this.isAllocationModalOpen.set(true);
  }

  saveAllocation() {
    if (!this.allocationForm.occupantName) {
      this.notificationService.danger('Validation', 'Please enter occupant name');
      return;
    }
    const body: CampAllocationBody = {
      campId:       this.allocationForm.campId,
      projectCode:  this.allocationForm.projectCode,
      occupantName: this.allocationForm.occupantName,
      role:         this.allocationForm.role,
      bedNumber:    this.allocationForm.bedNumber,
      checkInDate:  this.allocationForm.checkInDate
    };

    this.isSaving.set(true);
    this.opsApi.createAllocation(body).subscribe({
      next: (created) => {
        this.allocations.update(list => [created, ...list]);
        // Update camp bed count locally
        this.camps.update(list => list.map(c =>
          c._id === this.allocationForm.campId
            ? { ...c, occupiedBeds: c.occupiedBeds + 1, availableBeds: c.availableBeds - 1 }
            : c
        ));
        this.isAllocationModalOpen.set(false);
        this.notificationService.success('Allocated', `Bed allocated to ${body.occupantName}`);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Allocation failed');
        this.isSaving.set(false);
      }
    });
  }

  releaseAllocation(allocationId: string, occupantName: string) {
    this.opsApi.releaseAllocation(allocationId).subscribe({
      next: () => {
        this.allocations.update(list => list.filter(a => a._id !== allocationId));
        const camp = this.selectedCamp();
        if (camp) {
          this.camps.update(list => list.map(c =>
            c._id === camp._id
              ? { ...c, occupiedBeds: Math.max(0, c.occupiedBeds - 1), availableBeds: c.availableBeds + 1 }
              : c
          ));
        }
        this.notificationService.success('Released', `${occupantName} checked out`);
      },
      error: (err) => this.notificationService.danger('Error', err?.error?.message || 'Release failed')
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private emptyCampForm(): Partial<CreateCampBody> {
    return {
      campCode: '', name: '', projectCode: '',
      location: '', totalBeds: 50, amenities: [],
      status: 'Active'
    };
  }

  private emptyAllocationForm(): CampAllocationBody & { campId: string } {
    return {
      campId: '', projectCode: '', occupantName: '',
      role: '', bedNumber: '',
      checkInDate: new Date().toISOString().split('T')[0]
    };
  }
}
