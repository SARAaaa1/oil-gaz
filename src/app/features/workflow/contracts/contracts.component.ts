import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { Contract, ContractAttachment } from '../../../shared/interfaces/workflow.interface';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './contracts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractsComponent implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  readonly exchangeRateService = inject(ExchangeRateService);

  readonly contracts = this.workflowService.contracts;
  readonly selectedContract = signal<Contract | null>(null);

  // Filter state
  searchQuery = '';
  statusFilter = 'ALL';
  typeFilter = 'ALL';

  // Modal state
  isModalOpen = signal(false);
  isEditMode = signal(false);
  editingContractId = '';

  // File upload state
  readonly pendingAttachments = signal<ContractAttachment[]>([]);
  readonly isDragOver = signal(false);

  // Exchange rate state
  readonly liveRate = signal<number | null>(null);
  readonly rateDate = signal<string>('');
  readonly rateSource = signal<string>('');
  readonly isFetchingRate = signal<boolean>(false);
  readonly rateError = signal<boolean>(false);

  formModel: any = this.emptyForm();

  readonly filteredContracts = computed(() => {
    let list = this.contracts();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;
    const type = this.typeFilter;

    if (status !== 'ALL') list = list.filter(c => c.status === status);
    if (type !== 'ALL') list = list.filter(c => c.type === type);
    if (query) {
      list = list.filter(c =>
        c.contractNumber.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.clientName.toLowerCase().includes(query) ||
        (c.rigName && c.rigName.toLowerCase().includes(query)) ||
        c.projectManager.toLowerCase().includes(query)
      );
    }
    return list;
  });

  // Computed EGP value from form model
  readonly egpValuePreview = computed(() => {
    const rate = this.liveRate();
    const value = this.formModel?.value ?? 0;
    if (!rate || !value) return null;
    return value * rate;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.contracts.breadcrumb') }
    ]);
    const list = this.filteredContracts();
    if (list.length > 0) this.selectedContract.set(list[0]);
  }

  private emptyForm() {
    return {
      title: '', clientName: '', clientContact: '', clientEmail: '',
      type: 'Daily Rate', startDate: '', endDate: '', value: 0,
      currency: 'USD', scope: '', rigId: '', rigName: '',
      projectManager: '', retentionPercent: 10, paymentTerms: 'Net 30',
      rateSheet: [], milestones: [], attachments: [],
      projectName: '', country: 'USA', region: 'Gulf of Mexico',
      siteName: '', gpsCoordinates: '', costCenterCode: '',
      costCenterName: '', parentCostCenter: 'CC-DRILL-01',
      preferredWarehouse: 'Warehouse A', nearestWarehouse: 'Warehouse A',
      distanceKm: 0, estimatedTransportationCost: 0,
      exchangeRateUSDtoEGP: null, contractValueEGP: null, rateSnapshotDate: null
    };
  }

  selectContract(contract: Contract) { this.selectedContract.set(contract); }

  canCreate() {
    const r = this.authService.currentUser()?.role;
    return r === 'Super Admin' || r === 'General Manager' || r === 'Procurement Manager' || r === 'Project Manager';
  }
  canEdit() { return this.canCreate(); }
  canApprove() {
    const r = this.authService.currentUser()?.role;
    return r === 'Super Admin' || r === 'General Manager';
  }

  // ─── EXCHANGE RATE ──────────────────────────────────────────────
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
      this.notificationService.success(
        'Exchange Rate Updated',
        `1 USD = ${snap.rate.toFixed(4)} EGP  (${snap.source})`
      );
    } catch {
      this.rateError.set(true);
    } finally {
      this.isFetchingRate.set(false);
    }
  }

  recalcEGP() {
    const rate = this.formModel.exchangeRateUSDtoEGP;
    const value = this.formModel.value ?? 0;
    if (rate && value) {
      this.formModel.contractValueEGP = parseFloat((value * rate).toFixed(2));
    }
  }

  // ─── APPROVE / REJECT ───────────────────────────────────────────
  approveContract(id: string) {
    this.workflowService.approveContract(id, 'Approved by assigned authority');
    const updated = this.contracts().find(c => c.id === id);
    if (updated) this.selectedContract.set(updated);

    const contract = this.contracts().find(c => c.id === id);
    const projectCode = contract?.projectCode;
    if (projectCode) {
      this.notificationService.success('Project Created', `Project ${projectCode} created. Navigating...`);
      setTimeout(() => this.router.navigate(['/operations/projects'], { queryParams: { project: projectCode } }), 1200);
    } else {
      this.notificationService.success('Contract Approved', 'Contract activated and project auto-generated.');
    }
  }

  rejectContract(id: string) {
    this.workflowService.rejectContract(id, 'Suspended by administrative decision');
    const updated = this.contracts().find(c => c.id === id);
    if (updated) this.selectedContract.set(updated);
  }

  navigateToProject(projectCode: string) {
    this.router.navigate(['/operations/projects'], { queryParams: { project: projectCode } });
  }

  // ─── MODAL ──────────────────────────────────────────────────────
  async openCreateModal() {
    this.isEditMode.set(false);
    this.editingContractId = '';
    this.pendingAttachments.set([]);
    this.formModel = {
      ...this.emptyForm(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 100000,
      projectManager: this.authService.currentUser()?.fullName || 'Project Manager',
      rateSheet: [{ id: 'new_1', description: 'Daily Rate Spud Operation', unit: 'DAY', rate: 25000, currency: 'USD' }],
      milestones: [{ id: 'mnew_1', title: 'Phase 1 Completion Spud', dueDate: new Date().toISOString().split('T')[0], amount: 25000, status: 'Pending' }],
      distanceKm: 120, estimatedTransportationCost: 25000
    };
    this.isModalOpen.set(true);
    // Auto-fetch live rate when modal opens
    await this.fetchExchangeRate();
  }

  openEditModal(contract: Contract) {
    this.isEditMode.set(true);
    this.editingContractId = contract.id;
    this.formModel = JSON.parse(JSON.stringify(contract));
    if (!this.formModel.attachments) this.formModel.attachments = [];
    this.pendingAttachments.set([...this.formModel.attachments]);

    // Restore cached rate or fetch fresh
    if (contract.exchangeRateUSDtoEGP) {
      this.liveRate.set(contract.exchangeRateUSDtoEGP);
      this.rateDate.set(contract.rateSnapshotDate || '');
      this.rateSource.set('saved snapshot');
    } else {
      this.fetchExchangeRate();
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.pendingAttachments.set([]);
  }

  onRigChange() {
    const id = this.formModel.rigId;
    if (id === 'rig1') this.formModel.rigName = 'Rig Alpha (Offshore)';
    else if (id === 'rig2') this.formModel.rigName = 'Rig Beta (Land)';
    else if (id === 'rig3') this.formModel.rigName = 'Rig Gamma (Deepwater)';
    else this.formModel.rigName = '';
  }

  addRateSheetRow() {
    this.formModel.rateSheet.push({ id: `new_${Date.now()}`, description: '', unit: 'DAY', rate: 0, currency: 'USD' });
  }
  removeRateSheetRow(index: number) { this.formModel.rateSheet.splice(index, 1); }

  addMilestoneRow() {
    this.formModel.milestones.push({ id: `mnew_${Date.now()}`, title: '', dueDate: new Date().toISOString().split('T')[0], amount: 0, status: 'Pending' });
  }
  removeMilestoneRow(index: number) { this.formModel.milestones.splice(index, 1); }

  // ─── FILE UPLOAD ────────────────────────────────────────────────
  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files) this.processFiles(Array.from(files));
  }
  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragOver.set(true); }
  onDragLeave() { this.isDragOver.set(false); }
  onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) { this.processFiles(Array.from(input.files)); input.value = ''; }
  }

  private processFiles(files: File[]) {
    const allowedTypes = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/webp'];
    const maxSizeMB = 10;

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        this.notificationService.danger('Invalid File', `${file.name} is not a supported type.`); continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        this.notificationService.danger('File Too Large', `${file.name} exceeds ${maxSizeMB}MB.`); continue;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: ContractAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          fileName: file.name, fileSize: file.size, fileType: file.type,
          uploadedAt: new Date().toISOString(),
          uploadedBy: this.authService.currentUser()?.fullName || 'Unknown',
          dataUrl: e.target?.result as string
        };
        this.pendingAttachments.update(list => [...list, attachment]);
      };
      reader.readAsDataURL(file);
    }
  }

  removeAttachment(id: string) { this.pendingAttachments.update(list => list.filter(a => a.id !== id)); }

  getFileIcon(fileType: string): string {
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.startsWith('image/')) return '🖼️';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ─── SAVE ───────────────────────────────────────────────────────
  saveContract() {
    if (!this.formModel.title || !this.formModel.clientName) {
      alert(this.translate.instant('workflow.contracts.alert_required'));
      return;
    }

    // Ensure EGP is recalculated before saving
    this.recalcEGP();
    this.formModel.attachments = this.pendingAttachments();

    if (this.isEditMode()) {
      this.workflowService.updateContract(this.editingContractId, this.formModel);
      const updated = this.contracts().find(c => c.id === this.editingContractId);
      if (updated) this.selectedContract.set(updated);
    } else {
      const created = this.workflowService.createContract({ ...this.formModel, status: 'Draft' });
      this.selectedContract.set(created);
    }
    this.isModalOpen.set(false);
    this.pendingAttachments.set([]);
  }
}
