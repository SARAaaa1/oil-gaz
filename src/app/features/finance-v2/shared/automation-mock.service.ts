import { Injectable, signal, computed } from '@angular/core';
import { PeriodCloseKpis, ChecklistItem, ValidationIssue, AutomationRule, AuditTrailRow } from './automation.interfaces';

@Injectable({ providedIn: 'root' })
export class AutomationMockService {

  // ── Period Status / KPIs Signal ────────────────────────────────────
  readonly kpis = signal<PeriodCloseKpis>({
    fiscalYear: '2025',
    accountingPeriod: 'Q2 2025',
    status: 'Open',
    pendingTasks: 6,
    completedTasks: 11,
    unpostedJournals: 4,
    draftDocuments: 8,
    pendingVendorPayments: 2,
    pendingCustomerCollections: 3,
    pendingVatSettlement: 1,
    pendingAssetDepreciation: 1,
    pendingBudgetReviews: 2,
    auditIssues: 3
  });

  // ── Month-End Closing Checklist Signal ─────────────────────────────
  readonly checklist = signal<ChecklistItem[]>([
    { id: 'ch01', name: 'Review Draft Journal Entries', status: 'Completed', completedBy: 'Sara Al-Rasheed', completedDate: '2025-06-28', notes: 'All JV drafts reviewed' },
    { id: 'ch02', name: 'Post All Approved Journals', status: 'Completed', completedBy: 'Sara Al-Rasheed', completedDate: '2025-06-29', notes: 'All approved JVs posted to ledger' },
    { id: 'ch03', name: 'Verify General Ledger Balance', status: 'Completed', completedBy: 'Sara Al-Rasheed', completedDate: '2025-06-29', notes: 'Asset and liability control balances matched' },
    { id: 'ch04', name: 'Trial Balance Balanced', status: 'Completed', completedBy: 'Faisal Al-Qahtani', completedDate: '2025-06-29', notes: 'DR/CR total matches' },
    { id: 'ch05', name: 'Review Accounts Payable (AP)', status: 'Completed', completedBy: 'Reem Al-Muaiqel', completedDate: '2025-06-30', notes: 'Supplier invoices aging confirmed' },
    { id: 'ch06', name: 'Review Accounts Receivable (AR)', status: 'Completed', completedBy: 'Reem Al-Muaiqel', completedDate: '2025-06-30', notes: 'Customer receipts logged' },
    { id: 'ch07', name: 'Verify Treasury Transactions', status: 'Completed', completedBy: 'Tariq Al-Mutairi', completedDate: '2025-06-30', notes: 'HQ safe ledger balances matched physical safes' },
    { id: 'ch08', name: 'Complete Bank Reconciliation', status: 'Completed', completedBy: 'Tariq Al-Mutairi', completedDate: '2025-06-30', notes: 'Al Rajhi statement matched ledger' },
    { id: 'ch09', name: 'Post Monthly Depreciation', status: 'Completed', completedBy: 'Sara Al-Rasheed', completedDate: '2025-07-01', notes: 'Asset straight-line depreciation calculated' },
    { id: 'ch10', name: 'Review Fixed Assets Register', status: 'Completed', completedBy: 'Sara Al-Rasheed', completedDate: '2025-07-01', notes: 'Asset acquisition register matches GL values' },
    { id: 'ch11', name: 'Calculate VAT Return', status: 'Completed', completedBy: 'Faisal Al-Qahtani', completedDate: '2025-07-01', notes: 'Q2 2025 VAT input/output compiled' },
    { id: 'ch12', name: 'Post VAT Settlement (Mock)', status: 'In Progress', completedBy: '', completedDate: '', notes: 'Clearing journal previewed, pending final sign-off' },
    { id: 'ch13', name: 'Verify Budget Utilization', status: 'Not Started', completedBy: '', completedDate: '', notes: '' },
    { id: 'ch14', name: 'Review Cost Centers Allocations', status: 'Not Started', completedBy: '', completedDate: '', notes: '' },
    { id: 'ch15', name: 'Generate Financial Statements', status: 'Not Started', completedBy: '', completedDate: '', notes: '' },
    { id: 'ch16', name: 'System Backup Confirmation (Mock)', status: 'Not Started', completedBy: '', completedDate: '', notes: 'Simulate disaster recovery dump' },
    { id: 'ch17', name: 'Lock Accounting Period', status: 'Not Started', completedBy: '', completedDate: '', notes: 'Pending checklist completions' }
  ]);

  // ── Validation Issues Signal ───────────────────────────────────────
  readonly validationIssues = signal<ValidationIssue[]>([
    { id: 'v01', severity: 'Error', module: 'GL', title: 'Unbalanced Journal Entry', description: 'JV-2025-104 has a debit/credit difference of 1,250 SAR.', recommendation: 'Adjust or reject the journal entry.' },
    { id: 'v02', severity: 'Warning', module: 'Treasury', title: 'Negative safe balance', description: 'Cash Box Olaya safe shows negative balance -3,200 SAR.', recommendation: 'Perform cash count or transfer liquidity.' },
    { id: 'v03', severity: 'Warning', module: 'Budgets', title: 'Budget Exceeded', description: 'Project SWCC Desalination materials exceeds budget by 300,000 SAR.', recommendation: 'Authorize budget variance approval.' },
    { id: 'v04', severity: 'Info', module: 'VAT', title: 'Missing Supplier VAT Numbers', description: 'Supplier Khobar Logistics has missing VAT registration number.', recommendation: 'Update supplier card.' }
  ]);

  // ── Automation Rules Signal ────────────────────────────────────────
  readonly automationRules = signal<AutomationRule[]>([
    { id: 'r01', name: 'Generate Monthly Depreciation', description: 'Runs Straight-Line depreciation calculations for all active assets', frequency: 'Monthly', lastRun: '2025-07-01 23:00', nextRun: '2025-08-01 00:00', status: 'Completed', result: 'Success', log: '7 active assets depreciated. Total: 114,800 SAR.' },
    { id: 'r02', name: 'Calculate VAT Return', description: 'Compiles input and output VAT registers for the active period', frequency: 'Quarterly', lastRun: '2025-07-01 23:05', nextRun: '2025-10-01 00:00', status: 'Completed', result: 'Success', log: 'VAT Return BGT-2025-Q2 compiled. Net payable: 795,000 SAR.' },
    { id: 'r03', name: 'Refresh Budget Actuals', description: 'Re-calculates project committed and actual site costs from GL ledger', frequency: 'Daily', lastRun: '2025-07-02 01:00', nextRun: '2025-07-03 01:00', status: 'Completed', result: 'Success', log: 'All project budgets synchronized.' },
    { id: 'r04', name: 'Sanity Check GL Ledger', description: 'Validates double-entry balancing and detects missing cost centers/projects', frequency: 'Daily', lastRun: '2025-07-02 01:10', nextRun: '2025-07-03 01:10', status: 'Failed', result: 'Warning', log: 'Unbalanced journal JV-2025-104 detected.' }
  ]);

  // ── Financial Audit Trail Signal ───────────────────────────────────
  readonly auditTrail = signal<AuditTrailRow[]>([
    { id: 'a01', date: '2025-07-02', time: '02:00:15', user: 'Sara Al-Rasheed', module: 'Period Close', action: 'Run Validation', document: 'Period Close Q2 2025', beforeValue: 'Open', afterValue: 'Review', ip: '192.168.10.45', status: 'Success' },
    { id: 'a02', date: '2025-07-02', time: '01:00:05', user: 'Reem Al-Muaiqel', module: 'Budget', action: 'Create Project Budget', document: 'BGT-2025-006', beforeValue: 'Draft', afterValue: 'Draft', ip: '192.168.10.12', status: 'Success' },
    { id: 'a03', date: '2025-07-02', time: '00:45:10', user: 'Faisal Al-Qahtani', module: 'GL', action: 'Post Journal Voucher', document: 'JV-2025-103', beforeValue: 'Approved', afterValue: 'Posted', ip: '192.168.10.88', status: 'Success' }
  ]);

  // ── Actions ────────────────────────────────────────────────────────
  runValidationRules() {
    // Clear error v01 to simulate user correction
    this.validationIssues.update(list => list.filter(item => item.id !== 'v01'));
    // Update KPI count
    this.kpis.update(k => ({ ...k, auditIssues: this.validationIssues().length }));
    
    // Add audit trail log
    const newLog: AuditTrailRow = {
      id: `a-${Date.now()}`,
      date: '2025-07-02',
      time: '02:30:00',
      user: 'Sara Al-Rasheed',
      module: 'Period Close',
      action: 'Run Validation',
      document: 'GL Ledger Check',
      beforeValue: '4 Issues',
      afterValue: '3 Issues',
      ip: '192.168.10.45',
      status: 'Success'
    };
    this.auditTrail.update(list => [newLog, ...list]);
  }

  runAutomationRule(id: string) {
    this.automationRules.update(list =>
      list.map(r => r.id === id ? { ...r, status: 'Completed', result: 'Success', lastRun: '2025-07-02 02:35' } : r)
    );
  }

  updateChecklistItemStatus(id: string, status: ChecklistItem['status'], user: string) {
    this.checklist.update(list =>
      list.map(item => item.id === id ? { ...item, status, completedBy: user, completedDate: '2025-07-02' } : item)
    );
    // Recount
    const pending = this.checklist().filter(c => c.status !== 'Completed' && c.status !== 'Skipped').length;
    const completed = this.checklist().length - pending;
    this.kpis.update(k => ({ ...k, pendingTasks: pending, completedTasks: completed }));
  }

  closePeriod() {
    this.kpis.update(k => ({ ...k, status: 'Closed' }));
    // Complete lock checklist item
    const lockItem = this.checklist().find(c => c.name.includes('Lock'));
    if (lockItem) {
      this.updateChecklistItemStatus(lockItem.id, 'Completed', 'Sara Al-Rasheed');
    }
  }

  reopenPeriod() {
    this.kpis.update(k => ({ ...k, status: 'Open' }));
    const lockItem = this.checklist().find(c => c.name.includes('Lock'));
    if (lockItem) {
      this.updateChecklistItemStatus(lockItem.id, 'Not Started', '');
    }
  }
}
