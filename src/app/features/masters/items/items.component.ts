import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { ItemMaster, ItemCategory, ItemSubCategory } from '../../../shared/interfaces/item-master.interface';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './items.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);

  // Stores
  readonly itemMasters = this.mockDataService.itemMasters;
  readonly itemCategories = this.mockDataService.itemCategories;
  readonly itemSubCategories = this.mockDataService.itemSubCategories;

  // UI State
  readonly activeTab = signal<'items' | 'categories' | 'subcategories' | 'uoms'>('items');
  readonly searchQuery = signal<string>('');
  readonly categoryFilter = signal<string>('All');

  // Form Modals
  readonly showItemModal = signal<boolean>(false);
  readonly editingItem = signal<ItemMaster | null>(null);

  // Form Fields
  itemCode = '';
  englishName = '';
  arabicName = '';
  category = '';
  subCategory = '';
  uom = 'EA';
  manufacturer = '';
  brand = '';
  reorderLevel = 5;
  minStock = 2;
  maxStock = 20;
  serialTracking = false;
  batchTracking = false;
  isActive = true;
  unitPrice = 0;

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.masters' },
      { label: 'navigation.item_master' }
    ]);
  }

  // Filtered Item Master list
  readonly filteredItems = computed(() => {
    let list = this.itemMasters();
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.categoryFilter();

    if (query) {
      list = list.filter(i => 
        i.itemCode.toLowerCase().includes(query) ||
        i.englishName.toLowerCase().includes(query) ||
        i.arabicName.includes(query) ||
        i.manufacturer.toLowerCase().includes(query)
      );
    }

    if (cat !== 'All') {
      list = list.filter(i => i.category === cat);
    }

    return list;
  });

  getCategoryName(code: string): string {
    const matched = this.itemCategories().find(c => c.code === code);
    return matched ? matched.nameEn : code;
  }

  getSubCategoryName(code: string): string {
    const matched = this.itemSubCategories().find(s => s.code === code);
    return matched ? matched.nameEn : code;
  }

  openAddItemModal() {
    this.editingItem.set(null);
    this.itemCode = '';
    this.englishName = '';
    this.arabicName = '';
    this.category = this.itemCategories()[0]?.code || '';
    this.subCategory = this.itemSubCategories()[0]?.code || '';
    this.uom = 'EA';
    this.manufacturer = '';
    this.brand = '';
    this.reorderLevel = 5;
    this.minStock = 2;
    this.maxStock = 20;
    this.serialTracking = false;
    this.batchTracking = false;
    this.isActive = true;
    this.unitPrice = 0;
    this.showItemModal.set(true);
  }

  openEditItemModal(item: ItemMaster) {
    this.editingItem.set(item);
    this.itemCode = item.itemCode;
    this.englishName = item.englishName;
    this.arabicName = item.arabicName;
    this.category = item.category;
    this.subCategory = item.subCategory;
    this.uom = item.uom;
    this.manufacturer = item.manufacturer;
    this.brand = item.brand;
    this.reorderLevel = item.reorderLevel;
    this.minStock = item.minStock;
    this.maxStock = item.maxStock;
    this.serialTracking = item.serialTracking;
    this.batchTracking = item.batchTracking;
    this.isActive = item.isActive;
    this.unitPrice = item.unitPrice;
    this.showItemModal.set(true);
  }

  saveItem() {
    if (!this.itemCode || !this.englishName || !this.arabicName) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const itemData: ItemMaster = {
      id: this.editingItem()?.id || `itm-${Date.now()}`,
      itemCode: this.itemCode,
      englishName: this.englishName,
      arabicName: this.arabicName,
      category: this.category,
      subCategory: this.subCategory,
      uom: this.uom,
      manufacturer: this.manufacturer,
      brand: this.brand,
      reorderLevel: this.reorderLevel,
      minStock: this.minStock,
      maxStock: this.maxStock,
      serialTracking: this.serialTracking,
      batchTracking: this.batchTracking,
      isActive: this.isActive,
      unitPrice: this.unitPrice
    };

    if (this.editingItem()) {
      // Edit
      this.mockDataService.itemMasters.update(list => 
        list.map(i => i.id === itemData.id ? itemData : i)
      );
      this.notificationService.success('masters.items.updated_title', 'masters.items.updated_desc');
    } else {
      // Add
      this.mockDataService.itemMasters.update(list => [...list, itemData]);
      // Also register in Inventory store
      this.mockDataService.inventoryItems.update(inv => [
        ...inv,
        {
          id: `inv-${Date.now()}`,
          itemCode: itemData.itemCode,
          itemName: itemData.englishName,
          quantity: 0,
          minQuantity: itemData.minStock,
          category: this.getCategoryName(itemData.category),
          uom: itemData.uom,
          location: 'Warehouse A',
          unitPrice: itemData.unitPrice,
          status: 'Out of Stock'
        }
      ]);
      this.notificationService.success('masters.items.created_title', 'masters.items.created_desc');
    }

    this.showItemModal.set(false);
  }

  deleteItem(id: string) {
    if (confirm('Are you sure you want to delete this master item record?')) {
      this.mockDataService.itemMasters.update(list => list.filter(i => i.id !== id));
      this.notificationService.success('masters.items.deleted_title', 'masters.items.deleted_desc');
    }
  }
}
