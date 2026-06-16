import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-vendor-history',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);

  readonly rfqList = this.mockDataService.rfqs;
  readonly searchQuery = signal<string>('');

  // Filter RFQs with submitted quotations
  readonly quotationHistory = computed(() => {
    const vId = this.authService.currentUser()?.vendorId;
    if (!vId) return [];
    
    const list: Array<{
      rfqId: string;
      rfqNumber: string;
      title: string;
      submissionDate: string;
      status: string;
      totalAmount: number;
    }> = [];

    this.rfqList().forEach(rfq => {
      const q = rfq.quotations.find(item => item.vendorId === vId);
      if (q) {
        list.push({
          rfqId: rfq.id,
          rfqNumber: rfq.rfqNumber,
          title: rfq.title,
          submissionDate: q.submissionDate || rfq.createdDate,
          status: q.status,
          totalAmount: q.totalAmount
        });
      }
    });

    // Filter by search query
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      return list.filter(item => 
        item.rfqNumber.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query)
      );
    }

    return list.sort((a, b) => b.submissionDate.localeCompare(a.submissionDate));
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('vendor.portal.breadcrumb_home') || 'Vendor Portal', url: '/vendor-portal' },
      { label: this.translate.instant('vendor.portal.quotation_history') || 'Quotation History' }
    ]);
  }
}
