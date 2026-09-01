import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { FinanceV2MockService } from '../shared/finance-v2-mock.service';
import { CostCenter, CostCenterStatus, AccountBranch } from '../shared/finance-v2.interfaces';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { CostCenterStoreService } from '../../../core/services/cost-center-store.service';

// ── Branch virtual node for tree rendering ───────────────────────────────────
export interface BranchNode {
  isBranchHeader: true;
  branch: AccountBranch;
}
export type CcTreeRow = CostCenter | BranchNode;

@Component({
  selector: 'app-finv2-cost-centers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './cost-centers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2CostCentersComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly langService = inject(LanguageService);
  readonly mockService = inject(FinanceV2MockService);
  private readonly financeApi = inject(FinanceApiService);
  private readonly costCenterStore = inject(CostCenterStoreService);

  // ── UI State ──────────────────────────────────────────────────────
  readonly searchQuery  = signal<string>('');
  readonly statusFilter = signal<string>('All');
  readonly typeFilter   = signal<string>('All');
  readonly branchFilter = signal<AccountBranch | 'All'>('All');
  readonly showModal    = signal<boolean>(false);
  readonly editingCC    = signal<CostCenter | null>(null);

  // Independent expand sets per branch
  readonly expandedCodesHO = signal<Set<string>>(new Set(['CC-100', 'CC-110']));
  readonly expandedCodesFZ = signal<Set<string>>(new Set(['FZ-CC-100', 'FZ-CC-110']));

  // Branch section collapse
  readonly branchCollapsedHO = signal<boolean>(false);
  readonly branchCollapsedFZ = signal<boolean>(false);

  // ── Form ──────────────────────────────────────────────────────────
  formCode   = '';
  formNameEn = '';
  formNameAr = '';
  formType: CostCenter['type'] = 'Project';
  formParentCode = '';
  formManager    = '';
  formStatus: CostCenterStatus = 'Active';
  formBudget     = 0;
  formBranch: AccountBranch = 'HeadOffice';

  // ── Stats Cards (branch-scoped) ────────────────────────────────────
  readonly stats = computed(() => {
    const all    = this.mockService.costCenters();
    const branch = this.branchFilter();
    const list   = branch === 'All' ? all : all.filter(c => c.branch === branch);
    const totalBudget = list.reduce((s, c) => s + c.budget, 0);
    const totalSpent  = list.reduce((s, c) => s + c.spent, 0);
    return {
      total: list.length,
      active: list.filter(c => c.status === 'Active').length,
      inactive: list.filter(c => c.status !== 'Active').length,
      totalBudget,
      totalSpent,
      utilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
    };
  });

  // ── Branch-aware flat tree ─────────────────────────────────────────
  readonly flatTree = computed((): CcTreeRow[] => {
    const all       = this.mockService.costCenters();
    const query     = this.searchQuery().toLowerCase().trim();
    const status    = this.statusFilter();
    const type      = this.typeFilter();
    const branchSel = this.branchFilter();

    // Search / filter mode: flat list, no branch headers
    if (query || status !== 'All' || type !== 'All') {
      return all.filter(c => {
        const matchBranch = branchSel === 'All' || c.branch === branchSel;
        const matchQuery  = !query
          || c.code.toLowerCase().includes(query)
          || c.nameEn.toLowerCase().includes(query)
          || c.nameAr.includes(query)
          || c.manager.toLowerCase().includes(query);
        const matchStatus = status === 'All' || c.status === status;
        const matchType   = type   === 'All' || c.type   === type;
        return matchBranch && matchQuery && matchStatus && matchType;
      });
    }

    // Tree mode: render HO section + FZ section
    const result: CcTreeRow[] = [];

    const renderBranch = (branch: AccountBranch) => {
      const branchCCs = all.filter(c => c.branch === branch);

      const childrenMap = new Map<string | null, CostCenter[]>();
      for (const cc of branchCCs) {
        const key = cc.parentCode ?? null;
        if (!childrenMap.has(key)) childrenMap.set(key, []);
        childrenMap.get(key)!.push(cc);
      }

      const expandedSet = branch === 'HeadOffice' ? this.expandedCodesHO() : this.expandedCodesFZ();
      const collapsed   = branch === 'HeadOffice' ? this.branchCollapsedHO() : this.branchCollapsedFZ();

      result.push({ isBranchHeader: true, branch });
      if (collapsed) return;

      const traverse = (parentCode: string | null) => {
        const children = (childrenMap.get(parentCode) ?? [])
          .sort((a, b) => a.code.localeCompare(b.code));
        for (const child of children) {
          result.push(child);
          if (expandedSet.has(child.code)) traverse(child.code);
        }
      };
      traverse(null);
    };

    const branches: AccountBranch[] = branchSel === 'All'
      ? ['HeadOffice', 'FreeZone']
      : [branchSel];
    for (const b of branches) renderBranch(b);

    return result;
  });

  // ── Type guards ────────────────────────────────────────────────────
  isBranchHeader(row: CcTreeRow): row is BranchNode {
    return (row as BranchNode).isBranchHeader === true;
  }
  isCC(row: CcTreeRow): row is CostCenter {
    return !(row as BranchNode).isBranchHeader;
  }

  // ── Expand / Collapse ───────────────────────────────────────────────
  hasChildren(code: string): boolean {
    return this.mockService.costCenters().some(c => c.parentCode === code);
  }
  isExpanded(code: string, branch: AccountBranch): boolean {
    const set = branch === 'HeadOffice' ? this.expandedCodesHO() : this.expandedCodesFZ();
    return set.has(code);
  }
  toggleExpand(code: string, branch: AccountBranch) {
    const sig = branch === 'HeadOffice' ? this.expandedCodesHO : this.expandedCodesFZ;
    sig.update(set => {
      const next = new Set(set);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }
  toggleBranchCollapse(branch: AccountBranch) {
    if (branch === 'HeadOffice') this.branchCollapsedHO.update(v => !v);
    else                         this.branchCollapsedFZ.update(v => !v);
  }
  isBranchCollapsed(branch: AccountBranch): boolean {
    return branch === 'HeadOffice' ? this.branchCollapsedHO() : this.branchCollapsedFZ();
  }

  expandAll() {
    const all = this.mockService.costCenters();
    this.expandedCodesHO.set(new Set(all.filter(c => c.branch === 'HeadOffice').map(c => c.code)));
    this.expandedCodesFZ.set(new Set(all.filter(c => c.branch === 'FreeZone').map(c => c.code)));
    this.branchCollapsedHO.set(false);
    this.branchCollapsedFZ.set(false);
  }
  collapseAll() {
    this.expandedCodesHO.set(new Set());
    this.expandedCodesFZ.set(new Set());
  }

  getLevelIndent(level: number): number { return (level - 1) * 24; }

  // ── Branch badge helpers ────────────────────────────────────────────
  getBranchHeaderClass(branch: AccountBranch): string {
    return branch === 'HeadOffice' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-teal-600 hover:bg-teal-700';
  }
  getBranchBadgeClass(branch: AccountBranch): string {
    return branch === 'HeadOffice'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : 'bg-teal-50 text-teal-700 border-teal-200';
  }

  // ── Utilization helpers ────────────────────────────────────────────
  getUtilization(cc: CostCenter): number {
    return cc.budget > 0 ? Math.round((cc.spent / cc.budget) * 100) : 0;
  }
  getUtilizationClass(pct: number): string {
    if (pct > 95) return 'bg-red-500';
    if (pct > 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  }
  getUtilizationTextClass(pct: number): string {
    if (pct > 95) return 'text-red-600';
    if (pct > 80) return 'text-amber-600';
    return 'text-emerald-600';
  }

  formatAmount(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'K';
    return v.toString();
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'Project':        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Department':     return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Overhead':       return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Administrative': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }
  getTypeKey(type: string): string { return `finance_v2.cost_centers.type_${type.toLowerCase()}`; }

  getStatusClass(s: string): string {
    switch (s) {
      case 'Active':    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Inactive':  return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'Suspended': return 'bg-red-50 text-red-600 border-red-200';
      default: return '';
    }
  }

  // ── CRUD ───────────────────────────────────────────────────────────
  openAddModal(parentCode?: string, defaultBranch?: AccountBranch) {
    this.editingCC.set(null);
    this.formCode = ''; this.formNameEn = ''; this.formNameAr = '';
    this.formType = 'Project'; this.formParentCode = parentCode ?? '';
    this.formManager = ''; this.formStatus = 'Active'; this.formBudget = 0;
    this.formBranch = defaultBranch
      ?? (this.branchFilter() !== 'All' ? this.branchFilter() as AccountBranch : 'HeadOffice');
    this.showModal.set(true);
  }

  openEditModal(cc: CostCenter) {
    this.editingCC.set(cc);
    this.formCode = cc.code; this.formNameEn = cc.nameEn; this.formNameAr = cc.nameAr;
    this.formType = cc.type; this.formParentCode = cc.parentCode ?? '';
    this.formManager = cc.manager; this.formStatus = cc.status;
    this.formBudget = cc.budget; this.formBranch = cc.branch;
    this.showModal.set(true);
  }

  saveCC() {
    if (!this.formCode || !this.formNameEn) {
      this.notificationService.warning('finance_v2.common.error', 'finance_v2.cost_centers.error_required');
      return;
    }
    const editing = this.editingCC();
    const list = this.mockService.costCenters();
    const duplicate = list.find(c => c.code === this.formCode && c.id !== editing?.id);
    if (duplicate) {
      this.notificationService.warning('finance_v2.common.error', 'finance_v2.cost_centers.error_duplicate');
      return;
    }
    // Calculate dynamic level based on selected parent
    let calcLevel = 1;
    if (this.formParentCode) {
      const parentNode = list.find(c => c.code === this.formParentCode);
      calcLevel = parentNode ? (parentNode.level + 1) : 2;
    }

    const payload: any = {
      code: this.formCode,
      name: this.formNameEn,
      nameEn: this.formNameEn,
      nameAr: this.formNameAr || this.formNameEn,
      type: this.formType,
      parentCode: this.formParentCode || null,
      level: calcLevel,
      manager: this.formManager,
      status: this.formStatus,
      budget: Number(this.formBudget),
      branch: this.formBranch
    };

    if (editing) {
      this.financeApi.updateCostCenter(editing.code, payload).subscribe({
        next: () => {
          this.costCenterStore.refreshCostCenters();
          this.notificationService.success('finance_v2.common.saved', 'finance_v2.cost_centers.saved_desc');
        },
        error: (err) => {
          // Fallback update
          this.mockService.costCenters.update(arr =>
            arr.map(c => c.id === editing.id ? { ...c, ...payload } : c)
          );
          this.notificationService.success('finance_v2.common.saved', 'finance_v2.cost_centers.saved_desc');
        }
      });
    } else {
      this.financeApi.createCostCenter(payload).subscribe({
        next: () => {
          this.costCenterStore.refreshCostCenters();
          this.notificationService.success('finance_v2.common.saved', 'finance_v2.cost_centers.added_desc');
        },
        error: (err) => {
          // Fallback update
          const newCC: CostCenter = {
            id: 'cc-' + Date.now(),
            code: this.formCode, nameEn: this.formNameEn, nameAr: this.formNameAr || this.formNameEn,
            type: this.formType, parentCode: this.formParentCode || null,
            level: calcLevel, manager: this.formManager, status: this.formStatus,
            budget: Number(this.formBudget), spent: 0, childrenCount: 0,
            branch: this.formBranch
          };
          this.mockService.costCenters.update(arr => [...arr, newCC]);
          this.notificationService.success('finance_v2.common.saved', 'finance_v2.cost_centers.added_desc');
        }
      });
    }
    this.showModal.set(false);
  }

  toggleStatus(cc: CostCenter) {
    const next: CostCenterStatus = cc.status === 'Active' ? 'Inactive' : 'Active';
    this.financeApi.toggleCostCenterStatus(cc.code).subscribe({
      next: (res) => {
        const newStatus = (res?.status ?? next) as CostCenterStatus;
        this.mockService.costCenters.update(arr =>
          arr.map(c => c.id === cc.id ? { ...c, status: newStatus } : c)
        );
        this.notificationService.success('finance_v2.common.saved', 'finance_v2.cost_centers.status_updated');
      },
      error: () => {
        this.mockService.costCenters.update(arr =>
          arr.map(c => c.id === cc.id ? { ...c, status: next } : c)
        );
        this.notificationService.success('finance_v2.common.saved', 'finance_v2.cost_centers.status_updated');
      }
    });
  }

  closeModal() { this.showModal.set(false); }

  readonly parentOptions = computed(() => {
    const editing = this.editingCC();
    const branch  = this.formBranch;
    const all     = this.mockService.costCenters().filter(c => c.branch === branch);
    if (!editing) return all;
    const excl = new Set([editing.code]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of all) {
        if (c.parentCode && excl.has(c.parentCode) && !excl.has(c.code)) {
          excl.add(c.code); changed = true;
        }
      }
    }
    return all.filter(c => !excl.has(c.code));
  });

  readonly ccTypes: CostCenter['type'][] = ['Project', 'Department', 'Overhead', 'Administrative'];
  readonly ccStatuses: CostCenterStatus[] = ['Active', 'Inactive', 'Suspended'];
  readonly branches: AccountBranch[] = ['HeadOffice', 'FreeZone'];

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.cost_centers.title' }
    ]);
    // Load real cost centers from API
    this.financeApi.getCostCenters({ limit: 200 }).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          const mapped: CostCenter[] = res.data.map((c: any) => ({
            id: c.id ?? c._id,
            code: c.code, nameEn: c.nameEn, nameAr: c.nameAr ?? '',
            type: c.type ?? 'Department',
            parentCode: c.parentCode ?? null, level: c.level ?? 1,
            manager: c.manager ?? '', status: c.status ?? 'Active',
            budget: c.budget ?? 0, spent: c.spent ?? 0,
            childrenCount: c.childrenCount ?? 0,
            branch: c.branch ?? 'HeadOffice'
          }));
          this.mockService.costCenters.set(mapped);
        }
      },
      error: () => {} // Keep mock data
    });
  }
}
