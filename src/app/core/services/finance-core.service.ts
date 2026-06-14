import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { ChartOfAccount, JournalEntry, JournalLine, AccountType, JournalStatus } from '../../shared/interfaces/finance.interface';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';

const ACCOUNTS_KEY = 'petroflow_finance_accounts';
const ENTRIES_KEY = 'petroflow_finance_journal_entries';

@Injectable({
  providedIn: 'root'
})
export class FinanceCoreService {
  private readonly injector = inject(Injector);
  private readonly authService = inject(AuthService);

  // --- Core State Signals ---
  readonly accounts = signal<ChartOfAccount[]>([]);
  readonly journalEntries = signal<JournalEntry[]>([]);

  // --- Dynamic balance computation ---
  readonly accountsWithBalances = computed(() => {
    const list = this.accounts();
    const postedEntries = this.journalEntries().filter(e => e.status === 'Posted');

    return list.map(acc => {
      const getBalanceForCodeAndChildren = (code: string): number => {
        let sum = 0;
        
        // Sum entries for exact account code
        for (const entry of postedEntries) {
          for (const line of entry.lines) {
            if (line.accountCode === code) {
              sum += (line.debit - line.credit);
            }
          }
        }

        // Sum sub-accounts
        const children = list.filter(c => c.parentCode === code);
        for (const child of children) {
          sum += getBalanceForCodeAndChildren(child.code);
        }

        return sum;
      };

      const rawBalance = getBalanceForCodeAndChildren(acc.code);
      
      // Debit positive, credit negative for asset/expense.
      // Credit positive, debit negative for liability/equity/revenue.
      let finalBalance = rawBalance;
      if (acc.type === 'Liability' || acc.type === 'Equity' || acc.type === 'Revenue') {
        finalBalance = -rawBalance;
      }

      return {
        ...acc,
        balance: finalBalance
      };
    });
  });

  private get auditService(): AuditService {
    return this.injector.get(AuditService);
  }

  constructor() {
    this.loadState();
  }

  private loadState() {
    const cachedAccounts = localStorage.getItem(ACCOUNTS_KEY);
    const cachedEntries = localStorage.getItem(ENTRIES_KEY);

    if (cachedAccounts && cachedEntries) {
      this.accounts.set(JSON.parse(cachedAccounts));
      this.journalEntries.set(JSON.parse(cachedEntries));
    } else {
      this.initializeMockData();
    }
  }

  private saveState() {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(this.accounts()));
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(this.journalEntries()));
  }

  // --- Chart of Accounts CRUD ---
  addAccount(account: Omit<ChartOfAccount, 'id' | 'balance'>) {
    const existing = this.accounts().find(a => a.code === account.code);
    if (existing) {
      throw new Error(`Account code ${account.code} already exists.`);
    }

    const id = `acc_${Math.random().toString(36).substr(2, 9)}`;
    const newAcc: ChartOfAccount = {
      ...account,
      id,
      balance: 0
    };

    this.accounts.update(list => [...list, newAcc]);
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'ChartOfAccount',
      entityId: newAcc.code,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newAcc),
      details: `Created new Chart of Account node "${newAcc.name}" (${newAcc.code}) of type ${newAcc.type}.`
    });

    return newAcc;
  }

  updateAccount(code: string, updated: Partial<ChartOfAccount>) {
    const old = this.accounts().find(a => a.code === code);
    if (!old) return;

    this.accounts.update(list =>
      list.map(a => a.code === code ? { ...a, ...updated } : a)
    );
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'ChartOfAccount',
      entityId: code,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.accounts().find(a => a.code === code)),
      details: `Updated Chart of Account node ${code} (${old.name}).`
    });
  }

  deleteAccount(code: string) {
    const old = this.accounts().find(a => a.code === code);
    if (!old) return;

    // Check if children exist
    const hasChildren = this.accounts().some(a => a.parentCode === code);
    if (hasChildren) {
      throw new Error(`Cannot delete account ${code} because it has child accounts.`);
    }

    // Check if any journal entries exist
    const hasEntries = this.journalEntries().some(e => e.lines.some(l => l.accountCode === code));
    if (hasEntries) {
      throw new Error(`Cannot delete account ${code} because it contains posted transactions.`);
    }

    this.accounts.update(list => list.filter(a => a.code !== code));
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'ChartOfAccount',
      entityId: code,
      action: 'Reject',
      oldValue: JSON.stringify(old),
      newValue: '',
      details: `Deleted Chart of Account node ${code} ("${old.name}").`
    });
  }

  // --- General Ledger Journal Entry Mutators ---
  postJournalEntry(entry: Omit<JournalEntry, 'id' | 'journalNumber' | 'createdDate' | 'status' | 'totalDebit' | 'totalCredit' | 'createdBy' | 'postedDate' | 'postedBy'> & { status?: JournalStatus }) {
    // 1. Validate Debit & Credit equality
    const totalDebit = entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Unbalanced Journal Entry: Total Debits ($${totalDebit}) must equal Total Credits ($${totalCredit}). Variance: $${(totalDebit - totalCredit).toFixed(2)}`);
    }

    if (totalDebit <= 0) {
      throw new Error('Journal entry amount must be greater than zero.');
    }

    // 2. Assign unique ID & Auto-generate Entry Number
    const id = `je_${Math.random().toString(36).substr(2, 9)}`;
    const count = this.journalEntries().length;
    const journalNumber = `JE-2026-${(count + 1).toString().padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const user = this.authService.currentUser();

    const newEntry: JournalEntry = {
      ...entry,
      id,
      journalNumber,
      status: entry.status || 'Posted',
      totalDebit,
      totalCredit,
      createdDate: today,
      createdBy: user?.fullName || 'System',
      postedDate: entry.status !== 'Draft' ? today : undefined,
      postedBy: entry.status !== 'Draft' ? (user?.fullName || 'System') : undefined
    };

    this.journalEntries.update(list => [newEntry, ...list]);
    this.saveState();

    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'JournalEntry',
      entityId: journalNumber,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newEntry),
      details: `Posted Journal Entry ${journalNumber} (Ref: ${entry.reference}) with value $${totalDebit}. Description: ${entry.description}`
    });

    return newEntry;
  }

  voidJournalEntry(id: string) {
    const entry = this.journalEntries().find(e => e.id === id);
    if (!entry) return;

    if (entry.status === 'Voided') {
      throw new Error(`Journal Entry ${entry.journalNumber} is already voided.`);
    }

    this.journalEntries.update(list =>
      list.map(e => e.id === id ? { ...e, status: 'Voided' as const } : e)
    );
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'JournalEntry',
      entityId: entry.journalNumber,
      action: 'Status Change',
      oldValue: 'Status: Posted',
      newValue: 'Status: Voided',
      details: `Voided Journal Entry ${entry.journalNumber} of value $${entry.totalDebit}.`
    });
  }

  // --- Initial Mock Data Seeding ---
  private initializeMockData() {
    const standardAccounts: ChartOfAccount[] = [
      // Assets
      { id: 'a1', code: '100000', name: 'Assets', type: 'Asset', isActive: true, isReconciliation: false },
      { id: 'a2', code: '110000', name: 'Cash & Banks', type: 'Asset', parentCode: '100000', isActive: true, isReconciliation: false },
      { id: 'a3', code: '111000', name: 'Cash at Bank (USD)', type: 'Asset', parentCode: '110000', isActive: true, isReconciliation: true },
      { id: 'a4', code: '112000', name: 'Cash at Bank (EGP)', type: 'Asset', parentCode: '110000', isActive: true, isReconciliation: true },
      { id: 'a5', code: '113000', name: 'Petty Cash', type: 'Asset', parentCode: '110000', isActive: true, isReconciliation: true },
      { id: 'a6', code: '120000', name: 'Receivables', type: 'Asset', parentCode: '100000', isActive: true, isReconciliation: false },
      { id: 'a7', code: '121000', name: 'Accounts Receivable (A/R)', type: 'Asset', parentCode: '120000', isActive: true, isReconciliation: false },
      { id: 'a8', code: '122000', name: 'Retentions Receivable', type: 'Asset', parentCode: '120000', isActive: true, isReconciliation: false },
      { id: 'a9', code: '130000', name: 'Inventory Asset', type: 'Asset', parentCode: '100000', isActive: true, isReconciliation: false },
      { id: 'a10', code: '131000', name: 'Material Warehouse Stock', type: 'Asset', parentCode: '130000', isActive: true, isReconciliation: false },

      // Liabilities
      { id: 'l1', code: '200000', name: 'Liabilities', type: 'Liability', isActive: true, isReconciliation: false },
      { id: 'l2', code: '210000', name: 'Payables & Accruals', type: 'Liability', parentCode: '200000', isActive: true, isReconciliation: false },
      { id: 'l3', code: '211000', name: 'Accounts Payable (A/P)', type: 'Liability', parentCode: '210000', isActive: true, isReconciliation: false },
      { id: 'l4', code: '212000', name: 'Accrued Salaries & Payroll', type: 'Liability', parentCode: '210000', isActive: true, isReconciliation: false },
      { id: 'l5', code: '213000', name: 'Withholding Tax Payable', type: 'Liability', parentCode: '210000', isActive: true, isReconciliation: false },
      { id: 'l6', code: '214000', name: 'VAT Payable', type: 'Liability', parentCode: '210000', isActive: true, isReconciliation: false },

      // Equity
      { id: 'e1', code: '300000', name: 'Equity', type: 'Equity', isActive: true, isReconciliation: false },
      { id: 'e2', code: '310000', name: 'Share Capital', type: 'Equity', parentCode: '300000', isActive: true, isReconciliation: false },
      { id: 'e3', code: '320000', name: 'Retained Earnings', type: 'Equity', parentCode: '300000', isActive: true, isReconciliation: false },

      // Revenue
      { id: 'r1', code: '400000', name: 'Revenue', type: 'Revenue', isActive: true, isReconciliation: false },
      { id: 'r2', code: '410000', name: 'Drilling Services Revenue', type: 'Revenue', parentCode: '400000', isActive: true, isReconciliation: false },
      { id: 'r3', code: '420000', name: 'Equipment Mobilization Revenue', type: 'Revenue', parentCode: '400000', isActive: true, isReconciliation: false },

      // Expenses
      { id: 'ex1', code: '500000', name: 'Expenses', type: 'Expense', isActive: true, isReconciliation: false },
      { id: 'ex2', code: '510000', name: 'Direct Cost of Services', type: 'Expense', parentCode: '500000', isActive: true, isReconciliation: false },
      { id: 'ex3', code: '511000', name: 'Project Material Consumed', type: 'Expense', parentCode: '510000', isActive: true, isReconciliation: false },
      { id: 'ex4', code: '512000', name: 'Project Labor Cost', type: 'Expense', parentCode: '510000', isActive: true, isReconciliation: false },
      { id: 'ex5', code: '513000', name: 'Rig Mobilization & Transfer Costs', type: 'Expense', parentCode: '510000', isActive: true, isReconciliation: false },
      { id: 'ex6', code: '514000', name: 'Equipment Maintenance Expenses', type: 'Expense', parentCode: '510000', isActive: true, isReconciliation: false },
      { id: 'ex7', code: '520000', name: 'Indirect & Admin Expenses', type: 'Expense', parentCode: '500000', isActive: true, isReconciliation: false },
      { id: 'ex8', code: '521000', name: 'General & Administrative Costs', type: 'Expense', parentCode: '520000', isActive: true, isReconciliation: false }
    ];

    const initialEntries: JournalEntry[] = [
      {
        id: 'je_1',
        journalNumber: 'JE-2026-0001',
        date: '2026-05-01',
        reference: 'SYS-INIT',
        description: 'Initial capital funding by shareholders',
        status: 'Posted',
        lines: [
          { id: 'jel_1', accountCode: '111000', accountName: 'Cash at Bank (USD)', debit: 1000000, credit: 0 },
          { id: 'jel_2', accountCode: '310000', accountName: 'Share Capital', debit: 0, credit: 1000000 }
        ],
        totalDebit: 1000000,
        totalCredit: 1000000,
        createdDate: '2026-05-01',
        createdBy: 'System Admin'
      },
      {
        id: 'je_2',
        journalNumber: 'JE-2026-0002',
        date: '2026-05-10',
        reference: 'PO-2026-001',
        description: 'Purchase of warehouse spares and drilling consumables from Vendor A',
        status: 'Posted',
        lines: [
          { id: 'jel_3', accountCode: '131000', accountName: 'Material Warehouse Stock', debit: 250000, credit: 0 },
          { id: 'jel_4', accountCode: '211000', accountName: 'Accounts Payable (A/P)', debit: 0, credit: 250000 }
        ],
        totalDebit: 250000,
        totalCredit: 250000,
        createdDate: '2026-05-10',
        createdBy: 'Sophia Sterling'
      },
      {
        id: 'je_3',
        journalNumber: 'JE-2026-0003',
        date: '2026-05-15',
        reference: 'PAYROLL-MAY',
        description: 'Accrual of offshore rig operations crew salaries for May 2026',
        status: 'Posted',
        lines: [
          { id: 'jel_5', accountCode: '512000', accountName: 'Project Labor Cost', debit: 45000, credit: 0, projectCode: 'PRJ-2026-001', costCenterCode: 'CC-OPS-01' },
          { id: 'jel_6', accountCode: '212000', accountName: 'Accrued Salaries & Payroll', debit: 0, credit: 45000 }
        ],
        totalDebit: 45000,
        totalCredit: 45000,
        createdDate: '2026-05-15',
        createdBy: 'Sophia Sterling'
      }
    ];

    this.accounts.set(standardAccounts);
    this.journalEntries.set(initialEntries);
    this.saveState();
  }
}
