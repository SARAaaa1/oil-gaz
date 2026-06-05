import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { WCC, DAR, Contract, WCCLineItem } from '../../../shared/interfaces/workflow.interface';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-wccs',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './wccs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WccsComponent implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly wccs = this.workflowService.wccs;
  readonly dars = this.workflowService.dars;
  readonly contracts = this.workflowService.contracts;
  readonly selectedWcc = signal<WCC | null>(null);

  // Filters
  searchQuery = '';
  statusFilter = 'ALL';

  // Form Drawer states
  isModalOpen = signal(false);
  selectedContractId = '';
  selectedDarIds = new Set<string>();

  readonly activeContracts = computed(() =>
    this.contracts().filter(c => c.status === 'Active')
  );

  // Load DARs that are Approved AND not linked to any existing WCC for the selected contract
  readonly availableDars = computed(() => {
    const contractId = this.selectedContractId;
    if (!contractId) return [];

    // find all DARs belonging to this contract
    const contractDars = this.dars().filter(d => d.contractId === contractId && d.status === 'Approved');

    // find all DAR IDs already linked to existing WCCs
    const linkedDarIds = new Set<string>();
    this.wccs().forEach(w => w.darIds.forEach(id => linkedDarIds.add(id)));

    // filter contractDars that are NOT linked
    return contractDars.filter(d => !linkedDarIds.has(d.id));
  });

  // Preview WCC computation based on chosen DARs
  readonly previewLineItems = computed<WCCLineItem[]>(() => {
    const contractId = this.selectedContractId;
    if (!contractId || this.selectedDarIds.size === 0) return [];

    const contract = this.contracts().find(c => c.id === contractId);
    if (!contract) return [];

    const list: WCCLineItem[] = [];
    const selectedDarsList = this.dars().filter(d => this.selectedDarIds.has(d.id));

    // accumulate operating, standby, repair, downtime hours
    let opHours = 0;
    let standbyHours = 0;
    let repairHours = 0;
    let downtimeHours = 0;

    selectedDarsList.forEach(d => {
      opHours += d.operatingHours;
      standbyHours += d.standbyHours;
      repairHours += d.repairHours;
      downtimeHours += d.downtimeHours;
    });

    // 1. Operating Rate (converts total operating hours to days based on contract rate sheet)
    const opRateItem = contract.rateSheet.find(rs => rs.description.includes('Operation') || rs.unit === 'DAY');
    if (opRateItem) {
      const days = opHours / 24;
      const rate = opRateItem.rate;
      list.push({
        id: 'li_op',
        description: `Rig Daily Operation Rate (${days.toFixed(2)} Days)`,
        unit: 'DAY',
        quantity: days,
        rate,
        amount: Math.round(days * rate)
      });
    }

    // 2. Standby hourly rate
    const standbyRateItem = contract.rateSheet.find(rs => rs.description.includes('Standby') || rs.unit === 'HOUR');
    if (standbyRateItem && standbyHours > 0) {
      list.push({
        id: 'li_standby',
        description: `Drill Crew Technical Standby (${standbyHours} Hours)`,
        unit: 'HOUR',
        quantity: standbyHours,
        rate: standbyRateItem.rate,
        amount: Math.round(standbyHours * standbyRateItem.rate)
      });
    }

    // 3. Downtime penalty rate sheet item (usually a negative rate!)
    const downtimeRateItem = contract.rateSheet.find(rs => rs.description.includes('Downtime') || rs.description.includes('Penalty'));
    if (downtimeRateItem && downtimeHours > 0) {
      list.push({
        id: 'li_downtime',
        description: `Downtime Operational Penalty Clause (${downtimeHours} Hours)`,
        unit: 'HOUR',
        quantity: downtimeHours,
        rate: downtimeRateItem.rate,
        amount: Math.round(downtimeHours * downtimeRateItem.rate) // usually rate is negative e.g. -2000
      });
    }

    return list;
  });

  readonly computedSubtotal = computed(() =>
    this.previewLineItems().reduce((sum, item) => sum + item.amount, 0)
  );

  readonly computedOpHours = computed(() => {
    let op = 0;
    this.dars().filter(d => this.selectedDarIds.has(d.id)).forEach(d => op += d.operatingHours);
    return op;
  });

  readonly computedStandbyHours = computed(() => {
    let s = 0;
    this.dars().filter(d => this.selectedDarIds.has(d.id)).forEach(d => s += d.standbyHours);
    return s;
  });

  readonly computedPeriodFrom = computed(() => {
    const dates = this.dars().filter(d => this.selectedDarIds.has(d.id)).map(d => d.reportDate).sort();
    return dates.length > 0 ? dates[0] : '';
  });

  readonly computedPeriodTo = computed(() => {
    const dates = this.dars().filter(d => this.selectedDarIds.has(d.id)).map(d => d.reportDate).sort();
    return dates.length > 0 ? dates[dates.length - 1] : '';
  });

  readonly filteredWccs = computed(() => {
    let list = this.wccs();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;

    if (status !== 'ALL') {
      if (status === 'Draft') {
        list = list.filter(w => w.status === 'Draft' || w.status === 'Pending Approval');
      } else {
        list = list.filter(w => w.status === status);
      }
    }

    if (query) {
      list = list.filter(w =>
        w.wccNumber.toLowerCase().includes(query) ||
        w.clientName.toLowerCase().includes(query) ||
        w.contractNumber.toLowerCase().includes(query) ||
        (w.rigName && w.rigName.toLowerCase().includes(query))
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.wccs.breadcrumb') }
    ]);

    const list = this.filteredWccs();
    if (list.length > 0) {
      this.selectedWcc.set(list[0]);
    }
  }

  selectWcc(wcc: WCC) {
    this.selectedWcc.set(wcc);
  }

  // --- Permissions and Multi-stage gates ---
  canCreate() {
    const role = this.authService.currentUser()?.role;
    return role === 'Super Admin' || role === 'General Manager' || role === 'Operations Manager' || role === 'Project Manager';
  }

  canApproveStep(role: string) {
    const currentRole = this.authService.currentUser()?.role;
    if (currentRole === 'Super Admin') return true;
    return currentRole === role;
  }

  approveWccStep(wccId: string, role: string) {
    const name = this.authService.currentUser()?.fullName || 'Manager';
    this.workflowService.approveWCC(wccId, role, name, `Approved from ${role} checkpoint.`);

    // Refresh selected WCC
    const updated = this.wccs().find(w => w.id === wccId);
    if (updated) this.selectedWcc.set(updated);
  }

  rejectWccStep(wccId: string, role: string) {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    const name = this.authService.currentUser()?.fullName || 'Manager';
    this.workflowService.rejectWCC(wccId, role, name, reason || 'Re-verification of mud log required.');

    const updated = this.wccs().find(w => w.id === wccId);
    if (updated) this.selectedWcc.set(updated);
  }

  // --- Form Modal actions ---
  openCreateModal() {
    this.selectedContractId = '';
    this.selectedDarIds.clear();
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onContractChange() {
    this.selectedDarIds.clear();
  }

  toggleDarSelection(id: string) {
    if (this.selectedDarIds.has(id)) {
      this.selectedDarIds.delete(id);
    } else {
      this.selectedDarIds.add(id);
    }
  }

  saveWCC() {
    if (!this.selectedContractId || this.selectedDarIds.size === 0) return;

    const contract = this.contracts().find(c => c.id === this.selectedContractId);
    if (!contract) return;

    const selectedDarsList = this.dars().filter(d => this.selectedDarIds.has(d.id));
    const darNumbers = selectedDarsList.map(d => d.darNumber);

    this.workflowService.createWCC({
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      clientName: contract.clientName,
      rigName: contract.rigName || 'Rig Alpha (Offshore)',
      periodFrom: this.computedPeriodFrom(),
      periodTo: this.computedPeriodTo(),
      darIds: Array.from(this.selectedDarIds),
      darNumbers,
      lineItems: this.previewLineItems(),
      subtotal: this.computedSubtotal(),
      totalOperatingHours: this.computedOpHours(),
      totalStandbyHours: this.computedStandbyHours(),
      preparedBy: this.authService.currentUser()?.fullName || 'Contracts specialist'
    });

    this.isModalOpen.set(false);

    // Select the new WCC (last in the list)
    const list = this.wccs();
    if (list.length > 0) {
      this.selectedWcc.set(list[list.length - 1]);
    }
  }
}
