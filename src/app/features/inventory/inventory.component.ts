import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './inventory.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly inventory = this.mockDataService.inventoryItems;

  readonly searchQuery = signal<string>('');
  readonly locationFilter = signal<string>('ALL');

  // Computed counts
  readonly lowStockCount = computed(() => 
    this.inventory().filter(i => i.status === 'Low Stock').length
  );

  readonly outOfStockCount = computed(() => 
    this.inventory().filter(i => i.status === 'Out of Stock').length
  );

  // Filtered items
  readonly filteredInventory = computed(() => {
    let list = this.inventory();
    const query = this.searchQuery().trim().toLowerCase();
    const location = this.locationFilter();

    if (location !== 'ALL') {
      list = list.filter(i => i.location === location);
    }

    if (query) {
      list = list.filter(i => 
        i.itemCode.toLowerCase().includes(query) ||
        i.itemName.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.inventory' }
    ]);
  }
}
