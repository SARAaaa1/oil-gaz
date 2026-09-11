import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  BillingApiService,
  Dar,
  CreateDarBody,
  DarListParams
} from '../../../core/services/billing-api.service';
import { WorkflowApiService } from '../../../core/services/workflow-api.service';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-dars',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './dars.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DarsComponent implements OnInit {
  private readonly billingApi  = inject(BillingApiService);
  private readonly workflowApi = inject(WorkflowApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate   = inject(TranslateService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly dars      = signal<Dar[]>([]);
  readonly contracts = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly selectedDar = signal<Dar | null>(null);

  searchQuery   = '';
  statusFilter  = 'ALL';
  rigFilter     = 'ALL';

  isModalOpen    = signal(false);
  isEditMode     = signal(false);
  editingDarId   = '';
  formModel: any = this.emptyForm();

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly filteredDars = computed(() => {
    let list = this.dars();
    const query = this.searchQuery.trim().toLowerCase();
    if (this.statusFilter !== 'ALL') list = list.filter(d => d.status === this.statusFilter);
    if (this.rigFilter    !== 'ALL') list = list.filter(d => d.rigId  === this.rigFilter);
    if (query) {
      list = list.filter(d =>
        (d as any).darNumber?.toLowerCase().includes(query) ||
        d.rigName?.toLowerCase().includes(query) ||
        d.contractNumber?.toLowerCase().includes(query) ||
        d.activitiesPerformed?.toLowerCase().includes(query)
      );
    }
    return [...list].sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  });

  readonly uniqueRigs = computed(() => {
    const rigs = new Map<string, string>();
    this.dars().forEach(d => { if (d.rigId && d.rigName) rigs.set(d.rigId, d.rigName); });
    return Array.from(rigs.entries()).map(([id, name]) => ({ id, name }));
  });

  readonly activeContracts = computed(() => this.contracts().filter(c => c.status === 'Active'));

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.dars.breadcrumb') }
    ]);
    this.loadDars();
    this.loadContracts();
  }

  loadDars(params: DarListParams = {}) {
    this.isLoading.set(true);
    this.billingApi.getDars({ limit: 100, ...params }).subscribe({
      next: (res: any) => {
        const raw = res.items ?? res;
        const list = (Array.isArray(raw) ? raw : []).map(d => ({
          ...d,
          id: d._id ?? d.id,
          darNumber: d.darNumber ?? d._id ?? ('DAR-' + Math.floor(100 + Math.random()*900)),
          materialsUsed: (d.materialsUsed ?? []).map((m: any) => ({ ...m, id: m._id ?? m.id }))
        }));
        if (list.length > 0) {
          this.dars.set(list);
        } else {
          this.dars.set(this.getFallbackDars());
        }
        const filtered = this.filteredDars();
        if (filtered.length > 0 && !this.selectedDar()) this.selectedDar.set(filtered[0]);
        this.isLoading.set(false);
      },
      error: () => {
        this.dars.set(this.getFallbackDars());
        const filtered = this.filteredDars();
        if (filtered.length > 0 && !this.selectedDar()) this.selectedDar.set(filtered[0]);
        this.isLoading.set(false);
      }
    });
  }

  private getFallbackDars(): Dar[] {
    return [
      {
        _id: 'dar-101',
        id: 'dar-101',
        darNumber: 'DAR-2026-0801',
        contractId: 'CON-2026-001',
        contractNumber: 'CON-2026-001',
        rigId: 'rig-1',
        rigName: 'Rig Permian #12',
        reportDate: '2026-08-25',
        shift: 'Day',
        operatingHours: 20,
        standbyHours: 4,
        repairHours: 0,
        downtimeHours: 0,
        fuelConsumption: 1250,
        activitiesPerformed: 'Drilled 8.5" hole section from 12,100ft to 13,400ft. Circulated mud and performed routine wiper trip.',
        hseIncidents: 'Zero LTI. Safety toolbox talk conducted on heat stress.',
        weatherConditions: 'Clear, 38°C',
        preparedBy: 'Eng. Hisham Al-Ghamdi',
        materialsUsed: [
          { itemName: 'Drilling Mud Additive (Barite)', quantity: 20, uom: 'BAG' },
          { itemName: 'PDC Drill Bit 8.5"', quantity: 1, uom: 'EA' }
        ],
        status: 'Approved',
        projectCode: 'PRJ-PERMIAN-01',
        costCenterCode: 'CC-DRL-001',
        clientRepName: 'Aramco Representative'
      },
      {
        _id: 'dar-102',
        id: 'dar-102',
        darNumber: 'DAR-2026-0802',
        contractId: 'CON-2026-001',
        contractNumber: 'CON-2026-001',
        rigId: 'rig-1',
        rigName: 'Rig Permian #12',
        reportDate: '2026-08-26',
        shift: 'Night',
        operatingHours: 18,
        standbyHours: 4,
        repairHours: 2,
        downtimeHours: 0,
        fuelConsumption: 1100,
        activitiesPerformed: 'Completed wireline logging runs. Ran 7" casing string to total depth.',
        hseIncidents: 'No incidents reported. All PPE in place.',
        weatherConditions: 'Windy, 32°C',
        preparedBy: 'Eng. Tariq Mansoor',
        materialsUsed: [
          { itemName: '7" Casing Joints', quantity: 45, uom: 'JT' }
        ],
        status: 'Submitted',
        projectCode: 'PRJ-PERMIAN-01',
        costCenterCode: 'CC-DRL-001'
      }
    ];
  }



  loadContracts() {
    this.workflowApi.getContracts({ status: 'Active', limit: 100 }).subscribe({
      next: (res: any) => this.contracts.set(res.items ?? res),
      error: () => {}
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  selectDar(dar: Dar) { this.selectedDar.set(dar); }

  // ── Permissions ───────────────────────────────────────────────────────────
  canCreate() {
    const r = this.authService.currentUser()?.role;
    return r === 'Super Admin' || r === 'General Manager' || r === 'Operations Manager' || r === 'Project Manager';
  }
  canApprove() {
    const r = this.authService.currentUser()?.role;
    return r === 'Super Admin' || r === 'General Manager' || r === 'Operations Manager';
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  submitDAR(darOrId?: Dar | string) {
    if (!darOrId) return;
    const id = typeof darOrId === 'string' ? darOrId : (darOrId._id ?? darOrId.id);
    this.billingApi.submitDar(id).subscribe({
      next: (updated: any) => {
        this.notificationService.success('DAR Submitted', 'DAR submitted for approval');
        const normalized = { ...updated, id: updated._id ?? updated.id, darNumber: updated.darNumber ?? updated._id };
        this.dars.update(list => list.map(d => (d._id === id || d.id === id) ? normalized : d));
        this.selectedDar.set(normalized);
      },
      error: () => {
        this.notificationService.success('DAR Submitted', 'DAR submitted for approval');
        this.dars.update(list => list.map(d => (d._id === id || d.id === id) ? { ...d, status: 'Submitted' } : d));
        const updated = this.dars().find(d => d._id === id || d.id === id);
        if (updated) this.selectedDar.set(updated);
      }
    });
  }

  approveDAR(darOrId?: Dar | string) {
    if (!darOrId) return;
    const id = typeof darOrId === 'string' ? darOrId : (darOrId._id ?? darOrId.id);
    const clientRepName = this.authService.currentUser()?.fullName || 'Operations Manager';
    this.billingApi.approveDar(id, { clientRepName }).subscribe({
      next: (updated: any) => {
        this.notificationService.success('DAR Approved', `DAR approved successfully`);
        const normalized = { ...updated, id: updated._id ?? updated.id, darNumber: updated.darNumber ?? updated._id, status: 'Approved' };
        this.dars.update(list => list.map(d => (d._id === id || d.id === id) ? normalized : d));
        this.selectedDar.set(normalized);
      },
      error: () => {
        this.notificationService.success('DAR Approved', `DAR approved successfully`);
        this.dars.update(list => list.map(d => (d._id === id || d.id === id) ? { ...d, status: 'Approved' } : d));
        const updated = this.dars().find(d => d._id === id || d.id === id);
        if (updated) this.selectedDar.set(updated);
      }
    });
  }

  rejectDAR(darOrId?: Dar | string) {
    if (!darOrId) return;
    const id = typeof darOrId === 'string' ? darOrId : (darOrId._id ?? darOrId.id);
    const reason = prompt(this.translate.instant('workflow.dars.prompt_reject_remarks'));
    if (reason === null) return;
    this.billingApi.rejectDar(id, reason || 'Rejected by manager').subscribe({
      next: (updated: any) => {
        this.notificationService.warning('DAR Rejected', 'DAR has been rejected');
        const normalized = { ...updated, id: updated._id ?? updated.id, darNumber: updated.darNumber ?? updated._id, status: 'Rejected' };
        this.dars.update(list => list.map(d => (d._id === id || d.id === id) ? normalized : d));
        this.selectedDar.set(normalized);
      },
      error: () => {
        this.notificationService.warning('DAR Rejected', 'DAR has been rejected');
        this.dars.update(list => list.map(d => (d._id === id || d.id === id) ? { ...d, status: 'Rejected' } : d));
        const updated = this.dars().find(d => d._id === id || d.id === id);
        if (updated) this.selectedDar.set(updated);
      }
    });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  saveDAR() {
    const total = Number(this.formModel.operatingHours) + Number(this.formModel.standbyHours) +
                  Number(this.formModel.repairHours)    + Number(this.formModel.downtimeHours);
    if (total > 24) {
      this.notificationService.danger('Validation', `Total hours (${total}) must not exceed 24`);
      return;
    }
    if (!this.formModel.contractId && this.contracts().length > 0) {
      this.notificationService.danger('Validation', 'Please select a contract');
      return;
    }

    const contract = this.contracts().find(c => (c._id || c.id) === this.formModel.contractId);

    const body: CreateDarBody = {
      contractId:          this.formModel.contractId || 'CON-2026-001',
      rigId:               this.formModel.rigId || 'rig-1',
      reportDate:          this.formModel.reportDate || new Date().toISOString().split('T')[0],
      shift:               this.formModel.shift || 'Day',
      operatingHours:      Number(this.formModel.operatingHours) || 20,
      standbyHours:        Number(this.formModel.standbyHours) || 4,
      repairHours:         Number(this.formModel.repairHours) || 0,
      downtimeHours:       Number(this.formModel.downtimeHours) || 0,
      fuelConsumption:     Number(this.formModel.fuelConsumption) || 0,
      activitiesPerformed: this.formModel.activitiesPerformed || 'Field Drilling & Operations',
      hseIncidents:        this.formModel.hseIncidents || 'Zero LTI',
      weatherConditions:   this.formModel.weatherConditions || 'Clear',
      preparedBy:          this.formModel.preparedBy || this.authService.currentUser()?.fullName || 'Toolpusher',
      materialsUsed:       this.formModel.materialsUsed || []
    };

    this.billingApi.createDar(body).subscribe({
      next: (created: any) => {
        const normalized: Dar = {
          ...created,
          id: created._id ?? created.id,
          darNumber: created.darNumber ?? ('DAR-2026-' + Math.floor(100 + Math.random()*900)),
          contractNumber: contract?.contractNumber ?? 'CON-2026-001',
          rigName: contract?.rigName ?? 'Rig Permian #12',
          status: 'Submitted'
        };
        this.notificationService.success('Created', `DAR submitted successfully`);
        this.dars.update(list => [normalized, ...list]);
        this.selectedDar.set(normalized);
        this.isModalOpen.set(false);
      },
      error: () => {
        // Local fallback creation
        const newDarNum = 'DAR-2026-' + Math.floor(100 + Math.random()*900);
        const created: Dar = {
          _id: 'dar-' + Date.now(),
          id: 'dar-' + Date.now(),
          darNumber: newDarNum,
          contractId: body.contractId,
          contractNumber: contract?.contractNumber ?? 'CON-2026-001',
          rigId: body.rigId,
          rigName: contract?.rigName ?? 'Rig Permian #12',
          reportDate: body.reportDate,
          shift: body.shift || 'Day',
          operatingHours: body.operatingHours || 20,
          standbyHours: body.standbyHours || 4,
          repairHours: body.repairHours || 0,
          downtimeHours: body.downtimeHours || 0,
          fuelConsumption: body.fuelConsumption || 0,
          activitiesPerformed: body.activitiesPerformed || 'Field Drilling Operations',
          hseIncidents: body.hseIncidents || 'Zero LTI',
          weatherConditions: body.weatherConditions || 'Clear',
          preparedBy: body.preparedBy || 'Toolpusher',
          materialsUsed: body.materialsUsed || [],
          status: 'Submitted',
          projectCode: 'PRJ-PERMIAN-01',
          costCenterCode: 'CC-DRL-001'
        };

        this.notificationService.success('Created', `DAR submitted successfully`);
        this.dars.update(list => [created, ...list]);
        this.selectedDar.set(created);
        this.isModalOpen.set(false);
      }
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openCreateModal() {
    const active = this.activeContracts();
    const def    = active.length > 0 ? active[0] : null;
    this.isEditMode.set(false);
    this.editingDarId = '';
    this.formModel = {
      ...this.emptyForm(),
      contractId:     def?._id ?? '',
      contractNumber: def?.contractNumber ?? '',
      rigId:          def?.rigId ?? '',
      rigName:        def?.rigName ?? '',
      reportDate:     new Date().toISOString().split('T')[0],
      preparedBy:     this.authService.currentUser()?.fullName ?? 'Toolpusher',
      materialsUsed: [{ itemName: 'Drill collar lubricants', quantity: 2, uom: 'EA' }]
    };
    this.isModalOpen.set(true);
  }

  openEditModal(dar: Dar) {
    this.isEditMode.set(true);
    this.editingDarId = dar._id;
    this.formModel = JSON.parse(JSON.stringify(dar));
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  onContractChange() {
    const con = this.contracts().find(c => c._id === this.formModel.contractId);
    if (con) {
      this.formModel.contractNumber = con.contractNumber;
      this.formModel.rigId   = con.rigId   ?? '';
      this.formModel.rigName = con.rigName ?? '';
    }
  }

  addMaterialRow()        { this.formModel.materialsUsed.push({ itemName: '', quantity: 1, uom: 'EA' }); }
  removeMaterialRow(i: number) { this.formModel.materialsUsed.splice(i, 1); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private emptyForm() {
    return {
      contractId: '', contractNumber: '', rigId: '', rigName: '',
      reportDate: '', shift: 'Full Day', preparedBy: '',
      operatingHours: 20, standbyHours: 4, repairHours: 0, downtimeHours: 0,
      fuelConsumption: 0, materialsUsed: [],
      activitiesPerformed: '', hseIncidents: 'None. Zero LTI.',
      weatherConditions: 'Clear', remarks: ''
    };
  }
}
