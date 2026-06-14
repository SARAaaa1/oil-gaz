import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { AuditService } from '../../core/services/audit.service';
import { FinanceCoreService } from '../../core/services/finance-core.service';
import { NotificationService } from '../../core/services/notification.service';
import { 
  InventoryItem, Warehouse, MRV, MRVItem, MIV, MIVItem, 
  InternalTransfer, InternalTransferItem, StockAdjustment, StockAdjustmentItem, 
  StockCount, StockCountItem, InventoryReservation, InventoryReservationItem
} from '../../shared/interfaces/inventory.interface';
import { Equipment, AssetCategory, AssetStatus } from '../../shared/interfaces/assets.interface';
import { ApprovalHistoryComponent } from '../../shared/components/approval-history/approval-history.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ApprovalHistoryComponent],
  templateUrl: './inventory.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly auditService = inject(AuditService);
  private readonly financeService = inject(FinanceCoreService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  // Core Data Stores (Signals)
  readonly inventory = this.mockDataService.inventoryItems;
  readonly warehouses = this.mockDataService.warehouses;
  readonly mrvs = this.mockDataService.mrvs;
  readonly mivs = this.mockDataService.mivs;
  readonly transfers = this.mockDataService.transfers;
  readonly adjustments = this.mockDataService.adjustments;
  readonly counts = this.mockDataService.counts;
  readonly purchaseOrders = this.mockDataService.purchaseOrders;
  readonly bulkImportHistories = this.mockDataService.bulkImportHistories;
  readonly inventoryReservations = this.mockDataService.inventoryReservations;

  // Navigation & Search State
  readonly activeTab = signal<'dashboard' | 'items' | 'warehouses' | 'mrv' | 'miv' | 'transfers' | 'adjustments' | 'valuation' | 'history' | 'reservations'>('dashboard');
  readonly searchQuery = signal<string>('');
  readonly locationFilter = signal<string>('ALL');

  // KPI Calculations
  readonly totalItemsCount = computed(() => this.inventory().length);
  readonly inventoryValue = computed(() =>
    this.inventory().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  );
  readonly lowStockCount = computed(() =>
    this.inventory().filter(i => i.status === 'Low Stock').length
  );
  readonly outOfStockCount = computed(() =>
    this.inventory().filter(i => i.status === 'Out of Stock').length
  );

  // Filtered Lists
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
        (i.category && i.category.toLowerCase().includes(query))
      );
    }
    return list;
  });

  readonly filteredHistory = computed(() => {
    return this.bulkImportHistories().filter(h => h.module === 'Inventory');
  });

  // --- MODAL STATES ---
  readonly isItemModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly isViewMode = signal(false);
  readonly selectedItem = signal<InventoryItem | null>(null);
  readonly selectedMRV = signal<MRV | null>(null);
  readonly selectedMIV = signal<MIV | null>(null);
  readonly selectedTransfer = signal<InternalTransfer | null>(null);
  readonly selectedAdjustment = signal<StockAdjustment | null>(null);

  readonly isWarehouseModalOpen = signal(false);
  readonly isMRVModalOpen = signal(false);
  readonly isMIVModalOpen = signal(false);
  readonly isTransferModalOpen = signal(false);
  readonly isAdjustmentModalOpen = signal(false);
  readonly isCountModalOpen = signal(false);

  // Form State Containers
  itemForm = {
    itemCode: '',
    itemName: '',
    category: 'Drilling Consumables',
    subCategory: '',
    uom: 'EA',
    itemType: 'Material',
    reorderLevel: 5,
    description: '',
    costCenter: 'CC-DRL-001',
    quantity: 10,
    unitPrice: 100,
    location: 'Warehouse A',
    status: 'In Stock' as 'In Stock' | 'Low Stock' | 'Out of Stock'
  };

  warehouseForm = {
    code: '',
    name: '',
    location: '',
    status: 'Active' as 'Active' | 'Inactive'
  };

  mrvForm = {
    poId: '',
    warehouseId: 'w1',
    receivedDate: new Date().toISOString().split('T')[0],
    supplierName: '',
    items: [] as MRVItem[]
  };

  mivForm = {
    issueTo: 'Project' as 'Project' | 'Cost Center' | 'Rig' | 'Workshop' | 'Vehicle' | 'Camp',
    destinationId: 'Permian Overland',
    referenceNumber: '',
    requestedBy: 'Robert Vance',
    items: [] as MIVItem[]
  };

  transferForm = {
    fromWarehouseId: 'w1',
    toWarehouseId: 'w2',
    transferDate: new Date().toISOString().split('T')[0],
    requestedBy: 'Jim Halpert',
    items: [] as InternalTransferItem[]
  };

  adjustmentForm = {
    warehouseId: 'w1',
    adjustmentDate: new Date().toISOString().split('T')[0],
    requestedBy: 'Jim Halpert',
    items: [] as StockAdjustmentItem[]
  };

  countForm = {
    warehouseId: 'w1',
    countDate: new Date().toISOString().split('T')[0],
    items: [] as StockCountItem[]
  };

  // Excel Import Dialog State
  readonly isImportModalOpen = signal(false);
  readonly isEquipmentImport = signal(false);
  readonly isUploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly importPreviewRecords = signal<any[]>([]);
  readonly importValidationErrors = signal<string[]>([]);
  readonly isDragOver = signal(false);
  uploadedFileName = signal<string>('');

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.inventory' }
    ]);
  }

  // --- ITEM METHODS ---
  openAddItem() {
    this.isEditMode.set(false);
    this.isViewMode.set(false);
    this.selectedItem.set(null);
    this.itemForm = {
      itemCode: '',
      itemName: '',
      category: 'Drilling Consumables',
      subCategory: '',
      uom: 'EA',
      itemType: 'Material',
      reorderLevel: 5,
      description: '',
      costCenter: 'CC-DRL-001',
      quantity: 10,
      unitPrice: 100,
      location: 'Warehouse A',
      status: 'In Stock'
    };
    this.isItemModalOpen.set(true);
  }

  openEditItem(item: InventoryItem) {
    this.isEditMode.set(true);
    this.isViewMode.set(false);
    this.selectedItem.set(item);
    this.itemForm = {
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category || 'Drilling Consumables',
      subCategory: '',
      uom: item.uom,
      itemType: 'Material',
      reorderLevel: item.minQuantity || 5,
      description: '',
      costCenter: 'CC-DRL-001',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      location: item.location,
      status: item.status
    };
    this.isItemModalOpen.set(true);
  }

  openViewItem(item: InventoryItem) {
    this.isEditMode.set(false);
    this.isViewMode.set(true);
    this.selectedItem.set(item);
    this.itemForm = {
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category || 'Drilling Consumables',
      subCategory: '',
      uom: item.uom,
      itemType: 'Material',
      reorderLevel: item.minQuantity || 5,
      description: '',
      costCenter: 'CC-DRL-001',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      location: item.location,
      status: item.status
    };
    this.isItemModalOpen.set(true);
  }

  saveItem() {
    if (!this.itemForm.itemCode || !this.itemForm.itemName) {
      this.notificationService.danger('Validation Error', 'Item Code and Item Name are required.');
      return;
    }

    let calcStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (this.itemForm.quantity === 0) {
      calcStatus = 'Out of Stock';
    } else if (this.itemForm.quantity <= this.itemForm.reorderLevel) {
      calcStatus = 'Low Stock';
    }

    if (this.isEditMode()) {
      const original = this.selectedItem();
      if (original) {
        this.mockDataService.updateInventoryItem(original.id, {
          itemCode: this.itemForm.itemCode,
          itemName: this.itemForm.itemName,
          category: this.itemForm.category,
          uom: this.itemForm.uom,
          quantity: this.itemForm.quantity,
          unitPrice: this.itemForm.unitPrice,
          location: this.itemForm.location,
          status: calcStatus,
          minQuantity: this.itemForm.reorderLevel
        });

        this.auditService.log({
          user: 'Admin User',
          role: 'Super Admin',
          module: 'Inventory',
          entityName: 'InventoryItem',
          entityId: original.itemCode,
          action: 'Update',
          oldValue: `Qty: ${original.quantity}, Price: ${original.unitPrice}`,
          newValue: `Qty: ${this.itemForm.quantity}, Price: ${this.itemForm.unitPrice}`,
          details: `Updated inventory item ${this.itemForm.itemName} (${this.itemForm.itemCode})`
        });
      }
    } else {
      const newItem = this.mockDataService.addInventoryItem({
        itemCode: this.itemForm.itemCode,
        itemName: this.itemForm.itemName,
        category: this.itemForm.category,
        uom: this.itemForm.uom,
        quantity: this.itemForm.quantity,
        unitPrice: this.itemForm.unitPrice,
        location: this.itemForm.location,
        status: calcStatus,
        minQuantity: this.itemForm.reorderLevel
      });

      this.auditService.log({
        user: 'Admin User',
        role: 'Super Admin',
        module: 'Inventory',
        entityName: 'InventoryItem',
        entityId: newItem.itemCode,
        action: 'Create',
        oldValue: '',
        newValue: JSON.stringify(newItem),
        details: `Registered new inventory item: ${newItem.itemName}`
      });
    }

    this.isItemModalOpen.set(false);
    this.notificationService.success('Success', 'Inventory item saved successfully.');
  }

  // --- WAREHOUSE METHODS ---
  openAddWarehouse() {
    this.warehouseForm = { code: '', name: '', location: '', status: 'Active' };
    this.isWarehouseModalOpen.set(true);
  }

  saveWarehouse() {
    if (!this.warehouseForm.code || !this.warehouseForm.name) {
      this.notificationService.danger('Validation Error', 'Warehouse Code and Name are required.');
      return;
    }

    const wh = this.mockDataService.addWarehouse(this.warehouseForm);
    this.auditService.log({
      user: 'Admin User',
      role: 'Super Admin',
      module: 'Inventory',
      entityName: 'Warehouse',
      entityId: wh.code,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(wh),
      details: `Created new warehouse: ${wh.name} (${wh.code})`
    });

    this.isWarehouseModalOpen.set(false);
    this.notificationService.success('Success', 'Warehouse registered successfully.');
  }

  // --- MRV (GOODS RECEIPT) METHODS ---
  openAddMRV() {
    this.mrvForm = {
      poId: '',
      warehouseId: 'w1',
      receivedDate: new Date().toISOString().split('T')[0],
      supplierName: '',
      items: []
    };
    this.isMRVModalOpen.set(true);
  }

  onMRVPOSelect() {
    const po = this.purchaseOrders().find(p => p.id === this.mrvForm.poId);
    if (po) {
      this.mrvForm.supplierName = po.vendorName;
      this.mrvForm.items = po.items.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantityOrdered: item.quantity,
        quantityReceived: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        uom: item.uom
      }));
    }
  }

  saveMRV() {
    if (this.mrvForm.items.length === 0) {
      this.notificationService.danger('Error', 'Goods Receipt must contain at least 1 item.');
      return;
    }

    const total = this.mrvForm.items.reduce((sum, i) => sum + i.totalPrice, 0);
    const po = this.purchaseOrders().find(p => p.id === this.mrvForm.poId);

    const mrv = this.mockDataService.addMRV({
      poId: this.mrvForm.poId || undefined,
      poNumber: po ? po.poNumber : undefined,
      warehouseId: this.mrvForm.warehouseId,
      receivedDate: this.mrvForm.receivedDate,
      receivedBy: 'Jim Halpert',
      supplierName: this.mrvForm.supplierName || 'General Supplier',
      items: this.mrvForm.items,
      totalAmount: total
    });

    this.auditService.log({
      user: 'Jim Halpert',
      role: 'Store Keeper',
      module: 'Inventory',
      entityName: 'MRV',
      entityId: mrv.voucherNumber,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(mrv),
      details: `Created Goods Receipt Voucher ${mrv.voucherNumber} for PO: ${mrv.poNumber || 'Direct'}`
    });

    this.isMRVModalOpen.set(false);
    this.notificationService.success('Draft Saved', `Voucher ${mrv.voucherNumber} created in Draft state.`);
  }

  approveMRV(mrv: MRV) {
    // 1. Update status
    this.mockDataService.updateMRVStatus(mrv.id, 'Posted');

    // 2. Finance Double Entry Posting!
    // Debit Inventory Asset (131000) and Credit Accounts Payable (211000)
    try {
      this.financeService.postJournalEntry({
        date: mrv.receivedDate,
        reference: mrv.voucherNumber,
        description: `Auto posting for Goods Receipt Voucher ${mrv.voucherNumber} from Supplier: ${mrv.supplierName}`,
        lines: [
          { id: crypto.randomUUID(), accountCode: '131000', accountName: 'Material Warehouse Stock', debit: mrv.totalAmount, credit: 0 },
          { id: crypto.randomUUID(), accountCode: '211000', accountName: 'Accounts Payable (A/P)', debit: 0, credit: mrv.totalAmount }
        ]
      });

      this.notificationService.success(
        'Voucher Approved & Posted',
        `MRV ${mrv.voucherNumber} inventory added. Finance journal entry posted successfully.`
      );

      this.auditService.log({
        user: 'Admin User',
        role: 'Super Admin',
        module: 'Inventory',
        entityName: 'MRV',
        entityId: mrv.voucherNumber,
        action: 'Approve',
        oldValue: 'Status: Draft',
        newValue: 'Status: Posted',
        details: `Approved MRV ${mrv.voucherNumber} & Posted double-entry journal entry of $${mrv.totalAmount}.`
      });
    } catch (e: any) {
      this.notificationService.danger('GL Posting Error', e.message);
    }
  }

  // --- MIV (MATERIAL ISSUE) METHODS ---
  openAddMIV() {
    this.mivForm = {
      issueTo: 'Project',
      destinationId: 'Permian Overland',
      referenceNumber: '',
      requestedBy: 'Robert Vance',
      items: []
    };
    this.addMIVRow();
    this.isMIVModalOpen.set(true);
  }

  addMIVRow() {
    this.mivForm.items.push({
      itemCode: '',
      itemName: '',
      quantityRequested: 1,
      quantityIssued: 1,
      unitPrice: 0,
      totalPrice: 0,
      uom: 'EA',
      inventoryCreditAcc: '131000',
      consumptionDebitAcc: '511000' // Project Material Consumed Expense
    });
  }

  removeMIVRow(index: number) {
    if (this.mivForm.items.length > 1) {
      this.mivForm.items.splice(index, 1);
    }
  }

  onMIVItemChange(index: number) {
    const row = this.mivForm.items[index];
    const match = this.inventory().find(i => i.itemCode === row.itemCode);
    if (match) {
      row.itemName = match.itemName;
      row.uom = match.uom;
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

    const total = this.mivForm.items.reduce((sum, i) => sum + i.totalPrice, 0);

    const miv = this.mockDataService.addMIV({
      issueTo: this.mivForm.issueTo,
      destinationId: this.mivForm.destinationId,
      referenceNumber: this.mivForm.referenceNumber,
      requestedBy: this.mivForm.requestedBy,
      issueDate: new Date().toISOString().split('T')[0],
      items: this.mivForm.items,
      totalAmount: total
    });

    this.auditService.log({
      user: miv.requestedBy,
      role: 'Operations Engineer',
      module: 'Inventory',
      entityName: 'MIV',
      entityId: miv.voucherNumber,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(miv),
      details: `Created MIV Draft ${miv.voucherNumber} for destination: ${miv.destinationId}`
    });

    this.isMIVModalOpen.set(false);
    this.notificationService.success('Draft Saved', `Material Issue Voucher ${miv.voucherNumber} created.`);
  }

  approveMIV(miv: MIV) {
    // Check stock availability
    for (const item of miv.items) {
      const match = this.inventory().find(i => i.itemCode === item.itemCode);
      if (!match || match.quantity < item.quantityIssued) {
        this.notificationService.danger(
          'Insufficient Stock',
          `Cannot approve. Stock of ${item.itemName} is ${match ? match.quantity : 0}, requested: ${item.quantityIssued}`
        );
        return;
      }
    }

    this.mockDataService.updateMIVStatus(miv.id, 'Posted');

    // Debit Cost of Service / Project Consumed (511000) and Credit Inventory Asset (131000)
    try {
      this.financeService.postJournalEntry({
        date: miv.issueDate,
        reference: miv.voucherNumber,
        description: `Direct cost allocation for material consumption issued to ${miv.issueTo}: ${miv.destinationId}`,
        lines: [
          { id: crypto.randomUUID(), accountCode: '511000', accountName: 'Project Material Consumed', debit: miv.totalAmount, credit: 0 },
          { id: crypto.randomUUID(), accountCode: '131000', accountName: 'Material Warehouse Stock', debit: 0, credit: miv.totalAmount }
        ]
      });

      this.notificationService.success(
        'MIV Approved & Posted',
        `MIV ${miv.voucherNumber} items issued. Cost allocated to General Ledger.`
      );

      this.auditService.log({
        user: 'Admin User',
        role: 'Super Admin',
        module: 'Inventory',
        entityName: 'MIV',
        entityId: miv.voucherNumber,
        action: 'Approve',
        oldValue: 'Status: Draft',
        newValue: 'Status: Posted',
        details: `Approved MIV ${miv.voucherNumber} & Posted consumption entry of $${miv.totalAmount}.`
      });
    } catch (e: any) {
      this.notificationService.danger('GL Posting Error', e.message);
    }
  }

  // --- INTERNAL TRANSFER METHODS ---
  openAddTransfer() {
    this.transferForm = {
      fromWarehouseId: 'w1',
      toWarehouseId: 'w2',
      transferDate: new Date().toISOString().split('T')[0],
      requestedBy: 'Jim Halpert',
      items: []
    };
    this.addTransferRow();
    this.isTransferModalOpen.set(true);
  }

  addTransferRow() {
    this.transferForm.items.push({
      itemCode: '',
      itemName: '',
      quantity: 1,
      uom: 'EA'
    });
  }

  removeTransferRow(index: number) {
    if (this.transferForm.items.length > 1) {
      this.transferForm.items.splice(index, 1);
    }
  }

  onTransferItemChange(index: number) {
    const row = this.transferForm.items[index];
    const match = this.inventory().find(i => i.itemCode === row.itemCode);
    if (match) {
      row.itemName = match.itemName;
      row.uom = match.uom;
    }
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

    const xfer = this.mockDataService.addTransfer(this.transferForm);
    this.isTransferModalOpen.set(false);
    this.notificationService.success('Draft Saved', `Transfer request ${xfer.transferNumber} created.`);
  }

  approveTransfer(xfer: InternalTransfer) {
    // Check stock
    const whSource = this.warehouses().find(w => w.id === xfer.fromWarehouseId)?.name || 'Source WH';
    const whDest = this.warehouses().find(w => w.id === xfer.toWarehouseId)?.name || 'Dest WH';

    for (const item of xfer.items) {
      const match = this.inventory().find(i => i.itemCode === item.itemCode && i.location === whSource);
      if (!match || match.quantity < item.quantity) {
        this.notificationService.danger(
          'Stock Deficit',
          `Cannot transfer. ${item.itemName} stock in ${whSource} is insufficient.`
        );
        return;
      }
    }

    // Process Transfer
    xfer.items.forEach(item => {
      // 1. Decrement source
      const matchSource = this.inventory().find(i => i.itemCode === item.itemCode && i.location === whSource);
      if (matchSource) {
        const newQty = matchSource.quantity - item.quantity;
        this.mockDataService.updateInventoryItem(matchSource.id, {
          quantity: newQty,
          status: newQty === 0 ? 'Out of Stock' : newQty <= matchSource.minQuantity ? 'Low Stock' : 'In Stock'
        });
      }

      // 2. Increment or create dest
      const matchDest = this.inventory().find(i => i.itemCode === item.itemCode && i.location === whDest);
      if (matchDest) {
        this.mockDataService.updateInventoryItem(matchDest.id, {
          quantity: matchDest.quantity + item.quantity,
          status: 'In Stock'
        });
      } else {
        const itemDetails = this.inventory().find(i => i.itemCode === item.itemCode);
        this.mockDataService.addInventoryItem({
          itemCode: item.itemCode,
          itemName: item.itemName,
          quantity: item.quantity,
          minQuantity: 5,
          category: itemDetails?.category || 'General',
          uom: item.uom,
          location: whDest,
          unitPrice: itemDetails?.unitPrice || 0,
          status: 'In Stock'
        });
      }
    });

    this.mockDataService.updateTransferStatus(xfer.id, 'Posted');
    this.notificationService.success('Transfer Posted', `Voucher ${xfer.transferNumber} executed. Inventory relocated.`);

    this.auditService.log({
      user: 'Admin User',
      role: 'Super Admin',
      module: 'Inventory',
      entityName: 'InternalTransfer',
      entityId: xfer.transferNumber,
      action: 'Approve',
      oldValue: 'Status: Draft',
      newValue: 'Status: Posted',
      details: `Approved transfer ${xfer.transferNumber} from ${whSource} to ${whDest}`
    });
  }

  // --- STOCK ADJUSTMENT METHODS ---
  openAddAdjustment() {
    this.adjustmentForm = {
      warehouseId: 'w1',
      adjustmentDate: new Date().toISOString().split('T')[0],
      requestedBy: 'Jim Halpert',
      items: []
    };
    this.addAdjustmentRow();
    this.isAdjustmentModalOpen.set(true);
  }

  addAdjustmentRow() {
    this.adjustmentForm.items.push({
      itemCode: '',
      itemName: '',
      systemQuantity: 0,
      adjustedQuantity: 1,
      adjustmentType: 'Addition',
      unitPrice: 0,
      reason: ''
    });
  }

  removeAdjustmentRow(index: number) {
    if (this.adjustmentForm.items.length > 1) {
      this.adjustmentForm.items.splice(index, 1);
    }
  }

  onAdjustmentItemChange(index: number) {
    const row = this.adjustmentForm.items[index];
    const match = this.inventory().find(i => i.itemCode === row.itemCode);
    if (match) {
      row.itemName = match.itemName;
      row.systemQuantity = match.quantity;
      row.unitPrice = match.unitPrice;
    }
  }

  saveAdjustment() {
    const invalid = this.adjustmentForm.items.some(i => !i.itemCode || i.adjustedQuantity <= 0 || !i.reason.trim());
    if (invalid) {
      this.notificationService.danger('Validation Error', 'Please complete all items, adjustment quantities, and reasons.');
      return;
    }

    const value = this.adjustmentForm.items.reduce((sum, i) => {
      const val = i.adjustedQuantity * i.unitPrice;
      return sum + (i.adjustmentType === 'Addition' ? val : -val);
    }, 0);

    const adj = this.mockDataService.addAdjustment({
      warehouseId: this.adjustmentForm.warehouseId,
      adjustmentDate: this.adjustmentForm.adjustmentDate,
      requestedBy: this.adjustmentForm.requestedBy,
      items: this.adjustmentForm.items,
      totalValue: value
    });

    this.isAdjustmentModalOpen.set(false);
    this.notificationService.success('Draft Saved', `Stock Adjustment ${adj.adjustmentNumber} registered.`);
  }

  approveAdjustment(adj: StockAdjustment) {
    this.mockDataService.updateAdjustmentStatus(adj.id, 'Posted');

    // GL impact: Debit Stock/Asset (131000) and Credit Admin Expenses (521000) or vice versa
    try {
      const isPositive = adj.totalValue >= 0;
      const amount = Math.abs(adj.totalValue);

      this.financeService.postJournalEntry({
        date: adj.adjustmentDate,
        reference: adj.adjustmentNumber,
        description: `Inventory stock adjustment: ${adj.adjustmentNumber}. Reason: Batch write-offs.`,
        lines: [
          { id: crypto.randomUUID(), accountCode: '131000', accountName: 'Material Warehouse Stock', debit: isPositive ? amount : 0, credit: isPositive ? 0 : amount },
          { id: crypto.randomUUID(), accountCode: '521000', accountName: 'General & Administrative Costs', debit: isPositive ? 0 : amount, credit: isPositive ? amount : 0 }
        ]
      });

      this.notificationService.success('Adjustment Posted', `Adjustment ${adj.adjustmentNumber} posted and ledger updated.`);

      this.auditService.log({
        user: 'Admin User',
        role: 'Super Admin',
        module: 'Inventory',
        entityName: 'StockAdjustment',
        entityId: adj.adjustmentNumber,
        action: 'Approve',
        oldValue: 'Status: Draft',
        newValue: 'Status: Posted',
        details: `Approved stock adjustment ${adj.adjustmentNumber} with net valuation impact: $${adj.totalValue}`
      });
    } catch (e: any) {
      this.notificationService.danger('GL Posting Error', e.message);
    }
  }

  // --- PHYSICAL STOCK COUNT METHODS ---
  openAddCount() {
    const wh = this.warehouses()[0]?.name || 'Warehouse A';
    const itemsInWH = this.inventory().filter(i => i.location === wh);

    this.countForm = {
      warehouseId: 'w1',
      countDate: new Date().toISOString().split('T')[0],
      items: itemsInWH.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        systemQuantity: item.quantity,
        countedQuantity: item.quantity,
        variance: 0
      }))
    };
    this.isCountModalOpen.set(true);
  }

  onCountQtyChange(index: number) {
    const row = this.countForm.items[index];
    row.variance = row.countedQuantity - row.systemQuantity;
  }

  saveCount() {
    const countNumber = `CNT-2026-0${this.counts().length + 1}`;
    const newCount: StockCount = {
      id: `cnt${this.counts().length + 1}`,
      countNumber,
      warehouseId: this.countForm.warehouseId,
      countDate: this.countForm.countDate,
      countedBy: 'Jim Halpert',
      status: 'Completed',
      items: this.countForm.items
    };

    this.mockDataService.counts.update(val => [...val, newCount]);

    // Apply adjustments automatically for variances!
    const variances = this.countForm.items.filter(i => i.variance !== 0);
    if (variances.length > 0) {
      const adjItems: StockAdjustmentItem[] = variances.map(v => {
        const originalPrice = this.inventory().find(i => i.itemCode === v.itemCode)?.unitPrice || 0;
        return {
          itemCode: v.itemCode,
          itemName: v.itemName,
          systemQuantity: v.systemQuantity,
          adjustedQuantity: Math.abs(v.variance),
          adjustmentType: v.variance > 0 ? 'Addition' : 'Deduction',
          unitPrice: originalPrice,
          reason: `Physical count variance reconciliation for ${countNumber}`
        };
      });

      const value = adjItems.reduce((sum, i) => {
        const val = i.adjustedQuantity * i.unitPrice;
        return sum + (i.adjustmentType === 'Addition' ? val : -val);
      }, 0);

      const autoAdj = this.mockDataService.addAdjustment({
        warehouseId: this.countForm.warehouseId,
        adjustmentDate: this.countForm.countDate,
        requestedBy: 'System Count Sync',
        items: adjItems,
        totalValue: value
      });

      // Auto approve
      this.approveAdjustment(autoAdj);
    }

    this.isCountModalOpen.set(false);
    this.notificationService.success('Count Completed', `Physical count ${countNumber} finalized. Variances auto-adjusted.`);
  }

  // --- EXCEL IMPORT METHODS ---
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
    let headers: string[] = [];
    let filename = '';

    if (this.isEquipmentImport()) {
      headers = [
        'Equipment Code', 'Asset Tag', 'Equipment Name', 'Equipment Type',
        'Manufacturer', 'Model', 'Serial Number', 'Purchase Date',
        'Purchase Cost', 'Location', 'Cost Center', 'Status'
      ];
      filename = 'equipment_import_template.csv';
    } else {
      headers = ['Item Code', 'Item Name', 'Category', 'UOM', 'Quantity', 'Unit Cost', 'Warehouse'];
      filename = 'items_import_template.csv';
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragOver.set(false);
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      this.handleFile(file);
    }
  }

  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
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
      } else {
        this.uploadProgress.set(current + 30);
      }
    }, 200);
  }

  generateMockPreviewRecords() {
    const errors: string[] = [];
    const preview: any[] = [];

    if (this.isEquipmentImport()) {
      preview.push({
        equipmentCode: 'EQ-GEN-010',
        assetNumber: 'AT-80922',
        equipmentName: 'Auxiliary Generator Pad 4',
        category: 'Generator',
        manufacturer: 'Cummins',
        model: 'QSK50',
        serialNumber: 'SN-CUM-80221',
        purchaseDate: '2025-01-10',
        purchaseCost: 95000,
        currentValue: 85000,
        depreciationMethod: 'Straight Line',
        location: 'Warehouse B',
        projectAssignment: 'Rig Delta Active',
        costCenter: 'CC-MNT-002',
        department: 'Maintenance',
        status: 'Active',
        operatingHours: 120,
        isValid: true
      });

      preview.push({
        equipmentCode: 'EQ-PMP-099',
        assetNumber: 'AT-90211',
        equipmentName: 'High Pressure Mud Injector',
        category: 'Pump',
        manufacturer: 'FMC Technologies',
        model: 'L11',
        serialNumber: '',
        purchaseDate: '2024-03-20',
        purchaseCost: 45000,
        currentValue: 35000,
        depreciationMethod: 'Straight Line',
        location: 'Warehouse A',
        projectAssignment: '',
        costCenter: 'CC-DRL-001',
        department: 'Drilling',
        status: 'Standby',
        operatingHours: 0,
        isValid: false,
        errorMessage: 'Row 2: Serial Number is required.'
      });

      errors.push('Row 2: Serial Number is required.');
    } else {
      preview.push({
        itemCode: 'TUB-PIPE-3.5IN',
        itemName: 'Steel Tubing 3.5in J55',
        category: 'Tubulars',
        uom: 'JOINTS',
        quantity: 120,
        unitPrice: 450,
        location: 'Pipe Yard 1',
        status: 'In Stock',
        isValid: true
      });

      preview.push({
        itemCode: '',
        itemName: 'Mud Chemical Additive Class G',
        category: 'Drilling Consumables',
        uom: 'BAGS',
        quantity: 300,
        unitPrice: 45,
        location: 'Warehouse A',
        status: 'In Stock',
        isValid: false,
        errorMessage: 'Row 2: Item Code is required.'
      });

      errors.push('Row 2: Item Code is required.');
    }

    this.importPreviewRecords.set(preview);
    this.importValidationErrors.set(errors);
  }

  confirmImport() {
    const validRecords = this.importPreviewRecords().filter(r => r.isValid);
    const totalCount = this.importPreviewRecords().length;
    const successCount = validRecords.length;
    const failedCount = totalCount - successCount;

    if (this.isEquipmentImport()) {
      validRecords.forEach(r => {
        const newEq = this.mockDataService.addEquipment({
          assetNumber: r.assetNumber,
          equipmentCode: r.equipmentCode,
          equipmentName: r.equipmentName,
          category: r.category,
          manufacturer: r.manufacturer,
          model: r.model,
          serialNumber: r.serialNumber,
          purchaseDate: r.purchaseDate,
          purchaseCost: r.purchaseCost,
          currentValue: r.currentValue,
          depreciationMethod: r.depreciationMethod,
          location: r.location,
          projectAssignment: r.projectAssignment,
          costCenter: r.costCenter,
          department: r.department,
          status: r.status as AssetStatus,
          operatingHours: r.operatingHours,
          lastMaintenanceDate: r.purchaseDate
        });

        this.mockDataService.addAssetHistory({
          assetId: newEq.id,
          equipmentCode: newEq.equipmentCode,
          changeType: 'Status Change',
          oldValue: 'None (Imported)',
          newValue: newEq.status,
          changedBy: 'System Excel Loader',
          notes: `Batch imported from ${this.uploadedFileName()}`
        });
      });

      this.mockDataService.addBulkImportHistory({
        importedBy: 'Admin Operator',
        numberOfRecords: successCount,
        status: failedCount > 0 ? 'Failed' : 'Success',
        module: 'Assets'
      });
    } else {
      validRecords.forEach(r => {
        this.mockDataService.addInventoryItem({
          itemCode: r.itemCode,
          itemName: r.itemName,
          category: r.category,
          uom: r.uom,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
          location: r.location,
          status: r.status,
          minQuantity: 5
        });
      });

      this.mockDataService.addBulkImportHistory({
        importedBy: 'Admin Operator',
        numberOfRecords: successCount,
        status: failedCount > 0 ? 'Failed' : 'Success',
        module: 'Inventory'
      });
    }

    this.isImportModalOpen.set(false);
    this.notificationService.success('Import Finished', `Successfully imported: ${successCount} records, failed: ${failedCount}.`);
  }

  getAbsValue(val: number): number {
    return Math.abs(val || 0);
  }

  // ─── Inventory Reservation Methods ───────────────────────────────────────
  readonly showReservationModal = signal(false);

  reservationForm: Omit<InventoryReservation, 'id' | 'reservationNumber' | 'status'> = {
    projectCode: '', projectName: '', requestedBy: '',
    requestDate: new Date().toISOString().split('T')[0],
    requiredDate: '', totalValue: 0,
    items: [{ itemCode: '', itemName: '', uom: 'EA', requestedQuantity: 1, reservedQuantity: 0, unitPrice: 0 }]
  };

  readonly pendingReservations = computed(() =>
    this.inventoryReservations().filter(r => r.status === 'Pending').length
  );
  readonly approvedReservations = computed(() =>
    this.inventoryReservations().filter(r => r.status === 'Approved').length
  );
  readonly reservedValue = computed(() =>
    this.inventoryReservations().filter(r => r.status === 'Approved').reduce((s, r) => s + r.totalValue, 0)
  );

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
