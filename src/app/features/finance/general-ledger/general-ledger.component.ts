import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { WorkflowService } from '../../../core/services/workflow.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RoleDirective } from '../../../shared/directives/role.directive';
import { JournalEntry, JournalLine, JournalStatus, ChartOfAccount } from '../../../shared/interfaces/finance.interface';

interface FormLine {
  accountCode: string;
  debit: number;
  credit: number;
  description: string;
  projectCode: string;
  costCenterCode: string;
}

@Component({
  selector: 'app-general-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RoleDirective],
  templateUrl: './general-ledger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralLedgerComponent implements OnInit {
  readonly financeService = inject(FinanceCoreService);
  readonly workflowService = inject(WorkflowService);
  private readonly notificationService = inject(NotificationService);
  readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  // Search & Filter State
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('All');

  // Modals States
  readonly showDetailModal = signal<boolean>(false);
  readonly selectedEntry = signal<JournalEntry | null>(null);

  readonly showPostModal = signal<boolean>(false);

  // Form State for posting manual entry
  formDate = new Date().toISOString().split('T')[0];
  formReference = '';
  formDescription = '';
  formLines = signal<FormLine[]>([
    { accountCode: '', debit: 0, credit: 0, description: '', projectCode: '', costCenterCode: '' },
    { accountCode: '', debit: 0, credit: 0, description: '', projectCode: '', costCenterCode: '' }
  ]);

  // Leaf accounts for line-item selection (prevents posting to summary nodes)
  readonly leafAccounts = computed(() => {
    const list: ChartOfAccount[] = this.financeService.accounts();
    return list.filter((acc: ChartOfAccount) => !list.some((other: ChartOfAccount) => other.parentCode === acc.code));
  });

  // Calculate totals and balance variance of the current posting form
  readonly formTotals = computed(() => {
    const lines = this.formLines();
    const debits = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const credits = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    const variance = Math.abs(debits - credits);
    
    return {
      debits,
      credits,
      variance,
      isBalanced: variance < 0.01 && debits > 0
    };
  });

  // Filtered Journals List
  readonly filteredEntries = computed(() => {
    const list: JournalEntry[] = this.financeService.journalEntries();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    let filtered = list;

    if (query) {
      filtered = filtered.filter((entry: JournalEntry) => 
        entry.journalNumber.toLowerCase().includes(query) ||
        (entry.reference && entry.reference.toLowerCase().includes(query)) ||
        entry.description.toLowerCase().includes(query) ||
        entry.lines.some((l: JournalLine) => l.accountCode.includes(query) || l.accountName.toLowerCase().includes(query))
      );
    }

    if (status !== 'All') {
      filtered = filtered.filter((entry: JournalEntry) => entry.status === status);
    }

    // Sort chronologically (most recent first)
    return filtered.sort((a: JournalEntry, b: JournalEntry) => b.date.localeCompare(a.date) || b.journalNumber.localeCompare(a.journalNumber));
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.general_ledger', url: '/finance/general-ledger' }
    ]);
  }

  // --- Modal actions ---
  openDetailModal(entry: JournalEntry) {
    this.selectedEntry.set(entry);
    this.showDetailModal.set(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedEntry.set(null);
  }

  openPostModal() {
    this.formDate = new Date().toISOString().split('T')[0];
    this.formReference = '';
    this.formDescription = '';
    this.formLines.set([
      { accountCode: '', debit: 0, credit: 0, description: '', projectCode: '', costCenterCode: '' },
      { accountCode: '', debit: 0, credit: 0, description: '', projectCode: '', costCenterCode: '' }
    ]);
    this.showPostModal.set(true);
  }

  closePostModal() {
    this.showPostModal.set(false);
  }

  // --- Form Grid Actions ---
  addFormRow() {
    this.formLines.update(lines => [
      ...lines,
      { accountCode: '', debit: 0, credit: 0, description: '', projectCode: '', costCenterCode: '' }
    ]);
  }

  removeFormRow(index: number) {
    if (this.formLines().length <= 2) {
      this.notificationService.warning('finance.general_ledger.title', 'Journal Entry must contain at least 2 lines.');
      return;
    }
    this.formLines.update(lines => lines.filter((_, i) => i !== index));
  }

  onDebitChange(index: number) {
    // If debit is typed, clear credit to preserve single-sided line input logic
    const lines = [...this.formLines()];
    if (lines[index].debit > 0) {
      lines[index].credit = 0;
    }
    this.formLines.set(lines);
  }

  onCreditChange(index: number) {
    // If credit is typed, clear debit
    const lines = [...this.formLines()];
    if (lines[index].credit > 0) {
      lines[index].debit = 0;
    }
    this.formLines.set(lines);
  }

  // --- API Mutators ---
  postManualEntry() {
    const totals = this.formTotals();
    if (!totals.isBalanced) {
      this.notificationService.danger(
        'finance.general_ledger.title',
        'finance.general_ledger.unbalanced_error',
        { variance: totals.variance.toFixed(2) }
      );
      return;
    }

    // Verify all rows have an account selected
    const invalidLine = this.formLines().some(l => !l.accountCode || (l.debit <= 0 && l.credit <= 0));
    if (invalidLine) {
      this.notificationService.warning('finance.general_ledger.title', 'Please specify an account and a debit/credit value for all lines.');
      return;
    }

    const lines: JournalLine[] = this.formLines().map((l, i) => {
      const accName = this.financeService.accounts().find((a: ChartOfAccount) => a.code === l.accountCode)?.name || 'Unknown';
      return {
        id: `jel_man_${i}_${Math.random().toString(36).substr(2, 5)}`,
        accountCode: l.accountCode,
        accountName: accName,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description || undefined,
        projectCode: l.projectCode || undefined,
        costCenterCode: l.costCenterCode || undefined
      };
    });

    try {
      this.financeService.postJournalEntry({
        date: this.formDate,
        reference: this.formReference,
        description: this.formDescription,
        lines
      });

      this.notificationService.success(
        'finance.general_ledger.title',
        'finance.general_ledger.success_post'
      );
      this.closePostModal();
    } catch (error: any) {
      this.notificationService.danger('finance.general_ledger.title', error.message || 'Error posting journal entry.');
    }
  }

  voidEntry(entry: JournalEntry) {
    if (confirm(`Are you sure you want to void journal entry ${entry.journalNumber}? This operation cannot be undone.`)) {
      try {
        this.financeService.voidJournalEntry(entry.id);
        this.notificationService.success(
          'finance.general_ledger.title',
          'finance.general_ledger.success_void'
        );
        // Sync selected details view if open
        const openDetail = this.selectedEntry();
        if (openDetail && openDetail.id === entry.id) {
          this.selectedEntry.set({
            ...openDetail,
            status: 'Voided'
          });
        }
      } catch (error: any) {
        this.notificationService.danger('finance.general_ledger.title', error.message || 'Error voiding journal entry.');
      }
    }
  }
}
