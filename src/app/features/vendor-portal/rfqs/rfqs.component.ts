import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { VendorApiService } from '../../../core/services/vendor-api.service';

@Component({
  selector: 'app-vendor-rfqs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './rfqs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RfqsComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly vendorApi = inject(VendorApiService);

  // Pure Backend States
  readonly apiRFQs = signal<any[]>([]);
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('ALL');
  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;
  readonly isLoading = signal<boolean>(false);

  // Filter and Search RFQs
  readonly filteredRFQs = computed(() => {
    let list = this.apiRFQs();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    if (query) {
      list = list.filter(rfq =>
        rfq.rfqNumber?.toLowerCase().includes(query) ||
        rfq.title?.toLowerCase().includes(query) ||
        rfq.purchaseRequestNumber?.toLowerCase().includes(query)
      );
    }

    if (status !== 'ALL') {
      list = list.filter(rfq => {
        const myStatus = rfq.myStatus || rfq.status;
        if (status === 'Open') {
          return myStatus === 'Pending' || myStatus === 'Revision Requested';
        } else {
          return myStatus === status;
        }
      });
    }

    return [...list].sort((a, b) => (b.rfqNumber || '').localeCompare(a.rfqNumber || ''));
  });

  // Paginated RFQs
  readonly paginatedRFQs = computed(() => {
    const list = this.filteredRFQs();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  // Total Pages
  readonly totalPages = computed(() => {
    return Math.ceil(this.filteredRFQs().length / this.pageSize) || 1;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('vendor.portal.breadcrumb_home') || 'Vendor Portal' },
      { label: this.translate.instant('vendor.portal.my_rfqs') || 'My RFQs' }
    ]);

    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      if (status) {
        this.statusFilter.set(status);
      }
    });

    this.loadRFQs();
  }

  loadRFQs() {
    this.isLoading.set(true);
    this.vendorApi.getPortalRFQs().subscribe({
      next: (res) => {
        const items = res?.data ?? [];
        this.apiRFQs.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.apiRFQs.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getVendorStatus(rfq: any): string {
    return rfq.myStatus || rfq.status || 'Pending';
  }

  getQuotationAmount(rfqId: string): number | null {
    const rfq = this.apiRFQs().find(r => (r._id ?? r.id) === rfqId);
    return rfq?.myQuotation?.totalAmount ?? null;
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}
