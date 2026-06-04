import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './vendors.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly vendors = this.mockDataService.vendors;

  readonly searchQuery = signal<string>('');

  readonly filteredVendors = computed(() => {
    let list = this.vendors();
    const query = this.searchQuery().trim().toLowerCase();

    if (query) {
      list = list.filter(v => 
        v.vendorName.toLowerCase().includes(query) ||
        v.taxNumber.toLowerCase().includes(query) ||
        v.contactPerson.toLowerCase().includes(query) ||
        v.paymentTerms.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.vendors' }
    ]);
  }
}
