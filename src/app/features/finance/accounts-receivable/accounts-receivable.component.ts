import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { WorkflowService } from '../../../core/services/workflow.service';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ARAgingEntry, CollectionVoucher, BankAccountDetails, CashAccountDetails } from '../../../shared/interfaces/finance-extended.interface';
import { Invoice } from '../../../shared/interfaces/workflow.interface';

import { FinanceApiService } from '../../../core/services/finance-api.service';

@Component({
  selector: 'app-accounts-receivable',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './accounts-receivable.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsReceivableComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly workflowService = inject(WorkflowService);
  private readonly financeService = inject(FinanceCoreService);
  private readonly financeApi = inject(FinanceApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  // Core signals — populated from API
  readonly clientInvoices = signal<any[]>([]);
  readonly aging = signal<any[]>([]);
  readonly vouchers = signal<any[]>([]);
  readonly bankAccounts = signal<any[]>([]);
  readonly cashAccounts = signal<any[]>([]);
  readonly isLoading = signal(false);

  // UI States
  readonly activeTab = signal<'invoices' | 'aging' | 'vouchers'>('invoices');
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('All');

  // Modal States
  readonly showCollectionModal = signal<boolean>(false);
  readonly showDetailsModal = signal<boolean>(false);
  readonly selectedInvoice = signal<Invoice | null>(null);

  // Form: Collection Voucher
  collectionDate = new Date().toISOString().split('T')[0];
  selectedClientName = signal<string>('');
  selectedAccountType = signal<'bank' | 'cash'>('bank');
  selectedAccountId = '';
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash' = 'Bank Transfer';
  referenceNumber = '';
  collectedAmount = 0;
  selectedInvoiceCollections = signal<{ invoiceId: string; invoiceNumber: string; amountDue: number; amountCollected: number; selected: boolean }[]>([]);

  // Unique clients derived from invoices
  readonly clientsList = computed(() => {
    const invoicesList = this.clientInvoices();
    const clients = new Set<string>();
    invoicesList.forEach(i => {
      if (i.clientName) clients.add(i.clientName);
    });
    return Array.from(clients);
  });

  // Computed totals for dashboard KPI cards
  readonly kpis = computed(() => {
    const invList = this.clientInvoices();
    // Outstanding: Sum of balanceDue of invoices with Sent or Partially Paid
    const outstandingInvoices = invList.filter(i => i.status === 'Sent' || i.status === 'Partially Paid');
    const totalOutstanding = outstandingInvoices.reduce((sum, i) => sum + (i.balanceDue !== undefined ? i.balanceDue : i.netPayable), 0);

    // Total collections posted
    const totalCollected = this.vouchers()
      .filter(v => v.status === 'Posted')
      .reduce((sum, v) => sum + v.amount, 0);

    // Overdue collections (due date passed and balanceDue > 0)
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = invList.filter(i => 
      i.dueDate < todayStr && 
      (i.status === 'Sent' || i.status === 'Partially Paid') &&
      (i.balanceDue === undefined || i.balanceDue > 0)
    ).length;

    return {
      totalOutstanding,
      totalCollected,
      overdueCount,
      totalClients: this.clientsList().length
    };
  });

  // Filtered lists
  readonly filteredInvoices = computed(() => {
    let list = this.clientInvoices();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    if (query) {
      list = list.filter(i => 
        i.invoiceNumber.toLowerCase().includes(query) ||
        i.clientName.toLowerCase().includes(query) ||
        (i.contractNumber && i.contractNumber.toLowerCase().includes(query))
      );
    }

    if (status !== 'All') {
      list = list.filter(i => i.status === status);
    }

    return list;
  });

  readonly filteredVouchers = computed(() => {
    let list = this.vouchers();
    const query = this.searchQuery().trim().toLowerCase();

    if (query) {
      list = list.filter(v => 
        v.voucherNumber.toLowerCase().includes(query) ||
        v.customerName.toLowerCase().includes(query) ||
        v.referenceNumber.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.ar_ledger' }
    ]);
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.financeApi.getArInvoices({ limit: 200 }).subscribe({
      next: (res) => {
        this.clientInvoices.set((res.data || []).map((i: any) => ({ ...i, id: i._id ?? i.id })));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    this.financeApi.getArAging().subscribe({
      next: (res: any) => this.aging.set(Array.isArray(res) ? res : (res.data ?? [])),
      error: () => {}
    });
    this.financeApi.getArVouchers().subscribe({
      next: (res: any) => this.vouchers.set((Array.isArray(res) ? res : (res.data ?? [])).map((v: any) => ({ ...v, id: v._id ?? v.id }))),
      error: () => {}
    });
    this.financeApi.getBankAccounts().subscribe({
      next: (res) => {
        this.bankAccounts.set((res.data || []).map((b: any) => ({ ...b, id: b._id ?? b.id })));
        this.cashAccounts.set([]);
      },
      error: () => {}
    });
  }

  // Client Selection Change
  onClientChange(clientName: string) {
    this.selectedClientName.set(clientName);
    if (!clientName) {
      this.selectedInvoiceCollections.set([]);
      return;
    }

    // Get Sent or Partially Paid invoices for this client
    const clientInvs = this.clientInvoices().filter(i => 
      i.clientName === clientName && (i.status === 'Sent' || i.status === 'Partially Paid')
    );

    const invoiceColls = clientInvs.map(i => {
      const amountDue = i.balanceDue !== undefined ? i.balanceDue : i.netPayable;
      return {
        invoiceId: i.id,
        invoiceNumber: i.invoiceNumber,
        amountDue: amountDue,
        amountCollected: amountDue, // default to collecting full due
        selected: false
      };
    });

    this.selectedInvoiceCollections.set(invoiceColls);
    this.calculateCollectedAmount();
  }

  toggleInvoiceSelection(index: number) {
    const current = [...this.selectedInvoiceCollections()];
    current[index].selected = !current[index].selected;
    this.selectedInvoiceCollections.set(current);
    this.calculateCollectedAmount();
  }

  onCollectionAmountChange(index: number, val: number) {
    const current = [...this.selectedInvoiceCollections()];
    current[index].amountCollected = Number(val) || 0;
    this.selectedInvoiceCollections.set(current);
    this.calculateCollectedAmount();
  }

  private calculateCollectedAmount() {
    const selectedSum = this.selectedInvoiceCollections()
      .filter(ic => ic.selected)
      .reduce((sum, ic) => sum + ic.amountCollected, 0);
    this.collectedAmount = selectedSum;
  }

  openAddCollectionModal() {
    this.collectionDate = new Date().toISOString().split('T')[0];
    this.selectedClientName.set('');
    this.selectedAccountType.set('bank');
    this.selectedAccountId = this.bankAccounts()[0]?.id || '';
    this.paymentMethod = 'Bank Transfer';
    this.referenceNumber = 'REF-COL-' + Math.floor(100000 + Math.random() * 900000);
    this.collectedAmount = 0;
    this.selectedInvoiceCollections.set([]);
    this.showCollectionModal.set(true);
  }

  onAccountTypeChange(type: 'bank' | 'cash') {
    this.selectedAccountType.set(type);
    if (type === 'bank') {
      this.selectedAccountId = this.bankAccounts()[0]?.id || '';
      this.paymentMethod = 'Bank Transfer';
    } else {
      this.selectedAccountId = this.cashAccounts()[0]?.id || '';
      this.paymentMethod = 'Cash';
    }
  }

  submitCollection() {
    const clientName = this.selectedClientName();
    if (!clientName || !this.selectedAccountId) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const selectedInvoices = this.selectedInvoiceCollections().filter(ic => ic.selected);
    if (selectedInvoices.length === 0) {
      this.notificationService.danger('common.validation_error', 'finance.ar.select_invoices_error');
      return;
    }

    this.financeApi.createArVoucher({
      collectionDate: this.collectionDate,
      customerName: clientName,
      bankAccountId: this.selectedAccountId,
      paymentMethod: this.paymentMethod,
      referenceNumber: this.referenceNumber || undefined,
      invoicesCollected: selectedInvoices.map(si => ({
        invoiceId: si.invoiceId,
        invoiceNumber: si.invoiceNumber,
        amountCollected: si.amountCollected
      }))
    }).subscribe({
      next: (created: any) => {
        const normalized = { ...created, id: created._id ?? created.id };
        this.vouchers.update(list => [normalized, ...list]);
        this.showCollectionModal.set(false);
        this.notificationService.success('finance.ar.collection_posted_title', 'finance.ar.collection_posted_desc');
        this.loadAll();
      },
      error: (err: any) => {
        this.notificationService.danger('finance.ar.title', err?.error?.message || 'Failed to create collection voucher');
      }
    });
  }

  viewInvoiceDetails(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.showDetailsModal.set(true);
  }
}
