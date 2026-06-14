import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RoleDirective } from '../../../shared/directives/role.directive';
import { ChartOfAccount, AccountType } from '../../../shared/interfaces/finance.interface';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RoleDirective],
  templateUrl: './chart-of-accounts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartOfAccountsComponent implements OnInit {
  readonly financeService = inject(FinanceCoreService);
  private readonly notificationService = inject(NotificationService);
  readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  // Search & Filter State
  readonly searchQuery = signal<string>('');
  readonly typeFilter = signal<string>('All');
  
  // Collapse Map State
  readonly collapsedAccounts = signal<Record<string, boolean>>({});

  // Modal State
  readonly showModal = signal<boolean>(false);
  readonly editingAccount = signal<ChartOfAccount | null>(null);

  // Form Fields State
  formCode = '';
  formName = '';
  formType: AccountType = 'Asset';
  formParentCode = '';
  formDescription = '';
  formIsActive = true;
  formIsReconciliation = false;

  // Compute Options for Parent Account Selection
  readonly parentOptions = computed(() => {
    const list = this.financeService.accounts();
    const editing = this.editingAccount();
    if (!editing) return list;
    
    // Prevent cycle by excluding editing account and its potential children
    const excludeCodes = new Set<string>([editing.code]);
    
    // Find children transitively
    let changed = true;
    while (changed) {
      changed = false;
      for (const a of list) {
        if (a.parentCode && excludeCodes.has(a.parentCode) && !excludeCodes.has(a.code)) {
          excludeCodes.add(a.code);
          changed = true;
        }
      }
    }
    
    return list.filter(a => !excludeCodes.has(a.code));
  });

  // Flat Tree of Accounts after sorting, searching, filtering, and collapsing
  readonly processedAccounts = computed(() => {
    const list = this.financeService.accountsWithBalances();
    const query = this.searchQuery().trim().toLowerCase();
    const type = this.typeFilter();
    const collapsed = this.collapsedAccounts();

    // 1. Sort accounts by code so hierarchy order is preserved naturally
    const sorted = [...list].sort((a, b) => a.code.localeCompare(b.code));

    // Helper to check if an account or any of its descendants matches the search
    const matchesSearch = (acc: ChartOfAccount): boolean => {
      const nameMatch = acc.name.toLowerCase().includes(query);
      const codeMatch = acc.code.includes(query);
      const typeMatch = acc.type.toLowerCase().includes(query);
      
      if (nameMatch || codeMatch || typeMatch) return true;

      // Check children recursively
      const children = sorted.filter(c => c.parentCode === acc.code);
      return children.some(matchesSearch);
    };

    // 2. Filter list based on search query and type filter
    let filtered = sorted;
    if (query) {
      filtered = filtered.filter(matchesSearch);
    }
    if (type !== 'All') {
      filtered = filtered.filter(a => a.type === type);
    }

    // Helper to check if account is collapsed due to any parent in hierarchy
    const isCollapsedByParent = (acc: ChartOfAccount): boolean => {
      let currentParentCode = acc.parentCode;
      while (currentParentCode) {
        if (collapsed[currentParentCode]) return true;
        const parent = sorted.find(p => p.code === currentParentCode);
        currentParentCode = parent?.parentCode;
      }
      return false;
    };

    // 3. Filter out collapsed items
    return filtered.filter(acc => !isCollapsedByParent(acc));
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.chart_of_accounts', url: '/finance/chart-of-accounts' }
    ]);
  }

  // --- UI Helpers ---
  getIndentLevel(account: ChartOfAccount): number {
    let level = 0;
    let parent = this.financeService.accounts().find(a => a.code === account.parentCode);
    while (parent) {
      level++;
      parent = this.financeService.accounts().find(a => a.code === parent?.parentCode);
    }
    return level;
  }

  hasChildren(code: string): boolean {
    return this.financeService.accounts().some(a => a.parentCode === code);
  }

  isCollapsed(code: string): boolean {
    return !!this.collapsedAccounts()[code];
  }

  toggleCollapse(code: string) {
    this.collapsedAccounts.update(state => ({
      ...state,
      [code]: !state[code]
    }));
  }

  // --- CRUD Modals ---
  openCreateModal() {
    this.editingAccount.set(null);
    this.formCode = '';
    this.formName = '';
    this.formType = 'Asset';
    this.formParentCode = '';
    this.formDescription = '';
    this.formIsActive = true;
    this.formIsReconciliation = false;
    this.showModal.set(true);
  }

  openEditModal(account: ChartOfAccount) {
    this.editingAccount.set(account);
    this.formCode = account.code;
    this.formName = account.name;
    this.formType = account.type;
    this.formParentCode = account.parentCode || '';
    this.formDescription = account.description || '';
    this.formIsActive = account.isActive;
    this.formIsReconciliation = account.isReconciliation;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveAccount() {
    if (!this.formCode || !this.formName) {
      this.notificationService.warning('finance.chart_of_accounts.title', 'Please enter Account Code and Name.');
      return;
    }

    const accountData = {
      code: this.formCode,
      name: this.formName,
      type: this.formType,
      parentCode: this.formParentCode || undefined,
      description: this.formDescription || undefined,
      isActive: this.formIsActive,
      isReconciliation: this.formIsReconciliation
    };

    try {
      const editing = this.editingAccount();
      if (editing) {
        this.financeService.updateAccount(editing.code, accountData);
        this.notificationService.success(
          'finance.chart_of_accounts.title',
          'finance.chart_of_accounts.success_update'
        );
      } else {
        this.financeService.addAccount(accountData);
        this.notificationService.success(
          'finance.chart_of_accounts.title',
          'finance.chart_of_accounts.success_create'
        );
      }
      this.closeModal();
    } catch (error: any) {
      this.notificationService.danger('finance.chart_of_accounts.title', error.message || 'Error saving account.');
    }
  }

  deleteAccount(account: ChartOfAccount) {
    const confirmMsg = this.langService.isArabic()
      ? `هل أنت متأكد من رغبتك في حذف الحساب ${account.name} (${account.code})؟`
      : `Are you sure you want to delete account ${account.name} (${account.code})?`;

    if (confirm(confirmMsg)) {
      try {
        this.financeService.deleteAccount(account.code);
        this.notificationService.success(
          'finance.chart_of_accounts.title',
          'finance.chart_of_accounts.success_delete'
        );
      } catch (error: any) {
        this.notificationService.danger('finance.chart_of_accounts.title', error.message || 'Error deleting account.');
      }
    }
  }
}
