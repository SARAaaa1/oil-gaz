import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { AuditService } from '../../core/services/audit.service';
import { FinanceCoreService } from '../../core/services/finance-core.service';
import { NotificationService } from '../../core/services/notification.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { InventoryApiService, extractApiArray } from '../../core/services/inventory-api.service';
import { ProcurementService } from '../../core/services/procurement.service';
import { AuthService } from '../../core/services/auth.service';
import {
  InventoryItem, Warehouse, MRV, MRVItem, MIV, MIVItem,
  InternalTransfer, InternalTransferItem, StockAdjustment, StockAdjustmentItem,
  StockCount, StockCountItem, InventoryReservation, InventoryReservationItem,
  OpeningStockItem, CreateOpeningStockDto, OpeningStockImportError, OpeningStockImportResponse
} from '../../shared/interfaces/inventory.interface';
import { ApprovalHistoryComponent } from '../../shared/components/approval-history/approval-history.component';
import { finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapApiItem(raw: any): InventoryItem {
  const qty = raw.quantity ?? 0;
  const min = raw.minQuantity ?? 0;
  let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
  if      (raw.status === 'Available')    status = 'In Stock';
  else if (raw.status === 'Low Stock')    status = 'Low Stock';
  else if (raw.status === 'Out of Stock') status = 'Out of Stock';
  else if (qty === 0)                     status = 'Out of Stock';
  else if (qty <= min)                    status = 'Low Stock';

  return {
    id:          raw._id ?? raw.id,
    itemCode:    raw.itemCode ?? '',
    itemName:    raw.itemName ?? '',
    quantity:    qty,
    minQuantity: min,
    category:    raw.category ?? '',
    uom:         raw.uom ?? 'PCS',
    location:    raw.location ?? '',
    unitPrice:   raw.unitPrice ?? 0,
    status,
  };
}

function mapApiWarehouse(raw: any): Warehouse {
  const doc = raw?._doc || raw || {};
  return {
    id:       raw?._id ?? raw?.id ?? doc?._id ?? doc?.id ?? '',
    code:     doc?.code ?? raw?.code ?? '',
    name:     doc?.name ?? raw?.name ?? '',
    location: doc?.location ?? raw?.location ?? '',
    status:   doc?.status ?? raw?.status ?? 'Active',
  };
}

function mapApiMRV(raw: any): MRV {
  return {
    id:           raw._id ?? raw.id,
    voucherNumber: raw.documentNumber ?? raw.mrvNumber ?? raw.voucherNumber ?? '',
    poId:         raw.poId,
    poNumber:     raw.poNumber,
    warehouseId:  raw.warehouseId ?? '',
    receivedDate: raw.receivedDate ?? raw.createdAt ?? '',
    receivedBy:   raw.receivedBy ?? '',
    supplierName: raw.supplierName ?? raw.vendorName ?? '',
    status:       raw.status ?? 'Draft',
    items:        (raw.items ?? []).map((i: any): MRVItem => ({
      itemCode:         i.itemCode ?? '',
      itemName:         i.itemName ?? '',
      quantityOrdered:  i.quantityOrdered ?? i.quantity ?? 0,
      quantityReceived: i.quantityReceived ?? i.quantity ?? 0,
      unitPrice:        i.unitPrice ?? 0,
      totalPrice:       i.totalPrice ?? 0,
      uom:              i.uom ?? 'PCS',
    })),
    totalAmount:  raw.totalAmount ?? 0,
    chargeType:   raw.chargeType,
    projectId:    raw.projectId,
    projectName:  raw.projectName,
    assetId:      raw.assetId,
    assetName:    raw.assetName,
    costCenter:   raw.costCenter,
  };
}

function mapApiMIV(raw: any): MIV {
  return {
    id:             raw._id ?? raw.id,
    voucherNumber:  raw.documentNumber ?? raw.mivNumber ?? raw.voucherNumber ?? '',
    issueTo:        raw.issueTo ?? 'Cost Center',
    destinationId:  raw.destinationId ?? raw.departmentId ?? '',
    referenceNumber: raw.referenceNumber ?? '',
    requestedBy:    raw.requestedBy ?? '',
    approvedBy:     raw.approvedBy,
    issueDate:      raw.issueDate ?? raw.createdAt ?? '',
    status:         raw.status ?? 'Draft',
    items:          (raw.items ?? []).map((i: any): MIVItem => ({
      itemCode:            i.itemCode ?? '',
      itemName:            i.itemName ?? '',
      quantityRequested:   i.quantityRequested ?? i.quantity ?? 0,
      quantityIssued:      i.quantityIssued ?? i.quantity ?? 0,
      unitPrice:           i.unitPrice ?? 0,
      totalPrice:          i.totalPrice ?? 0,
      uom:                 i.uom ?? 'PCS',
      inventoryCreditAcc:  i.inventoryCreditAcc ?? '131000',
      consumptionDebitAcc: i.consumptionDebitAcc ?? '511000',
    })),
    totalAmount: raw.totalAmount ?? 0,
  };
}

function mapApiTransfer(raw: any): InternalTransfer {
  return {
    id:             raw._id ?? raw.id,
    transferNumber: raw.documentNumber ?? raw.transferNumber ?? '',
    fromWarehouseId: raw.fromWarehouseId ?? '',
    toWarehouseId:   raw.toWarehouseId ?? '',
    transferDate:   raw.transferDate ?? raw.createdAt ?? '',
    requestedBy:    raw.requestedBy ?? '',
    status:         raw.status ?? 'Draft',
    items:          (raw.items ?? []).map((i: any): InternalTransferItem => ({
      itemCode: i.itemCode ?? '',
      itemName: i.itemName ?? '',
      quantity: i.quantity ?? 0,
      uom:      i.uom ?? 'PCS',
    })),
  };
}

function mapApiAdjustment(raw: any): StockAdjustment {
  return {
    id:               raw._id ?? raw.id,
    adjustmentNumber: raw.documentNumber ?? raw.adjustmentNumber ?? '',
    warehouseId:      raw.warehouseId ?? '',
    adjustmentDate:   raw.adjustmentDate ?? raw.createdAt ?? '',
    requestedBy:      raw.requestedBy ?? '',
    status:           raw.status ?? 'Draft',
    items:            (raw.items ?? []).map((i: any): StockAdjustmentItem => ({
      itemCode:       i.itemCode ?? '',
      itemName:       i.itemName ?? '',
      systemQuantity: i.systemQuantity ?? 0,
      adjustedQuantity: i.adjustedQuantity ?? i.quantity ?? 0,
      adjustmentType: i.adjustmentType === 'decrease' ? 'Deduction' : 'Addition',
      unitPrice:      i.unitPrice ?? 0,
      reason:         i.notes ?? i.reason ?? '',
    })),
    totalValue: raw.totalValue ?? 0,
  };
}

function mapApiOpeningStock(raw: any): OpeningStockItem {
  const doc = raw?._doc || raw || {};
  return {
    id:              raw?._id ?? raw?.id ?? doc?._id ?? doc?.id ?? '',
    openingNumber:   doc?.openingNumber ?? raw?.openingNumber ?? '',
    itemCode:        doc?.itemCode ?? raw?.itemCode ?? '',
    itemName:        doc?.itemName ?? raw?.itemName ?? '',
    warehouseCode:   doc?.warehouseCode ?? raw?.warehouseCode ?? '',
    warehouseName:   doc?.warehouseName ?? raw?.warehouseName ?? '',
    openingQuantity: doc?.openingQuantity ?? raw?.openingQuantity ?? 0,
    unitOfMeasure:   doc?.unitOfMeasure ?? raw?.unitOfMeasure ?? 'EA',
    location:        doc?.location ?? raw?.location ?? '',
    batchNumber:     doc?.batchNumber ?? raw?.batchNumber ?? '',
    serialNumber:    doc?.serialNumber ?? raw?.serialNumber ?? '',
    condition:       doc?.condition ?? raw?.condition ?? 'New',
    notes:           doc?.notes ?? raw?.notes ?? '',
    openingDate:     doc?.openingDate ?? raw?.openingDate ?? '',
    status:          doc?.status ?? raw?.status ?? 'Draft',
    createdAt:       doc?.createdAt ?? raw?.createdAt,
    updatedAt:       doc?.updatedAt ?? raw?.updatedAt,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ApprovalHistoryComponent, RouterLink],
  templateUrl: './inventory.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {
  private readonly inventoryApi        = inject(InventoryApiService);
  private readonly mockDataService     = inject(MockDataService);   // للـ POs و reservations والـ bulk import
  private readonly breadcrumbService   = inject(BreadcrumbService);
  private readonly auditService        = inject(AuditService);
  private readonly financeService      = inject(FinanceCoreService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate           = inject(TranslateService);
  private readonly route               = inject(ActivatedRoute);
  private readonly cdr                 = inject(ChangeDetectorRef);
  private readonly procurementService = inject(ProcurementService);
  private readonly authService         = inject(AuthService);

  readonly canEditInventory = computed(() =>
    this.authService.hasPermission('edit:inventory' as any) ||
    this.authService.hasAnyRole(['Super Admin', 'General Manager', 'Store Keeper'])
  );

  readonly canDeleteWarehouse = computed(() =>
    this.authService.hasAnyRole(['Super Admin', 'General Manager'])
  );

  // ── Core Data Stores (API-backed Signals) ──────────────────────────────────
  readonly inventory   = signal<InventoryItem[]>([]);
  readonly warehouses  = signal<Warehouse[]>([]);
  readonly mrvs        = signal<MRV[]>([]);
  readonly mivs        = signal<MIV[]>([]);
  readonly transfers   = signal<InternalTransfer[]>([]);
  readonly adjustments = signal<StockAdjustment[]>([]);
  readonly counts      = signal<StockCount[]>([]);
  readonly openingStocks = signal<OpeningStockItem[]>([]);

  // KPI summary from API
  readonly apiSummary = signal<{ totalItems: number; totalValue: number; lowStockCount: number; outOfStockCount: number } | null>(null);

  // Live Purchase Orders from Procurement API
  readonly purchaseOrders       = signal<any[]>([]);
  readonly bulkImportHistories  = this.mockDataService.bulkImportHistories;
  readonly inventoryReservations = this.mockDataService.inventoryReservations;

  readonly isLoading = signal<boolean>(false);
  readonly isLoadingOpeningStock = signal<boolean>(false);

  // ── Navigation & Search ────────────────────────────────────────────────────
  readonly activeTab     = signal<'dashboard' | 'items' | 'warehouses' | 'mrv' | 'miv' | 'transfers' | 'adjustments' | 'valuation' | 'history' | 'reservations' | 'opening-stock'>('dashboard');
  readonly searchQuery   = signal<string>('');
  readonly locationFilter = signal<string>('ALL');

  // ── Opening Stock Filters ──────────────────────────────────────────────────
  readonly openingStockFilterStatus    = signal<string>('ALL');
  readonly openingStockFilterWarehouse = signal<string>('ALL');
  readonly openingStockSearchQuery     = signal<string>('');

  readonly filteredOpeningStocks = computed(() => {
    let list = this.openingStocks();
    const status = this.openingStockFilterStatus();
    const wh = this.openingStockFilterWarehouse();
    const q = this.openingStockSearchQuery().trim().toLowerCase();

    if (status !== 'ALL') {
      list = list.filter(os => os.status === status);
    }
    if (wh !== 'ALL') {
      list = list.filter(os => os.warehouseCode === wh);
    }
    if (q) {
      list = list.filter(os =>
        (os.openingNumber && os.openingNumber.toLowerCase().includes(q)) ||
        (os.itemCode && os.itemCode.toLowerCase().includes(q)) ||
        (os.itemName && os.itemName.toLowerCase().includes(q)) ||
        (os.warehouseCode && os.warehouseCode.toLowerCase().includes(q)) ||
        (os.batchNumber && os.batchNumber.toLowerCase().includes(q)) ||
        (os.serialNumber && os.serialNumber.toLowerCase().includes(q))
      );
    }
    return list;
  });

  // ── KPI Calculations (from API summary or computed locally) ───────────────
  readonly totalItemsCount = computed(() =>
    this.apiSummary()?.totalItems ?? this.inventory().length
  );
  readonly inventoryValue = computed(() =>
    this.apiSummary()?.totalValue ??
    this.inventory().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  );
  readonly lowStockCount = computed(() =>
    this.apiSummary()?.lowStockCount ??
    this.inventory().filter(i => i.status === 'Low Stock').length
  );
  readonly outOfStockCount = computed(() =>
    this.apiSummary()?.outOfStockCount ??
    this.inventory().filter(i => i.status === 'Out of Stock').length
  );

  // ── Filtered Lists ─────────────────────────────────────────────────────────
  readonly filteredInventory = computed(() => {
    let list    = this.inventory();
    const query = this.searchQuery().trim().toLowerCase();
    const loc   = this.locationFilter();
    if (loc !== 'ALL') list = list.filter(i => i.location === loc);
    if (query) {
      list = list.filter(i =>
        i.itemCode.toLowerCase().includes(query) ||
        i.itemName.toLowerCase().includes(query) ||
        (i.category && i.category.toLowerCase().includes(query))
      );
    }
    return list;
  });

  readonly filteredHistory = computed(() =>
    this.bulkImportHistories().filter(h => h.module === 'Inventory')
  );

  // ── Modal States ───────────────────────────────────────────────────────────
  readonly isItemModalOpen       = signal(false);
  readonly isEditMode            = signal(false);
  readonly isViewMode            = signal(false);
  readonly selectedItem          = signal<InventoryItem | null>(null);
  readonly selectedMRV           = signal<MRV | null>(null);
  readonly selectedMIV           = signal<MIV | null>(null);
  readonly selectedTransfer      = signal<InternalTransfer | null>(null);
  readonly selectedAdjustment    = signal<StockAdjustment | null>(null);
  readonly isWarehouseModalOpen  = signal(false);
  readonly isWarehouseEditMode   = signal(false);
  readonly selectedWarehouseToEdit = signal<Warehouse | null>(null);
  readonly isMRVModalOpen        = signal(false);
  readonly isMIVModalOpen        = signal(false);
  readonly isTransferModalOpen   = signal(false);
  readonly isAdjustmentModalOpen = signal(false);
  readonly isCountModalOpen      = signal(false);

  // Opening Stock Modals & State
  readonly isOpeningStockModalOpen       = signal(false);
  readonly isViewOpeningStockModalOpen   = signal(false);
  readonly selectedOpeningStock          = signal<OpeningStockItem | null>(null);
  readonly isImportOpeningStockModalOpen = signal(false);

  openingStockForm: CreateOpeningStockDto = {
    itemCode: '',
    warehouseCode: '',
    openingQuantity: 1,
    unitOfMeasure: 'EA',
    location: '',
    batchNumber: '',
    serialNumber: '',
    condition: 'New',
    notes: '',
    openingDate: new Date().toISOString().split('T')[0]
  };

  readonly openingStockImportFile = signal<File | null>(null);
  readonly isImportingOpeningStock = signal(false);
  readonly importSuccessSummary = signal<{ totalRows: number; successCount: number; failedCount: number; message: string } | null>(null);
  readonly importErrors = signal<OpeningStockImportError[]>([]);

  // ── Form State ────────────────────────────────────────────────────────────
  itemForm = {
    itemCode: '', itemName: '', category: '', subCategory: '',
    uom: 'EA', itemType: 'Material', reorderLevel: 5, description: '',
    costCenter: 'CC-DRL-001', quantity: 10, unitPrice: 100,
    location: '', status: 'In Stock' as 'In Stock' | 'Low Stock' | 'Out of Stock'
  };

  warehouseForm = { code: '', name: '', location: '', status: 'Active' as 'Active' | 'Inactive' };

  mrvForm = {
    poId: '', warehouseId: '', receivedDate: new Date().toISOString().split('T')[0],
    supplierName: '', items: [] as MRVItem[]
  };

  mivForm = {
    issueTo: 'Project' as 'Project' | 'Cost Center' | 'Rig' | 'Workshop' | 'Vehicle' | 'Camp',
    destinationId: '', referenceNumber: '', requestedBy: '', items: [] as MIVItem[]
  };

  transferForm = {
    fromWarehouseId: '', toWarehouseId: '',
    transferDate: new Date().toISOString().split('T')[0],
    requestedBy: '', items: [] as InternalTransferItem[]
  };

  adjustmentForm = {
    warehouseId: '', adjustmentDate: new Date().toISOString().split('T')[0],
    requestedBy: '', items: [] as StockAdjustmentItem[]
  };

  countForm = {
    warehouseId: '', countDate: new Date().toISOString().split('T')[0],
    items: [] as StockCountItem[]
  };

  // Excel import
  readonly isImportModalOpen   = signal(false);
  readonly isEquipmentImport   = signal(false);
  readonly isUploading         = signal(false);
  readonly uploadProgress      = signal(0);
  readonly importPreviewRecords = signal<any[]>([]);
  readonly importValidationErrors = signal<string[]>([]);
  readonly isDragOver          = signal(false);
  uploadedFileName             = signal<string>('');

  // ── Init ──────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{ label: 'navigation.inventory' }]);

    this.loadAll();

    this.route.queryParams.subscribe(params => {
      if (params['tab']) this.activeTab.set(params['tab'] as any);
      if (params['mivId']) {
        const miv = this.mivs().find(m => m.id === params['mivId']);
        if (miv) this.selectedMIV.set(miv);
      }
    });
  }

  private loadAll() {
    this.loadItems();
    this.loadWarehouses();
    this.loadOpeningStocks();
    this.loadMRVs();
    this.loadMIVs();
    this.loadTransfers();
    this.loadAdjustments();
    this.loadSummary();
    this.loadPOs();
  }

  private loadPOs() {
    this.procurementService.getPOs(1, 100).subscribe({
      next: res => {
        const raw = extractApiArray(res);
        this.purchaseOrders.set(raw);
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load purchase orders:', err)
    });
  }

  private loadItems() {
    this.inventoryApi.getItems({ limit: 500 }).subscribe({
      next: res => {
        const raw = extractApiArray(res);
        this.inventory.set(raw.map(mapApiItem));
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Failed to load items from API:', err);
        this.inventory.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  private loadWarehouses() {
    this.inventoryApi.getWarehouses().subscribe({
      next: res => {
        const raw: any[] = Array.isArray(res) ? res : extractApiArray(res);
        this.warehouses.set(raw.map(mapApiWarehouse));
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Failed to load warehouses from API:', err);
        this.warehouses.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  private loadMRVs() {
    this.inventoryApi.getMRVs({ limit: 200 }).subscribe({
      next: res => {
        const raw = extractApiArray(res);
        this.mrvs.set(raw.map(mapApiMRV));
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Failed to load MRVs from API:', err);
        this.mrvs.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  private loadMIVs() {
    this.inventoryApi.getMIVs({ limit: 200 }).subscribe({
      next: res => {
        const raw = extractApiArray(res);
        this.mivs.set(raw.map(mapApiMIV));
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Failed to load MIVs from API:', err);
        this.mivs.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  private loadTransfers() {
    this.inventoryApi.getTransfers({ limit: 200 }).subscribe({
      next: res => {
        const raw = extractApiArray(res);
        this.transfers.set(raw.map(mapApiTransfer));
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Failed to load transfers from API:', err);
        this.transfers.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  private loadAdjustments() {
    this.inventoryApi.getAdjustments({ limit: 200 }).subscribe({
      next: res => {
        const raw = extractApiArray(res);
        this.adjustments.set(raw.map(mapApiAdjustment));
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Failed to load adjustments from API:', err);
        this.adjustments.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  private loadSummary() {
    this.inventoryApi.getSummary().subscribe({
      next: summary => {
        this.apiSummary.set(summary);
        this.cdr.markForCheck();
      },
      error: () => { /* fallback to computed signals */ }
    });
  }

  // ─── ITEM METHODS ──────────────────────────────────────────────────────────

  openAddItem() {
    this.isEditMode.set(false);
    this.isViewMode.set(false);
    this.selectedItem.set(null);
    const defaultWh = this.warehouses()[0]?.name || '';
    this.itemForm = {
      itemCode: '', itemName: '', category: '', subCategory: '',
      uom: 'EA', itemType: 'Material', reorderLevel: 5, description: '',
      costCenter: 'CC-DRL-001', quantity: 10, unitPrice: 100,
      location: defaultWh, status: 'In Stock'
    };
    this.isItemModalOpen.set(true);
  }

  openEditItem(item: InventoryItem) {
    this.isEditMode.set(true);
    this.isViewMode.set(false);
    this.selectedItem.set(item);
    this.itemForm = {
      itemCode:    item.itemCode,
      itemName:    item.itemName,
      category:    item.category || '',
      subCategory: '',
      uom:         item.uom,
      itemType:    'Material',
      reorderLevel: item.minQuantity || 5,
      description: '',
      costCenter:  'CC-DRL-001',
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      location:    item.location,
      status:      item.status
    };
    this.isItemModalOpen.set(true);
  }

  openViewItem(item: InventoryItem) {
    this.isEditMode.set(false);
    this.isViewMode.set(true);
    this.selectedItem.set(item);
    this.itemForm = {
      itemCode:    item.itemCode,
      itemName:    item.itemName,
      category:    item.category || 'Drilling Consumables',
      subCategory: '',
      uom:         item.uom,
      itemType:    'Material',
      reorderLevel: item.minQuantity || 5,
      description: '',
      costCenter:  'CC-DRL-001',
      quantity:    item.quantity,
      unitPrice:   item.unitPrice,
      location:    item.location,
      status:      item.status
    };
    this.isItemModalOpen.set(true);
  }

  saveItem() {
    if (!this.itemForm.itemCode || !this.itemForm.itemName) {
      this.notificationService.danger('Validation Error', 'Item Code and Item Name are required.');
      return;
    }

    if (this.isEditMode()) {
      const original = this.selectedItem();
      if (!original) return;

      this.isLoading.set(true);
      this.inventoryApi.updateItem(original.id, {
        itemName:    this.itemForm.itemName,
        category:    this.itemForm.category,
        uom:         this.itemForm.uom,
        quantity:    this.itemForm.quantity,
        unitPrice:   this.itemForm.unitPrice,
        location:    this.itemForm.location,
        minQuantity: this.itemForm.reorderLevel,
      }).pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
        .subscribe({
          next: updated => {
            const mapped = mapApiItem(updated ?? { ...original, ...this.itemForm, minQuantity: this.itemForm.reorderLevel });
            this.inventory.update(list => list.map(i => i.id === original.id ? mapped : i));
            this.auditService.log({
              user: 'Current User', role: 'Store Keeper', module: 'Inventory',
              entityName: 'InventoryItem', entityId: original.itemCode, action: 'Update',
              oldValue: `Qty: ${original.quantity}, Price: ${original.unitPrice}`,
              newValue:  `Qty: ${this.itemForm.quantity}, Price: ${this.itemForm.unitPrice}`,
              details:   `Updated inventory item ${this.itemForm.itemName}`
            });
            this.isItemModalOpen.set(false);
            this.notificationService.success('Success', 'Inventory item updated successfully.');
          },
          error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to update item.')
        });
    } else {
      const payload = {
        itemCode:    this.itemForm.itemCode,
        itemName:    this.itemForm.itemName,
        category:    this.itemForm.category,
        uom:         this.itemForm.uom,
        quantity:    this.itemForm.quantity,
        unitPrice:   this.itemForm.unitPrice,
        location:    this.itemForm.location,
        minQuantity: this.itemForm.reorderLevel,
        itemType:    this.itemForm.itemType,
      };

      this.isLoading.set(true);
      this.inventoryApi.createItem(payload)
        .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
        .subscribe({
          next: created => {
            const mapped = mapApiItem(created);
            this.inventory.update(list => [mapped, ...list]);
            this.auditService.log({
              user: 'Current User', role: 'Store Keeper', module: 'Inventory',
              entityName: 'InventoryItem', entityId: mapped.itemCode, action: 'Create',
              oldValue: '', newValue: JSON.stringify(mapped),
              details: `Registered new item: ${mapped.itemName}`
            });
            this.isItemModalOpen.set(false);
            this.notificationService.success('Success', 'Inventory item created successfully.');
          },
          error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to create item.')
        });
    }
  }

  // ─── WAREHOUSE METHODS ─────────────────────────────────────────────────────

  openAddWarehouse() {
    this.isWarehouseEditMode.set(false);
    this.selectedWarehouseToEdit.set(null);
    this.warehouseForm = { code: '', name: '', location: '', status: 'Active' };
    this.isWarehouseModalOpen.set(true);
  }

  openEditWarehouse(wh: Warehouse) {
    this.isWarehouseEditMode.set(true);
    this.selectedWarehouseToEdit.set(wh);
    this.warehouseForm = {
      code: wh.code,
      name: wh.name,
      location: wh.location,
      status: wh.status || 'Active'
    };
    this.isWarehouseModalOpen.set(true);
  }

  saveWarehouse() {
    if (!this.warehouseForm.code || !this.warehouseForm.name) {
      this.notificationService.danger('common.validation_error', 'inventory.warehouse_code_name_required');
      return;
    }

    this.isLoading.set(true);
    if (this.isWarehouseEditMode()) {
      const selected = this.selectedWarehouseToEdit();
      if (!selected) return;

      this.inventoryApi.updateWarehouse(selected.id, this.warehouseForm)
        .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
        .subscribe({
          next: updated => {
            const mapped = mapApiWarehouse(updated ?? { ...selected, ...this.warehouseForm });
            this.warehouses.update(list => list.map(w => w.id === selected.id ? mapped : w));
            this.auditService.log('Update', 'Inventory', 'Warehouse', selected.id, JSON.stringify(selected), JSON.stringify(mapped), `Updated warehouse: ${mapped.name}`);
            this.isWarehouseModalOpen.set(false);
            this.notificationService.success('common.success', 'inventory.warehouse_updated_success');
          },
          error: (err: any) => {
            const msg = err?.error?.message || err?.message || 'Failed to update warehouse.';
            this.notificationService.danger('common.error', msg);
          }
        });
    } else {
      this.inventoryApi.createWarehouse(this.warehouseForm)
        .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
        .subscribe({
          next: created => {
            const mapped = mapApiWarehouse(created);
            this.warehouses.update(list => [mapped, ...list]);
            this.auditService.log('Create', 'Inventory', 'Warehouse', mapped.id, '', JSON.stringify(mapped), `Created warehouse: ${mapped.name}`);
            this.isWarehouseModalOpen.set(false);
            this.notificationService.success('common.success', 'inventory.warehouse_created_success');
          },
          error: (err: any) => {
            const msg = err?.error?.message || err?.message || 'Failed to create warehouse.';
            this.notificationService.danger('common.error', msg);
          }
        });
    }
  }

  deleteWarehouse(wh: Warehouse) {
    const confirmMsg = this.translate.instant('inventory.confirm_delete_warehouse', { name: wh.name, code: wh.code });
    if (!confirm(confirmMsg)) return;

    this.isLoading.set(true);
    this.inventoryApi.deleteWarehouse(wh.id)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.auditService.log('Delete', 'Inventory', 'Warehouse', wh.id, JSON.stringify(wh), '', `Deactivated warehouse: ${wh.name}`);
          this.notificationService.success('common.success', 'inventory.warehouse_deactivated_success');
          this.loadWarehouses();
        },
        error: (err: any) => {
          // Backend returns 400 Bad Request if warehouse is already used in transactions
          const msg = err?.error?.message || err?.message || this.translate.instant('inventory.cannot_delete_warehouse');
          this.notificationService.danger('common.error', msg);
        }
      });
  }

  // ─── MRV (GOODS RECEIPT) METHODS ──────────────────────────────────────────

  openAddMRV() {
    this.mrvForm = {
      poId: '', warehouseId: this.warehouses()[0]?.id ?? '',
      receivedDate: new Date().toISOString().split('T')[0],
      supplierName: '', items: []
    };
    this.isMRVModalOpen.set(true);
  }

  onMRVPOSelect() {
    const po = this.purchaseOrders().find(p => p.id === this.mrvForm.poId);
    if (po) {
      this.mrvForm.supplierName = po.vendorName || po.supplierName || '';
      this.mrvForm.items = (po.items || []).map((item: any) => ({
        itemCode:         item.itemCode,
        itemName:         item.itemName,
        quantityOrdered:  item.quantity || 0,
        quantityReceived: item.quantity || 0,
        unitPrice:        item.unitPrice || 0,
        totalPrice:       (item.quantity || 0) * (item.unitPrice || 0),
        uom:              item.uom || 'EA'
      }));
    }
  }

  saveMRV() {
    if (this.mrvForm.items.length === 0) {
      this.notificationService.danger('Error', 'Goods Receipt must contain at least 1 item.');
      return;
    }

    const payload = {
      warehouseId:  this.mrvForm.warehouseId,
      poId:         this.mrvForm.poId || undefined,
      supplierName: this.mrvForm.supplierName || 'General Supplier',
      receivedDate: this.mrvForm.receivedDate,
      remarks:      `MRV created via ERP`,
      items:        this.mrvForm.items.map(i => ({
        itemCode:        i.itemCode,
        itemName:        i.itemName,
        quantity:        i.quantityReceived,
        uom:             i.uom,
        condition:       'Good',
        unitPrice:       i.unitPrice,
      }))
    };

    this.isLoading.set(true);
    this.inventoryApi.createMRV(payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          const mapped = mapApiMRV(created);
          this.mrvs.update(list => [mapped, ...list]);
          this.isMRVModalOpen.set(false);
          this.notificationService.success('Draft Saved', `Voucher ${mapped.voucherNumber} created.`);
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to create MRV.')
      });
  }

  approveMRV(mrv: MRV) {
    this.isLoading.set(true);
    this.inventoryApi.updateMRV(mrv.id, { status: 'Posted' })
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.mrvs.update(list => list.map(m => m.id === mrv.id ? { ...m, status: 'Posted' as const } : m));

          try {
            this.financeService.postJournalEntry({
              date:        mrv.receivedDate,
              reference:   mrv.voucherNumber,
              description: `Auto posting for Goods Receipt Voucher ${mrv.voucherNumber}`,
              lines: [
                { id: crypto.randomUUID(), accountCode: '131000', accountName: 'Material Warehouse Stock', debit: mrv.totalAmount, credit: 0 },
                { id: crypto.randomUUID(), accountCode: '211000', accountName: 'Accounts Payable (A/P)', debit: 0, credit: mrv.totalAmount }
              ]
            });
            this.notificationService.success('Voucher Approved & Posted', `MRV ${mrv.voucherNumber} inventory added.`);
            this.auditService.log({
              user: 'Current User', role: 'Store Keeper', module: 'Inventory',
              entityName: 'MRV', entityId: mrv.voucherNumber, action: 'Approve',
              oldValue: 'Status: Draft', newValue: 'Status: Posted',
              details: `Approved MRV ${mrv.voucherNumber} — $${mrv.totalAmount}`
            });
          } catch (e: any) {
            this.notificationService.danger('GL Posting Error', e.message);
          }
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to approve MRV.')
      });
  }

  // ─── MIV (MATERIAL ISSUE) METHODS ─────────────────────────────────────────

  openAddMIV() {
    this.mivForm = {
      issueTo: 'Project', destinationId: '', referenceNumber: '',
      requestedBy: '', items: []
    };
    this.addMIVRow();
    this.isMIVModalOpen.set(true);
  }

  addMIVRow() {
    this.mivForm.items.push({
      itemCode: '', itemName: '', quantityRequested: 1, quantityIssued: 1,
      unitPrice: 0, totalPrice: 0, uom: 'EA',
      inventoryCreditAcc: '131000', consumptionDebitAcc: '511000'
    });
  }

  removeMIVRow(index: number) {
    if (this.mivForm.items.length > 1) this.mivForm.items.splice(index, 1);
  }

  onMIVItemChange(index: number) {
    const row   = this.mivForm.items[index];
    const match = this.inventory().find(i => i.itemCode === row.itemCode);
    if (match) {
      row.itemName  = match.itemName;
      row.uom       = match.uom;
      row.unitPrice = match.unitPrice;
      row.totalPrice = row.quantityIssued * match.unitPrice;
    }
  }

  saveMIV() {
    const invalid = this.mivForm.items.some(i => !i.itemCode || i.quantityIssued <= 0);
    if (invalid) {
      this.notificationService.danger('Validation Error', 'Please select valid items and issue quantities.');
      return;
    }

    const payload = {
      issueTo:         this.mivForm.issueTo,
      destinationId:   this.mivForm.destinationId,
      referenceNumber: this.mivForm.referenceNumber,
      requestedBy:     this.mivForm.requestedBy,
      remarks:         `MIV created via ERP`,
      items:           this.mivForm.items.map(i => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        quantity: i.quantityIssued,
        uom:      i.uom,
      }))
    };

    this.isLoading.set(true);
    this.inventoryApi.createMIV(payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          const mapped = mapApiMIV(created);
          this.mivs.update(list => [mapped, ...list]);
          this.isMIVModalOpen.set(false);
          this.notificationService.success('Draft Saved', `MIV ${mapped.voucherNumber} created.`);
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to create MIV.')
      });
  }

  approveMIV(miv: MIV) {
    this.isLoading.set(true);
    this.inventoryApi.updateMIV(miv.id, { status: 'Posted' })
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.mivs.update(list => list.map(m => m.id === miv.id ? { ...m, status: 'Posted' as const } : m));
          try {
            this.financeService.postJournalEntry({
              date:        miv.issueDate,
              reference:   miv.voucherNumber,
              description: `Direct cost allocation for material issued to ${miv.issueTo}: ${miv.destinationId}`,
              lines: [
                { id: crypto.randomUUID(), accountCode: '511000', accountName: 'Project Material Consumed', debit: miv.totalAmount, credit: 0 },
                { id: crypto.randomUUID(), accountCode: '131000', accountName: 'Material Warehouse Stock', debit: 0, credit: miv.totalAmount }
              ]
            });
            this.notificationService.success('MIV Approved & Posted', `MIV ${miv.voucherNumber} items issued.`);
            this.auditService.log({
              user: 'Current User', role: 'Store Keeper', module: 'Inventory',
              entityName: 'MIV', entityId: miv.voucherNumber, action: 'Approve',
              oldValue: 'Status: Draft', newValue: 'Status: Posted',
              details: `Approved MIV ${miv.voucherNumber} — $${miv.totalAmount}`
            });
          } catch (e: any) {
            this.notificationService.danger('GL Posting Error', e.message);
          }
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to approve MIV.')
      });
  }

  // ─── INTERNAL TRANSFER METHODS ─────────────────────────────────────────────

  openAddTransfer() {
    const whs = this.warehouses();
    this.transferForm = {
      fromWarehouseId: whs[0]?.id ?? '',
      toWarehouseId:   whs[1]?.id ?? '',
      transferDate:    new Date().toISOString().split('T')[0],
      requestedBy:     '', items: []
    };
    this.addTransferRow();
    this.isTransferModalOpen.set(true);
  }

  addTransferRow() {
    this.transferForm.items.push({ itemCode: '', itemName: '', quantity: 1, uom: 'EA' });
  }

  removeTransferRow(index: number) {
    if (this.transferForm.items.length > 1) this.transferForm.items.splice(index, 1);
  }

  onTransferItemChange(index: number) {
    const row   = this.transferForm.items[index];
    const match = this.inventory().find(i => i.itemCode === row.itemCode);
    if (match) { row.itemName = match.itemName; row.uom = match.uom; }
  }

  saveTransfer() {
    if (this.transferForm.fromWarehouseId === this.transferForm.toWarehouseId) {
      this.notificationService.danger('Validation Error', 'Source and Destination warehouses must be different.');
      return;
    }
    const invalid = this.transferForm.items.some(i => !i.itemCode || i.quantity <= 0);
    if (invalid) {
      this.notificationService.danger('Validation Error', 'Please select valid items and transfer quantities.');
      return;
    }

    const payload = {
      fromWarehouseId: this.transferForm.fromWarehouseId,
      toWarehouseId:   this.transferForm.toWarehouseId,
      reason:          `Transfer requested by ${this.transferForm.requestedBy}`,
      items:           this.transferForm.items.map(i => ({
        itemCode: i.itemCode, itemName: i.itemName, quantity: i.quantity, uom: i.uom
      }))
    };

    this.isLoading.set(true);
    this.inventoryApi.createTransfer(payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          const mapped = mapApiTransfer(created);
          this.transfers.update(list => [mapped, ...list]);
          this.isTransferModalOpen.set(false);
          this.notificationService.success('Draft Saved', `Transfer ${mapped.transferNumber} created.`);
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to create transfer.')
      });
  }

  approveTransfer(xfer: InternalTransfer) {
    const whSource = this.warehouses().find(w => w.id === xfer.fromWarehouseId)?.name || 'Source WH';
    const whDest   = this.warehouses().find(w => w.id === xfer.toWarehouseId)?.name   || 'Dest WH';

    this.isLoading.set(true);
    this.inventoryApi.updateTransfer(xfer.id, { status: 'Posted' })
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.transfers.update(list => list.map(t => t.id === xfer.id ? { ...t, status: 'Posted' as const } : t));
          this.notificationService.success('Transfer Posted', `Voucher ${xfer.transferNumber} executed.`);
          this.auditService.log({
            user: 'Current User', role: 'Store Keeper', module: 'Inventory',
            entityName: 'InternalTransfer', entityId: xfer.transferNumber, action: 'Approve',
            oldValue: 'Status: Draft', newValue: 'Status: Posted',
            details: `Approved transfer from ${whSource} to ${whDest}`
          });
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to approve transfer.')
      });
  }

  // ─── STOCK ADJUSTMENT METHODS ──────────────────────────────────────────────

  openAddAdjustment() {
    this.adjustmentForm = {
      warehouseId:    this.warehouses()[0]?.id ?? '',
      adjustmentDate: new Date().toISOString().split('T')[0],
      requestedBy:    '', items: []
    };
    this.addAdjustmentRow();
    this.isAdjustmentModalOpen.set(true);
  }

  addAdjustmentRow() {
    this.adjustmentForm.items.push({
      itemCode: '', itemName: '', systemQuantity: 0,
      adjustedQuantity: 1, adjustmentType: 'Addition', unitPrice: 0, reason: ''
    });
  }

  removeAdjustmentRow(index: number) {
    if (this.adjustmentForm.items.length > 1) this.adjustmentForm.items.splice(index, 1);
  }

  onAdjustmentItemChange(index: number) {
    const row   = this.adjustmentForm.items[index];
    const match = this.inventory().find(i => i.itemCode === row.itemCode);
    if (match) { row.itemName = match.itemName; row.systemQuantity = match.quantity; row.unitPrice = match.unitPrice; }
  }

  saveAdjustment() {
    const invalid = this.adjustmentForm.items.some(i => !i.itemCode || i.adjustedQuantity <= 0 || !i.reason.trim());
    if (invalid) {
      this.notificationService.danger('Validation Error', 'Please complete all items, quantities, and reasons.');
      return;
    }

    const payload = {
      warehouseId: this.adjustmentForm.warehouseId,
      reason:      `Adjustment requested by ${this.adjustmentForm.requestedBy}`,
      items:       this.adjustmentForm.items.map(i => ({
        itemCode:       i.itemCode,
        itemName:       i.itemName,
        adjustmentType: i.adjustmentType === 'Addition' ? 'increase' : 'decrease',
        quantity:       i.adjustedQuantity,
        uom:            'PCS',
        notes:          i.reason,
      }))
    };

    this.isLoading.set(true);
    this.inventoryApi.createAdjustment(payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          const mapped = mapApiAdjustment(created);
          this.adjustments.update(list => [mapped, ...list]);
          this.isAdjustmentModalOpen.set(false);
          this.notificationService.success('Draft Saved', `Adjustment ${mapped.adjustmentNumber} registered.`);
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to create adjustment.')
      });
  }

  approveAdjustment(adj: StockAdjustment) {
    this.isLoading.set(true);
    this.inventoryApi.updateAdjustment(adj.id, { status: 'Posted' })
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.adjustments.update(list => list.map(a => a.id === adj.id ? { ...a, status: 'Posted' as const } : a));
          try {
            const isPositive = adj.totalValue >= 0;
            const amount     = Math.abs(adj.totalValue);
            this.financeService.postJournalEntry({
              date:        adj.adjustmentDate,
              reference:   adj.adjustmentNumber,
              description: `Inventory stock adjustment: ${adj.adjustmentNumber}`,
              lines: [
                { id: crypto.randomUUID(), accountCode: '131000', accountName: 'Material Warehouse Stock', debit: isPositive ? amount : 0, credit: isPositive ? 0 : amount },
                { id: crypto.randomUUID(), accountCode: '521000', accountName: 'General & Administrative Costs', debit: isPositive ? 0 : amount, credit: isPositive ? amount : 0 }
              ]
            });
            this.notificationService.success('Adjustment Posted', `Adjustment ${adj.adjustmentNumber} ledger updated.`);
          } catch (e: any) {
            this.notificationService.danger('GL Posting Error', e.message);
          }
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to approve adjustment.')
      });
  }

  // ─── PHYSICAL STOCK COUNT METHODS ─────────────────────────────────────────

  openAddCount() {
    const wh      = this.warehouses()[0];
    const whName  = wh?.name || 'Warehouse A';
    const whId    = wh?.id   || '';
    const items   = this.inventory().filter(i => !i.location || i.location === whName);

    this.countForm = {
      warehouseId: whId,
      countDate:   new Date().toISOString().split('T')[0],
      items:       items.map(item => ({
        itemCode:        item.itemCode,
        itemName:        item.itemName,
        systemQuantity:  item.quantity,
        countedQuantity: item.quantity,
        variance:        0
      }))
    };
    this.isCountModalOpen.set(true);
  }

  onCountQtyChange(index: number) {
    const row    = this.countForm.items[index];
    row.variance = row.countedQuantity - row.systemQuantity;
  }

  saveCount() {
    const payload = {
      warehouseId: this.countForm.warehouseId,
      countedBy:   'Current User',
      items:       this.countForm.items.map(i => ({
        itemCode:        i.itemCode,
        itemName:        i.itemName,
        systemQuantity:  i.systemQuantity,
        countedQuantity: i.countedQuantity,
      }))
    };

    this.isLoading.set(true);
    this.inventoryApi.createCount(payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          const newCount: StockCount = {
            id:          created._id ?? created.id ?? `cnt-${Date.now()}`,
            countNumber: created.documentNumber ?? created.countNumber ?? `CNT-${Date.now()}`,
            warehouseId: this.countForm.warehouseId,
            countDate:   this.countForm.countDate,
            countedBy:   'Current User',
            status:      'Completed',
            items:       this.countForm.items
          };
          this.counts.update(list => [...list, newCount]);
          this.isCountModalOpen.set(false);
          this.notificationService.success('Count Completed', `Physical count ${newCount.countNumber} finalized.`);
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to create count.')
      });
  }

  // ─── EXCEL IMPORT METHODS ─────────────────────────────────────────────────

  openImport(isEquipment: boolean = false) {
    this.isEquipmentImport.set(isEquipment);
    this.uploadedFileName.set('');
    this.importPreviewRecords.set([]);
    this.importValidationErrors.set([]);
    this.uploadProgress.set(0);
    this.isUploading.set(false);
    this.isImportModalOpen.set(true);
  }

  closeImportModal() {
    this.isImportModalOpen.set(false);
    this.importPreviewRecords.set([]);
    this.importValidationErrors.set([]);
  }

  downloadTemplate() {
    if (this.isEquipmentImport()) {
      const headers = ['Equipment Code', 'Asset Tag', 'Equipment Name', 'Equipment Type', 'Manufacturer', 'Model', 'Serial Number', 'Purchase Date', 'Purchase Cost', 'Location', 'Cost Center', 'Status'];
      const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', 'equipment_import_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = [
      'Category',
      'Item Code',
      'Item Name',
      'Location',
      'Min Quantity',
      'Quantity',
      'Unit Price',
      'UOM'
    ];

    const defaultWarehouse = this.warehouses()[0]?.name || 'Warehouse A';
    const sampleRows = [
      ['Drilling Consumables', 'ITM-001', 'Drill Bit 8.5in PDC', defaultWarehouse, '5', '50', '1250', 'EA'],
      ['Pipes & Tubulars', 'ITM-002', 'Steel Casing 9-5/8in J55', defaultWarehouse, '10', '100', '450', 'JOINTS']
    ];

    const csvLines = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];
    const csvContent = '\uFEFF' + csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'items_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onDragOver(e: DragEvent) { e.preventDefault(); e.stopPropagation(); this.isDragOver.set(true); }
  onDragLeave(e: DragEvent) { e.preventDefault(); e.stopPropagation(); this.isDragOver.set(false); }
  onDrop(e: DragEvent) {
    e.preventDefault(); e.stopPropagation(); this.isDragOver.set(false);
    if (e.dataTransfer?.files?.length) this.handleFile(e.dataTransfer.files[0]);
  }
  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.handleFile(input.files[0]);
  }

  handleFile(file: File) {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      this.notificationService.danger('Format Error', 'Only .xlsx, .xls and .csv files are supported.');
      return;
    }

    this.uploadedFileName.set(file.name);
    this.isUploading.set(true);
    this.uploadProgress.set(30);

    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        this.uploadProgress.set(70);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        this.uploadProgress.set(100);
        this.isUploading.set(false);

        if (this.isEquipmentImport()) {
          this.generateMockPreviewRecords();
        } else {
          this.parseItemsImport(rawJson);
        }
        this.cdr.markForCheck();
      } catch (err: any) {
        this.isUploading.set(false);
        this.notificationService.danger('Import Error', 'Failed to parse file: ' + (err?.message || 'Unknown error'));
        this.cdr.markForCheck();
      }
    };

    reader.onerror = () => {
      this.isUploading.set(false);
      this.notificationService.danger('Import Error', 'Could not read the uploaded file.');
      this.cdr.markForCheck();
    };

    reader.readAsArrayBuffer(file);
  }

  parseItemsImport(rows: any[]) {
    const preview: any[] = [];
    const errors: string[] = [];
    const defaultWarehouse = this.warehouses()[0]?.name || '';

    if (!rows || rows.length === 0) {
      errors.push('The uploaded file is empty.');
      this.importPreviewRecords.set([]);
      this.importValidationErrors.set(errors);
      return;
    }

    rows.forEach((row, index) => {
      const rowNum = index + 2; // Accounting for header row (Row 1)

      // Normalize row keys to handle variations like "Item Code", "item_code", "itemcode", "Code"
      const getVal = (...keys: string[]): string => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return String(row[k]).trim();
          }
          const lowerKey = k.toLowerCase().replace(/[\s_-]/g, '');
          for (const rawKey of Object.keys(row)) {
            if (rawKey.toLowerCase().replace(/[\s_-]/g, '') === lowerKey) {
              const val = row[rawKey];
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                return String(val).trim();
              }
            }
          }
        }
        return '';
      };

      const category = getVal('Category', 'category', 'الفئة', 'التصنيف');
      const itemCode = getVal('Item Code', 'itemCode', 'ItemCode', 'Code', 'كود المادة', 'الكود');
      const itemName = getVal('Item Name', 'itemName', 'ItemName', 'Name', 'Description', 'اسم المادة', 'الاسم');
      const location = getVal('Location', 'Warehouse', 'location', 'warehouse', 'المستودع', 'الموقع') || defaultWarehouse;
      const minQtyStr = getVal('Min Quantity', 'minQuantity', 'MinQty', 'Reorder Level', 'الحد الادنى', 'الحد الأدنى');
      const qtyStr = getVal('Quantity', 'quantity', 'Qty', 'الكمية');
      const priceStr = getVal('Unit Price', 'unitPrice', 'UnitPrice', 'Unit Cost', 'Price', 'سعر الوحدة', 'السعر');
      const uom = getVal('UOM', 'uom', 'Unit', 'الوحدة') || 'EA';

      const minQuantity = minQtyStr !== '' && !isNaN(Number(minQtyStr)) ? Math.max(0, Number(minQtyStr)) : 5;
      const quantity = qtyStr !== '' && !isNaN(Number(qtyStr)) ? Math.max(0, Number(qtyStr)) : 0;
      const unitPrice = priceStr !== '' && !isNaN(Number(priceStr)) ? Math.max(0, Number(priceStr)) : 0;

      const rowErrors: string[] = [];
      if (!itemCode) {
        rowErrors.push(`Row ${rowNum}: Item Code is required.`);
      }
      if (!itemName) {
        rowErrors.push(`Row ${rowNum}: Item Name is required.`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      }

      preview.push({
        itemCode,
        itemName,
        category,
        location,
        minQuantity,
        quantity,
        unitPrice,
        uom: uom.toUpperCase(),
        isValid: rowErrors.length === 0,
        errorMessage: rowErrors.join(' | ')
      });
    });

    this.importPreviewRecords.set(preview);
    this.importValidationErrors.set(errors);
  }

  generateMockPreviewRecords() {
    const errors: string[] = [];
    const preview: any[] = [];
    this.importPreviewRecords.set(preview);
    this.importValidationErrors.set(errors);
  }

  confirmImport() {
    const validRecords = this.importPreviewRecords().filter(r => r.isValid);
    if (validRecords.length === 0) {
      this.notificationService.danger('Validation Error', 'No valid records to import.');
      return;
    }

    const totalRecords = validRecords.length;

    if (!this.isEquipmentImport()) {
      this.isUploading.set(true);
      let successCount = 0;
      let failedCount = 0;
      let processed = 0;

      validRecords.forEach(record => {
        this.inventoryApi.createItem({
          itemCode: record.itemCode,
          itemName: record.itemName,
          category: record.category || '',
          uom: record.uom || 'EA',
          quantity: record.quantity,
          unitPrice: record.unitPrice,
          minQuantity: record.minQuantity,
          location: record.location || ''
        }).subscribe({
          next: created => {
            this.inventory.update(list => [mapApiItem(created), ...list]);
            successCount++;
            processed++;
            this.checkImportDone(processed, totalRecords, successCount, failedCount);
          },
          error: (err: any) => {
            failedCount++;
            processed++;
            this.checkImportDone(processed, totalRecords, successCount, failedCount);
          }
        });
      });
    } else {
      this.mockDataService.addBulkImportHistory({
        importedBy: this.authService.currentUser()?.fullName || 'Current User',
        numberOfRecords: validRecords.length,
        status: 'Success',
        module: 'Assets'
      });
      this.isImportModalOpen.set(false);
      this.notificationService.success('Import Finished', `Imported: ${validRecords.length} assets.`);
    }
  }

  private checkImportDone(processed: number, total: number, successCount: number, failedCount: number) {
    if (processed >= total) {
      this.isUploading.set(false);
      this.mockDataService.addBulkImportHistory({
        importedBy: this.authService.currentUser()?.fullName || 'Current User',
        numberOfRecords: successCount,
        status: failedCount > 0 ? 'Failed' : 'Success',
        module: 'Inventory'
      });
      this.isImportModalOpen.set(false);
      this.loadAll(); // Refresh inventory items & KPIs from backend

      if (failedCount === 0) {
        this.notificationService.success('Import Finished', `Successfully imported ${successCount} item(s) to inventory.`);
      } else {
        this.notificationService.warning('Import Completed with Warnings', `Imported: ${successCount}, Failed: ${failedCount}. Check duplicates or validation errors.`);
      }
      this.cdr.markForCheck();
    }
  }

  getAbsValue(val: number): number { return Math.abs(val || 0); }

  // ─── Inventory Reservation Methods (still via MockDataService) ─────────────
  readonly showReservationModal = signal(false);

  reservationForm: Omit<InventoryReservation, 'id' | 'reservationNumber' | 'status'> = {
    projectCode: '', projectName: '', requestedBy: '',
    requestDate: new Date().toISOString().split('T')[0],
    requiredDate: '', totalValue: 0,
    items: [{ itemCode: '', itemName: '', uom: 'EA', requestedQuantity: 1, reservedQuantity: 0, unitPrice: 0 }]
  };

  readonly pendingReservations  = computed(() => this.inventoryReservations().filter(r => r.status === 'Pending').length);
  readonly approvedReservations = computed(() => this.inventoryReservations().filter(r => r.status === 'Approved').length);
  readonly reservedValue        = computed(() => this.inventoryReservations().filter(r => r.status === 'Approved').reduce((s, r) => s + r.totalValue, 0));

  openReservationModal() {
    this.reservationForm = {
      projectCode: '', projectName: '', requestedBy: '',
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate: '', totalValue: 0,
      items: [{ itemCode: '', itemName: '', uom: 'EA', requestedQuantity: 1, reservedQuantity: 0, unitPrice: 0 }]
    };
    this.showReservationModal.set(true);
  }

  addReservationItem() {
    this.reservationForm.items.push({ itemCode: '', itemName: '', uom: 'EA', requestedQuantity: 1, reservedQuantity: 0, unitPrice: 0 });
  }

  removeReservationItem(index: number) {
    if (this.reservationForm.items.length > 1) this.reservationForm.items.splice(index, 1);
  }

  calcReservationTotal() {
    this.reservationForm.totalValue = this.reservationForm.items.reduce((s, i) => s + (i.requestedQuantity * i.unitPrice), 0);
  }

  submitReservation() {
    if (!this.reservationForm.projectCode || !this.reservationForm.requestedBy) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }
    this.calcReservationTotal();
    this.mockDataService.addReservation(this.reservationForm);
    this.showReservationModal.set(false);
    this.notificationService.success('inventory.reservation_created_title', 'inventory.reservation_created_desc');
  }

  approveReservation(id: string) {
    this.mockDataService.approveReservation(id);
    this.notificationService.success('inventory.reservation_approved_title', 'inventory.reservation_approved_desc');
  }

  releaseReservation(id: string) {
    this.mockDataService.releaseReservation(id);
    this.notificationService.warning('inventory.reservation_released_title', 'inventory.reservation_released_desc');
  }

  // ─── OPENING STOCK METHODS ────────────────────────────────────────────────

  loadOpeningStocks() {
    this.isLoadingOpeningStock.set(true);
    this.inventoryApi.getOpeningStocks({ limit: 500 })
      .pipe(finalize(() => { this.isLoadingOpeningStock.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          const raw: any[] = Array.isArray(res) ? res : extractApiArray(res);
          this.openingStocks.set(raw.map(mapApiOpeningStock));
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Failed to load opening stock from API:', err);
          this.openingStocks.set([]);
          this.cdr.markForCheck();
        }
      });
  }

  openAddOpeningStock() {
    const defaultWh = this.warehouses()[0]?.code || '';
    this.openingStockForm = {
      itemCode: '',
      warehouseCode: defaultWh,
      openingQuantity: 1,
      unitOfMeasure: 'EA',
      location: '',
      batchNumber: '',
      serialNumber: '',
      condition: 'New',
      notes: '',
      openingDate: new Date().toISOString().split('T')[0]
    };
    this.isOpeningStockModalOpen.set(true);
  }

  onOpeningStockItemSelect() {
    const matched = this.inventory().find(i => i.itemCode === this.openingStockForm.itemCode);
    if (matched) {
      if (matched.uom) this.openingStockForm.unitOfMeasure = matched.uom;
      if (matched.location && !this.openingStockForm.location) this.openingStockForm.location = matched.location;
    }
  }

  saveOpeningStock() {
    if (!this.openingStockForm.itemCode || !this.openingStockForm.warehouseCode) {
      this.notificationService.danger('common.validation_error', 'inventory.opening_stock_required_fields');
      return;
    }

    if (this.openingStockForm.openingQuantity === null || this.openingStockForm.openingQuantity === undefined || this.openingStockForm.openingQuantity < 0) {
      this.notificationService.danger('common.validation_error', 'inventory.invalid_quantity');
      return;
    }

    if (!this.openingStockForm.unitOfMeasure) {
      this.notificationService.danger('common.validation_error', 'inventory.uom_required');
      return;
    }

    this.isLoading.set(true);
    this.inventoryApi.createOpeningStock(this.openingStockForm)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          const mapped = mapApiOpeningStock(created);
          this.openingStocks.update(list => [mapped, ...list]);
          this.auditService.log('Create', 'Inventory', 'OpeningStock', mapped.openingNumber || mapped.id, '', JSON.stringify(mapped), `Created opening stock for item ${mapped.itemCode}`);
          this.isOpeningStockModalOpen.set(false);
          this.notificationService.success('common.success', 'inventory.opening_stock_created_success');
          this.loadOpeningStocks();
        },
        error: (err: any) => {
          const msg = err?.error?.message || err?.message || 'inventory.failed_to_create_opening_stock';
          this.notificationService.danger('common.error', msg);
        }
      });
  }

  openViewOpeningStock(item: OpeningStockItem) {
    this.selectedOpeningStock.set(item);
    this.isViewOpeningStockModalOpen.set(true);
  }

  postOpeningStock(item: OpeningStockItem) {
    if (item.status === 'Posted') {
      this.notificationService.warning('common.warning', 'inventory.opening_stock_already_posted');
      return;
    }

    const confirmMsg = this.translate.instant('inventory.confirm_post_opening_stock', {
      number: item.openingNumber || item.itemCode,
      qty: item.openingQuantity,
      item: item.itemCode
    });
    if (!confirm(confirmMsg)) return;

    this.isLoading.set(true);
    this.inventoryApi.postOpeningStock(item.id)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.auditService.log('Status Change', 'Inventory', 'OpeningStock', item.id, 'Draft', 'Posted', `Posted opening stock ${item.openingNumber}`);
          this.notificationService.success('common.success', 'inventory.opening_stock_posted_success');
          // Refresh Opening Stocks, Inventory Items, and Dashboard Summary
          this.loadOpeningStocks();
          this.loadItems();
          this.loadSummary();
        },
        error: (err: any) => {
          const msg = err?.error?.message || err?.message || 'inventory.failed_to_post_opening_stock';
          this.notificationService.danger('common.error', msg);
        }
      });
  }

  deleteOpeningStock(item: OpeningStockItem) {
    const isPosted = item.status === 'Posted' || item.status === 'POSTED';
    const confirmPrompt = isPosted
      ? `هل أنت متأكد من إلغاء الرصيد الافتتاحي المرحّل (${item.openingNumber || item.itemCode})؟ سيتم عكس الأثر المخزني وخصم الكمية من رصيد الصنف تلقائياً.`
      : `هل أنت متأكد من حذف مسودة الرصيد الافتتاحي (${item.openingNumber || item.itemCode})؟`;

    if (!confirm(confirmPrompt)) return;

    this.isLoading.set(true);
    this.inventoryApi.deleteOpeningStock(item.id)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: (res: any) => {
          const msg = res?.message || (isPosted ? 'تم إلغاء الرصيد وعكس أثر المخزون بنجاح' : 'تم حذف مسودة الرصيد الافتتاحي');
          this.notificationService.success('common.success', msg);
          this.loadOpeningStocks();
          this.loadItems();
          this.loadSummary();
        },
        error: (err: any) => {
          const msg = err?.error?.message || err?.message || 'Failed to delete opening stock';
          this.notificationService.danger('common.error', msg);
        }
      });
  }

  // ─── EXCEL IMPORT OPENING STOCK ───────────────────────────────────────────

  openImportOpeningStock() {
    this.openingStockImportFile.set(null);
    this.importSuccessSummary.set(null);
    this.importErrors.set([]);
    this.isImportOpeningStockModalOpen.set(true);
  }

  onOpeningStockFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(fileExt)) {
        this.notificationService.danger('common.validation_error', 'inventory.invalid_file_format');
        input.value = '';
        return;
      }
      this.openingStockImportFile.set(file);
      this.importSuccessSummary.set(null);
      this.importErrors.set([]);
    }
  }

  downloadOpeningStockTemplate() {
    const headers = [
      'Item Code',
      'Item Name',
      'Quantity',
      'Warehouse',
      'Unit Cost',
      'Category',
      'Unit of Measure',
      'Location / Bin',
      'Batch / Lot No.',
      'Serial No.',
      'Condition',
      'Notes'
    ];

    const exampleRow = [
      'ITM-001',
      'Drill Bit 8.5in',
      '100',
      this.warehouses()[0]?.code || 'WH-01',
      '450.00',
      'Drilling Tools',
      'EA',
      'Shelf A-1',
      'BATCH-2026-01',
      'SN-001',
      'New',
      'Initial balance from physical count'
    ];

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + exampleRow.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'opening_stock_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  submitOpeningStockImport() {
    const file = this.openingStockImportFile();
    if (!file) {
      this.notificationService.danger('common.validation_error', 'inventory.please_select_file');
      return;
    }

    this.isImportingOpeningStock.set(true);
    this.importSuccessSummary.set(null);
    this.importErrors.set([]);

    this.inventoryApi.importOpeningStock(file)
      .pipe(finalize(() => { this.isImportingOpeningStock.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: (res: OpeningStockImportResponse) => {
          if (res.success) {
            const total = res.totalRows ?? res.data?.totalItems ?? res.successCount ?? 0;
            const success = res.successCount ?? res.data?.totalItems ?? total;
            const failed = res.failedCount ?? 0;
            this.importSuccessSummary.set({
              totalRows: total,
              successCount: success,
              failedCount: failed,
              message: res.message || 'Opening stock imported and posted successfully'
            });
            this.notificationService.success('common.success', res.message || 'inventory.opening_stock_posted_success');
            this.loadOpeningStocks();
            this.loadItems();
            this.loadSummary();
          } else {
            this.importErrors.set(res.errors || []);
            this.notificationService.danger('common.error', res.message || 'inventory.import_failed');
          }
        },
        error: (err: any) => {
          const res = err?.error;
          if (res && res.errors && Array.isArray(res.errors)) {
            this.importErrors.set(res.errors);
          }
          const msg = res?.message || err?.message || 'inventory.import_failed';
          this.notificationService.danger('common.error', msg);
        }
      });
  }
}
