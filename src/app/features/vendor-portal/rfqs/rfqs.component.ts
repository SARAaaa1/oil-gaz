import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-vendor-rfqs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './rfqs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RfqsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  // States
  readonly rfqList = this.mockDataService.rfqs;
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('ALL');
  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  // Filter RFQs assigned to the logged-in vendor
  readonly myRFQs = computed(() => {
    const vId = this.authService.currentUser()?.vendorId;
    if (!vId) return [];
    return this.rfqList().filter(rfq => 
      rfq.vendors.some(v => v.vendorId === vId)
    );
  });

  // Filter and Search RFQs
  readonly filteredRFQs = computed(() => {
    let list = this.myRFQs();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const vId = this.authService.currentUser()?.vendorId;

    if (query) {
      list = list.filter(rfq =>
        rfq.rfqNumber.toLowerCase().includes(query) ||
        rfq.title.toLowerCase().includes(query) ||
        rfq.purchaseRequestNumber.toLowerCase().includes(query)
      );
    }

    if (status !== 'ALL') {
      list = list.filter(rfq => {
        const vState = rfq.vendors.find(v => v.vendorId === vId);
        if (!vState) return false;
        
        if (status === 'Open') {
          return vState.status === 'Pending' || vState.status === 'Revision Requested';
        } else {
          return vState.status === status;
        }
      });
    }

    return [...list].sort((a, b) => b.rfqNumber.localeCompare(a.rfqNumber));
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

    // Check query params for initial status filter
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      if (status) {
        this.statusFilter.set(status);
      }
    });
  }

  getVendorStatus(rfq: any): string {
    const vId = this.authService.currentUser()?.vendorId;
    const v = rfq.vendors.find((item: any) => item.vendorId === vId);
    return v ? v.status : 'Pending';
  }

  getQuotationAmount(rfqId: string): number | null {
    const vId = this.authService.currentUser()?.vendorId;
    const rfq = this.rfqList().find(r => r.id === rfqId);
    if (!rfq) return null;
    const q = rfq.quotations.find(item => item.vendorId === vId);
    return q ? q.totalAmount : null;
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}
