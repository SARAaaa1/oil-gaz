import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ApMockService } from '../../shared/ap-mock.service';
import { ApSupplier, SupplierStatus } from '../../shared/ap.interfaces';

@Component({
  selector: 'app-finv2-ap-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './suppliers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2ApSuppliersComponent implements OnInit {
  private readonly breadcrumb   = inject(BreadcrumbService);
  private readonly notify       = inject(NotificationService);
  readonly lang                 = inject(LanguageService);
  readonly apService            = inject(ApMockService);

  // ── UI State ──────────────────────────────────────────────────────
  readonly searchQuery      = signal('');
  readonly statusFilter     = signal('All');
  readonly categoryFilter   = signal('All');
  readonly selectedId       = signal<string | null>(null);
  readonly showAddModal     = signal(false);
  readonly showStatementModal = signal(false);

  // ── Form ──────────────────────────────────────────────────────────
  formData: Partial<ApSupplier> = {};

  // ── Derived ───────────────────────────────────────────────────────
  readonly filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const st  = this.statusFilter();
    const cat = this.categoryFilter();
    return this.apService.suppliers().filter(s => {
      const mq  = !q || s.nameEn.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) ||
                  s.nameAr.includes(q) || s.contactPerson.toLowerCase().includes(q);
      const ms  = st  === 'All' || s.status  === st;
      const mc  = cat === 'All' || s.category === cat;
      return mq && ms && mc;
    }).sort((a, b) => a.code.localeCompare(b.code));
  });

  readonly activeSupplier = computed(() => {
    const id = this.selectedId();
    return id ? (this.apService.suppliers().find(s => s.id === id) ?? null) : null;
  });

  // Stats
  readonly totalActive   = computed(() => this.apService.suppliers().filter(s => s.status === 'Active').length);
  readonly totalOnHold   = computed(() => this.apService.suppliers().filter(s => s.status === 'On Hold').length);
  readonly totalInactive = computed(() => this.apService.suppliers().filter(s => s.status !== 'Active').length);
  readonly totalBalance  = computed(() => this.apService.suppliers().reduce((s, sup) => s + sup.openBalance, 0));

  readonly categories = computed(() =>
    ['All', ...new Set(this.apService.suppliers().map(s => s.category))]
  );

  // Invoice link helper
  readonly supplierInvoices = computed(() => {
    const id = this.selectedId();
    if (!id) return [];
    return this.apService.invoices().filter(inv => inv.supplierId === id);
  });

  readonly supplierPayments = computed(() => {
    const id = this.selectedId();
    if (!id) return [];
    return this.apService.payments().filter(p => p.allocations.some(a => a.supplierId === id));
  });

  // ── Actions ───────────────────────────────────────────────────────
  selectSupplier(s: ApSupplier) { this.selectedId.set(s.id); }

  openAddModal() {
    this.formData = { status: 'Active', currency: 'SAR', paymentTerms: 'Net 30', rating: 3 };
    this.showAddModal.set(true);
  }

  saveSupplier() {
    const data = this.formData;
    if (!data.nameEn || !data.code) {
      this.notify.warning('finance_v2.ap.sup.error_required', 'finance_v2.ap.sup.error_required_msg');
      return;
    }
    const newSup: ApSupplier = {
      id: 'sup-' + Date.now(),
      code: data.code!, nameEn: data.nameEn!, nameAr: data.nameAr ?? '',
      taxNumber: data.taxNumber ?? '', vatNumber: data.vatNumber ?? '',
      commercialReg: data.commercialReg ?? '', address: data.address ?? '',
      city: data.city ?? '', country: data.country ?? 'SA',
      contactPerson: data.contactPerson ?? '', contactEmail: data.contactEmail ?? '',
      contactPhone: data.contactPhone ?? '', paymentTerms: data.paymentTerms ?? 'Net 30',
      currency: data.currency ?? 'SAR', creditLimit: data.creditLimit ?? 0,
      openBalance: 0, outstandingInvoices: 0,
      lastPaymentDate: '', lastPaymentAmount: 0,
      status: data.status ?? 'Active', rating: data.rating ?? 3,
      bankName: data.bankName ?? '', iban: data.iban ?? '',
      category: data.category ?? 'General', notes: data.notes ?? ''
    };
    this.apService.suppliers.update(list => [newSup, ...list]);
    this.notify.success('finance_v2.common.saved', 'finance_v2.ap.sup.saved_desc');
    this.showAddModal.set(false);
  }

  toggleStatus(s: ApSupplier) {
    const nextStatus: SupplierStatus = s.status === 'Active' ? 'Inactive' : 'Active';
    this.apService.suppliers.update(list =>
      list.map(x => x.id === s.id ? { ...x, status: nextStatus } : x)
    );
    this.notify.success('finance_v2.common.updated', 'finance_v2.ap.sup.status_updated');
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getStatusClass(s: SupplierStatus): string {
    switch (s) {
      case 'Active':      return 'bg-green-100 text-green-700';
      case 'Inactive':    return 'bg-slate-100 text-slate-600';
      case 'On Hold':     return 'bg-amber-100 text-amber-700';
      case 'Blacklisted': return 'bg-red-100 text-red-700';
    }
  }

  stars(r: number): number[] { return Array.from({ length: 5 }, (_, i) => i + 1); }

  formatAmt(v: number): string {
    if (!v) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  readonly statuses: SupplierStatus[] = ['Active', 'Inactive', 'On Hold', 'Blacklisted'];
  readonly paymentTermsOptions = ['Net 30', 'Net 45', 'Net 60', 'Net 90', 'Immediate', 'COD'];

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.ap.title' },
      { label: 'finance_v2.ap.sup.title' }
    ]);
  }
}
