import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { VendorApiService } from '../../../core/services/vendor-api.service';

@Component({
  selector: 'app-vendor-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  private readonly vendorApi = inject(VendorApiService);

  readonly searchQuery = signal<string>('');
  readonly apiHistoryList = signal<any[]>([]);
  readonly isLoading = signal<boolean>(false);

  // Filter RFQs with submitted quotations strictly from Backend API
  readonly quotationHistory = computed(() => {
    const list = this.apiHistoryList();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      return list.filter(item => 
        (item.rfqNumber && item.rfqNumber.toLowerCase().includes(query)) ||
        (item.title && item.title.toLowerCase().includes(query))
      );
    }
    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('vendor.portal.breadcrumb_home') || 'Vendor Portal', url: '/vendor-portal' },
      { label: this.translate.instant('vendor.portal.quotation_history') || 'Quotation History' }
    ]);

    this.loadHistory();
  }

  loadHistory() {
    this.isLoading.set(true);
    this.vendorApi.getPortalQuotationHistory().subscribe({
      next: (res) => {
        const items = res?.data ?? [];
        this.apiHistoryList.set(items.map((i: any) => ({
          rfqId: i.rfqId ?? i._id,
          rfqNumber: i.rfqNumber ?? `RFQ-${i.rfqId}`,
          title: i.title ?? 'RFQ Quotation',
          submissionDate: i.submissionDate ? String(i.submissionDate).split('T')[0] : '',
          status: i.status ?? 'Submitted',
          totalAmount: i.totalAmount ?? 0
        })));
        this.isLoading.set(false);
      },
      error: () => {
        this.apiHistoryList.set([]);
        this.isLoading.set(false);
      }
    });
  }
}
