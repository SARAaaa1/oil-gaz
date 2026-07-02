import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { FinanceV2MockService } from '../shared/finance-v2-mock.service';
import { JournalEntry, JournalLine, JournalStatus } from '../shared/finance-v2.interfaces';

@Component({
  selector: 'app-finv2-journal-entries',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './journal-entries.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2JournalEntriesComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly langService = inject(LanguageService);
  readonly mockService = inject(FinanceV2MockService);

  // ── UI State ──────────────────────────────────────────────────────
  readonly searchQuery   = signal('');
  readonly statusFilter  = signal('All');
  readonly dateFrom      = signal('');
  readonly dateTo        = signal('');
  readonly showModal     = signal(false);
  readonly showViewModal = signal(false);
  readonly editingEntry  = signal<JournalEntry | null>(null);
  readonly viewingEntry  = signal<JournalEntry | null>(null);

  // ── Form State ────────────────────────────────────────────────────
  formDate         = '';
  formReference    = '';
  formDescription  = '';
  formCurrency     = 'SAR';
  formProject      = '';
  formCostCenter   = '';
  formRemarks      = '';
  formLines: JournalLine[] = [];

  // ── Stats ──────────────────────────────────────────────────────────
  readonly stats = computed(() => {
    const list = this.mockService.journalEntries();
    const now   = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return {
      draft:     list.filter(j => j.status === 'Draft').length,
      posted:    list.filter(j => j.status === 'Posted').length,
      reversed:  list.filter(j => j.status === 'Reversed').length,
      thisMonth: list.filter(j => j.date.startsWith('2025-06')).length,
      totalDebit:  list.filter(j => j.status === 'Posted').reduce((s, j) => s + j.totalDebit, 0),
      totalCredit: list.filter(j => j.status === 'Posted').reduce((s, j) => s + j.totalCredit, 0),
    };
  });

  // ── Filtered list ──────────────────────────────────────────────────
  readonly filteredEntries = computed(() => {
    const q      = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    const from   = this.dateFrom();
    const to     = this.dateTo();
    return this.mockService.journalEntries().filter(j => {
      const matchQ = !q ||
        j.journalNumber.toLowerCase().includes(q) ||
        j.reference.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.createdBy.toLowerCase().includes(q);
      const matchStatus = status === 'All' || j.status === status;
      const matchFrom   = !from || j.date >= from;
      const matchTo     = !to   || j.date <= to;
      return matchQ && matchStatus && matchFrom && matchTo;
    }).sort((a, b) => b.journalNumber.localeCompare(a.journalNumber));
  });

  // ── Form computed balance ──────────────────────────────────────────
  readonly formTotalDebit  = computed(() =>
    this.formLines.reduce((s, l) => s + (Number(l.debit) || 0), 0));
  readonly formTotalCredit = computed(() =>
    this.formLines.reduce((s, l) => s + (Number(l.credit) || 0), 0));
  readonly formIsBalanced  = computed(() =>
    Math.abs(this.formTotalDebit() - this.formTotalCredit()) < 0.01);
  readonly formDifference  = computed(() =>
    Math.abs(this.formTotalDebit() - this.formTotalCredit()));

  // ── CRUD ───────────────────────────────────────────────────────────
  openAddModal() {
    this.editingEntry.set(null);
    const now = new Date();
    this.formDate        = now.toISOString().split('T')[0];
    this.formReference   = '';
    this.formDescription = '';
    this.formCurrency    = 'SAR';
    this.formProject     = '';
    this.formCostCenter  = '';
    this.formRemarks     = '';
    this.formLines = [
      this.newLine('l-a1'),
      this.newLine('l-a2'),
    ];
    this.showModal.set(true);
  }

  openEditModal(entry: JournalEntry) {
    if (entry.status !== 'Draft') {
      this.notificationService.warning('finance_v2.je.only_draft_edit', 'finance_v2.je.only_draft_edit_desc');
      return;
    }
    this.editingEntry.set(entry);
    this.formDate        = entry.date;
    this.formReference   = entry.reference;
    this.formDescription = entry.description;
    this.formCurrency    = entry.currency;
    this.formProject     = entry.projectCode;
    this.formCostCenter  = entry.costCenterCode;
    this.formRemarks     = entry.remarks;
    this.formLines       = entry.lines.map(l => ({ ...l }));
    this.showModal.set(true);
  }

  openViewModal(entry: JournalEntry) {
    this.viewingEntry.set(entry);
    this.showViewModal.set(true);
  }

  newLine(id: string): JournalLine {
    return {
      id, accountCode: '', accountNameEn: '', accountNameAr: '',
      costCenterCode: '', projectCode: '', description: '',
      debit: 0, credit: 0, notes: ''
    };
  }

  addLine() {
    this.formLines = [...this.formLines, this.newLine('l-' + Date.now())];
  }

  removeLine(idx: number) {
    if (this.formLines.length <= 2) return;
    this.formLines = this.formLines.filter((_, i) => i !== idx);
  }

  saveDraft() { this.saveEntry('Draft'); }
  postJournal() {
    if (!this.formIsBalanced()) {
      this.notificationService.warning('finance_v2.je.unbalanced', 'finance_v2.je.unbalanced_desc');
      return;
    }
    this.saveEntry('Posted');
  }

  private saveEntry(status: JournalStatus) {
    if (!this.formDescription) {
      this.notificationService.warning('finance_v2.je.error_desc_required', 'finance_v2.je.error_desc_required_msg');
      return;
    }
    const editing = this.editingEntry();
    const totalDebit  = this.formLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = this.formLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    const now = new Date().toISOString().split('T')[0];

    if (editing) {
      this.mockService.journalEntries.update(list =>
        list.map(j => j.id === editing.id ? {
          ...j, date: this.formDate, reference: this.formReference,
          description: this.formDescription, currency: this.formCurrency,
          projectCode: this.formProject, costCenterCode: this.formCostCenter,
          remarks: this.formRemarks, lines: this.formLines,
          status, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
          postedDate: status === 'Posted' ? now : j.postedDate,
          approvedBy: status === 'Posted' ? 'Reem Al-Muaiqel' : j.approvedBy
        } : j)
      );
    } else {
      const entries = this.mockService.journalEntries();
      const lastNum = entries.length > 0
        ? parseInt(entries[0].journalNumber.split('-')[2]) + 1
        : 48;
      const newEntry: JournalEntry = {
        id: 'je-' + Date.now(),
        journalNumber: `JE-2025-${String(lastNum).padStart(4, '0')}`,
        date: this.formDate, reference: this.formReference,
        description: this.formDescription, currency: this.formCurrency,
        projectCode: this.formProject, costCenterCode: this.formCostCenter,
        remarks: this.formRemarks, lines: this.formLines,
        status, totalDebit, totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        createdBy: 'Reem Al-Muaiqel',
        approvedBy: status === 'Posted' ? 'Reem Al-Muaiqel' : '',
        createdDate: now,
        postedDate: status === 'Posted' ? now : '',
        reversedDate: '', reversedJournalNumber: ''
      };
      this.mockService.journalEntries.update(list => [newEntry, ...list]);
    }
    this.notificationService.success('finance_v2.common.saved', 'finance_v2.je.saved_desc');
    this.showModal.set(false);
  }

  postEntry(entry: JournalEntry) {
    this.mockService.journalEntries.update(list =>
      list.map(j => j.id === entry.id
        ? { ...j, status: 'Posted', postedDate: new Date().toISOString().split('T')[0] }
        : j)
    );
    this.notificationService.success('finance_v2.je.posted', 'finance_v2.je.posted_desc');
  }

  reverseEntry(entry: JournalEntry) {
    if (entry.status !== 'Posted') return;
    this.mockService.journalEntries.update(list =>
      list.map(j => j.id === entry.id
        ? { ...j, status: 'Reversed', reversedDate: new Date().toISOString().split('T')[0], reversedJournalNumber: j.journalNumber + '-R' }
        : j)
    );
    this.notificationService.success('finance_v2.je.reversed', 'finance_v2.je.reversed_desc');
  }

  duplicateEntry(entry: JournalEntry) {
    const now = new Date().toISOString().split('T')[0];
    const entries = this.mockService.journalEntries();
    const lastNum = parseInt(entries[0].journalNumber.split('-')[2]) + 1;
    const dup: JournalEntry = {
      ...entry,
      id: 'je-' + Date.now(),
      journalNumber: `JE-2025-${String(lastNum).padStart(4, '0')}`,
      status: 'Draft', createdDate: now,
      postedDate: '', approvedBy: '',
      reversedDate: '', reversedJournalNumber: '',
      lines: entry.lines.map(l => ({ ...l, id: l.id + '-dup' }))
    };
    this.mockService.journalEntries.update(list => [dup, ...list]);
    this.notificationService.success('finance_v2.je.duplicated', 'finance_v2.je.duplicated_desc');
  }

  closeModal()     { this.showModal.set(false); }
  closeViewModal() { this.showViewModal.set(false); }

  // ── Helpers ────────────────────────────────────────────────────────
  getStatusClass(s: JournalStatus): string {
    switch (s) {
      case 'Posted':   return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Draft':    return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Reversed': return 'bg-rose-50 text-rose-600 border-rose-200';
    }
  }

  getStatusKey(s: string): string {
    switch (s) {
      case 'Posted':   return 'finance_v2.je.status_posted';
      case 'Draft':    return 'finance_v2.je.status_draft';
      case 'Reversed': return 'finance_v2.je.status_reversed';
      default: return s;
    }
  }

  formatAmount(v: number): string {
    if (!v) return '—';
    return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // Look up account name from COA
  lookupAccount(code: string, idx: number) {
    const account = this.mockService.accounts().find(a => a.code === code);
    if (account) {
      this.formLines[idx] = {
        ...this.formLines[idx],
        accountNameEn: account.nameEn,
        accountNameAr: account.nameAr
      };
      this.formLines = [...this.formLines];
    }
  }

  readonly coaAccounts = computed(() =>
    this.mockService.accounts().filter(a => a.allowManualEntries && a.status === 'Active')
  );

  readonly currencies = ['SAR', 'USD', 'EUR'];
  readonly statuses: JournalStatus[] = ['Draft', 'Posted', 'Reversed'];

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.je.title' }
    ]);
  }
}
