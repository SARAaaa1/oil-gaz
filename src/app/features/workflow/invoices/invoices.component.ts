import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { Invoice, WCC, Contract } from '../../../shared/interfaces/workflow.interface';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesComponent implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly invoices = this.workflowService.invoices;
  readonly wccs = this.workflowService.wccs;
  readonly contracts = this.workflowService.contracts;
  readonly selectedInvoice = signal<Invoice | null>(null);

  searchQuery = '';
  statusFilter = 'ALL';
  isModalOpen = signal(false);
  selectedWccId = '';
  formModel: any = {
    contractId: '', contractNumber: '', wccId: '', wccNumber: '',
    clientName: '', clientContact: '', issueDate: '', dueDate: '',
    subtotal: 0, vatPercent: 15, vatAmount: 0, retentionPercent: 10,
    retentionAmount: 0, withholdingTaxPercent: 2, withholdingTaxAmount: 0,
    totalAmount: 0, netPayable: 0, currency: 'USD', paymentTerms: 'Net 30', notes: ''
  };

  readonly approvedWccs = computed(() => this.wccs().filter(w => w.status === 'Approved'));

  readonly filteredInvoices = computed(() => {
    let list = this.invoices();
    const query = this.searchQuery.trim().toLowerCase();
    if (this.statusFilter !== 'ALL') list = list.filter(i => i.status === this.statusFilter);
    if (query) list = list.filter(i =>
      i.invoiceNumber.toLowerCase().includes(query) ||
      i.wccNumber.toLowerCase().includes(query) ||
      i.clientName.toLowerCase().includes(query) ||
      i.contractNumber.toLowerCase().includes(query)
    );
    return [...list].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.invoices.breadcrumb') }
    ]);
    const list = this.filteredInvoices();
    if (list.length > 0) this.selectedInvoice.set(list[0]);
  }

  selectInvoice(inv: Invoice) { this.selectedInvoice.set(inv); }

  canCreate() {
    const role = this.authService.currentUser()?.role;
    return role === 'Super Admin' || role === 'Finance Manager' || role === 'General Manager';
  }

  canApprove() { return this.canCreate(); }

  approveInvoice(id: string) {
    const name = this.authService.currentUser()?.fullName || this.translate.instant('workflow.invoices.default_auditor_name');
    this.workflowService.approveInvoice(id, name, this.translate.instant('workflow.invoices.default_approve_comments'));
    const updated = this.invoices().find(i => i.id === id);
    if (updated) this.selectedInvoice.set(updated);
  }

  sendInvoice(id: string) {
    this.workflowService.sendInvoice(id);
    const updated = this.invoices().find(i => i.id === id);
    if (updated) this.selectedInvoice.set(updated);
  }

  openCreateModal() {
    this.selectedWccId = '';
    this.formModel = {
      contractId: '', contractNumber: '', wccId: '', wccNumber: '',
      clientName: '', clientContact: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 0, vatPercent: 15, vatAmount: 0, retentionPercent: 10,
      retentionAmount: 0, withholdingTaxPercent: 2, withholdingTaxAmount: 0,
      totalAmount: 0, netPayable: 0, currency: 'USD', paymentTerms: 'Net 30', notes: ''
    };
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  onWccChange() {
    const wcc = this.wccs().find(w => w.id === this.selectedWccId);
    if (wcc) {
      const contract = this.contracts().find(c => c.contractNumber === wcc.contractNumber);
      this.formModel.contractId = wcc.contractId;
      this.formModel.contractNumber = wcc.contractNumber;
      this.formModel.wccId = wcc.id;
      this.formModel.wccNumber = wcc.wccNumber;
      this.formModel.clientName = wcc.clientName;
      this.formModel.subtotal = wcc.subtotal;
      this.formModel.retentionPercent = contract ? contract.retentionPercent : 10;
      this.formModel.paymentTerms = contract ? contract.paymentTerms : 'Net 30';
      this.formModel.clientContact = contract ? contract.clientContact : this.translate.instant('workflow.invoices.default_representative');
      this.onDateChange();
      this.recalculateAmounts();
    }
  }

  onDateChange() {
    if (this.formModel.issueDate) {
      const days = this.formModel.paymentTerms.toLowerCase().includes('45') ? 45 :
                   this.formModel.paymentTerms.toLowerCase().includes('15') ? 15 : 30;
      const issue = new Date(this.formModel.issueDate);
      issue.setDate(issue.getDate() + days);
      this.formModel.dueDate = issue.toISOString().split('T')[0];
    }
  }

  recalculateAmounts() {
    const sub = Number(this.formModel.subtotal) || 0;
    const vat = Math.round(sub * (Number(this.formModel.vatPercent) / 100));
    const ret = Math.round(sub * (Number(this.formModel.retentionPercent) / 100));
    const wht = Math.round(sub * (Number(this.formModel.withholdingTaxPercent) / 100));
    this.formModel.vatAmount = vat;
    this.formModel.retentionAmount = ret;
    this.formModel.withholdingTaxAmount = wht;
    this.formModel.totalAmount = sub + vat;
    this.formModel.netPayable = sub + vat - ret - wht;
  }

  saveInvoice() {
    if (!this.selectedWccId) return;
    this.workflowService.createInvoice(this.formModel);
    this.isModalOpen.set(false);
    const list = this.invoices();
    if (list.length > 0) this.selectedInvoice.set(list[list.length - 1]);
  }
}
