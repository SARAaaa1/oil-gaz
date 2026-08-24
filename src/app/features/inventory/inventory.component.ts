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
import { InventoryApiService } from '../../core/services/inventory-api.service';
import {
  InventoryItem, Warehouse, MRV, MRVItem, MIV, MIVItem,
  InternalTransfer, InternalTransferItem, StockAdjustment, StockAdjustmentItem,
  StockCount, StockCountItem, InventoryReservation, InventoryReservationItem
} from '../../shared/interfaces/inventory.interface';
import { ApprovalHistoryComponent } from '../../shared/components/approval-history/approval-history.component';
import { finalize } from 'rxjs/operators';

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
  return {
    id:       raw._id ?? raw.id,
    code:     raw.code ?? '',
    name:     raw.name ?? '',
    location: raw.location ?? '',
    status:   raw.status ?? 'Active',
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

  // ── Core Data Stores (API-backed Signals) ──────────────────────────────────
  readonly inventory   = signal<InventoryItem[]>([]);
  readonly warehouses  = signal<Warehouse[]>([]);
  readonly mrvs        = signal<MRV[]>([]);
  readonly mivs        = signal<MIV[]>([]);
  readonly transfers   = signal<InternalTransfer[]>([]);
  readonly adjustments = signal<StockAdjustment[]>([]);
  readonly counts      = signal<StockCount[]>([]);

  // KPI summary from API
  readonly apiSummary = signal<{ totalItems: number; totalValue: number; lowStockCount: number; outOfStockCount: number } | null>(null);

  // Still from mock (not yet in API scope)
  readonly purchaseOrders       = this.mockDataService.purchaseOrders;
  readonly bulkImportHistories  = this.mockDataService.bulkImportHistories;
  readonly inventoryReservations = this.mockDataService.inventoryReservations;

  readonly isLoading = signal<boolean>(false);

  // ── Navigation & Search ────────────────────────────────────────────────────
  readonly activeTab     = signal<'dashboard' | 'items' | 'warehouses' | 'mrv' | 'miv' | 'transfers' | 'adjustments' | 'valuation' | 'history' | 'reservations'>('dashboard');
  readonly searchQuery   = signal<string>('');
  readonly locationFilter = signal<string>('ALL');

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
  readonly isMRVModalOpen        = signal(false);
  readonly isMIVModalOpen        = signal(false);
  readonly isTransferModalOpen   = signal(false);
  readonly isAdjustmentModalOpen = signal(false);
  readonly isCountModalOpen      = signal(false);

  // ── Form State ────────────────────────────────────────────────────────────
  itemForm = {
    itemCode: '', itemName: '', category: 'Drilling Consumables', subCategory: '',
    uom: 'EA', itemType: 'Material', reorderLevel: 5, description: '',
    costCenter: 'CC-DRL-001', quantity: 10, unitPrice: 100,
    location: 'Warehouse A', status: 'In Stock' as 'In Stock' | 'Low Stock' | 'Out of Stock'
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
    this.loadMRVs();
    this.loadMIVs();
    this.loadTransfers();
    this.loadAdjustments();
    this.loadSummary();
  }

  private loadItems() {
    this.inventoryApi.getItems({ limit: 500 }).subscribe({
      next: res => {
        const raw = res?.items ?? (Array.isArray(res) ? res : []);
        this.inventory.set(raw.map(mapApiItem));
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load items:', err)
    });
  }

  private loadWarehouses() {
    this.inventoryApi.getWarehouses().subscribe({
      next: res => {
        const raw = res?.items ?? (Array.isArray(res) ? res : []);
        this.warehouses.set(raw.map(mapApiWarehouse));
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load warehouses:', err)
    });
  }

  private loadMRVs() {
    this.inventoryApi.getMRVs({ limit: 200 }).subscribe({
      next: res => {
        const raw = res?.items ?? (Array.isArray(res) ? res : []);
        this.mrvs.set(raw.map(mapApiMRV));
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load MRVs:', err)
    });
  }

  private loadMIVs() {
    this.inventoryApi.getMIVs({ limit: 200 }).subscribe({
      next: res => {
        const raw = res?.items ?? (Array.isArray(res) ? res : []);
        this.mivs.set(raw.map(mapApiMIV));
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load MIVs:', err)
    });
  }

  private loadTransfers() {
    this.inventoryApi.getTransfers({ limit: 200 }).subscribe({
      next: res => {
        const raw = res?.items ?? (Array.isArray(res) ? res : []);
        this.transfers.set(raw.map(mapApiTransfer));
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load transfers:', err)
    });
  }

  private loadAdjustments() {
    this.inventoryApi.getAdjustments({ limit: 200 }).subscribe({
      next: res => {
        const raw = res?.items ?? (Array.isArray(res) ? res : []);
        this.adjustments.set(raw.map(mapApiAdjustment));
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load adjustments:', err)
    });
  }

  private loadSummary() {
    this.inventoryApi.getSummary().subscribe({
      next: summary => {
        this.apiSummary.set(summary);
        this.cdr.markForCheck();
      },
      error: () => { /* يُستخدم computed fallback */ }
    });
  }

  // ─── ITEM METHODS ──────────────────────────────────────────────────────────

  openAddItem() {
    this.isEditMode.set(false);
    this.isViewMode.set(false);
    this.selectedItem.set(null);
    this.itemForm = {
      itemCode: '', itemName: '', category: 'Drilling Consumables', subCategory: '',
      uom: 'EA', itemType: 'Material', reorderLevel: 5, description: '',
      costCenter: 'CC-DRL-001', quantity: 10, unitPrice: 100,
      location: 'Warehouse A', status: 'In Stock'
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
    this.warehouseForm = { code: '', name: '', location: '', status: 'Active' };
    this.isWarehouseModalOpen.set(true);
  }

  saveWarehouse() {
    if (!this.warehouseForm.code || !this.warehouseForm.name) {
      this.notificationService.danger('Validation Error', 'Warehouse Code and Name are required.');
      return;
    }

    this.isLoading.set(true);
    this.inventoryApi.createWarehouse(this.warehouseForm)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          const mapped = mapApiWarehouse(created);
          this.warehouses.update(list => [mapped, ...list]);
          this.auditService.log({
            user: 'Current User', role: 'Store Keeper', module: 'Inventory',
            entityName: 'Warehouse', entityId: mapped.code, action: 'Create',
            oldValue: '', newValue: JSON.stringify(mapped),
            details: `Created warehouse: ${mapped.name} (${mapped.code})`
          });
          this.isWarehouseModalOpen.set(false);
          this.notificationService.success('Success', 'Warehouse registered successfully.');
        },
        error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to create warehouse.')
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
      this.mrvForm.supplierName = po.vendorName;
      this.mrvForm.items = po.items.map(item => ({
        itemCode:         item.itemCode,
        itemName:         item.itemName,
        quantityOrdered:  item.quantity,
        quantityReceived: item.quantity,
        unitPrice:        item.unitPrice,
        totalPrice:       item.quantity * item.unitPrice,
        uom:              item.uom
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
    const headers  = this.isEquipmentImport()
      ? ['Equipment Code', 'Asset Tag', 'Equipment Name', 'Equipment Type', 'Manufacturer', 'Model', 'Serial Number', 'Purchase Date', 'Purchase Cost', 'Location', 'Cost Center', 'Status']
      : ['Item Code', 'Item Name', 'Category', 'UOM', 'Quantity', 'Unit Cost', 'Warehouse'];
    const filename = this.isEquipmentImport() ? 'equipment_import_template.csv' : 'items_import_template.csv';
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      this.notificationService.danger('Format Error', 'Only .xlsx and .csv files are supported.');
      return;
    }
    this.uploadedFileName.set(file.name);
    this.isUploading.set(true);
    this.uploadProgress.set(10);
    const interval = setInterval(() => {
      const current = this.uploadProgress();
      if (current >= 100) {
        clearInterval(interval);
        this.isUploading.set(false);
        this.generateMockPreviewRecords();
        this.cdr.markForCheck();
      } else {
        this.uploadProgress.set(current + 30);
      }
    }, 200);
  }

  generateMockPreviewRecords() {
    const errors: string[] = [];
    const preview: any[]   = [];

    if (!this.isEquipmentImport()) {
      preview.push({ itemCode: 'TUB-PIPE-3.5IN', itemName: 'Steel Tubing 3.5in J55', category: 'Tubulars', uom: 'JOINTS', quantity: 120, unitPrice: 450, location: 'Pipe Yard 1', status: 'In Stock', isValid: true });
      preview.push({ itemCode: '', itemName: 'Mud Chemical Additive Class G', category: 'Drilling Consumables', uom: 'BAGS', quantity: 300, unitPrice: 45, location: 'Warehouse A', status: 'In Stock', isValid: false, errorMessage: 'Row 2: Item Code is required.' });
      errors.push('Row 2: Item Code is required.');
    }

    this.importPreviewRecords.set(preview);
    this.importValidationErrors.set(errors);
  }

  confirmImport() {
    const validRecords  = this.importPreviewRecords().filter(r => r.isValid);
    const successCount  = validRecords.length;
    const failedCount   = this.importPreviewRecords().length - successCount;

    if (!this.isEquipmentImport()) {
      // NOTE: bulk-import endpoint is a placeholder in the API — we create items one by one
      const creates = validRecords.map(r =>
        this.inventoryApi.createItem({
          itemCode: r.itemCode, itemName: r.itemName, category: r.category,
          uom: r.uom, quantity: r.quantity, unitPrice: r.unitPrice,
          location: r.location, minQuantity: 5
        })
      );

      let done = 0;
      creates.forEach(obs => obs.subscribe({
        next: created => {
          this.inventory.update(list => [mapApiItem(created), ...list]);
          done++;
          if (done === creates.length) {
            this.mockDataService.addBulkImportHistory({ importedBy: 'Current User', numberOfRecords: successCount, status: failedCount > 0 ? 'Failed' : 'Success', module: 'Inventory' });
            this.isImportModalOpen.set(false);
            this.notificationService.success('Import Finished', `Imported: ${successCount}, Failed: ${failedCount}.`);
            this.cdr.markForCheck();
          }
        },
        error: () => { done++; }
      }));
    } else {
      this.mockDataService.addBulkImportHistory({ importedBy: 'Current User', numberOfRecords: successCount, status: failedCount > 0 ? 'Failed' : 'Success', module: 'Assets' });
      this.isImportModalOpen.set(false);
      this.notificationService.success('Import Finished', `Imported: ${successCount}, Failed: ${failedCount}.`);
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
}
