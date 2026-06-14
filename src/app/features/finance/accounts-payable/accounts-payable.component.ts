import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SupplierInvoice, APAgingEntry, PaymentVoucher, BankAccountDetails, CashAccountDetails } from '../../../shared/interfaces/finance-extended.interface';
import { Vendor } from '../../../shared/interfaces/vendor.interface';
import { PurchaseOrder } from '../../../shared/interfaces/purchase-order.interface';

@Component({
  selector: 'app-accounts-payable',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './accounts-payable.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsPayableComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  // Core signals from service
  readonly invoices = this.mockDataService.supplierInvoices;
  readonly aging = this.mockDataService.apAging;
  readonly vouchers = this.mockDataService.paymentVouchers;
  readonly bankAccounts = this.mockDataService.bankAccountsDetails;
  readonly cashAccounts = this.mockDataService.cashAccountsDetails;
  readonly vendors = this.mockDataService.vendors;
  readonly purchaseOrders = this.mockDataService.purchaseOrders;

  // UI States
  readonly activeTab = signal<'invoices' | 'aging' | 'vouchers'>('invoices');
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('All');

  // Modal States
  readonly showInvoiceModal = signal<boolean>(false);
  readonly showVoucherModal = signal<boolean>(false);
  readonly showDetailsModal = signal<boolean>(false);
  readonly selectedInvoice = signal<SupplierInvoice | null>(null);

  // Form: Supplier Invoice
  invoiceNumber = '';
  selectedPoId = '';
  selectedVendorId = '';
  invoiceDate = new Date().toISOString().split('T')[0];
  dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Net 30 default
  subTotal = 0;
  taxAmount = 0;
  paymentTerms = 'Net 30';

  // Form: Payment Voucher
  voucherDate = new Date().toISOString().split('T')[0];
  voucherVendorId = signal<string>('');
  selectedAccountType = signal<'bank' | 'cash'>('bank');
  selectedAccountId = '';
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash' = 'Bank Transfer';
  referenceNumber = '';
  paymentAmount = 0;
  selectedInvoicePayments = signal<{ invoiceId: string; invoiceNumber: string; amountDue: number; amountPaid: number; selected: boolean }[]>([]);

  // Computed totals for dashboard KPI cards
  readonly kpis = computed(() => {
    const invList = this.invoices();
    const unpaid = invList.filter(i => i.status === 'Unpaid' || i.status === 'Partially Paid');
    const totalOutstanding = unpaid.reduce((sum, i) => sum + i.totalAmount, 0); // simplification for mock
    
    // Total payments posted this month
    const payList = this.vouchers().filter(v => v.status === 'Posted');
    const totalPaid = payList.reduce((sum, v) => sum + v.amount, 0);

    // Overdue count (due date passed and status unpaid/partially paid)
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = unpaid.filter(i => i.dueDate < todayStr).length;

    return {
      totalOutstanding,
      totalPaid,
      overdueCount,
      activeVendorCount: this.vendors().length
    };
  });

  // Filtered lists
  readonly filteredInvoices = computed(() => {
    let list = this.invoices();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    if (query) {
      list = list.filter(i => 
        i.invoiceNumber.toLowerCase().includes(query) ||
        i.vendorName.toLowerCase().includes(query) ||
        (i.poNumber && i.poNumber.toLowerCase().includes(query))
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
        v.vendorName.toLowerCase().includes(query) ||
        v.referenceNumber.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.ap_ledger' }
    ]);
  }

  // Invoice calculations
  readonly totalInvoiceAmount = computed(() => {
    return (Number(this.subTotal) || 0) + (Number(this.taxAmount) || 0);
  });

  // Automatically pre-fill vendor and amount based on selected PO
  onPoChange(poId: string) {
    if (!poId) return;
    const po = this.purchaseOrders().find(p => p.id === poId);
    if (po) {
      this.selectedVendorId = po.vendorId;
      // Mock subtotal & tax from PO amount
      this.subTotal = po.totalAmount;
      this.taxAmount = parseFloat((po.totalAmount * 0.15).toFixed(2)); // 15% VAT default
    }
  }

  openAddItemModal() {
    // Standard template method call
    this.openAddInvoiceModal();
  }

  openAddInvoiceModal() {
    this.invoiceNumber = 'INV-' + Math.floor(1000 + Math.random() * 9000);
    this.selectedPoId = '';
    this.selectedVendorId = '';
    this.subTotal = 0;
    this.taxAmount = 0;
    this.invoiceDate = new Date().toISOString().split('T')[0];
    this.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    this.paymentTerms = 'Net 30';
    this.showInvoiceModal.set(true);
  }

  submitInvoice() {
    if (!this.invoiceNumber || !this.selectedVendorId) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const vendor = this.vendors().find(v => v.id === this.selectedVendorId);
    const po = this.purchaseOrders().find(p => p.id === this.selectedPoId);

    const newInvoice: SupplierInvoice = {
      id: 'ap-' + Math.random().toString(36).substring(2, 9),
      invoiceNumber: this.invoiceNumber,
      poId: this.selectedPoId || undefined,
      poNumber: po?.poNumber || undefined,
      vendorId: this.selectedVendorId,
      vendorName: vendor?.vendorName || 'Unknown Vendor',
      invoiceDate: this.invoiceDate,
      dueDate: this.dueDate,
      subTotal: Number(this.subTotal),
      taxAmount: Number(this.taxAmount),
      totalAmount: this.totalInvoiceAmount(),
      status: 'Unpaid',
      paymentTerms: this.paymentTerms
    };

    // Update invoices list
    this.invoices.update(prev => [newInvoice, ...prev]);

    // Recalculate or append aging entry
    this.updateAgingOnNewInvoice(newInvoice);

    this.showInvoiceModal.set(false);
    this.notificationService.success('finance.ap.invoice_created_title', 'finance.ap.invoice_created_desc');
  }

  private updateAgingOnNewInvoice(invoice: SupplierInvoice) {
    const currentAging = this.aging();
    const vendorIdx = currentAging.findIndex(a => a.vendorId === invoice.vendorId);
    
    if (vendorIdx > -1) {
      const updatedEntry = { ...currentAging[vendorIdx] };
      updatedEntry.totalDue += invoice.totalAmount;
      updatedEntry.current += invoice.totalAmount; // place in current 0-30 days
      
      const newAging = [...currentAging];
      newAging[vendorIdx] = updatedEntry;
      this.aging.set(newAging);
    } else {
      const newEntry: APAgingEntry = {
        vendorId: invoice.vendorId,
        vendorName: invoice.vendorName,
        totalDue: invoice.totalAmount,
        current: invoice.totalAmount,
        thirtyToSixty: 0,
        sixtyToNinety: 0,
        overNinety: 0
      };
      this.aging.update(prev => [...prev, newEntry]);
    }
  }

  // Payment Voucher Flow
  onVoucherVendorChange(vendorId: string) {
    this.voucherVendorId.set(vendorId);
    if (!vendorId) {
      this.selectedInvoicePayments.set([]);
      return;
    }

    // Get all unpaid/partially paid invoices for this vendor
    const vendorInvoices = this.invoices().filter(i => 
      i.vendorId === vendorId && (i.status === 'Unpaid' || i.status === 'Partially Paid')
    );

    const invoicePayments = vendorInvoices.map(i => {
      // Find payments already made for this invoice in existing vouchers to calculate due
      const alreadyPaid = this.vouchers()
        .filter(v => v.status === 'Posted' && v.vendorId === vendorId)
        .reduce((sum, v) => {
          const invMatch = v.invoicesPaid.find(ip => ip.invoiceId === i.id);
          return sum + (invMatch ? invMatch.amountPaid : 0);
        }, 0);

      const amountDue = Math.max(0, i.totalAmount - alreadyPaid);

      return {
        invoiceId: i.id,
        invoiceNumber: i.invoiceNumber,
        amountDue: amountDue,
        amountPaid: amountDue, // default to paying full due
        selected: false
      };
    });

    this.selectedInvoicePayments.set(invoicePayments);
    this.calculatePaymentAmount();
  }

  toggleInvoiceSelection(index: number) {
    const current = [...this.selectedInvoicePayments()];
    current[index].selected = !current[index].selected;
    this.selectedInvoicePayments.set(current);
    this.calculatePaymentAmount();
  }

  onPaymentAmountChange(index: number, val: number) {
    const current = [...this.selectedInvoicePayments()];
    current[index].amountPaid = Number(val) || 0;
    this.selectedInvoicePayments.set(current);
    this.calculatePaymentAmount();
  }

  private calculatePaymentAmount() {
    const selectedSum = this.selectedInvoicePayments()
      .filter(ip => ip.selected)
      .reduce((sum, ip) => sum + ip.amountPaid, 0);
    this.paymentAmount = selectedSum;
  }

  openAddVoucherModal() {
    this.voucherDate = new Date().toISOString().split('T')[0];
    this.voucherVendorId.set('');
    this.selectedAccountType.set('bank');
    this.selectedAccountId = this.bankAccounts()[0]?.id || '';
    this.paymentMethod = 'Bank Transfer';
    this.referenceNumber = 'REF-' + Math.floor(100000 + Math.random() * 900000);
    this.paymentAmount = 0;
    this.selectedInvoicePayments.set([]);
    this.showVoucherModal.set(true);
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

  submitVoucher() {
    const vendorId = this.voucherVendorId();
    if (!vendorId || !this.selectedAccountId) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const selectedInvoices = this.selectedInvoicePayments().filter(ip => ip.selected);
    if (selectedInvoices.length === 0) {
      this.notificationService.danger('common.validation_error', 'finance.ap.select_invoices_error');
      return;
    }

    const vendor = this.vendors().find(v => v.id === vendorId);
    let accountName = '';

    // Verify account and decrement balance
    if (this.selectedAccountType() === 'bank') {
      const bank = this.bankAccounts().find(b => b.id === this.selectedAccountId);
      if (bank) {
        accountName = bank.bankName + ' (' + bank.accountNumber + ')';
        if (bank.balance < this.paymentAmount) {
          this.notificationService.danger('finance.ap.insufficient_funds_title', 'finance.ap.insufficient_funds_desc');
          return;
        }
        // Deduct from bank balance
        this.bankAccounts.update(accounts => 
          accounts.map(a => a.id === bank.id ? { ...a, balance: a.balance - this.paymentAmount } : a)
        );
      }
    } else {
      const cash = this.cashAccounts().find(c => c.id === this.selectedAccountId);
      if (cash) {
        accountName = cash.officeLocation + ' Custodian: ' + cash.custodianName;
        if (cash.balance < this.paymentAmount) {
          this.notificationService.danger('finance.ap.insufficient_funds_title', 'finance.ap.insufficient_funds_desc');
          return;
        }
        // Deduct from cash balance
        this.cashAccounts.update(accounts => 
          accounts.map(a => a.id === cash.id ? { ...a, balance: a.balance - this.paymentAmount } : a)
        );
      }
    }

    const voucherNum = 'PV-2026-' + Math.floor(100 + Math.random() * 900);
    const newVoucher: PaymentVoucher = {
      id: 'pv-' + Math.random().toString(36).substring(2, 9),
      voucherNumber: voucherNum,
      paymentDate: this.voucherDate,
      vendorId: vendorId,
      vendorName: vendor?.vendorName || 'Unknown Vendor',
      bankAccountId: this.selectedAccountId,
      bankAccountName: accountName,
      paymentMethod: this.paymentMethod,
      referenceNumber: this.referenceNumber,
      amount: this.paymentAmount,
      status: 'Posted',
      invoicesPaid: selectedInvoices.map(si => ({
        invoiceId: si.invoiceId,
        invoiceNumber: si.invoiceNumber,
        amountPaid: si.amountPaid
      }))
    };

    // Update vouchers list
    this.vouchers.update(prev => [newVoucher, ...prev]);

    // Update status and paid amounts of paid invoices
    this.invoices.update(invoicesList => 
      invoicesList.map(inv => {
        const paymentDetails = selectedInvoices.find(si => si.invoiceId === inv.id);
        if (paymentDetails) {
          // Calculate new total paid
          const invoicePaidSoFar = this.vouchers()
            .filter(v => v.status === 'Posted')
            .reduce((sum, v) => {
              const matches = v.invoicesPaid.find(ip => ip.invoiceId === inv.id);
              return sum + (matches ? matches.amountPaid : 0);
            }, 0);

          let newStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
          if (invoicePaidSoFar >= inv.totalAmount) {
            newStatus = 'Paid';
          } else if (invoicePaidSoFar > 0) {
            newStatus = 'Partially Paid';
          }
          return { ...inv, status: newStatus };
        }
        return inv;
      })
    );

    // Update aging entry
    this.aging.update(entries => 
      entries.map(entry => {
        if (entry.vendorId === vendorId) {
          const newTotal = Math.max(0, entry.totalDue - this.paymentAmount);
          const newCurrent = Math.max(0, entry.current - this.paymentAmount);
          return {
            ...entry,
            totalDue: newTotal,
            current: newCurrent
          };
        }
        return entry;
      })
    );

    this.showVoucherModal.set(false);
    this.notificationService.success('finance.ap.voucher_posted_title', 'finance.ap.voucher_posted_desc');
  }

  viewInvoiceDetails(invoice: SupplierInvoice) {
    this.selectedInvoice.set(invoice);
    this.showDetailsModal.set(true);
  }
}
