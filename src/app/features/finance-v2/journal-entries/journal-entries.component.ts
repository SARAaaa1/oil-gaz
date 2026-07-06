import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { FinanceV2MockService } from '../shared/finance-v2-mock.service';
import { WorkflowService } from '../../../core/services/workflow.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { JournalEntry, JournalLine, JournalStatus } from '../shared/finance-v2.interfaces';
import { BranchService } from '../shared/branch.service';
import { ArMockService } from '../shared/ar-mock.service';
import { ApMockService } from '../shared/ap-mock.service';

interface JVAttachment {
  name: string;
  size: string;
  uploadedBy: string;
  date: string;
}

interface AuditEvent {
  action: string;
  user: string;
  timestamp: string;
}

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
  readonly workflowService = inject(WorkflowService);
  readonly mockDataService = inject(MockDataService);

  readonly branchService = inject(BranchService);
  readonly arMock = inject(ArMockService);
  readonly apMock = inject(ApMockService);

  // ── UI State ──────────────────────────────────────────────────────
  readonly searchQuery   = signal('');
  readonly statusFilter  = signal('All');
  readonly branchFilter  = signal('All');
  readonly dateFrom      = signal('');
  readonly dateTo        = signal('');
  readonly showModal     = signal(false); // Used as switch for full page editor
  readonly showViewModal = signal(false); // Used as switch for full page view
  readonly toastMessage  = signal('');
  readonly showHistoryPanel = signal(false);

  readonly activeSearchIdx = signal<number | null>(null);
  readonly activeSearchQuery = signal<string>('');
  readonly activeDescIdx = signal<number | null>(null);

  // ── Form State ────────────────────────────────────────────────────
  formDate          = '';
  formReference     = '';
  formDescription   = '';
  formCurrency      = 'SAR';
  formExchangeRate  = 1;
  formProject       = '';
  formCostCenter    = '';
  formEquipmentCode = '';
  formBusinessUnit  = '';
  formBranch        = '';
  formBranchId      = 'HeadOffice';
  formBranchName    = 'Head Office';
  formInternalNotes = '';
  formRemarks       = '';
  formSourceModule  = 'Manual Journal';
  formJournalType   = 'Cash';
  formPartnerId     = '';
  formPartnerName   = '';
  formLines: JournalLine[] = [];
  readonly formAttachments = signal<JVAttachment[]>([]);
  readonly formAuditHistory = signal<AuditEvent[]>([]);

  // Dropdown Options
  readonly sourceModules = [
    'Manual Journal', 'Accounts Payable', 'Accounts Receivable', 'Inventory',
    'Treasury', 'Payroll', 'Fixed Assets', 'Depreciation', 'VAT', 'Period Close', 'Adjustment'
  ];
  readonly journalTypes = [
    { id: 'Customer', label: 'Customer Journal', labelAr: 'يومية عملاء' },
    { id: 'Supplier', label: 'Supplier Journal', labelAr: 'يومية موردين' },
    { id: 'Cash',     label: 'Cash Journal',     labelAr: 'يومية خزينة' },
    { id: 'Bank',     label: 'Bank Journal',     labelAr: 'يومية بنوك' }
  ];
  readonly businessUnits = ['BU-Main', 'BU-East', 'BU-West'];
  readonly branches = ['Dammam Branch', 'Riyadh Branch', 'Jeddah Branch'];
  readonly branchOptions = [
    { id: 'HeadOffice', label: 'Head Office', labelAr: 'المركز الرئيسي' },
    { id: 'FreeZone',   label: 'Free Zone',   labelAr: 'المنطقة الحرة'  }
  ];
  readonly currencies = ['SAR', 'EGP', 'USD', 'EUR'];

  // Editing/Viewing references
  readonly editingEntry  = signal<JournalEntry | null>(null);
  readonly viewingEntry  = signal<JournalEntry | null>(null);

  // ── Keyboard Shortcuts Listener ──────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    if (!this.showModal()) return;

    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      this.saveDraft();
    } else if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.postJournal();
    } else if (event.key === 'Insert') {
      event.preventDefault();
      this.addLine();
    }
  }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.je.title' }
    ]);
  }

  // ── Autocomplete Matching Accounts ────────────────────────────────
  readonly autocompleteAccounts = computed(() => {
    const q = this.activeSearchQuery().toLowerCase();
    const accounts = this.mockService.accounts().filter(a => a.allowManualEntries && a.status === 'Active');
    if (!q) return accounts.slice(0, 8);
    return accounts.filter(a =>
      a.code.toLowerCase().includes(q) ||
      a.nameEn.toLowerCase().includes(q) ||
      a.nameAr.toLowerCase().includes(q)
    ).slice(0, 8);
  });

  // ── Stats ──────────────────────────────────────────────────────────
  readonly stats = computed(() => {
    const list = this.mockService.journalEntries();
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
    const branch = this.branchFilter();
    const from   = this.dateFrom();
    const to     = this.dateTo();
    return this.mockService.journalEntries().filter(j => {
      const matchQ = !q ||
        j.journalNumber.toLowerCase().includes(q) ||
        j.reference.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.createdBy.toLowerCase().includes(q);
      const matchStatus = status === 'All' || j.status === status;
      const matchBranch = branch === 'All' || (j.branchId || 'HeadOffice') === branch;
      const matchFrom   = !from || j.date >= from;
      const matchTo     = !to   || j.date <= to;
      return matchQ && matchStatus && matchBranch && matchFrom && matchTo;
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

  // ── Actions Handlers ───────────────────────────────────────────────
  
  openAddModal() {
    this.editingEntry.set(null);
    const now = new Date().toISOString().split('T')[0];
    const activeBranch = this.branchService.activeBranch();
    this.formDate        = now;
    this.formReference   = '';
    this.formDescription = '';
    this.formCurrency    = 'SAR';
    this.formExchangeRate = 1;
    this.formProject     = '';
    this.formCostCenter  = '';
    this.formEquipmentCode = '';
    this.formBusinessUnit = '';
    this.formBranch       = '';
    this.formBranchId     = activeBranch === 'All' ? 'HeadOffice' : activeBranch;
    this.formBranchName   = this.formBranchId === 'FreeZone' ? 'Free Zone' : 'Head Office';
    this.formInternalNotes = '';
    this.formRemarks     = '';
    this.formSourceModule = 'Manual Journal';
    this.formJournalType  = 'Cash';
    this.formPartnerId     = '';
    this.formPartnerName   = '';
    this.formLines = [
      this.newLine('l-a1'),
      this.newLine('l-a2'),
    ];
    this.formAttachments.set([]);
    this.formAuditHistory.set([
      { action: 'Created', user: 'Reem Al-Muaiqel', timestamp: new Date().toLocaleString() }
    ]);
    this.showModal.set(true);
  }

  openEditModal(entry: JournalEntry) {
    if (entry.status !== 'Draft') {
      this.notificationService.warning('finance_v2.je.only_draft_edit', 'Only Draft entries can be edited.');
      return;
    }
    this.editingEntry.set(entry);
    this.formDate        = entry.date;
    this.formReference   = entry.reference;
    this.formDescription = entry.description;
    this.formCurrency    = entry.currency;
    this.formExchangeRate = entry.exchangeRate || 1;
    this.formProject     = entry.projectCode;
    this.formCostCenter  = entry.costCenterCode;
    this.formEquipmentCode = entry.equipmentCode || '';
    this.formBusinessUnit = entry.businessUnit || '';
    this.formBranch       = entry.branch || '';
    this.formBranchId     = entry.branchId || 'HeadOffice';
    this.formBranchName   = entry.branchName || 'Head Office';
    this.formInternalNotes = entry.internalNotes || '';
    this.formRemarks     = entry.remarks;
    this.formSourceModule = entry.sourceModule || 'Manual Journal';
    this.formJournalType  = entry.journalType || 'Cash';
    this.formPartnerId     = entry.partnerId || '';
    this.formPartnerName   = entry.partnerName || '';
    this.formLines       = entry.lines.map(l => ({ ...l }));
    this.formAttachments.set(entry.attachments || []);
    this.formAuditHistory.set(entry.auditHistory || [
      { action: 'Created', user: 'Reem Al-Muaiqel', timestamp: entry.createdDate || new Date().toLocaleString() }
    ]);
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
      debit: 0, credit: 0, notes: '', exchangeRate: 1, reference: ''
    };
  }

  addLine() {
    this.formLines = [...this.formLines, this.newLine('l-' + Date.now())];
  }

  removeLine(idx: number) {
    if (this.formLines.length <= 2) {
      this.notificationService.warning('finance_v2.je.validate_failed', 'A Journal Entry requires at least 2 lines.');
      return;
    }
    this.formLines = this.formLines.filter((_, i) => i !== idx);
  }

  duplicateLine(idx: number) {
    const orig = this.formLines[idx];
    const dup = {
      ...orig,
      id: 'l-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)
    };
    this.formLines = [
      ...this.formLines.slice(0, idx + 1),
      dup,
      ...this.formLines.slice(idx + 1)
    ];
  }

  insertBelow(idx: number) {
    const fresh = this.newLine('l-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5));
    this.formLines = [
      ...this.formLines.slice(0, idx + 1),
      fresh,
      ...this.formLines.slice(idx + 1)
    ];
  }

  // ── Autocomplete helpers ──────────────────────────────────────────
  selectAccount(acc: any, idx: number) {
    this.formLines[idx] = {
      ...this.formLines[idx],
      accountCode: acc.code,
      accountNameEn: acc.nameEn,
      accountNameAr: acc.nameAr
    };
    this.formLines = [...this.formLines];
    this.activeSearchIdx.set(null);
  }

  lookupAccount(code: string, idx: number) {
    const acc = this.mockService.accounts().find(a => a.code === code);
    if (acc) {
      this.formLines[idx] = {
        ...this.formLines[idx],
        accountNameEn: acc.nameEn,
        accountNameAr: acc.nameAr
      };
      this.formLines = [...this.formLines];
    }
  }

  // ── Attachments ───────────────────────────────────────────────────
  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        this.formAttachments.update(arr => [...arr, {
          name: file.name,
          size: sizeMB,
          uploadedBy: 'Reem Al-Muaiqel',
          date: new Date().toISOString().split('T')[0]
        }]);
      }
      this.showToast('Files attached successfully.');
    }
  }

  deleteAttachment(idx: number) {
    this.formAttachments.update(arr => arr.filter((_, i) => i !== idx));
  }

  downloadAttachment(name: string) {
    this.showToast(`Downloading ${name}...`);
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  // ── Live Validation & Actions ─────────────────────────────────────
  validateJournal() {
    if (!this.formDescription) {
      this.notificationService.warning('finance_v2.je.validate_failed', 'Description field is required.');
      return;
    }
    if (!this.formDate) {
      this.notificationService.warning('finance_v2.je.validate_failed', 'Posting Date is required.');
      return;
    }
    if (this.formLines.length < 2) {
      this.notificationService.warning('finance_v2.je.validate_failed', 'At least two lines are required.');
      return;
    }
    if (this.formLines.some(l => !l.accountCode)) {
      this.notificationService.warning('finance_v2.je.validate_failed', 'All journal lines must have a valid account code.');
      return;
    }
    if (this.formLines.some(l => (l.debit > 0 && l.credit > 0))) {
      this.notificationService.warning('finance_v2.je.validate_failed', 'Debit and Credit cannot both be active on the same line.');
      return;
    }
    if (this.formLines.some(l => l.debit < 0 || l.credit < 0)) {
      this.notificationService.warning('finance_v2.je.validate_failed', 'Negative values are not allowed.');
      return;
    }
    if (!this.formIsBalanced()) {
      this.notificationService.warning('finance_v2.je.validate_failed', 'Debit and Credit totals are out of balance.');
      return;
    }
    
    // Add to Audit
    this.formAuditHistory.update(arr => [...arr, {
      action: 'Validated', user: 'Reem Al-Muaiqel', timestamp: new Date().toLocaleString()
    }]);

    this.notificationService.success('finance_v2.je.validate_success', 'Journal entries are correct and balanced.');
  }

  saveDraft() {
    this.saveEntry('Draft');
  }

  postJournal() {
    if (!this.formIsBalanced()) {
      this.notificationService.warning('finance_v2.je.unbalanced', 'The journal is unbalanced and cannot be posted.');
      return;
    }
    this.saveEntry('Posted');
  }

  onPartnerChange(partnerId: string) {
    this.formPartnerId = partnerId;
    if (this.formJournalType === 'Customer') {
      const found = this.arMock.customers().find(c => c.id === partnerId);
      this.formPartnerName = found ? (this.langService.isRtl() ? found.nameAr : found.nameEn) : '';
    } else if (this.formJournalType === 'Supplier') {
      const found = this.apMock.suppliers().find(s => s.id === partnerId);
      this.formPartnerName = found ? (this.langService.isRtl() ? found.nameAr : found.nameEn) : '';
    } else {
      this.formPartnerName = '';
    }
  }

  onJournalTypeChange() {
    this.formPartnerId = '';
    this.formPartnerName = '';
  }

  private saveEntry(status: JournalStatus) {
    if (!this.formDescription) {
      this.notificationService.warning('finance_v2.je.error_desc_required', 'Description is required.');
      return;
    }
    const editing = this.editingEntry();
    const totalDebit  = this.formTotalDebit();
    const totalCredit = this.formTotalCredit();
    const now = new Date().toISOString().split('T')[0];

    const audit = [...this.formAuditHistory()];
    audit.push({
      action: status === 'Posted' ? 'Posted' : 'Edited',
      user: 'Reem Al-Muaiqel',
      timestamp: new Date().toLocaleString()
    });

    if (editing) {
      this.mockService.journalEntries.update(list =>
        list.map(j => j.id === editing.id ? {
          ...j,
          date: this.formDate,
          documentDate: this.formDate,
          reference: this.formReference,
          description: this.formDescription,
          currency: this.formCurrency,
          exchangeRate: this.formExchangeRate,
          projectCode: this.formProject,
          costCenterCode: this.formCostCenter,
          equipmentCode: this.formEquipmentCode,
          businessUnit: this.formBusinessUnit,
          branch: this.formBranch,
          branchId: this.formBranchId,
          branchName: this.formBranchName,
          branchCode: this.formBranchId,
          partnerId: this.formPartnerId,
          partnerName: this.formPartnerName,
          internalNotes: this.formInternalNotes,
          remarks: this.formRemarks,
          sourceModule: this.formSourceModule,
          journalType: this.formJournalType,
          lines: this.formLines,
          status,
          totalDebit,
          totalCredit,
          isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
          postedDate: status === 'Posted' ? now : j.postedDate,
          approvedBy: status === 'Posted' ? 'Reem Al-Muaiqel' : j.approvedBy,
          attachments: this.formAttachments(),
          auditHistory: audit,
          lastModified: now
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
        date: this.formDate,
        documentDate: this.formDate,
        reference: this.formReference,
        description: this.formDescription,
        currency: this.formCurrency,
        exchangeRate: this.formExchangeRate,
        projectCode: this.formProject,
        costCenterCode: this.formCostCenter,
        equipmentCode: this.formEquipmentCode,
        businessUnit: this.formBusinessUnit,
        branch: this.formBranch,
        branchId: this.formBranchId,
        branchName: this.formBranchName,
        branchCode: this.formBranchId,
        partnerId: this.formPartnerId,
        partnerName: this.formPartnerName,
        internalNotes: this.formInternalNotes,
        remarks: this.formRemarks,
        sourceModule: this.formSourceModule,
        journalType: this.formJournalType,
        lines: this.formLines,
        status,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        createdBy: 'Reem Al-Muaiqel',
        approvedBy: status === 'Posted' ? 'Reem Al-Muaiqel' : '',
        createdDate: now,
        postedDate: status === 'Posted' ? now : '',
        reversedDate: '',
        reversedJournalNumber: '',
        attachments: this.formAttachments(),
        auditHistory: audit
      };
      this.mockService.journalEntries.update(list => [newEntry, ...list]);
    }
    this.notificationService.success('finance_v2.common.saved', 'Journal Voucher saved.');
    this.showModal.set(false);
  }

  postEntry(entry: JournalEntry) {
    const now = new Date().toISOString().split('T')[0];
    const audit = entry.auditHistory ? [...entry.auditHistory] : [];
    audit.push({ action: 'Posted', user: 'Reem Al-Muaiqel', timestamp: new Date().toLocaleString() });

    this.mockService.journalEntries.update(list =>
      list.map(j => j.id === entry.id
        ? { ...j, status: 'Posted', postedDate: now, auditHistory: audit }
        : j)
    );
    this.notificationService.success('finance_v2.je.posted', 'Journal posted successfully.');
  }

  reverseEntry(entry: JournalEntry) {
    if (entry.status !== 'Posted') return;
    const now = new Date().toISOString().split('T')[0];
    const audit = entry.auditHistory ? [...entry.auditHistory] : [];
    audit.push({ action: 'Reversed', user: 'Reem Al-Muaiqel', timestamp: new Date().toLocaleString() });

    this.mockService.journalEntries.update(list =>
      list.map(j => j.id === entry.id
        ? { ...j, status: 'Reversed', reversedDate: now, reversedJournalNumber: j.journalNumber + '-R', auditHistory: audit }
        : j)
    );
    this.notificationService.success('finance_v2.je.reversed', 'Journal reversed successfully.');
  }

  duplicateEntry(entry: JournalEntry) {
    const now = new Date().toISOString().split('T')[0];
    const entries = this.mockService.journalEntries();
    const lastNum = parseInt(entries[0].journalNumber.split('-')[2]) + 1;
    const audit = [
      { action: 'Created (Duplicated)', user: 'Reem Al-Muaiqel', timestamp: new Date().toLocaleString() }
    ];
    const dup: JournalEntry = {
      ...entry,
      id: 'je-' + Date.now(),
      journalNumber: `JE-2025-${String(lastNum).padStart(4, '0')}`,
      status: 'Draft',
      createdDate: now,
      postedDate: '',
      approvedBy: '',
      reversedDate: '',
      reversedJournalNumber: '',
      lines: entry.lines.map(l => ({ ...l, id: l.id + '-dup' })),
      auditHistory: audit
    };
    this.mockService.journalEntries.update(list => [dup, ...list]);
    this.notificationService.success('finance_v2.je.duplicated', 'Journal entry duplicated.');
  }

  closeModal()     { this.showModal.set(false); }
  closeViewModal() { this.showViewModal.set(false); }

  getStatusClass(s: JournalStatus): string {
    switch (s) {
      case 'Posted':   return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Draft':    return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Reversed': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
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

  getBranchClass(branchId?: string): string {
    return branchId === 'FreeZone'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : 'bg-blue-50 text-blue-700 border border-blue-200';
  }

  getBranchLabel(branchId?: string, isAr = false): string {
    if (branchId === 'FreeZone') return isAr ? 'المنطقة الحرة' : 'Free Zone';
    return isAr ? 'المركز الرئيسي' : 'Head Office';
  }

  onBranchChange(id: string) {
    this.formBranchId   = id;
    this.formBranchName = id === 'FreeZone' ? 'Free Zone' : 'Head Office';
  }

  printReport() {
    window.print();
  }

  exportExcel() {
    this.showToast('Excel spreadsheet downloaded.');
  }

  exportPDF() {
    this.showToast('PDF Document generated and downloaded.');
  }
}
