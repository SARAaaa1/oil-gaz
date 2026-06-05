import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { AuditService } from '../../core/services/audit.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryItem } from '../../shared/interfaces/inventory.interface';
import { Equipment, AssetCategory, AssetStatus } from '../../shared/interfaces/assets.interface';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './inventory.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly auditService = inject(AuditService);
  private readonly translate = inject(TranslateService);

  readonly inventory = this.mockDataService.inventoryItems;
  readonly bulkImportHistories = this.mockDataService.bulkImportHistories;

  readonly searchQuery = signal<string>('');
  readonly locationFilter = signal<string>('ALL');
  readonly activeTab = signal<'items' | 'history'>('items');

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

  // Filtered inventory list
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

  // Filtered import history for Inventory module
  readonly filteredHistory = computed(() => {
    return this.bulkImportHistories().filter(h => h.module === 'Inventory');
  });

  // --- ITEM DIALOG / MODAL STATES ---
  readonly isItemModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly isViewMode = signal(false);
  readonly selectedItem = signal<InventoryItem | null>(null);

  // Add/Edit Form model
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

  // --- EQUIPMENT DIALOG / MODAL STATES (inside items page) ---
  readonly isEquipmentModalOpen = signal(false);
  equipmentForm = {
    assetNumber: '',
    equipmentCode: '',
    equipmentName: '',
    category: 'Rig' as AssetCategory,
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchaseCost: 0,
    currentValue: 0,
    depreciationMethod: 'Straight Line',
    location: 'Warehouse A',
    projectAssignment: '',
    costCenter: 'CC-DRL-001',
    department: 'Drilling',
    status: 'Active' as AssetStatus,
    operatingHours: 0,
    lastMaintenanceDate: '',
    nextMaintenanceDate: ''
  };

  // --- EXCEL IMPORT DIALOG STATES ---
  readonly isImportModalOpen = signal(false);
  readonly isEquipmentImport = signal(false); // true if importing Equipment, false for Items
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

  // --- ACTION METHODS ---
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
      alert(this.translate.instant('inventory.validation_errors'));
      return;
    }

    // Determine status from quantity & reorder level
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

        // Audit Logging
        this.auditService.log({
          action: 'Update',
          module: 'Inventory',
          entityName: 'InventoryItem',
          entityId: original.itemCode,
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

      // Audit Logging
      this.auditService.log({
        action: 'Create',
        module: 'Inventory',
        entityName: 'InventoryItem',
        entityId: newItem.itemCode,
        newValue: JSON.stringify(newItem),
        details: `Registered new inventory item: ${newItem.itemName}`
      });
    }

    this.isItemModalOpen.set(false);
  }

  // --- EQUIPMENT REGISTRATION IN ITEMS PAGE ---
  openAddEquipment() {
    this.equipmentForm = {
      assetNumber: 'AT-' + Math.floor(10000 + Math.random() * 90000),
      equipmentCode: 'EQ-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      equipmentName: '',
      category: 'Rig',
      manufacturer: '',
      model: '',
      serialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 50000,
      currentValue: 45000,
      depreciationMethod: 'Straight Line',
      location: 'Warehouse A',
      projectAssignment: '',
      costCenter: 'CC-DRL-001',
      department: 'Drilling',
      status: 'Active',
      operatingHours: 0,
      lastMaintenanceDate: '',
      nextMaintenanceDate: ''
    };
    this.isEquipmentModalOpen.set(true);
  }

  saveEquipment() {
    if (!this.equipmentForm.equipmentName || !this.equipmentForm.serialNumber) {
      alert('Equipment Name and Serial Number are required.');
      return;
    }

    const newEq = this.mockDataService.addEquipment({
      assetNumber: this.equipmentForm.assetNumber,
      equipmentCode: this.equipmentForm.equipmentCode,
      equipmentName: this.equipmentForm.equipmentName,
      category: this.equipmentForm.category,
      manufacturer: this.equipmentForm.manufacturer,
      model: this.equipmentForm.model,
      serialNumber: this.equipmentForm.serialNumber,
      purchaseDate: this.equipmentForm.purchaseDate,
      purchaseCost: this.equipmentForm.purchaseCost,
      currentValue: this.equipmentForm.currentValue,
      depreciationMethod: this.equipmentForm.depreciationMethod,
      location: this.equipmentForm.location,
      projectAssignment: this.equipmentForm.projectAssignment || 'Unassigned',
      costCenter: this.equipmentForm.costCenter,
      department: this.equipmentForm.department,
      status: this.equipmentForm.status,
      operatingHours: this.equipmentForm.operatingHours,
      lastMaintenanceDate: this.equipmentForm.lastMaintenanceDate || undefined,
      nextMaintenanceDate: this.equipmentForm.nextMaintenanceDate || undefined
    });

    // Asset tracking initial log
    this.mockDataService.addAssetHistory({
      assetId: newEq.id,
      equipmentCode: newEq.equipmentCode,
      changeType: 'Status Change',
      oldValue: 'None (New)',
      newValue: newEq.status,
      changedBy: this.auditService.logs()[0]?.user || 'Admin Operator',
      notes: 'Initial registration from Items Panel.'
    });

    // Audit Logging
    this.auditService.log({
      action: 'Create',
      module: 'Operations',
      entityName: 'Equipment',
      entityId: newEq.equipmentCode,
      newValue: JSON.stringify(newEq),
      details: `Registered new Equipment: ${newEq.equipmentName} (${newEq.category})`
    });

    this.isEquipmentModalOpen.set(false);
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
      alert('Only .xlsx and .csv files are supported.');
      return;
    }

    this.uploadedFileName.set(file.name);
    this.isUploading.set(true);
    this.uploadProgress.set(10);

    // Simulate file parsing progress
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
      // Simulate 3 Equipment records
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
        serialNumber: '', // Serial missing (error)
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

      preview.push({
        equipmentCode: 'EQ-TRK-772',
        assetNumber: 'AT-30441',
        equipmentName: 'Offroad Water Carrier',
        category: 'Truck',
        manufacturer: 'Peterbilt',
        model: '348',
        serialNumber: 'SN-PB-90214',
        purchaseDate: '2025-04-12',
        purchaseCost: 140000,
        currentValue: 130000,
        depreciationMethod: 'Straight Line',
        location: 'Pipe Yard 1',
        projectAssignment: 'Logistics Supply',
        costCenter: 'CC-LOG-004',
        department: 'Logistics',
        status: 'InvalidStatusVal', // Invalid Status (error)
        operatingHours: 45,
        isValid: false,
        errorMessage: 'Row 3: Status must be Active, Standby, Maintenance, or Out Of Service.'
      });

      errors.push('Row 2: Serial Number is required.');
      errors.push('Row 3: Status must be Active, Standby, Maintenance, or Out Of Service.');
    } else {
      // Simulate 3 Inventory Item records
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
        itemCode: '', // Code missing (error)
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

      preview.push({
        itemCode: 'LUB-OIL-SAE40',
        itemName: 'Engine Lubricating Oil SAE40',
        category: 'Lubricants',
        uom: 'DRUM',
        quantity: -10, // Negative Qty (error)
        unitPrice: 280,
        location: 'Warehouse B',
        status: 'Low Stock',
        isValid: false,
        errorMessage: 'Row 3: Quantity cannot be negative.'
      });

      errors.push('Row 2: Item Code is required.');
      errors.push('Row 3: Quantity cannot be negative.');
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
      // Import valid Equipment
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

        // Log Asset History
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

      // Log Bulk Import History
      this.mockDataService.addBulkImportHistory({
        importedBy: this.auditService.logs()[0]?.user || 'Admin Operator',
        numberOfRecords: successCount,
        status: failedCount > 0 ? 'Failed' : 'Success', // wait, or track total status
        module: 'Assets'
      });

      // Log Audit Trail
      this.auditService.log({
        action: 'Status Change',
        module: 'Operations',
        entityName: 'EquipmentImport',
        entityId: `Excel-${Date.now()}`,
        newValue: `Success: ${successCount}, Fail: ${failedCount}`,
        details: `Excel Equipment Import executed. File: ${this.uploadedFileName()}. Added ${successCount} equipment.`
      });

    } else {
      // Import valid Items
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

      // Log Bulk Import History
      this.mockDataService.addBulkImportHistory({
        importedBy: this.auditService.logs()[0]?.user || 'Admin Operator',
        numberOfRecords: successCount,
        status: failedCount > 0 ? 'Failed' : 'Success',
        module: 'Inventory'
      });

      // Log Audit Trail
      this.auditService.log({
        action: 'Status Change',
        module: 'Inventory',
        entityName: 'ItemsImport',
        entityId: `Excel-${Date.now()}`,
        newValue: `Success: ${successCount}, Fail: ${failedCount}`,
        details: `Excel Items Import executed. File: ${this.uploadedFileName()}. Added ${successCount} items.`
      });
    }

    this.isImportModalOpen.set(false);
    alert(`Import Complete. Successful: ${successCount}, Failed: ${failedCount}`);
  }
}
