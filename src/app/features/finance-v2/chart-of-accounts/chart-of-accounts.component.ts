import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { FinanceV2MockService } from '../shared/finance-v2-mock.service';
import { CoaAccount, AccountType, AccountStatus } from '../shared/finance-v2.interfaces';

@Component({
  selector: 'app-finv2-chart-of-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chart-of-accounts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2ChartOfAccountsComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly langService = inject(LanguageService);
  readonly mockService = inject(FinanceV2MockService);

  // ── UI State ──────────────────────────────────────────────────────
  readonly searchQuery = signal<string>('');
  readonly typeFilter = signal<string>('All');
  readonly statusFilter = signal<string>('All');
  readonly showModal = signal<boolean>(false);
  readonly editingAccount = signal<CoaAccount | null>(null);
  readonly expandedCodes = signal<Set<string>>(new Set(['1000','1100','1120','2000','2100']));

  // ── Form State ────────────────────────────────────────────────────
  formCode = '';
  formNameEn = '';
  formNameAr = '';
  formType: AccountType = 'Asset';
  formParentCode = '';
  formCurrency = 'SAR';
  formStatus: AccountStatus = 'Active';
  formAllowManual = true;
  formRequiresCostCenter = false;
  formIsReconciliation = false;
  formIsConfidential = false;

  // ── Stats ──────────────────────────────────────────────────────────
  readonly stats = computed(() => {
    const accounts = this.mockService.accounts();
    return {
      total: accounts.length,
      active: accounts.filter(a => a.status === 'Active').length,
      assets: accounts.filter(a => a.type === 'Asset').length,
      liabilities: accounts.filter(a => a.type === 'Liability').length,
      equity: accounts.filter(a => a.type === 'Equity').length,
      revenue: accounts.filter(a => a.type === 'Revenue').length,
      expenses: accounts.filter(a => a.type === 'Expense').length,
    };
  });

  // ── Tree rendering ─────────────────────────────────────────────────
  readonly flatTree = computed(() => {
    const all = this.mockService.accounts();
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.typeFilter();
    const status = this.statusFilter();
    const expanded = this.expandedCodes();

    // Build parent → children map
    const childrenMap = new Map<string | null, CoaAccount[]>();
    for (const acc of all) {
      const key = acc.parentCode ?? null;
      if (!childrenMap.has(key)) childrenMap.set(key, []);
      childrenMap.get(key)!.push(acc);
    }

    // Search mode: flatten everything visible
    if (query || type !== 'All' || status !== 'All') {
      return all.filter(a => {
        const matchQuery = !query ||
          a.code.toLowerCase().includes(query) ||
          a.nameEn.toLowerCase().includes(query) ||
          a.nameAr.includes(query);
        const matchType = type === 'All' || a.type === type;
        const matchStatus = status === 'All' || a.status === status;
        return matchQuery && matchType && matchStatus;
      }).sort((a, b) => a.code.localeCompare(b.code));
    }

    // Tree mode: DFS respecting expanded state
    const result: CoaAccount[] = [];
    const traverse = (parentCode: string | null) => {
      const children = childrenMap.get(parentCode) ?? [];
      children.sort((a, b) => a.code.localeCompare(b.code));
      for (const child of children) {
        result.push(child);
        if (expanded.has(child.code)) {
          traverse(child.code);
        }
      }
    };
    traverse(null);
    return result;
  });

  // Check if account has children
  hasChildren(code: string): boolean {
    return this.mockService.accounts().some(a => a.parentCode === code);
  }

  isExpanded(code: string): boolean {
    return this.expandedCodes().has(code);
  }

  toggleExpand(code: string) {
    this.expandedCodes.update(set => {
      const next = new Set(set);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

  expandAll() {
    const codes = new Set(this.mockService.accounts().map(a => a.code));
    this.expandedCodes.set(codes);
  }

  collapseAll() {
    this.expandedCodes.set(new Set());
  }

  // ── Type helpers ───────────────────────────────────────────────────
  getTypeClass(type: AccountType): string {
    switch (type) {
      case 'Asset': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Liability': return 'bg-red-50 text-red-700 border-red-200';
      case 'Equity': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Revenue': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Expense': return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  }

  getTypeKey(type: AccountType): string {
    return `finance_v2.coa.type_${type.toLowerCase()}`;
  }

  getLevelIndent(level: number): number {
    return (level - 1) * 20;
  }

  // ── CRUD ───────────────────────────────────────────────────────────
  openAddModal(parentCode?: string) {
    this.editingAccount.set(null);
    this.formCode = '';
    this.formNameEn = '';
    this.formNameAr = '';
    this.formType = 'Asset';
    this.formParentCode = parentCode ?? '';
    this.formCurrency = 'SAR';
    this.formStatus = 'Active';
    this.formAllowManual = true;
    this.formRequiresCostCenter = false;
    this.formIsReconciliation = false;
    this.formIsConfidential = false;
    this.showModal.set(true);
  }

  openEditModal(account: CoaAccount) {
    this.editingAccount.set(account);
    this.formCode = account.code;
    this.formNameEn = account.nameEn;
    this.formNameAr = account.nameAr;
    this.formType = account.type;
    this.formParentCode = account.parentCode ?? '';
    this.formCurrency = account.currency;
    this.formStatus = account.status;
    this.formAllowManual = account.allowManualEntries;
    this.formRequiresCostCenter = account.requiresCostCenter;
    this.formIsReconciliation = account.isReconciliation;
    this.formIsConfidential = account.isConfidential;
    this.showModal.set(true);
  }

  saveAccount() {
    const editing = this.editingAccount();
    if (!this.formCode || !this.formNameEn) {
      this.notificationService.warning('finance_v2.coa.error_required', 'finance_v2.coa.error_required_desc');
      return;
    }
    const accounts = this.mockService.accounts();
    const existing = accounts.find(a => a.code === this.formCode && a.id !== editing?.id);
    if (existing) {
      this.notificationService.warning('finance_v2.coa.error_duplicate', 'finance_v2.coa.error_duplicate_desc');
      return;
    }
    if (editing) {
      this.mockService.accounts.update(list =>
        list.map(a => a.id === editing.id ? {
          ...a,
          code: this.formCode, nameEn: this.formNameEn, nameAr: this.formNameAr,
          type: this.formType, parentCode: this.formParentCode || null,
          currency: this.formCurrency, status: this.formStatus,
          allowManualEntries: this.formAllowManual,
          requiresCostCenter: this.formRequiresCostCenter,
          isReconciliation: this.formIsReconciliation,
          isConfidential: this.formIsConfidential
        } : a)
      );
      this.notificationService.success('finance_v2.common.saved', 'finance_v2.coa.saved_desc');
    } else {
      const newAcc: CoaAccount = {
        id: 'acc-' + Date.now(),
        code: this.formCode, nameEn: this.formNameEn, nameAr: this.formNameAr,
        type: this.formType, parentCode: this.formParentCode || null,
        level: 1, currency: this.formCurrency, status: this.formStatus,
        allowManualEntries: this.formAllowManual,
        requiresCostCenter: this.formRequiresCostCenter,
        isReconciliation: this.formIsReconciliation,
        isConfidential: this.formIsConfidential,
        balance: 0
      };
      this.mockService.accounts.update(list => [...list, newAcc]);
      this.notificationService.success('finance_v2.common.saved', 'finance_v2.coa.added_desc');
    }
    this.showModal.set(false);
  }

  toggleStatus(account: CoaAccount) {
    this.mockService.accounts.update(list =>
      list.map(a => a.id === account.id
        ? { ...a, status: a.status === 'Active' ? 'Inactive' : 'Active' }
        : a)
    );
    this.notificationService.success('finance_v2.common.saved', 'finance_v2.coa.status_updated');
  }

  closeModal() { this.showModal.set(false); }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.coa.title' }
    ]);
  }

  // Parent account options (excludes self and descendants during edit)
  readonly parentOptions = computed(() => {
    const editing = this.editingAccount();
    const accounts = this.mockService.accounts();
    if (!editing) return accounts;
    const excluded = new Set<string>([editing.code]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const a of accounts) {
        if (a.parentCode && excluded.has(a.parentCode) && !excluded.has(a.code)) {
          excluded.add(a.code); changed = true;
        }
      }
    }
    return accounts.filter(a => !excluded.has(a.code));
  });

  readonly accountTypes: AccountType[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];
  readonly currencies = ['SAR', 'USD', 'EUR', 'GBP'];
}
