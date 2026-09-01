import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FinanceApiService } from '../../../../core/services/finance-api.service';
import { ReconciliationSession, ReconciliationStatus, StatementTransaction, SystemTransaction } from '../../shared/treasury.interfaces';
import { BranchService } from '../../shared/branch.service';

@Component({
  selector: 'app-finv2-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './reconciliation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2ReconciliationComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);

  readonly reconciliations = signal<any[]>([]);
  readonly bankAccounts = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly showCreateModal = signal(false);

  readonly selectedId   = signal<string | null>(null);
  readonly statusFilter = signal<ReconciliationStatus | 'All'>('All');
  readonly branchFilter = signal('All');

  // Manual matching selections
  readonly selectedStmtTxId = signal<string | null>(null);
  readonly selectedSysTxId  = signal<string | null>(null);

  readonly filtered = computed(() => {
    const st = this.statusFilter();
    const br = this.branchFilter();
    return this.reconciliations()
      .filter(r => {
        const ms = st === 'All' || r.status === st;
        const mb = br === 'All' || (r.branchId || 'HeadOffice') === br;
        return ms && mb;
      });
  });

  readonly activeSession = computed(() => {
    const id = this.selectedId();
    return id ? (this.reconciliations().find(r => r.id === id || r._id === id) ?? null) : null;
  });

  selectSession(sess: ReconciliationSession) {
    this.selectedId.set(sess.id);
    this.selectedStmtTxId.set(null);
    this.selectedSysTxId.set(null);
  }

  autoMatch() {
    const sess = this.activeSession();
    if (!sess || sess.status === 'Approved') return;

    let matchedCount = 0;
    const stmt = sess.statementTransactions.map((st: any) => {
      if (st.matched) return st;
      // Search for unmatched system txn with same reference and amount
      const match = sess.systemTransactions.find((sy: any) => !sy.matched && sy.reference === st.reference && sy.amount === st.amount);
      if (match) {
        st.matched = true;
        match.matched = true;
        matchedCount++;
      }
      return st;
    });

    if (matchedCount > 0) {
      this.reconciliations.update(list =>
        list.map(r => (r.id === sess.id || r._id === sess.id) ? {
          ...r,
          statementTransactions: stmt,
          matchedCount: r.matchedCount + matchedCount,
          unmatchedCount: Math.max(0, r.unmatchedCount - matchedCount),
          difference: r.difference - (matchedCount * 100) // Dummy difference adjustment
        } : r)
      );
      this.notify.success('finance_v2.treasury.reconciliation.auto_match_success', 'finance_v2.treasury.reconciliation.auto_match_success_desc');
    } else {
      this.notify.info('finance_v2.treasury.reconciliation.auto_match_none', 'finance_v2.treasury.reconciliation.auto_match_none_desc');
    }
  }

  selectStmtTx(id: string) {
    const sess = this.activeSession();
    if (!sess || sess.status === 'Approved') return;
    const tx = sess.statementTransactions.find((t: any) => t.id === id);
    if (tx?.matched) return;
    this.selectedStmtTxId.set(this.selectedStmtTxId() === id ? null : id);
  }

  selectSysTx(id: string) {
    const sess = this.activeSession();
    if (!sess || sess.status === 'Approved') return;
    const tx = sess.systemTransactions.find((t: any) => t.id === id);
    if (tx?.matched) return;
    this.selectedSysTxId.set(this.selectedSysTxId() === id ? null : id);
  }

  manualMatch() {
    const stmtId = this.selectedStmtTxId();
    const sysId  = this.selectedSysTxId();
    const sess   = this.activeSession();
    if (!stmtId || !sysId || !sess) return;

    const stmtTx = sess.statementTransactions.find((t: any) => t.id === stmtId);
    const sysTx  = sess.systemTransactions.find((t: any) => t.id === sysId);

    if (!stmtTx || !sysTx) return;

    if (stmtTx.amount !== sysTx.amount) {
      this.notify.warning('finance_v2.treasury.reconciliation.error_mismatch', 'finance_v2.treasury.reconciliation.error_mismatch_desc');
      return;
    }

    // Set matched
    stmtTx.matched = true;
    sysTx.matched  = true;

    this.reconciliations.update(list =>
      list.map(r => (r.id === sess.id || r._id === sess.id) ? {
        ...r,
        matchedCount: r.matchedCount + 1,
        unmatchedCount: Math.max(0, r.unmatchedCount - 1),
        difference: Math.max(0, r.difference - 100)
      } : r)
    );

    this.selectedStmtTxId.set(null);
    this.selectedSysTxId.set(null);
    this.notify.success('finance_v2.treasury.reconciliation.matched', 'finance_v2.treasury.reconciliation.matched_desc');
  }

  approveReconciliation(sess: ReconciliationSession) {
    if (sess.status === 'Approved') return;
    
    if (sess.unmatchedCount > 0) {
      this.notify.warning('finance_v2.treasury.reconciliation.error_unmatched', 'finance_v2.treasury.reconciliation.error_unmatched_desc');
      return;
    }

    this.reconciliations.update(list =>
      list.map(r => (r.id === sess.id || r._id === sess.id) ? { ...r, status: 'Approved' } : r)
    );
    this.notify.success('finance_v2.treasury.reconciliation.approved', 'finance_v2.treasury.reconciliation.approved_desc');
  }

  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  getStatusClass(s: ReconciliationStatus): string {
    return s === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500';
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.treasury.title' },
      { label: 'finance_v2.treasury.banks.btn_reconcile' }
    ]);
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    
    this.financeApi.getBankAccounts().subscribe({
      next: res => this.bankAccounts.set(res.data)
    });

    this.financeApi.getReconciliations().subscribe({
      next: recs => {
        this.reconciliations.set(recs);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  createReconciliation(form: any) {
    this.isSaving.set(true);
    this.financeApi.createReconciliation({
      bankAccountId: form.bankAccountId,
      statementPeriod: form.statementPeriod,
      statementEndDate: form.statementEndDate,
      statementBalance: form.statementBalance
    }).subscribe({
      next: created => {
        this.reconciliations.update(l => [{...created, id: created._id}, ...l]);
        this.showCreateModal?.set(false);
        this.notify.success('Reconciliation Created', '');
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}
