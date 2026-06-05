import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { DAR, DARMaterialUsed, Contract } from '../../../shared/interfaces/workflow.interface';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-dars',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './dars.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DarsComponent implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly dars = this.workflowService.dars;
  readonly contracts = this.workflowService.contracts;
  readonly selectedDar = signal<DAR | null>(null);

  // Filters
  searchQuery = '';
  statusFilter = 'ALL';
  rigFilter = 'ALL';

  // Form states
  isModalOpen = signal(false);
  isEditMode = signal(false);
  editingDarId = '';
  formModel: any = {
    contractId: '', contractNumber: '', rigId: '', rigName: '',
    reportDate: '', shift: 'Day', preparedBy: '',
    operatingHours: 24, standbyHours: 0, repairHours: 0, downtimeHours: 0,
    totalHours: 24, fuelConsumption: 0, fuelUnit: 'LITERS',
    materialsUsed: [], activitiesPerformed: '', hseIncidents: '',
    weatherConditions: '', remarks: '', attachments: []
  };

  readonly filteredDars = computed(() => {
    let list = this.dars();
    const query = this.searchQuery.trim().toLowerCase();
    if (this.statusFilter !== 'ALL') list = list.filter(d => d.status === this.statusFilter);
    if (this.rigFilter !== 'ALL') list = list.filter(d => d.rigId === this.rigFilter);
    if (query) list = list.filter(d =>
      d.darNumber.toLowerCase().includes(query) ||
      d.rigName.toLowerCase().includes(query) ||
      d.contractNumber.toLowerCase().includes(query) ||
      d.activitiesPerformed.toLowerCase().includes(query) ||
      d.preparedBy.toLowerCase().includes(query)
    );
    return [...list].sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.dars.breadcrumb') }
    ]);
    const list = this.filteredDars();
    if (list.length > 0) this.selectedDar.set(list[0]);
  }

  selectDar(dar: DAR) { this.selectedDar.set(dar); }

  canCreate() {
    const role = this.authService.currentUser()?.role;
    return role === 'Super Admin' || role === 'Operations Manager' || role === 'Employee' || role === 'Project Manager';
  }

  canApprove() {
    const role = this.authService.currentUser()?.role;
    return role === 'Super Admin' || role === 'General Manager' || role === 'Operations Manager';
  }

  submitDAR(id: string) {
    this.workflowService.submitDAR(id);
    const updated = this.dars().find(d => d.id === id);
    if (updated) this.selectedDar.set(updated);
  }

  approveDAR(id: string) {
    const name = this.authService.currentUser()?.fullName || this.translate.instant('roles.Operations Manager');
    this.workflowService.approveDAR(id, name, this.translate.instant('workflow.dars.default_approve_comments'));
    const updated = this.dars().find(d => d.id === id);
    if (updated) this.selectedDar.set(updated);
  }

  rejectDAR(id: string) {
    const reason = prompt(this.translate.instant('workflow.dars.prompt_reject_remarks'));
    if (reason === null) return;
    const name = this.authService.currentUser()?.fullName || this.translate.instant('roles.Operations Manager');
    this.workflowService.rejectDAR(id, name, reason || this.translate.instant('workflow.dars.default_reject_remarks'));
    const updated = this.dars().find(d => d.id === id);
    if (updated) this.selectedDar.set(updated);
  }

  openCreateModal() {
    const activeContracts = this.contracts().filter(c => c.status === 'Active');
    const defaultContract = activeContracts.length > 0 ? activeContracts[0] : this.contracts()[0];
    this.isEditMode.set(false);
    this.editingDarId = '';
    this.formModel = {
      contractId: defaultContract?.id || '',
      contractNumber: defaultContract?.contractNumber || '',
      rigId: defaultContract?.rigId || '',
      rigName: defaultContract?.rigName || '',
      reportDate: new Date().toISOString().split('T')[0],
      shift: 'Day',
      preparedBy: this.authService.currentUser()?.fullName || this.translate.instant('workflow.dars.default_prepared_by'),
      operatingHours: 24, standbyHours: 0, repairHours: 0, downtimeHours: 0,
      totalHours: 24, fuelConsumption: 1200, fuelUnit: 'LITERS',
      materialsUsed: [{ id: `mat_${Date.now()}`, itemName: 'Drill collar lubricants', quantity: 2, uom: 'EA' }],
      activitiesPerformed: '',
      hseIncidents: this.translate.instant('workflow.dars.default_hse'),
      weatherConditions: this.translate.instant('workflow.dars.default_weather'),
      remarks: '', attachments: []
    };
    this.isModalOpen.set(true);
  }

  openEditModal(dar: DAR) {
    this.isEditMode.set(true);
    this.editingDarId = dar.id;
    this.formModel = JSON.parse(JSON.stringify(dar));
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  onContractChange() {
    const con = this.contracts().find(c => c.id === this.formModel.contractId);
    if (con) {
      this.formModel.contractNumber = con.contractNumber;
      this.formModel.rigId = con.rigId || '';
      this.formModel.rigName = con.rigName || '';
    }
  }

  addMaterialRow() {
    this.formModel.materialsUsed.push({ id: `mat_${Date.now()}`, itemName: '', quantity: 1, uom: 'EA' });
  }

  removeMaterialRow(index: number) { this.formModel.materialsUsed.splice(index, 1); }

  saveDAR() {
    const totalHours = Number(this.formModel.operatingHours) + Number(this.formModel.standbyHours) +
                       Number(this.formModel.repairHours) + Number(this.formModel.downtimeHours);
    if (totalHours !== 24) {
      alert(this.translate.instant('workflow.dars.alert_hours', { hours: totalHours }));
      return;
    }
    if (!this.formModel.activitiesPerformed) {
      alert(this.translate.instant('workflow.dars.alert_activities'));
      return;
    }
    this.formModel.totalHours = totalHours;
    if (this.isEditMode()) {
      this.workflowService.updateDAR(this.editingDarId, this.formModel);
      const updated = this.dars().find(d => d.id === this.editingDarId);
      if (updated) this.selectedDar.set(updated);
    } else {
      const created = this.workflowService.createDAR(this.formModel);
      this.selectedDar.set(created);
    }
    this.isModalOpen.set(false);
  }
}
