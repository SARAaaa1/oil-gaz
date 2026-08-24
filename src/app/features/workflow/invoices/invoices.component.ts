import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  BillingApiService,
  Invoice,
  Wcc,
  CreateInvoiceFromWccBody
} from '../../../core/services/billing-api.service';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesComponent implements OnInit {
  private readonly billingApi  = inject(BillingApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate   = inject(TranslateService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly invoices   = signal<Invoice[]>([]);
  readonly wccs       = signal<Wcc[]>([]);
  readonly isLoading  = signal(false);
  readonly isCreating = signal(false);
  readonly selectedInvoice = signal<Invoice | null>(null);

  searchQuery   = '';
  statusFilter  = 'ALL';
  isModalOpen   = signal(false);
  selectedWccId = '';
  formModel: any = this.emptyForm();

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly approvedWccs = computed(() => this.wccs().filter(w => w.status === 'Approved'));

  readonly filteredInvoices = computed(() => {
    let list = this.invoices();
    const query = this.searchQuery.trim().toLowerCase();
    if (this.statusFilter !== 'ALL') list = list.filter(i => i.status === this.statusFilter);
    if (query) list = list.filter(i =>
      i.invoiceNumber?.toLowerCase().includes(query) ||
      i.wccNumber?.toLowerCase().includes(query) ||
      i.clientName?.toLowerCase().includes(query) ||
      i.contractNumber?.toLowerCase().includes(query)
    );
    return [...list].sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.invoices.breadcrumb') }
    ]);
    this.loadInvoices();
    this.loadApprovedWccs();
  }

  loadInvoices() {
    this.isLoading.set(true);
    this.billingApi.getInvoices({ limit: 100 }).subscribe({
      next: (res: any) => {
        const raw = res.items ?? res;
        const list = (Array.isArray(raw) ? raw : []).map(i => ({
          ...i,
          id: i._id ?? i.id,
          issueDate: i.invoiceDate ?? i.issueDate,
          paidAmount: i.totalCollected ?? i.paidAmount ?? 0
        }));
        this.invoices.set(list);
        const filtered = this.filteredInvoices();
        if (filtered.length > 0 && !this.selectedInvoice()) this.selectedInvoice.set(filtered[0]);
        this.isLoading.set(false);
      },
      error: () => { this.notificationService.danger('Error', 'Failed to load invoices'); this.isLoading.set(false); }
    });
  }

  loadApprovedWccs() {
    this.billingApi.getWccs({ status: 'Approved', limit: 100 }).subscribe({
      next: (res: any) => {
        const raw = res.items ?? res;
        this.wccs.set((Array.isArray(raw) ? raw : []).map((w: any) => ({ ...w, id: w._id ?? w.id })));
      },
      error: () => {}
    });
  }

  onDateChange() {
    this.recalculateAmounts();
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  selectInvoice(inv: Invoice) { this.selectedInvoice.set(inv); }

  // ── Permissions ───────────────────────────────────────────────────────────
  canCreate() {
    const r = this.authService.currentUser()?.role;
    return r === 'Super Admin' || r === 'Finance Manager' || r === 'General Manager';
  }
  canApprove() { return this.canCreate(); }

  // ── Actions ───────────────────────────────────────────────────────────────
  approveInvoice(invOrId?: any) {
    const id = typeof invOrId === 'string' ? invOrId : (invOrId?._id ?? invOrId?.id ?? this.selectedInvoice()?._id);
    if (!id) return;
    this.billingApi.postGlInvoice(id).subscribe({
      next: () => {
        this.notificationService.success('Invoice Approved', 'GL journal entry posted successfully');
        this.loadInvoices();
      },
      error: (err: any) => this.notificationService.danger('Error', err?.error?.message || 'Approval failed')
    });
  }

  sendInvoice(invOrId?: any) {
    const id = typeof invOrId === 'string' ? invOrId : (invOrId?._id ?? invOrId?.id ?? this.selectedInvoice()?._id);
    if (!id) return;
    this.billingApi.postGlInvoice(id).subscribe({
      next: () => {
        this.notificationService.success('Invoice Sent', 'Invoice issued and sent to client');
        this.loadInvoices();
      },
      error: (err: any) => this.notificationService.danger('Error', err?.error?.message || 'Send failed')
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openCreateModal() {
    this.selectedWccId = '';
    this.formModel = this.emptyForm();
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  onWccChange() {
    const wcc = this.wccs().find(w => w._id === this.selectedWccId);
    if (wcc) {
      this.formModel.wccId        = wcc._id;
      this.formModel.wccNumber    = wcc.wccNumber;
      this.formModel.subtotal     = wcc.subtotal;
      this.formModel.retentionPercent = wcc.retentionPercent;
      this.recalculateAmounts();
    }
  }

  recalculateAmounts() {
    const sub = Number(this.formModel.subtotal) || 0;
    const vat = Math.round(sub * (Number(this.formModel.vatPercent)            / 100));
    const ret = Math.round(sub * (Number(this.formModel.retentionPercent)      / 100));
    const wht = Math.round(sub * (Number(this.formModel.withholdingTaxPercent) / 100));
    this.formModel.vatAmount             = vat;
    this.formModel.retentionAmount       = ret;
    this.formModel.withholdingTaxAmount  = wht;
    this.formModel.netPayable            = (sub + vat) - ret - wht;
  }

  // ── Save ⚡ ────────────────────────────────────────────────────────────────
  saveInvoice() {
    if (!this.selectedWccId) {
      this.notificationService.danger('Validation', 'Please select an approved WCC');
      return;
    }
    if (!this.formModel.dueDate) {
      this.notificationService.danger('Validation', 'Please set a due date');
      return;
    }

    const body: CreateInvoiceFromWccBody = {
      wccId:                  this.selectedWccId,
      vatPercent:             Number(this.formModel.vatPercent) || 15,
      withholdingTaxPercent:  Number(this.formModel.withholdingTaxPercent) || 5,
      dueDate:                this.formModel.dueDate
    };

    this.isCreating.set(true);
    this.billingApi.createInvoiceFromWcc(body).subscribe({
      next: ({ invoice, glEntry }) => {
        this.notificationService.success(
          'Invoice Created',
          `${invoice.invoiceNumber} created. GL Entry: ${glEntry.entryNumber}`
        );
        this.invoices.update(list => [invoice, ...list]);
        this.selectedInvoice.set(invoice);
        this.isModalOpen.set(false);
        this.isCreating.set(false);
        this.loadApprovedWccs(); // refresh WCC list (remove invoiced ones)
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to create invoice');
        this.isCreating.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private emptyForm() {
    return {
      wccId: '', wccNumber: '', subtotal: 0,
      vatPercent: 15, vatAmount: 0,
      retentionPercent: 10, retentionAmount: 0,
      withholdingTaxPercent: 5, withholdingTaxAmount: 0,
      netPayable: 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }
}
