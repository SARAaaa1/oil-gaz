import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { FinanceV2MockService } from '../shared/finance-v2-mock.service';
import { CostCenter, CostCenterStatus } from '../shared/finance-v2.interfaces';

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

  // ── UI State ──────────────────────────────────────────────────────
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('All');
  readonly typeFilter = signal<string>('All');
  readonly showModal = signal<boolean>(false);
  readonly editingCC = signal<CostCenter | null>(null);
  readonly expandedCodes = signal<Set<string>>(new Set(['CC-100', 'CC-110', 'CC-200']));

  // ── Form ──────────────────────────────────────────────────────────
  formCode = '';
  formNameEn = '';
  formNameAr = '';
  formType: CostCenter['type'] = 'Project';
  formParentCode = '';
  formManager = '';
  formStatus: CostCenterStatus = 'Active';
  formBudget = 0;

  // ── Stats Cards ────────────────────────────────────────────────────
  readonly stats = computed(() => {
    const list = this.mockService.costCenters();
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

  // ── Tree rendering ─────────────────────────────────────────────────
  readonly flatTree = computed(() => {
    const all = this.mockService.costCenters();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const type = this.typeFilter();
    const expanded = this.expandedCodes();

    // Search / filter: flatten
    if (query || status !== 'All' || type !== 'All') {
      return all.filter(c => {
        const matchQuery = !query ||
          c.code.toLowerCase().includes(query) ||
          c.nameEn.toLowerCase().includes(query) ||
          c.nameAr.includes(query) ||
          c.manager.toLowerCase().includes(query);
        const matchStatus = status === 'All' || c.status === status;
        const matchType   = type   === 'All' || c.type   === type;
        return matchQuery && matchStatus && matchType;
      });
    }

    // Tree mode: DFS
    const childrenMap = new Map<string | null, CostCenter[]>();
    for (const cc of all) {
      const key = cc.parentCode ?? null;
      if (!childrenMap.has(key)) childrenMap.set(key, []);
      childrenMap.get(key)!.push(cc);
    }
    const result: CostCenter[] = [];
    const traverse = (parentCode: string | null) => {
      const children = childrenMap.get(parentCode) ?? [];
      children.sort((a, b) => a.code.localeCompare(b.code));
      for (const child of children) {
        result.push(child);
        if (expanded.has(child.code)) traverse(child.code);
      }
    };
    traverse(null);
    return result;
  });

  hasChildren(code: string): boolean {
    return this.mockService.costCenters().some(c => c.parentCode === code);
  }
  isExpanded(code: string): boolean { return this.expandedCodes().has(code); }
  toggleExpand(code: string) {
    this.expandedCodes.update(s => { const n = new Set(s); n.has(code) ? n.delete(code) : n.add(code); return n; });
  }
  expandAll()   { this.expandedCodes.set(new Set(this.mockService.costCenters().map(c => c.code))); }
  collapseAll() { this.expandedCodes.set(new Set()); }

  getLevelIndent(level: number): number { return (level - 1) * 24; }

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
  openAddModal(parentCode?: string) {
    this.editingCC.set(null);
    this.formCode = ''; this.formNameEn = ''; this.formNameAr = '';
    this.formType = 'Project'; this.formParentCode = parentCode ?? '';
    this.formManager = ''; this.formStatus = 'Active'; this.formBudget = 0;
    this.showModal.set(true);
  }

  openEditModal(cc: CostCenter) {
    this.editingCC.set(cc);
    this.formCode = cc.code; this.formNameEn = cc.nameEn; this.formNameAr = cc.nameAr;
    this.formType = cc.type; this.formParentCode = cc.parentCode ?? '';
    this.formManager = cc.manager; this.formStatus = cc.status; this.formBudget = cc.budget;
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
    if (editing) {
      this.mockService.costCenters.update(arr =>
        arr.map(c => c.id === editing.id ? {
          ...c,
          code: this.formCode, nameEn: this.formNameEn, nameAr: this.formNameAr,
          type: this.formType, parentCode: this.formParentCode || null,
          manager: this.formManager, status: this.formStatus, budget: Number(this.formBudget)
        } : c)
      );
      this.notificationService.success('finance_v2.common.saved', 'finance_v2.cost_centers.saved_desc');
    } else {
      const newCC: CostCenter = {
        id: 'cc-' + Date.now(),
        code: this.formCode, nameEn: this.formNameEn, nameAr: this.formNameAr,
        type: this.formType, parentCode: this.formParentCode || null,
        level: 1, manager: this.formManager, status: this.formStatus,
        budget: Number(this.formBudget), spent: 0, childrenCount: 0
      };
      this.mockService.costCenters.update(arr => [...arr, newCC]);
      this.notificationService.success('finance_v2.common.saved', 'finance_v2.cost_centers.added_desc');
    }
    this.showModal.set(false);
  }

  toggleStatus(cc: CostCenter) {
    const next: CostCenterStatus = cc.status === 'Active' ? 'Inactive' : 'Active';
    this.mockService.costCenters.update(arr =>
      arr.map(c => c.id === cc.id ? { ...c, status: next } : c)
    );
    this.notificationService.success('finance_v2.common.saved', 'finance_v2.cost_centers.status_updated');
  }

  closeModal() { this.showModal.set(false); }

  readonly parentOptions = computed(() => {
    const editing = this.editingCC();
    const all = this.mockService.costCenters();
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

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.cost_centers.title' }
    ]);
  }
}
