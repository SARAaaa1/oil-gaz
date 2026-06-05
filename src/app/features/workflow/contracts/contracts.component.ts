import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { Contract, RateSheetItem, ContractMilestone, ContractStatus, ContractType } from '../../../shared/interfaces/workflow.interface';
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
  private readonly translate = inject(TranslateService);

  readonly contracts = this.workflowService.contracts;
  readonly selectedContract = signal<Contract | null>(null);

  // Filter conditions
  searchQuery = '';
  statusFilter = 'ALL';
  typeFilter = 'ALL';

  // Form states
  isModalOpen = signal(false);
  isEditMode = signal(false);
  editingContractId = '';
  formModel: any = {
    title: '',
    clientName: '',
    clientContact: '',
    clientEmail: '',
    type: 'Daily Rate',
    startDate: '',
    endDate: '',
    value: 0,
    currency: 'USD',
    scope: '',
    rigId: '',
    rigName: '',
    projectManager: '',
    retentionPercent: 10,
    paymentTerms: 'Net 30',
    rateSheet: [],
    milestones: []
  };

  // computed filtered list
  readonly filteredContracts = computed(() => {
    let list = this.contracts();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;
    const type = this.typeFilter;

    if (status !== 'ALL') {
      list = list.filter(c => c.status === status);
    }
    if (type !== 'ALL') {
      list = list.filter(c => c.type === type);
    }

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

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.contracts.breadcrumb') }
    ]);

    // Preselect the first contract
    const list = this.filteredContracts();
    if (list.length > 0) {
      this.selectedContract.set(list[0]);
    }
  }

  selectContract(contract: Contract) {
    this.selectedContract.set(contract);
  }

  // --- Role Check Permissions ---
  canCreate() {
    const role = this.authService.currentUser()?.role;
    return role === 'Super Admin' || role === 'General Manager' || role === 'Procurement Manager' || role === 'Project Manager';
  }

  canEdit() {
    return this.canCreate();
  }

  canApprove() {
    const role = this.authService.currentUser()?.role;
    return role === 'Super Admin' || role === 'General Manager';
  }

  // --- Action Mutators ---
  approveContract(id: string) {
    this.workflowService.approveContract(id, 'Approved by assigned authority');
    // update current selected contract details
    const updated = this.contracts().find(c => c.id === id);
    if (updated) {
      this.selectedContract.set(updated);
    }
  }

  rejectContract(id: string) {
    this.workflowService.rejectContract(id, 'Suspended by administrative decision');
    const updated = this.contracts().find(c => c.id === id);
    if (updated) {
      this.selectedContract.set(updated);
    }
  }

  // --- Modal Forms ---
  openCreateModal() {
    this.isEditMode.set(false);
    this.editingContractId = '';
    this.formModel = {
      title: '',
      clientName: '',
      clientContact: '',
      clientEmail: '',
      type: 'Daily Rate',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 100000,
      currency: 'USD',
      scope: '',
      rigId: '',
      rigName: '',
      projectManager: this.authService.currentUser()?.fullName || 'Project Manager',
      retentionPercent: 10,
      paymentTerms: 'Net 30',
      rateSheet: [
        { id: 'new_1', description: 'Daily Rate Spud Operation', unit: 'DAY', rate: 25000, currency: 'USD' }
      ],
      milestones: [
        { id: 'mnew_1', title: 'Phase 1 Completion Spud', dueDate: new Date().toISOString().split('T')[0], amount: 25000, status: 'Pending' }
      ]
    };
    this.isModalOpen.set(true);
  }

  openEditModal(contract: Contract) {
    this.isEditMode.set(true);
    this.editingContractId = contract.id;
    this.formModel = JSON.parse(JSON.stringify(contract)); // deep copy
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onRigChange() {
    const id = this.formModel.rigId;
    if (id === 'rig1') this.formModel.rigName = 'Rig Alpha (Offshore)';
    else if (id === 'rig2') this.formModel.rigName = 'Rig Beta (Land)';
    else if (id === 'rig3') this.formModel.rigName = 'Rig Gamma (Deepwater)';
    else this.formModel.rigName = '';
  }

  addRateSheetRow() {
    this.formModel.rateSheet.push({
      id: `new_${Date.now()}`,
      description: '',
      unit: 'DAY',
      rate: 0,
      currency: 'USD'
    });
  }

  removeRateSheetRow(index: number) {
    this.formModel.rateSheet.splice(index, 1);
  }

  addMilestoneRow() {
    this.formModel.milestones.push({
      id: `mnew_${Date.now()}`,
      title: '',
      dueDate: new Date().toISOString().split('T')[0],
      amount: 0,
      status: 'Pending'
    });
  }

  removeMilestoneRow(index: number) {
    this.formModel.milestones.splice(index, 1);
  }

  saveContract() {
    if (!this.formModel.title || !this.formModel.clientName) {
      alert(this.translate.instant('workflow.contracts.alert_required'));
      return;
    }

    if (this.isEditMode()) {
      this.workflowService.updateContract(this.editingContractId, this.formModel);
      const updated = this.contracts().find(c => c.id === this.editingContractId);
      if (updated) {
        this.selectedContract.set(updated);
      }
    } else {
      const created = this.workflowService.createContract({
        ...this.formModel,
        status: 'Draft'
      });
      this.selectedContract.set(created);
    }
    this.isModalOpen.set(false);
  }
}
