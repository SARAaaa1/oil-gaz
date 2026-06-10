import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '../../../core/services/workflow.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { RoleDirective } from '../../../shared/directives/role.directive';
import { CostCenter } from '../../../shared/interfaces/project.interface';

@Component({
  selector: 'app-cost-centers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RoleDirective],
  templateUrl: './cost-centers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CostCentersComponent implements OnInit {
  readonly workflowService = inject(WorkflowService);
  private readonly notificationService = inject(NotificationService);
  readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);

  // Search & Filter State
  readonly searchQuery = signal<string>('');
  readonly typeFilter = signal<string>('All');
  readonly statusFilter = signal<string>('All');

  // Modal State
  readonly showModal = signal<boolean>(false);
  readonly editingCostCenter = signal<CostCenter | null>(null);

  // Form State
  formCode = '';
  formName = '';
  formType: CostCenter['type'] = 'Project';
  formParentCode = '';
  formStatus: CostCenter['status'] = 'Active';
  formDescription = '';

  // Options for Parent Cost Center Selection
  readonly availableParentOptions = computed(() => {
    const list = this.workflowService.costCenters();
    const editing = this.editingCostCenter();
    if (!editing) return list;
    // Prevent selecting self or children as parent to avoid cycles
    return list.filter(cc => cc.code !== editing.code && cc.parentCode !== editing.code);
  });

  // Calculate Rollup Aggregates (Budget, Spent, Remaining, Associated Projects)
  readonly costCenterAggregates = computed(() => {
    const ccs = this.workflowService.costCenters();
    const projs = this.workflowService.projects();
    const mats = this.workflowService.materialConsumptions();
    const labor = this.workflowService.laborRecords();
    const transfers = this.workflowService.equipmentTransfers();

    return ccs.map(cc => {
      // Find projects associated with this cost center
      const associatedProjects = projs.filter(p => p.costCenterCode === cc.code);
      const projectCodes = associatedProjects.map(p => p.code);

      // Sum project contract value (as budget)
      const totalBudget = associatedProjects.reduce((sum, p) => sum + p.contractValue, 0);

      // Calculate materials consumed
      const materialCost = mats
        .filter(m => m.costCenterCode === cc.code || projectCodes.includes(m.projectCode))
        .reduce((sum, m) => sum + (m.consumedQuantity * m.unitPrice), 0);

      // Calculate labor cost
      const laborCost = labor
        .filter(l => projectCodes.includes(l.projectCode))
        .reduce((sum, l) => sum + l.totalCost, 0);

      // Calculate transfer cost
      const transferCost = transfers
        .filter(t => t.costCenterCode === cc.code || projectCodes.includes(t.projectCode))
        .reduce((sum, t) => sum + t.transportationCost, 0);

      const totalSpent = materialCost + laborCost + transferCost;
      const remaining = totalBudget - totalSpent;

      return {
        ...cc,
        projectsCount: associatedProjects.length,
        totalBudget,
        totalSpent,
        remaining,
        materialCost,
        laborCost,
        transferCost
      };
    });
  });

  // Filtered & Tree-ordered List of Cost Centers
  readonly hierarchicalCostCenters = computed(() => {
    const list = this.costCenterAggregates();
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.typeFilter();
    const status = this.statusFilter();

    // First filter by query and dropdowns
    const filtered = list.filter(cc => {
      const matchesQuery = !query || cc.code.toLowerCase().includes(query) || cc.name.toLowerCase().includes(query) || (cc.description || '').toLowerCase().includes(query);
      const matchesType = type === 'All' || cc.type === type;
      const matchesStatus = status === 'All' || cc.status === status;
      return matchesQuery && matchesType && matchesStatus;
    });

    // If active filters exist, return flat list; otherwise build hierarchical tree view
    if (query || type !== 'All' || status !== 'All') {
      return filtered.map(item => ({ ...item, level: 0 }));
    }

    // Build hierarchy
    const roots = filtered.filter(cc => !cc.parentCode || !filtered.some(p => p.code === cc.parentCode));
    const result: Array<any & { level: number }> = [];

    const addChildren = (parentCode: string, level: number) => {
      const children = filtered.filter(cc => cc.parentCode === parentCode);
      for (const child of children) {
        result.push({ ...child, level });
        addChildren(child.code, level + 1);
      }
    };

    for (const root of roots) {
      result.push({ ...root, level: 0 });
      addChildren(root.code, 1);
    }

    return result;
  });

  // Computed Financial Totals across all filtered cost centers
  readonly financeTotals = computed(() => {
    const list = this.hierarchicalCostCenters();
    let totalBudget = 0;
    let totalSpent = 0;
    let projectsCount = 0;

    // Only sum unique projects to avoid double counting from parent-child relationships
    const uniqueProjectCodes = new Set<string>();
    this.workflowService.projects().forEach(p => uniqueProjectCodes.add(p.code));

    list.forEach(cc => {
      // If flat level, add to avoid repeating sub-nodes
      if (cc.level === 0) {
        totalBudget += cc.totalBudget || 0;
        totalSpent += cc.totalSpent || 0;
      }
      projectsCount += cc.projectsCount || 0;
    });

    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      projectsCount
    };
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.cost_centers', url: '/finance/cost-centers' }
    ]);
  }

  // --- MODAL ACTIONS ---
  openCreateModal() {
    this.editingCostCenter.set(null);
    this.formCode = '';
    this.formName = '';
    this.formType = 'Project';
    this.formParentCode = '';
    this.formStatus = 'Active';
    this.formDescription = '';
    this.showModal.set(true);
  }

  openEditModal(cc: CostCenter) {
    this.editingCostCenter.set(cc);
    this.formCode = cc.code;
    this.formName = cc.name;
    this.formType = cc.type;
    this.formParentCode = cc.parentCode || '';
    this.formStatus = cc.status;
    this.formDescription = cc.description || '';
    this.showModal.set(true);
  }

  saveCostCenter() {
    if (!this.formCode.trim() || !this.formName.trim()) {
      this.notificationService.danger('Validation Error', 'Please specify a Cost Center Code and Name.');
      return;
    }

    const ccData: CostCenter = {
      code: this.formCode.trim().toUpperCase(),
      name: this.formName.trim(),
      type: this.formType,
      parentCode: this.formParentCode || undefined,
      status: this.formStatus,
      description: this.formDescription.trim() || undefined
    };

    const isEdit = this.editingCostCenter() !== null;

    if (isEdit) {
      this.workflowService.updateCostCenter(this.formCode, ccData);
      this.notificationService.success('Success', `Cost center ${ccData.code} updated successfully.`);
    } else {
      // Check for uniqueness
      const exists = this.workflowService.costCenters().some(c => c.code === ccData.code);
      if (exists) {
        this.notificationService.danger('Duplicate Error', `Cost Center with code ${ccData.code} already exists.`);
        return;
      }
      this.workflowService.createCostCenter(ccData);
      this.notificationService.success('Success', `Cost center ${ccData.code} created successfully.`);
    }

    this.showModal.set(false);
  }

  deleteCostCenter(cc: CostCenter) {
    if (confirm(`Are you sure you want to delete Cost Center "${cc.name}" (${cc.code})?`)) {
      this.workflowService.deleteCostCenter(cc.code);
      this.notificationService.success('Success', `Cost center ${cc.code} deleted successfully.`);
    }
  }

  toggleStatus(cc: CostCenter) {
    const newStatus = cc.status === 'Active' ? 'Inactive' : 'Active';
    this.workflowService.updateCostCenter(cc.code, { status: newStatus });
    this.notificationService.success('Status Updated', `Cost Center ${cc.code} is now ${newStatus}.`);
  }
}
