import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  CreateContractBody,
  PaginatedResponse
} from '../../../core/services/workflow-api.service';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

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

  // ── State ──────────────────────────────────────────────────────────────────
  readonly contracts      = signal<Contract[]>([]);
  readonly rigs           = signal<any[]>([]);
  readonly isLoading      = signal(false);
  readonly selectedContract = signal<Contract | null>(null);

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
    this.loadRigs();
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

  loadRigs() {
    this.assetsApi.getEquipment({ limit: 100 }).subscribe({
      next: (res: any) => {
        const rawList = res.items ?? res.data ?? (Array.isArray(res) ? res : []);
        if (rawList && rawList.length > 0) {
          this.rigs.set(rawList.map((r: any) => ({ ...r, id: r._id ?? r.id })));
        } else {
          this.opsApi.getRigs().subscribe({
            next: (rigList: any) => {
              const items = rigList.data ?? (Array.isArray(rigList) ? rigList : []);
              this.rigs.set(items.map((r: any) => ({ ...r, id: r._id ?? r.id })));
            },
            error: () => {}
          });
        }
      },
      error: () => {
        this.opsApi.getRigs().subscribe({
          next: (rigList: any) => {
            const items = rigList.data ?? (Array.isArray(rigList) ? rigList : []);
            this.rigs.set(items.map((r: any) => ({ ...r, id: r._id ?? r.id })));
          },
          error: () => {}
        });
      }
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
    this.formModel = JSON.parse(JSON.stringify({
      ...contract,
      rigId:   contract.rigId   ?? '',
      rigName: contract.rigName ?? ''
    }));
    this.isModalOpen.set(true);
    if (!(this.formModel as any).exchangeRateUSDtoEGP) this.fetchExchangeRate();
    else {
      this.liveRate.set((this.formModel as any).exchangeRateUSDtoEGP);
      this.rateSource.set('saved snapshot');
    }
  }

  closeModal() { this.isModalOpen.set(false); }

  onRigChange() {
    const selectedId = this.formModel.rigId;
    const rig = this.rigs().find(r => r._id === selectedId || r.id === selectedId);
    this.formModel.rigName = rig ? (rig.rigName || rig.equipmentName || rig.equipmentCode || '') : '';
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
      projectManager:     this.formModel.projectManager,
      retentionPercent:   Number(this.formModel.retentionPercent) || 10,
      vatRate:            Number(this.formModel.vatRate) || 15,
      withholdingRate:    Number(this.formModel.withholdingRate) || 5,
      paymentTerms:       this.formModel.paymentTerms || 'Net 30',
      country:            this.formModel.country,
      region:             this.formModel.region,
      siteName:           this.formModel.siteName,
      gpsCoordinates:     this.formModel.gpsCoordinates,
      costCenterCode:     this.formModel.costCenterCode,
      costCenterName:     this.formModel.costCenterName,
      parentCostCenter:   this.formModel.parentCostCenter,
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
