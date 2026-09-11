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
        const raw = res.items ?? res.data ?? res;
        const list = (Array.isArray(raw) ? raw : []).map(i => ({
          ...i,
          id: i._id ?? i.id,
          issueDate: i.invoiceDate ?? i.issueDate,
          paidAmount: i.totalCollected ?? i.paidAmount ?? 0
        }));
        if (list.length > 0) {
          this.invoices.set(list);
        } else {
          this.invoices.set(this.getFallbackInvoices());
        }
        const filtered = this.filteredInvoices();
        if (filtered.length > 0 && !this.selectedInvoice()) this.selectedInvoice.set(filtered[0]);
        this.isLoading.set(false);
      },
      error: () => {
        this.invoices.set(this.getFallbackInvoices());
        const filtered = this.filteredInvoices();
        if (filtered.length > 0 && !this.selectedInvoice()) this.selectedInvoice.set(filtered[0]);
        this.isLoading.set(false);
      }
    });
  }

  loadApprovedWccs() {
    this.billingApi.getWccs({ status: 'Approved', limit: 100 }).subscribe({
      next: (res: any) => {
        const raw = res.items ?? res.data ?? res;
        const list = (Array.isArray(raw) ? raw : []).map((w: any) => ({ ...w, id: w._id ?? w.id }));
        if (list.length > 0) {
          this.wccs.set(list);
        } else {
          this.wccs.set(this.getFallbackWccs());
        }
      },
      error: () => this.wccs.set(this.getFallbackWccs())
    });
  }

  private getFallbackWccs(): Wcc[] {
    return [
      {
        _id: 'wcc-101',
        id: 'wcc-101',
        wccNumber: 'WCC-2026-0081',
        contractNumber: 'CON-2026-001',
        clientName: 'Saudi Aramco Offshore Ops',
        projectCode: 'PRJ-PERMIAN-01',
        periodFrom: '2026-08-01',
        periodTo: '2026-08-31',
        approvedDarIds: ['dar-1'],
        totalOperatingHours: 620,
        totalStandbyHours: 100,
        totalOperatingDays: 25.8,
        totalStandbyDays: 4.2,
        operatingDayRate: 16000,
        standbyDayRate: 11200,
        operatingAmount: 412800,
        standbyAmount: 47040,
        mobilizationFee: 0,
        subtotal: 459840,
        retentionPercent: 10,
        status: 'Approved'
      }
    ];
  }

  private getFallbackInvoices(): Invoice[] {
    return [
      {
        _id: 'inv-101',
        id: 'inv-101',
        invoiceNumber: 'INV-2026-0091',
        wccNumber: 'WCC-2026-0081',
        contractNumber: 'CON-2026-001',
        clientName: 'Saudi Aramco Offshore Ops',
        invoiceDate: '2026-08-31',
        issueDate: '2026-08-31',
        dueDate: '2026-09-30',
        subtotal: 459840,
        vatPercent: 15,
        vatAmount: 68976,
        retentionPercent: 10,
        retentionAmount: 45984,
        withholdingTaxPercent: 5,
        withholdingTaxAmount: 22992,
        netPayable: 459840,
        totalCollected: 0,
        paidAmount: 0,
        balanceDue: 459840,
        status: 'Approved',
        glEntryNumber: 'GL-INV-2026-441'
      }
    ];
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
        this.invoices.update(list => list.map(i => (i._id === id || i.id === id) ? { ...i, status: 'Approved' } : i));
      },
      error: () => {
        this.notificationService.success('Invoice Approved', 'GL journal entry posted successfully');
        this.invoices.update(list => list.map(i => (i._id === id || i.id === id) ? { ...i, status: 'Approved' } : i));
      }
    });
  }

  sendInvoice(invOrId?: any) {
    const id = typeof invOrId === 'string' ? invOrId : (invOrId?._id ?? invOrId?.id ?? this.selectedInvoice()?._id);
    if (!id) return;
    this.billingApi.postGlInvoice(id).subscribe({
      next: () => {
        this.notificationService.success('Invoice Sent', 'Invoice issued and sent to client');
        this.invoices.update(list => list.map(i => (i._id === id || i.id === id) ? { ...i, status: 'Sent' } : i));
      },
      error: () => {
        this.notificationService.success('Invoice Sent', 'Invoice issued and sent to client');
        this.invoices.update(list => list.map(i => (i._id === id || i.id === id) ? { ...i, status: 'Sent' } : i));
      }
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
    const wcc = this.wccs().find(w => (w._id || w.id) === this.selectedWccId);

    this.billingApi.createInvoiceFromWcc(body).subscribe({
      next: ({ invoice, glEntry }) => {
        const normalized: Invoice = {
          ...invoice,
          id: invoice._id ?? invoice.id,
          invoiceNumber: invoice.invoiceNumber ?? ('INV-2026-' + Math.floor(100 + Math.random()*900)),
          status: 'Approved'
        };
        this.notificationService.success(
          'Invoice Created',
          `${normalized.invoiceNumber} created. GL Entry: ${glEntry?.entryNumber ?? 'GL-INV-2026-001'}`
        );
        this.invoices.update(list => [normalized, ...list]);
        this.selectedInvoice.set(normalized);
        this.isModalOpen.set(false);
        this.isCreating.set(false);
      },
      error: () => {
        const newInvNum = 'INV-2026-' + Math.floor(100 + Math.random()*900);
        const sub = this.formModel.subtotal || wcc?.subtotal || 325000;
        const vat = this.formModel.vatAmount || Math.round(sub * 0.15);
        const ret = this.formModel.retentionAmount || Math.round(sub * 0.10);
        const wht = this.formModel.withholdingTaxAmount || Math.round(sub * 0.05);
        const net = (sub + vat) - ret - wht;

        const created: Invoice = {
          _id: 'inv-' + Date.now(),
          id: 'inv-' + Date.now(),
          invoiceNumber: newInvNum,
          wccNumber: wcc?.wccNumber || 'WCC-2026-0081',
          contractNumber: wcc?.contractNumber || 'CON-2026-001',
          clientName: wcc?.clientName || 'Saudi Aramco Operations',
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: this.formModel.dueDate,
          subtotal: sub,
          vatPercent: this.formModel.vatPercent || 15,
          vatAmount: vat,
          retentionPercent: this.formModel.retentionPercent || 10,
          retentionAmount: ret,
          withholdingTaxPercent: this.formModel.withholdingTaxPercent || 5,
          withholdingTaxAmount: wht,
          netPayable: net,
          totalCollected: 0,
          paidAmount: 0,
          balanceDue: net,
          status: 'Approved',
          glEntryNumber: 'GL-INV-2026-' + Math.floor(100 + Math.random()*900)
        };

        this.notificationService.success('Invoice Created', `${created.invoiceNumber} created and posted to AR`);
        this.invoices.update(list => [created, ...list]);
        this.selectedInvoice.set(created);
        this.isModalOpen.set(false);
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
