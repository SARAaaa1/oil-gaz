import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ArMockService } from '../../shared/ar-mock.service';
import { ArCustomer, CustomerStatus } from '../../shared/ar.interfaces';
import { FinanceApiService } from '../../../../core/services/finance-api.service';

@Component({
  selector: 'app-finv2-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './customers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2CustomersComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly arService          = inject(ArMockService);
  private readonly financeApi = inject(FinanceApiService);

  readonly searchQuery    = signal('');
  readonly statusFilter   = signal<CustomerStatus | 'All'>('All');
  readonly industryFilter = signal('All');
  readonly selectedId     = signal<string | null>(null);
  readonly activeTab      = signal<'profile' | 'invoices' | 'collections'>('profile');

  readonly filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const st  = this.statusFilter();
    const ind = this.industryFilter();
    return this.arService.customers()
      .filter(c => {
        const mq  = !q || c.nameEn.toLowerCase().includes(q) ||
                    c.code.toLowerCase().includes(q) ||
                    c.contactPerson.toLowerCase().includes(q) ||
                    c.industry.toLowerCase().includes(q);
        const ms  = st  === 'All' || c.status === st;
        const mi  = ind === 'All' || c.industry === ind;
        return mq && ms && mi;
      })
      .sort((a, b) => b.openBalance - a.openBalance);
  });

  readonly activeCustomer = computed(() => {
    const id = this.selectedId();
    return id ? (this.arService.customers().find(c => c.id === id) ?? null) : null;
  });

  readonly customerInvoices = computed(() => {
    const id = this.selectedId();
    if (!id) return [];
    return this.arService.customerInvoices()
      .filter(i => i.customerId === id)
      .sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
  });

  readonly customerCollections = computed(() => {
    const id = this.selectedId();
    if (!id) return [];
    return this.arService.collections()
      .filter(c => c.customerId === id)
      .sort((a, b) => b.voucherNumber.localeCompare(a.voucherNumber));
  });

  // KPI counts
  readonly countActive      = computed(() => this.arService.customers().filter(c => c.status === 'Active').length);
  readonly totalOutstanding = computed(() => this.arService.customers().reduce((s, c) => s + c.openBalance, 0));
  readonly totalCustomers   = computed(() => this.arService.customers().length);

  // Industry list for filter
  readonly industries = computed(() => {
    const set = new Set(this.arService.customers().map(c => c.industry));
    return ['All', ...Array.from(set).sort()];
  });

  readonly customerStatuses: CustomerStatus[] = ['Active', 'Inactive', 'Suspended', 'Blacklisted'];

  selectCustomer(c: ArCustomer) {
    this.selectedId.set(c.id);
    this.activeTab.set('profile');
  }

  toggleStatus(c: ArCustomer) {
    const id = c.id ?? (c as any)._id;
    this.financeApi.toggleArCustomerStatus(id).subscribe({
      next: (res) => {
        const newStatus: CustomerStatus = (res?.status ?? (c.status === 'Active' ? 'Inactive' : 'Active')) as CustomerStatus;
        this.arService.customers.update(list =>
          list.map(x => x.id === c.id ? { ...x, status: newStatus } : x)
        );
        this.notify.success('finance_v2.ar.cus.status_updated', 'finance_v2.ar.cus.status_updated_desc');
      },
      error: () => {
        const next: CustomerStatus = c.status === 'Active' ? 'Inactive' : 'Active';
        this.arService.customers.update(list =>
          list.map(x => x.id === c.id ? { ...x, status: next } : x)
        );
        this.notify.success('finance_v2.ar.cus.status_updated', 'finance_v2.ar.cus.status_updated_desc');
      }
    });
  }

  getStatusClass(s: CustomerStatus): string {
    switch (s) {
      case 'Active':      return 'bg-green-100 text-green-700';
      case 'Inactive':    return 'bg-slate-100 text-slate-500';
      case 'Suspended':   return 'bg-amber-100 text-amber-700';
      case 'Blacklisted': return 'bg-red-100 text-red-700';
    }
  }

  getInvStatusClass(s: string): string {
    switch (s) {
      case 'Draft':               return 'bg-slate-100 text-slate-600';
      case 'Under Review':        return 'bg-amber-100 text-amber-700';
      case 'Approved':            return 'bg-green-100 text-green-700';
      case 'Sent To Customer':    return 'bg-blue-100 text-blue-700';
      case 'Partially Collected': return 'bg-orange-100 text-orange-700';
      case 'Collected':           return 'bg-emerald-100 text-emerald-700';
      case 'Closed':              return 'bg-slate-200 text-slate-500';
      case 'Rejected':            return 'bg-red-100 text-red-700';
      default:                    return 'bg-slate-100 text-slate-600';
    }
  }

  getRatingStars(r: number): string {
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  getRatingClass(r: number): string {
    if (r >= 4) return 'text-amber-400';
    if (r === 3) return 'text-slate-400';
    return 'text-red-400';
  }

  formatAmt(v: number): string {
    if (!v) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.ar.title' },
      { label: 'finance_v2.ar.cus.title' }
    ]);
    // Load real customers from API
    this.financeApi.getArCustomers({ limit: 200 }).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          const mapped: any[] = res.data.map((c: any) => ({
            id: c.id ?? c._id,
            code: c.code ?? '',
            nameEn: c.nameEn ?? c.name ?? '',
            nameAr: c.nameAr ?? '',
            taxNumber: c.taxNumber ?? '',
            vatNumber: c.vatNumber ?? '',
            commercialReg: c.commercialReg ?? '',
            industry: c.industry ?? 'Oil & Gas',
            contactPerson: c.contactPerson ?? '',
            contactEmail: c.contactEmail ?? '',
            contactPhone: c.contactPhone ?? '',
            address: c.address ?? '',
            city: c.city ?? '',
            country: c.country ?? 'SA',
            currency: c.currency ?? 'SAR',
            creditLimit: c.creditLimit ?? 0,
            paymentTerms: c.paymentTerms ?? 'Net 30',
            openBalance: c.openBalance ?? c.totalOutstanding ?? 0,
            outstandingInvoices: c.outstandingInvoices ?? 0,
            totalInvoiced: c.totalInvoiced ?? 0,
            totalCollected: c.totalCollected ?? 0,
            lastInvoiceDate: c.lastInvoiceDate ?? '',
            lastCollectionDate: c.lastCollectionDate ?? c.lastPaymentDate ?? '',
            lastCollectionAmount: c.lastCollectionAmount ?? 0,
            avgCollectionDays: c.avgCollectionDays ?? 0,
            status: c.status ?? 'Active',
            rating: c.rating ?? 3,
            bankName: c.bankName ?? '',
            iban: c.iban ?? '',
            notes: c.notes ?? '',
            branchId: c.branchId ?? 'HeadOffice'
          }));
          this.arService.customers.set(mapped);
        }
      },
      error: () => {} // Keep ArMockService data
    });
  }
}
