import { Injectable, signal, computed } from '@angular/core';
import { PurchaseRequest, PurchaseRequestItem, PurchaseRequestStatus } from '../../shared/interfaces/purchase-request.interface';
import { RFQ, RFQQuotation, RFQStatus } from '../../shared/interfaces/rfq.interface';
import { PurchaseOrder, POItem, PurchaseOrderStatus } from '../../shared/interfaces/purchase-order.interface';
import { Vendor } from '../../shared/interfaces/vendor.interface';
import { Rig, RigTimesheet, TimesheetDayRow } from '../../shared/interfaces/operations.interface';
import { 
  InventoryItem, Warehouse, WarehouseLocation, UOM, MaterialCategory, 
  MRV, MRVItem, MIV, MIVItem, InternalTransfer, InternalTransferItem, 
  StockAdjustment, StockAdjustmentItem, StockCount, StockCountItem,
  InventoryReservation, InventoryReservationItem
} from '../../shared/interfaces/inventory.interface';
import { 
  Equipment, AssetHistory, BulkImportRecord, RigDetails, Caravan, Camp, CampAllocation, Vehicle, TripLog,
  AssetAssignment, AssetTransfer, AssetDisposal
} from '../../shared/interfaces/assets.interface';
import { 
  ItemCategory, ItemSubCategory, ItemMaster, WarehouseStructure, WarehouseZone, WarehouseRack, WarehouseShelf, WarehouseBin,
  InspectionRequest, InspectionRequestItem, NCR, PMSchedule, WorkOrder,
  SupplierInvoice, APAgingEntry, PaymentVoucher, ARAgingEntry, CollectionVoucher, BankAccountDetails, CashAccountDetails, BankReconciliation,
  HSEIncident, PTW, SafetyInspection, SafetyRisk
} from '../../shared/interfaces';
import { FuelTank, FuelReceipt, FuelIssue } from '../../shared/interfaces/fuel.interface';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  // --- SIGNAL STORES ---
  readonly purchaseRequests = signal<PurchaseRequest[]>([]);
  readonly rfqs = signal<RFQ[]>([]);
  readonly purchaseOrders = signal<PurchaseOrder[]>([]);
  readonly inventoryItems = signal<InventoryItem[]>([]);
  readonly vendors = signal<Vendor[]>([]);
  readonly rigs = signal<Rig[]>([]);
  readonly timesheets = signal<RigTimesheet[]>([]);
  readonly equipment = signal<Equipment[]>([]);
  readonly assetHistories = signal<AssetHistory[]>([]);
  readonly bulkImportHistories = signal<BulkImportRecord[]>([]);

  // Phase 2 / extended signals
  readonly warehouses = signal<Warehouse[]>([]);
  readonly mrvs = signal<MRV[]>([]);
  readonly mivs = signal<MIV[]>([]);
  readonly transfers = signal<InternalTransfer[]>([]);
  readonly adjustments = signal<StockAdjustment[]>([]);
  readonly counts = signal<StockCount[]>([]);
  readonly camps = signal<Camp[]>([]);
  readonly caravans = signal<Caravan[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly tripLogs = signal<TripLog[]>([]);

  // Phase 3 signals
  readonly itemMasters = signal<ItemMaster[]>([]);
  readonly itemCategories = signal<ItemCategory[]>([]);
  readonly itemSubCategories = signal<ItemSubCategory[]>([]);
  readonly warehouseStructures = signal<WarehouseStructure[]>([]);
  readonly inspectionRequests = signal<InspectionRequest[]>([]);
  readonly ncrs = signal<NCR[]>([]);
  readonly assetAssignments = signal<AssetAssignment[]>([]);
  readonly assetTransfers = signal<AssetTransfer[]>([]);
  readonly assetDisposals = signal<AssetDisposal[]>([]);
  readonly pmSchedules = signal<PMSchedule[]>([]);
  readonly workOrders = signal<WorkOrder[]>([]);
  readonly supplierInvoices = signal<SupplierInvoice[]>([]);
  readonly apAging = signal<APAgingEntry[]>([]);
  readonly paymentVouchers = signal<PaymentVoucher[]>([]);
  readonly arAging = signal<ARAgingEntry[]>([]);
  readonly collectionVouchers = signal<CollectionVoucher[]>([]);
  readonly bankAccountsDetails = signal<BankAccountDetails[]>([]);
  readonly cashAccountsDetails = signal<CashAccountDetails[]>([]);
  readonly bankReconciliations = signal<BankReconciliation[]>([]);
  readonly hseIncidents = signal<HSEIncident[]>([]);
  readonly ptws = signal<PTW[]>([]);
  readonly safetyInspections = signal<SafetyInspection[]>([]);
  readonly safetyRisks = signal<SafetyRisk[]>([]);

  // Phase 4 signals — Fuel Management
  readonly fuelTanks = signal<FuelTank[]>([]);
  readonly fuelReceipts = signal<FuelReceipt[]>([]);
  readonly fuelIssues = signal<FuelIssue[]>([]);
  // Phase 4 signals — Inventory Reservations
  readonly inventoryReservations = signal<InventoryReservation[]>([]);

  constructor() {
    this.initializeMockData();
  }


  private initializeMockData() {
    // 1. Vendors
    const mockVendors: Vendor[] = [
      {
        id: 'v1',
        vendorCode: 'VND-GOS-001',
        vendorName: 'Global Oilfield Solutions',
        arabicName: 'الحلول العالمية لحقول النفط',
        taxNumber: 'TX-88992211',
        vatNumber: 'VAT-99001122',
        commercialRegistration: 'CR-101009988',
        address: '1220 Petroleum Way, Houston TX 77001',
        contactPerson: 'Mark Peterson',
        contactEmail: 'm.peterson@globaloilfield.com',
        contactPhone: '+1-555-0199',
        paymentTerms: 'Net 30',
        currency: 'USD',
        rating: 4.8,
        status: 'Active',
        bankAccounts: [
          { bankName: 'HSBC Corporate', accountNumber: '120-889922-001', iban: 'AE12HSBC0000120889922001', currency: 'USD' }
        ],
        contactPersons: [
          { name: 'Mark Peterson', role: 'Sales Account Manager', email: 'm.peterson@globaloilfield.com', phone: '+1-555-0199' }
        ]
      },
      {
        id: 'v2',
        vendorCode: 'VND-APX-002',
        vendorName: 'APEX Industrial Supplies',
        arabicName: 'أبيكس للتوريدات الصناعية',
        taxNumber: 'TX-44558833',
        vatNumber: 'VAT-44558833',
        commercialRegistration: 'CR-101007766',
        address: '850 Industrial Blvd, Dallas TX 75201',
        contactPerson: 'Jane Sterling',
        contactEmail: 'j.sterling@apexind.com',
        contactPhone: '+1-555-0145',
        paymentTerms: 'Net 45',
        currency: 'USD',
        rating: 4.2,
        status: 'Active',
        bankAccounts: [
          { bankName: 'Chase Commercial', accountNumber: '5544-3322-11', iban: 'US88CHAS00005544332211', currency: 'USD' }
        ],
        contactPersons: [
          { name: 'Jane Sterling', role: 'Customer Support Lead', email: 'j.sterling@apexind.com', phone: '+1-555-0145' }
        ]
      },
      {
        id: 'v3',
        vendorCode: 'VND-VAL-003',
        vendorName: 'Valero Drilling Supplies',
        arabicName: 'فاليرو لمستلزمات الحفر',
        taxNumber: 'TX-11223344',
        vatNumber: 'VAT-11223344',
        commercialRegistration: 'CR-101005544',
        address: '400 Refinery Rd, San Antonio TX 78201',
        contactPerson: 'Carlos Ruiz',
        contactEmail: 'c.ruiz@valerods.com',
        contactPhone: '+1-555-0182',
        paymentTerms: 'Net 15',
        currency: 'SAR',
        rating: 4.5,
        status: 'Active',
        bankAccounts: [
          { bankName: 'Saudi National Bank', accountNumber: '2030-1122-002', iban: 'SA80SNB0000020301122002', currency: 'SAR' }
        ],
        contactPersons: [
          { name: 'Carlos Ruiz', role: 'Operations Officer', email: 'c.ruiz@valerods.com', phone: '+1-555-0182' }
        ]
      },
      {
        id: 'v4',
        vendorCode: 'VND-HSE-004',
        vendorName: 'HSE Safety First Inc',
        arabicName: 'بيئة وصحة أولاً للسلامة',
        taxNumber: 'TX-55443322',
        vatNumber: 'VAT-55443322',
        commercialRegistration: 'CR-101003322',
        address: '99 Safety Way, Houston TX 77002',
        contactPerson: 'Sarah Connor',
        contactEmail: 's.connor@hsesafety.com',
        contactPhone: '+1-555-0123',
        paymentTerms: 'Net 30',
        currency: 'USD',
        rating: 4.9,
        status: 'Active',
        bankAccounts: [
          { bankName: 'Wells Fargo Corporate', accountNumber: '9988-7766-55', iban: 'US99WELS00009988776655', currency: 'USD' }
        ],
        contactPersons: [
          { name: 'Sarah Connor', role: 'HSE Compliance Specialist', email: 's.connor@hsesafety.com', phone: '+1-555-0123' }
        ]
      }
    ];
    this.vendors.set(mockVendors);


    // 2. Inventory Items
    const mockInventory: InventoryItem[] = [
      {
        id: 'inv1',
        itemCode: 'DR-BIT-8.5-PDC',
        itemName: 'Drill Bit 8.5in PDC Premium',
        quantity: 8,
        minQuantity: 5,
        category: 'Drilling Consumables',
        uom: 'EA',
        location: 'Warehouse A',
        unitPrice: 8500,
        status: 'In Stock'
      },
      {
        id: 'inv2',
        itemCode: 'HY-PUMP-HP450',
        itemName: 'Hydraulic Pump HP-450 Seal Unit',
        quantity: 1,
        minQuantity: 2,
        category: 'Machinery Spares',
        uom: 'EA',
        location: 'Warehouse B',
        unitPrice: 12500,
        status: 'Low Stock'
      },
      {
        id: 'inv3',
        itemCode: 'HSE-HARN-CLA',
        itemName: 'Safety Harness Class A Full Body',
        quantity: 45,
        minQuantity: 15,
        category: 'HSE Equipment',
        uom: 'EA',
        location: 'Warehouse A',
        unitPrice: 150,
        status: 'In Stock'
      },
      {
        id: 'inv4',
        itemCode: 'HSE-DET-GAS',
        itemName: 'Multi-Gas Detector Portable',
        quantity: 0,
        minQuantity: 10,
        category: 'HSE Equipment',
        uom: 'EA',
        location: 'Warehouse A',
        unitPrice: 420,
        status: 'Out of Stock'
      },
      {
        id: 'inv5',
        itemCode: 'LUB-GRE-DRUM',
        itemName: 'Premium Rig Grease (55 Gal)',
        quantity: 12,
        minQuantity: 20,
        category: 'Lubricants',
        uom: 'DRUM',
        location: 'Warehouse B',
        unitPrice: 350,
        status: 'Low Stock'
      },
      {
        id: 'inv6',
        itemCode: 'TUB-PIPE-5IN',
        itemName: 'Steel Pipes 5in Casing joints',
        quantity: 180,
        minQuantity: 100,
        category: 'Tubulars',
        uom: 'JOINTS',
        location: 'Pipe Yard 1',
        unitPrice: 950,
        status: 'In Stock'
      }
    ];
    this.inventoryItems.set(mockInventory);

    // 3. Purchase Requests
    const mockPRs: PurchaseRequest[] = [
      {
        id: 'pr1',
        requestNumber: 'PR-2026-001',
        department: 'Drilling Operations',
        costCenter: 'CC-DRL-001',
        requestDate: '2026-05-10',
        requiredDate: '2026-06-15',
        status: 'Approved',
        description: 'Critical drill bits and casing joints required for Rig Alpha offshore drilling.',
        requestedBy: 'Robert Vance',
        items: [
          { id: 'pri1', itemCode: 'DR-BIT-8.5-PDC', itemName: 'Drill Bit 8.5in PDC Premium', quantity: 2, uom: 'EA', notes: 'Needed for sandstone segment' },
          { id: 'pri2', itemCode: 'TUB-PIPE-5IN', itemName: 'Steel Pipes 5in Casing joints', quantity: 40, uom: 'JOINTS', notes: 'Grade L80' }
        ]
      },
      {
        id: 'pr2',
        requestNumber: 'PR-2026-002',
        department: 'Maintenance & Engineering',
        costCenter: 'CC-MNT-002',
        requestDate: '2026-05-15',
        requiredDate: '2026-06-10',
        status: 'RFQ Created',
        description: 'Replacement hydraulic pump unit and seals for Rig Beta overhaul.',
        requestedBy: 'Sarah Jenkins',
        items: [
          { id: 'pri3', itemCode: 'HY-PUMP-HP450', itemName: 'Hydraulic Pump HP-450 Seal Unit', quantity: 1, uom: 'EA', notes: 'Immediate replacement needed' }
        ]
      },
      {
        id: 'pr3',
        requestNumber: 'PR-2026-003',
        department: 'HSE & Safety',
        costCenter: 'CC-HSE-001',
        requestDate: '2026-05-28',
        requiredDate: '2026-06-20',
        status: 'Pending Approval',
        description: 'Annual safety gear replenishing and multi-gas detector replacement.',
        requestedBy: 'David Miller',
        items: [
          { id: 'pri4', itemCode: 'HSE-HARN-CLA', itemName: 'Safety Harness Class A Full Body', quantity: 20, uom: 'EA', notes: 'For offshore rig crews' },
          { id: 'pri5', itemCode: 'HSE-DET-GAS', itemName: 'Multi-Gas Detector Portable', quantity: 12, uom: 'EA', notes: 'Must be calibrated for H2S' }
        ]
      },
      {
        id: 'pr4',
        requestNumber: 'PR-2026-004',
        department: 'Logistics',
        costCenter: 'CC-LOG-004',
        requestDate: '2026-06-01',
        requiredDate: '2026-07-01',
        status: 'Draft',
        description: 'Heavy duty grease drums and lifting straps for Warehouse B.',
        requestedBy: 'System Scheduler',
        items: [
          { id: 'pri6', itemCode: 'LUB-GRE-DRUM', itemName: 'Premium Rig Grease (55 Gal)', quantity: 15, uom: 'DRUM', notes: 'Restock min level' }
        ]
      }
    ];
    this.purchaseRequests.set(mockPRs);

    // 4. RFQs & Quotations
    const mockRFQs: RFQ[] = [
      {
        id: 'rfq1',
        rfqNumber: 'RFQ-2026-001',
        purchaseRequestId: 'pr2',
        purchaseRequestNumber: 'PR-2026-002',
        title: 'Hydraulic Pump HP-450 & Seal Kits',
        createdDate: '2026-05-16',
        deadlineDate: '2026-05-25',
        status: 'Quotations Received',
        vendors: [
          { vendorId: 'v1', vendorName: 'Global Oilfield Solutions', contactEmail: 'm.peterson@globaloilfield.com', status: 'Submitted' },
          { vendorId: 'v2', vendorName: 'APEX Industrial Supplies', contactEmail: 'j.sterling@apexind.com', status: 'Submitted' },
          { vendorId: 'v3', vendorName: 'Valero Drilling Supplies', contactEmail: 'c.ruiz@valerods.com', status: 'Submitted' }
        ],
        quotations: [
          {
            id: 'q1',
            vendorId: 'v2',
            vendorName: 'APEX Industrial Supplies',
            price: 12500,
            deliveryWeeks: 2,
            taxPercent: 15,
            taxAmount: 1875,
            totalAmount: 14375,
            notes: 'Ex-stocks. Standard 1 year warranty included.'
          },
          {
            id: 'q2',
            vendorId: 'v1',
            vendorName: 'Global Oilfield Solutions',
            price: 11200,
            deliveryWeeks: 4,
            taxPercent: 15,
            taxAmount: 1680,
            totalAmount: 12880,
            isBestPrice: true,
            notes: 'Direct factory pricing. Lead time 4 weeks ship.'
          },
          {
            id: 'q3',
            vendorId: 'v3',
            vendorName: 'Valero Drilling Supplies',
            price: 13800,
            deliveryWeeks: 1,
            taxPercent: 15,
            taxAmount: 2070,
            totalAmount: 15870,
            isRecommended: true,
            notes: 'Expedited shipping. Available for next-day dispatch.'
          }
        ]
      },
      {
        id: 'rfq2',
        rfqNumber: 'RFQ-2026-002',
        purchaseRequestId: 'pr3',
        purchaseRequestNumber: 'PR-2026-003',
        title: 'Safety Gear & H2S Multi-Gas Detectors',
        createdDate: '2026-05-29',
        deadlineDate: '2026-06-08',
        status: 'Sent',
        vendors: [
          { vendorId: 'v4', vendorName: 'HSE Safety First Inc', contactEmail: 's.connor@hsesafety.com', status: 'Invited' },
          { vendorId: 'v2', vendorName: 'APEX Industrial Supplies', contactEmail: 'j.sterling@apexind.com', status: 'Invited' }
        ],
        quotations: []
      }
    ];
    this.rfqs.set(mockRFQs);

    // 5. Purchase Orders
    const mockPOs: PurchaseOrder[] = [
      {
        id: 'po1',
        poNumber: 'PO-2026-001',
        rfqId: 'rfq1',
        rfqNumber: 'RFQ-2026-001',
        vendorId: 'v1',
        vendorName: 'Global Oilfield Solutions',
        vendorTaxNumber: 'TX-88992211',
        vendorAddress: '1220 Petroleum Way, Houston TX 77001',
        date: '2026-05-26',
        deliveryDate: '2026-06-25',
        costCenter: 'CC-DRL-001',
        paymentTerms: 'Net 30',
        status: 'Approved',
        subtotal: 11200,
        taxPercent: 15,
        taxAmount: 1680,
        withholdingTaxPercent: 2,
        withholdingTaxAmount: 224,
        totalAmount: 12656, // subtotal + tax - wht
        items: [
          {
            id: 'poi1',
            itemCode: 'HY-PUMP-HP450',
            itemName: 'Hydraulic Pump HP-450 Seal Unit',
            quantity: 1,
            unitPrice: 11200,
            uom: 'EA',
            totalPrice: 11200
          }
        ],
        approvalWorkflow: [
          { role: 'Procurement Specialist', approverName: 'Jane Smith', status: 'Approved', actionDate: '2026-05-25', comments: 'Cheapest option selected from RFQ' },
          { role: 'Procurement Manager', approverName: 'Frank Jones', status: 'Approved', actionDate: '2026-05-26', comments: 'Budget matches cost center allocations' },
          { role: 'VP Operations', approverName: 'Marcus Aurelius', status: 'Approved', actionDate: '2026-05-26', comments: 'Essential rig spares release' }
        ]
      },
      {
        id: 'po2',
        poNumber: 'PO-2026-002',
        vendorId: 'v2',
        vendorName: 'APEX Industrial Supplies',
        vendorTaxNumber: 'TX-44558833',
        vendorAddress: '850 Industrial Blvd, Dallas TX 75201',
        date: '2026-06-02',
        deliveryDate: '2026-06-16',
        costCenter: 'CC-MNT-002',
        paymentTerms: 'Net 45',
        status: 'Pending Approval',
        subtotal: 17000,
        taxPercent: 15,
        taxAmount: 2550,
        withholdingTaxPercent: 2,
        withholdingTaxAmount: 340,
        totalAmount: 19210,
        items: [
          {
            id: 'poi2',
            itemCode: 'DR-BIT-8.5-PDC',
            itemName: 'Drill Bit 8.5in PDC Premium',
            quantity: 2,
            unitPrice: 8500,
            uom: 'EA',
            totalPrice: 17000
          }
        ],
        approvalWorkflow: [
          { role: 'Procurement Specialist', approverName: 'Jane Smith', status: 'Approved', actionDate: '2026-06-02', comments: 'Emergency order for drilling operations' },
          { role: 'Procurement Manager', approverName: 'Frank Jones', status: 'Pending', comments: 'Awaiting secondary cost center sign-off' },
          { role: 'VP Operations', approverName: 'Marcus Aurelius', status: 'Pending' }
        ]
      }
    ];
    this.purchaseOrders.set(mockPOs);

    // 6. Rigs
    const mockRigs: Rig[] = [
      { id: 'rig1', rigName: 'Rig Alpha (Offshore)', location: 'Gulf of Mexico - Block 41A', status: 'Active', drillDepthFt: 14850, crewCount: 42, managerName: 'Robert Vance' },
      { id: 'rig2', rigName: 'Rig Beta (Land)', location: 'Permian Basin - Section 12', status: 'Maintenance', drillDepthFt: 8400, crewCount: 15, managerName: 'Sarah Jenkins' },
      { id: 'rig3', rigName: 'Rig Gamma (Deepwater)', location: 'Offshore Alaska - Sector 9', status: 'Standby', drillDepthFt: 0, crewCount: 8, managerName: 'David Miller' },
      { id: 'rig4', rigName: 'Rig Delta (Land)', location: 'Bakken Formation - Plot 4', status: 'Active', drillDepthFt: 11200, crewCount: 38, managerName: 'Sven Larson' }
    ];
    this.rigs.set(mockRigs);

    // 7. Rig Timesheets
    const mockTimesheets: RigTimesheet[] = [
      this.generateMockTimesheet('rig1', 'Rig Alpha (Offshore)', '2026-05'),
      this.generateMockTimesheet('rig2', 'Rig Beta (Land)', '2026-05'),
      this.generateMockTimesheet('rig4', 'Rig Delta (Land)', '2026-05')
    ];
    this.timesheets.set(mockTimesheets);

    // 8. Assets & Equipment
    const mockEquipment: Equipment[] = [
      {
        id: 'eq1',
        assetNumber: 'AT-10023',
        equipmentCode: 'EQ-RIG-001',
        equipmentName: 'Rig Alpha Drill Mast',
        category: 'Rig',
        manufacturer: 'NOV',
        model: 'Mast-X3000',
        serialNumber: 'SN-NOV-44211',
        purchaseDate: '2021-03-15',
        purchaseCost: 12000000,
        currentValue: 9500000,
        depreciationMethod: 'Straight Line',
        location: 'Warehouse A',
        projectAssignment: 'Deepwater Horizon',
        costCenter: 'CC-DRL-001',
        department: 'Drilling',
        status: 'Active',
        operatingHours: 12500,
        lastMaintenanceDate: '2026-05-10',
        nextMaintenanceDate: '2026-08-10'
      },
      {
        id: 'eq2',
        assetNumber: 'AT-20054',
        equipmentCode: 'EQ-GEN-002',
        equipmentName: 'Generator Aux A',
        category: 'Generator',
        manufacturer: 'Caterpillar',
        model: 'CAT-3512',
        serialNumber: 'SN-CAT-88992',
        purchaseDate: '2023-08-20',
        purchaseCost: 150000,
        currentValue: 110000,
        depreciationMethod: 'Straight Line',
        location: 'Warehouse A',
        projectAssignment: 'Permian Overland',
        costCenter: 'CC-MNT-002',
        department: 'Maintenance',
        status: 'Standby',
        operatingHours: 450,
        lastMaintenanceDate: '2026-04-15',
        nextMaintenanceDate: '2026-10-15'
      },
      {
        id: 'eq3',
        assetNumber: 'AT-30043',
        equipmentCode: 'EQ-CRN-003',
        equipmentName: 'Main Rig Crane',
        category: 'Crane',
        manufacturer: 'Liebherr',
        model: 'LR-1150',
        serialNumber: 'SN-LBH-10049',
        purchaseDate: '2022-01-10',
        purchaseCost: 850000,
        currentValue: 720000,
        depreciationMethod: 'Double Declining Balance',
        location: 'Warehouse B',
        projectAssignment: 'Permian Overland',
        costCenter: 'CC-MNT-002',
        department: 'Operations',
        status: 'Maintenance',
        operatingHours: 3200,
        lastMaintenanceDate: '2026-05-25',
        nextMaintenanceDate: '2026-06-25'
      },
      {
        id: 'eq4',
        assetNumber: 'AT-40092',
        equipmentCode: 'EQ-TRK-004',
        equipmentName: 'Crew Rig Transport',
        category: 'Truck',
        manufacturer: 'Kenworth',
        model: 'T880',
        serialNumber: 'SN-KW-55012',
        purchaseDate: '2024-05-01',
        purchaseCost: 180000,
        currentValue: 140000,
        depreciationMethod: 'Straight Line',
        location: 'Pipe Yard 1',
        projectAssignment: 'Logistics Feed',
        costCenter: 'CC-LOG-004',
        department: 'Logistics',
        status: 'Active',
        operatingHours: 850,
        lastMaintenanceDate: '2026-02-14',
        nextMaintenanceDate: '2026-08-14'
      },
      {
        id: 'eq5',
        assetNumber: 'AT-50022',
        equipmentCode: 'EQ-PMP-005',
        equipmentName: 'Mud Pump Auxiliary',
        category: 'Pump',
        manufacturer: 'Gardner Denver',
        model: 'PZ-9',
        serialNumber: 'SN-GD-00384',
        purchaseDate: '2022-11-12',
        purchaseCost: 95000,
        currentValue: 65000,
        depreciationMethod: 'Straight Line',
        location: 'Warehouse B',
        projectAssignment: 'Rig Beta Overhaul',
        costCenter: 'CC-DRL-001',
        department: 'Drilling',
        status: 'Out Of Service',
        operatingHours: 4200,
        lastMaintenanceDate: '2025-12-01',
        nextMaintenanceDate: '2026-06-01'
      }
    ];
    this.equipment.set(mockEquipment);

    const mockHistory: AssetHistory[] = [
      {
        id: 'h1',
        assetId: 'eq3',
        equipmentCode: 'EQ-CRN-003',
        changeType: 'Status Change',
        oldValue: 'Active',
        newValue: 'Maintenance',
        changedBy: 'Sarah Jenkins',
        date: '2026-05-25',
        notes: 'Scheduled 500-hour hydraulic service.'
      },
      {
        id: 'h2',
        assetId: 'eq1',
        equipmentCode: 'EQ-RIG-001',
        changeType: 'Location Change',
        oldValue: 'Pipe Yard 1',
        newValue: 'Warehouse A',
        changedBy: 'System Scheduler',
        date: '2026-05-10',
        notes: 'Transferred drill mast from yard to primary warehouse storage.'
      },
      {
        id: 'h3',
        assetId: 'eq2',
        equipmentCode: 'EQ-GEN-002',
        changeType: 'Project Assignment',
        oldValue: 'None',
        newValue: 'Permian Overland',
        changedBy: 'Robert Vance',
        date: '2026-04-15',
        notes: 'Assigned standby power generator for drilling pad B.'
      }
    ];
    this.assetHistories.set(mockHistory);

    const mockImportHistories: BulkImportRecord[] = [
      {
        id: 'b1',
        importedBy: 'Sarah Jenkins',
        date: '2026-05-20',
        numberOfRecords: 12,
        status: 'Success',
        module: 'Inventory'
      },
      {
        id: 'b2',
        importedBy: 'Robert Vance',
        date: '2026-05-18',
        numberOfRecords: 5,
        status: 'Success',
        module: 'Assets'
      }
    ];
    this.bulkImportHistories.set(mockImportHistories);

    // Extended Mock Data Initialization
    const mockWarehouses: Warehouse[] = [
      { id: 'w1', code: 'WH-A', name: 'Warehouse A', location: 'Houston Main Station', status: 'Active' },
      { id: 'w2', code: 'WH-B', name: 'Warehouse B', location: 'Permian Base Yard', status: 'Active' },
      { id: 'w3', code: 'PY-1', name: 'Pipe Yard 1', location: 'Offshore Supply Port', status: 'Active' }
    ];
    this.warehouses.set(mockWarehouses);

    const mockCamps: Camp[] = [
      { id: 'c1', campCode: 'CMP-ALPHA', campName: 'Base Camp Alpha', location: 'Permian Block 12', totalBeds: 150, occupiedBeds: 112, caravansCount: 20, status: 'Active' },
      { id: 'c2', campCode: 'CMP-BETA', campName: 'South Caravan Station', location: 'Orla Drilling Site', totalBeds: 80, occupiedBeds: 45, caravansCount: 10, status: 'Active' }
    ];
    this.camps.set(mockCamps);

    const mockCaravans: Caravan[] = [
      { id: 'car1', caravanNumber: 'CRV-001', capacityBeds: 8, assignedCampId: 'c1', status: 'Available', assets: { generators: 1, airConditioners: 2, furnitureCount: 6, waterTanks: 1, kitchenEquipCount: 0 } },
      { id: 'car2', caravanNumber: 'CRV-002', capacityBeds: 8, assignedCampId: 'c1', status: 'Full', assets: { generators: 1, airConditioners: 2, furnitureCount: 6, waterTanks: 1, kitchenEquipCount: 1 } },
      { id: 'car3', caravanNumber: 'CRV-003', capacityBeds: 4, assignedCampId: 'c2', status: 'Available', assets: { generators: 0, airConditioners: 1, furnitureCount: 4, waterTanks: 1, kitchenEquipCount: 0 } }
    ];
    this.caravans.set(mockCaravans);

    const mockVehicles: Vehicle[] = [
      { id: 'v1', plateNumber: 'TX-OG-889', make: 'Ford', model: 'F-250 Super Duty', year: 2024, assignedTo: 'Robert Vance', fuelType: 'Diesel', status: 'Assigned', currentOdometer: 14500 },
      { id: 'v2', plateNumber: 'TX-OG-210', make: 'Chevrolet', model: 'Silverado 1500', year: 2023, assignedTo: 'Sven Larson', fuelType: 'Petrol', status: 'Assigned', currentOdometer: 22800 },
      { id: 'v3', plateNumber: 'TX-OG-304', make: 'Toyota', model: 'Hilux 4x4', year: 2022, assignedTo: 'Sarah Jenkins', fuelType: 'Diesel', status: 'Available', currentOdometer: 48900 }
    ];
    this.vehicles.set(mockVehicles);

    const mockTripLogs: TripLog[] = [
      { id: 't1', vehicleId: 'v1', driverName: 'Robert Vance', purpose: 'Rig Alpha Site Inspection', startOdometer: 14200, endOdometer: 14500, fuelAddedLiters: 85, fuelCost: 110, tripDate: '2026-06-10' },
      { id: 't2', vehicleId: 'v2', driverName: 'Sven Larson', purpose: 'Logistics Supply Run', startOdometer: 22500, endOdometer: 22800, fuelAddedLiters: 60, fuelCost: 80, tripDate: '2026-06-12' }
    ];
    this.tripLogs.set(mockTripLogs);

    const mockMRVs: MRV[] = [
      {
        id: 'mrv1',
        voucherNumber: 'MRV-2026-001',
        poId: 'po1',
        poNumber: 'PO-2026-001',
        warehouseId: 'w1',
        receivedDate: '2026-06-05',
        receivedBy: 'Jim Halpert',
        supplierName: 'Global Oilfield Solutions',
        status: 'Posted',
        totalAmount: 11200,
        items: [
          { itemCode: 'HY-PUMP-HP450', itemName: 'Hydraulic Pump HP-450 Seal Unit', quantityOrdered: 1, quantityReceived: 1, unitPrice: 11200, totalPrice: 11200, uom: 'EA' }
        ]
      }
    ];
    this.mrvs.set(mockMRVs);

    const mockMIVs: MIV[] = [
      {
        id: 'miv1',
        voucherNumber: 'MIV-2026-001',
        issueTo: 'Project',
        destinationId: 'Permian Overland',
        referenceNumber: 'REF-MIV-8821',
        requestedBy: 'Robert Vance',
        approvedBy: 'Sophia Sterling',
        issueDate: '2026-06-08',
        status: 'Posted',
        totalAmount: 350,
        items: [
          { itemCode: 'LUB-GRE-DRUM', itemName: 'Premium Rig Grease (55 Gal)', quantityRequested: 1, quantityIssued: 1, unitPrice: 350, totalPrice: 350, uom: 'DRUM', inventoryCreditAcc: '1201-01', consumptionDebitAcc: '5102-04' }
        ]
      }
    ];
    this.mivs.set(mockMIVs);

    const mockTransfers: InternalTransfer[] = [
      {
        id: 'xfer1',
        transferNumber: 'XFER-2026-001',
        fromWarehouseId: 'w1',
        toWarehouseId: 'w2',
        transferDate: '2026-06-09',
        requestedBy: 'Jim Halpert',
        status: 'Approved',
        items: [
          { itemCode: 'HSE-HARN-CLA', itemName: 'Safety Harness Class A Full Body', quantity: 10, uom: 'EA' }
        ]
      }
    ];
    this.transfers.set(mockTransfers);

    const mockAdjustments: StockAdjustment[] = [
      {
        id: 'adj1',
        adjustmentNumber: 'ADJ-2026-001',
        warehouseId: 'w1',
        adjustmentDate: '2026-06-11',
        requestedBy: 'Jim Halpert',
        status: 'Approved',
        totalValue: -8500,
        items: [
          { itemCode: 'DR-BIT-8.5-PDC', itemName: 'Drill Bit 8.5in PDC Premium', systemQuantity: 8, adjustedQuantity: -1, adjustmentType: 'Deduction', unitPrice: 8500, reason: 'Damaged in transit inspection' }
        ]
      }
    ];
    this.adjustments.set(mockAdjustments);

    // Initialize Phase 3 Mock Data
    this.initializePhase3MockData();
  }

  private initializePhase3MockData() {
    // 1. Item Master categories and subcategories
    const categories: ItemCategory[] = [
      { code: 'DRL', nameEn: 'Drilling Consumables', nameAr: 'مستهلكات الحفر' },
      { code: 'MCH', nameEn: 'Machinery Spares', nameAr: 'قطع غيار الآلات' },
      { code: 'HSE', nameEn: 'HSE Equipment', nameAr: 'معدات السلامة والبيئة' },
      { code: 'LUB', nameEn: 'Lubricants', nameAr: 'زيوت وشحوم' },
      { code: 'TUB', nameEn: 'Tubulars', nameAr: 'أنابيب تبطين' }
    ];
    this.itemCategories.set(categories);

    const subCategories: ItemSubCategory[] = [
      { code: 'BITS', parentCategoryCode: 'DRL', nameEn: 'Drill Bits', nameAr: 'دقاقات الحفر' },
      { code: 'PUMPS', parentCategoryCode: 'MCH', nameEn: 'Pumps & Parts', nameAr: 'مضخات وأجزاؤها' },
      { code: 'PPE', parentCategoryCode: 'HSE', nameEn: 'Personal Protective Equipment', nameAr: 'معدات الوقاية الشخصية' },
      { code: 'GAS-DET', parentCategoryCode: 'HSE', nameEn: 'Gas Detection', nameAr: 'كشف الغازات' },
      { code: 'OILS', parentCategoryCode: 'LUB', nameEn: 'Engine Oils', nameAr: 'زيوت المحركات' }
    ];
    this.itemSubCategories.set(subCategories);

    // 2. Item Master list
    const items: ItemMaster[] = [
      { id: 'itm1', itemCode: 'DR-BIT-8.5-PDC', englishName: 'Drill Bit 8.5in PDC Premium', arabicName: 'دقاقة حفر 8.5 بوصة PDC ممتازة', category: 'DRL', subCategory: 'BITS', uom: 'EA', manufacturer: 'Baker Hughes', brand: 'Tricone', reorderLevel: 5, minStock: 2, maxStock: 15, serialTracking: true, batchTracking: false, isActive: true, unitPrice: 8500 },
      { id: 'itm2', itemCode: 'HY-PUMP-HP450', englishName: 'Hydraulic Pump HP-450 Seal Unit', arabicName: 'مانع تسرب مضخة هيدروليكية HP-450', category: 'MCH', subCategory: 'PUMPS', uom: 'EA', manufacturer: 'Rexroth', brand: 'Bosch', reorderLevel: 2, minStock: 1, maxStock: 5, serialTracking: true, batchTracking: true, isActive: true, unitPrice: 12500 },
      { id: 'itm3', itemCode: 'HSE-HARN-CLA', englishName: 'Safety Harness Class A Full Body', arabicName: 'حزام أمان كامل للجسم فئة أ', category: 'HSE', subCategory: 'PPE', uom: 'EA', manufacturer: '3M', brand: 'Protecta', reorderLevel: 15, minStock: 10, maxStock: 100, serialTracking: false, batchTracking: false, isActive: true, unitPrice: 150 },
      { id: 'itm4', itemCode: 'HSE-DET-GAS', englishName: 'Multi-Gas Detector Portable', arabicName: 'جهاز محمول للكشف عن الغازات المتعددة', category: 'HSE', subCategory: 'GAS-DET', uom: 'EA', manufacturer: 'Honeywell', brand: 'BW Technologies', reorderLevel: 10, minStock: 5, maxStock: 30, serialTracking: true, batchTracking: false, isActive: true, unitPrice: 420 },
      { id: 'itm5', itemCode: 'LUB-GRE-DRUM', englishName: 'Premium Rig Grease (55 Gal)', arabicName: 'شحم منصة حفر ممتاز (55 جالون)', category: 'LUB', subCategory: 'OILS', uom: 'DRUM', manufacturer: 'Mobil', brand: 'Mobilux', reorderLevel: 20, minStock: 10, maxStock: 50, serialTracking: false, batchTracking: true, isActive: true, unitPrice: 350 }
    ];
    this.itemMasters.set(items);

    // 3. Warehouse Structures
    const whStructs: WarehouseStructure[] = [
      {
        warehouseId: 'w1',
        zones: [
          { code: 'ZONE-A', name: 'Drilling Equipment Zone', description: 'Heavy parts storage' },
          { code: 'ZONE-B', name: 'HSE & Small Parts Zone', description: 'Climate-controlled safety gear' }
        ],
        racks: [
          { code: 'RACK-A1', zoneCode: 'ZONE-A', name: 'Drill Bit Rack' },
          { code: 'RACK-B1', zoneCode: 'ZONE-B', name: 'Safety Gear Rack' }
        ],
        shelves: [
          { code: 'SHELF-A1-1', rackCode: 'RACK-A1', name: 'Shelf 1' },
          { code: 'SHELF-B1-1', rackCode: 'RACK-B1', name: 'Shelf 1' }
        ],
        bins: [
          { code: 'BIN-A1-1-A', shelfCode: 'SHELF-A1-1', name: 'Bin A', maxWeightCapacity: 500, maxVolumeCapacity: 2 },
          { code: 'BIN-B1-1-A', shelfCode: 'SHELF-B1-1', name: 'Bin A', maxWeightCapacity: 50, maxVolumeCapacity: 0.5 }
        ]
      }
    ];
    this.warehouseStructures.set(whStructs);

    // 4. Inspection Requests
    const inspections: InspectionRequest[] = [
      {
        id: 'ins1',
        requestNumber: 'IR-2026-001',
        poId: 'po1',
        poNumber: 'PO-2026-001',
        vendorId: 'v1',
        vendorName: 'Global Oilfield Solutions',
        requestDate: '2026-06-03',
        inspectorName: 'John Doe',
        status: 'Accepted',
        inspectionDate: '2026-06-05',
        notes: 'All items matched specs. Quality check passed.',
        items: [
          { itemCode: 'HY-PUMP-HP450', itemName: 'Hydraulic Pump HP-450 Seal Unit', quantityOrdered: 1, quantityReceived: 1, quantityAccepted: 1, quantityRejected: 0, status: 'Passed' }
        ]
      },
      {
        id: 'ins2',
        requestNumber: 'IR-2026-002',
        poId: 'po2',
        poNumber: 'PO-2026-002',
        vendorId: 'v2',
        vendorName: 'APEX Industrial Supplies',
        requestDate: '2026-06-11',
        inspectorName: 'John Doe',
        status: 'Rejected',
        inspectionDate: '2026-06-12',
        notes: 'Material defects found on outer casing. Defect logged.',
        ncrId: 'ncr1',
        items: [
          { itemCode: 'DR-BIT-8.5-PDC', itemName: 'Drill Bit 8.5in PDC Premium', quantityOrdered: 2, quantityReceived: 2, quantityAccepted: 0, quantityRejected: 2, status: 'Failed', remarks: 'Outer cutters cracked.' }
        ]
      }
    ];
    this.inspectionRequests.set(inspections);

    // 5. NCR Register
    const mockNCRs: NCR[] = [
      {
        id: 'ncr1',
        ncrNumber: 'NCR-2026-001',
        inspectionRequestId: 'ins2',
        poNumber: 'PO-2026-002',
        vendorName: 'APEX Industrial Supplies',
        issueDate: '2026-06-12',
        severity: 'High',
        description: 'Two drill bits failed structural integrity check due to micro-fractures in PDC inserts.',
        rootCause: 'Supplier manufacturing flaw or inadequate protective transit packaging.',
        correctiveAction: 'Return defective units to APEX. Request replacement and transit damage analysis.',
        status: 'Open'
      }
    ];
    this.ncrs.update(val => [...val, ...mockNCRs]);

    // 6. Asset Assignments, Transfers, Disposals
    const assignments: AssetAssignment[] = [
      { id: 'asg1', assetId: 'eq1', assetNumber: 'AST-DRL-001', equipmentName: 'Rig Alpha Main Drawworks', assignedToType: 'Rig', assignedToId: 'rig1', assignedToName: 'Rig Alpha', assignmentDate: '2026-01-10', conditionOnAssign: 'Good', notes: 'Assigned for active drilling campaign' }
    ];
    this.assetAssignments.set(assignments);

    const assetTransfersList: AssetTransfer[] = [
      { id: 'xf1', assetId: 'eq2', assetNumber: 'AST-DRL-002', equipmentName: 'Cat 3512 Generator Set', fromLocation: 'Rig Beta', toLocation: 'Main Workshop', transferDate: '2026-06-01', authorizedBy: 'Frank Jones', status: 'Completed', notes: 'Transferred for major scheduled overhaul' }
    ];
    this.assetTransfers.set(assetTransfersList);

    const disposals: AssetDisposal[] = [
      { id: 'disp1', assetId: 'eq3', assetNumber: 'AST-LOG-010', equipmentName: 'Toyota Land Cruiser 2018', disposalDate: '2026-05-15', disposalMethod: 'Sale', disposalCost: 500, revenueReceived: 12000, reason: 'End of operational lifecycle, excessive mileage.', authorizedBy: 'Marcus Aurelius', status: 'Approved' }
    ];
    this.assetDisposals.set(disposals);

    // 7. Maintenance schedules and work orders
    const pmPlans: PMSchedule[] = [
      { id: 'pm1', assetId: 'eq1', assetNumber: 'AST-DRL-001', equipmentName: 'Rig Alpha Main Drawworks', pmCode: 'PM-DW-MONTHLY', taskDescription: 'Lubricate bearings, inspect brake bands, check hydraulic pressure.', frequencyDays: 30, lastDoneDate: '2026-05-10', nextDueDate: '2026-06-09', status: 'Active' },
      { id: 'pm2', assetId: 'eq2', assetNumber: 'AST-DRL-002', equipmentName: 'Cat 3512 Generator Set', pmCode: 'PM-GEN-250HR', taskDescription: 'Change engine oil, replace filters, clean air intakes.', frequencyDays: 15, lastDoneDate: '2026-05-25', nextDueDate: '2026-06-10', status: 'Active' }
    ];
    this.pmSchedules.set(pmPlans);

    const wos: WorkOrder[] = [
      { id: 'wo1', woNumber: 'WO-2026-001', assetId: 'eq1', assetNumber: 'AST-DRL-001', equipmentName: 'Rig Alpha Main Drawworks', type: 'Preventive', priority: 'Medium', issueDescription: 'Monthly Drawworks PM checklist execution', assignedToTechnician: 'Alex Mercer', createdDate: '2026-06-08', status: 'In Progress' },
      { id: 'wo2', woNumber: 'WO-2026-002', assetId: 'eq2', assetNumber: 'AST-DRL-002', equipmentName: 'Cat 3512 Generator Set', type: 'Breakdown', priority: 'Emergency', issueDescription: 'Engine hunting and radiator coolant leakage reported.', assignedToTechnician: 'John Sterling', createdDate: '2026-06-11', status: 'Open' }
    ];
    this.workOrders.set(wos);

    // 8. Finance extended: AP invoices, Aging, payments, collections
    const apInvoices: SupplierInvoice[] = [
      { id: 'ap1', invoiceNumber: 'INV-GOS-8821', poId: 'po1', poNumber: 'PO-2026-001', vendorId: 'v1', vendorName: 'Global Oilfield Solutions', invoiceDate: '2026-06-06', dueDate: '2026-07-06', subTotal: 11200, taxAmount: 1680, totalAmount: 12880, status: 'Unpaid', paymentTerms: 'Net 30' }
    ];
    this.supplierInvoices.set(apInvoices);

    const agingAP: APAgingEntry[] = [
      { vendorId: 'v1', vendorName: 'Global Oilfield Solutions', totalDue: 12880, current: 12880, thirtyToSixty: 0, sixtyToNinety: 0, overNinety: 0 },
      { vendorId: 'v3', vendorName: 'Valero Drilling Supplies', totalDue: 4500, current: 0, thirtyToSixty: 4500, sixtyToNinety: 0, overNinety: 0 }
    ];
    this.apAging.set(agingAP);

    const paymentVocs: PaymentVoucher[] = [
      { id: 'pv1', voucherNumber: 'PV-2026-001', paymentDate: '2026-06-10', vendorId: 'v1', vendorName: 'Global Oilfield Solutions', bankAccountId: 'ba1', bankAccountName: 'HSBC Corporate A/C', paymentMethod: 'Bank Transfer', referenceNumber: 'TXN-8821092', amount: 5000, status: 'Posted', invoicesPaid: [{ invoiceId: 'ap1', invoiceNumber: 'INV-GOS-8821', amountPaid: 5000 }] }
    ];
    this.paymentVouchers.set(paymentVocs);

    const agingAR: ARAgingEntry[] = [
      { customerId: 'c1', customerName: 'Saudi Aramco', totalDue: 145000, current: 120000, thirtyToSixty: 25000, sixtyToNinety: 0, overNinety: 0 }
    ];
    this.arAging.set(agingAR);

    const collectionVocs: CollectionVoucher[] = [
      { id: 'cv1', voucherNumber: 'CV-2026-001', collectionDate: '2026-06-12', customerName: 'Saudi Aramco', bankAccountId: 'ba1', bankAccountName: 'HSBC Corporate A/C', paymentMethod: 'Bank Transfer', referenceNumber: 'INW-881290', amount: 25000, status: 'Posted', invoicesCollected: [{ invoiceId: 'inv-1', invoiceNumber: 'INV-2026-001', amountCollected: 25000 }] }
    ];
    this.collectionVouchers.set(collectionVocs);

    const bankDetails: BankAccountDetails[] = [
      { id: 'ba1', bankName: 'HSBC Bank', accountNumber: '120-889922-001', iban: 'AE12HSBC0000120889922001', currency: 'USD', balance: 420500, status: 'Active' },
      { id: 'ba2', bankName: 'Saudi National Bank', accountNumber: '2030-1122-002', iban: 'SA80SNB0000020301122002', currency: 'SAR', balance: 1540000, status: 'Active' }
    ];
    this.bankAccountsDetails.set(bankDetails);

    const cashDetails: CashAccountDetails[] = [
      { id: 'ca1', officeLocation: 'Khobar HQ Petty Cash', custodianName: 'Ahmed Mansour', currency: 'SAR', balance: 15000, status: 'Active' }
    ];
    this.cashAccountsDetails.set(cashDetails);

    const bankRecs: BankReconciliation[] = [
      { id: 'br1', bankAccountId: 'ba1', statementPeriod: 'May 2026', statementEndDate: '2026-05-31', bookBalance: 425500, statementBalance: 425500, difference: 0, status: 'Reconciled', reconciledDate: '2026-06-02', reconciledBy: 'Sophia Sterling' }
    ];
    this.bankReconciliations.set(bankRecs);

    // 9. HSE
    const incidentsList: HSEIncident[] = [
      { id: 'inc1', incidentNumber: 'INC-2026-001', type: 'Near Miss', severity: 'Low', date: '2026-06-04', location: 'Rig Alpha', description: 'Drill pipe slipped slightly during tripping operation. No injuries or damage.', immediateActionTaken: 'Tripping stopped. Slip jaws inspected and cleaned.', reportedBy: 'David Miller', status: 'Closed', rootCause: 'Accumulated grease on slip dies.', correctiveAction: 'Mandatory inspection of slips before every tripping run.' }
    ];
    this.hseIncidents.set(incidentsList);

    const permits: PTW[] = [
      { id: 'ptw1', permitNumber: 'PTW-2026-001', type: 'Hot Work', requestDate: '2026-06-12', validFrom: '2026-06-13 08:00', validTo: '2026-06-13 18:00', location: 'Rig Alpha Welding Shop', applicantName: 'Sven Larson', safetyOfficerApproved: true, operationsManagerApproved: true, status: 'Approved', gasTestRequired: true, gasTestResults: '0% LEL, 20.9% O2, 0ppm H2S' }
    ];
    this.ptws.set(permits);

    const safetyAudits: SafetyInspection[] = [
      { id: 'sa1', inspectionNumber: 'SI-2026-001', date: '2026-06-10', location: 'Rig Beta Base Camp', inspectorName: 'David Miller', itemsAuditedCount: 20, violationsCount: 1, scorePercentage: 95, status: 'Closed' }
    ];
    this.safetyInspections.set(safetyAudits);

    const risks: SafetyRisk[] = [
      { id: 'risk1', riskCode: 'RSK-DRL-001', activityDescription: 'Tripping Pipe', hazardDescription: 'Crush injuries from moving elevators / equipment', initialSeverity: 'High', controlMeasures: 'Ensure safety lines are clear, crew wearing heavy duty impact gloves, automated elevator checks.', residualSeverity: 'Medium', status: 'Mitigated' }
    ];
    this.safetyRisks.set(risks);

    // ── Fuel Tanks ──────────────────────────────────────────────────────────
    const mockFuelTanks: FuelTank[] = [
      { id: 'ft1', tankCode: 'TNK-DSL-A', tankName: 'Main Diesel Tank A', location: 'Base Camp Alpha', fuelType: 'Diesel', capacityLiters: 50000, currentLevelLiters: 32500, status: 'Active' },
      { id: 'ft2', tankCode: 'TNK-DSL-B', tankName: 'Site Diesel Tank B', location: 'Permian Rig Site', fuelType: 'Diesel', capacityLiters: 20000, currentLevelLiters: 8400, status: 'Active' },
      { id: 'ft3', tankCode: 'TNK-PET-A', tankName: 'Petrol Tank A', location: 'Houston Main Station', fuelType: 'Petrol', capacityLiters: 10000, currentLevelLiters: 6200, status: 'Active' }
    ];
    this.fuelTanks.set(mockFuelTanks);

    const mockFuelReceipts: FuelReceipt[] = [
      { id: 'fr1', receiptNumber: 'FR-2026-001', tankId: 'ft1', tankName: 'Main Diesel Tank A', fuelType: 'Diesel', quantityLiters: 15000, unitCost: 0.85, totalCost: 12750, supplierName: 'Gulf Fuel Suppliers LLC', deliveryDate: '2026-06-01', receivedBy: 'Jim Halpert', invoiceNumber: 'GFS-2026-441', status: 'Posted' },
      { id: 'fr2', receiptNumber: 'FR-2026-002', tankId: 'ft2', tankName: 'Site Diesel Tank B', fuelType: 'Diesel', quantityLiters: 5000, unitCost: 0.88, totalCost: 4400, supplierName: 'Texas Fuel Corp', deliveryDate: '2026-06-08', receivedBy: 'Robert Vance', status: 'Posted' },
      { id: 'fr3', receiptNumber: 'FR-2026-003', tankId: 'ft3', tankName: 'Petrol Tank A', fuelType: 'Petrol', quantityLiters: 3000, unitCost: 1.05, totalCost: 3150, supplierName: 'Gulf Fuel Suppliers LLC', deliveryDate: '2026-06-10', receivedBy: 'Sven Larson', status: 'Posted' }
    ];
    this.fuelReceipts.set(mockFuelReceipts);

    const mockFuelIssues: FuelIssue[] = [
      { id: 'fi1', issueNumber: 'FI-2026-001', tankId: 'ft1', tankName: 'Main Diesel Tank A', fuelType: 'Diesel', quantityLiters: 250, unitCost: 0.85, totalCost: 212.5, issuedTo: 'Vehicle', issuedToId: 'v1', issuedToName: 'Ford F-250 (TX-OG-889)', costCenterCode: 'CC-OPS-001', issueDate: '2026-06-10', issuedBy: 'Jim Halpert', odometerReading: 14500, status: 'Posted' },
      { id: 'fi2', issueNumber: 'FI-2026-002', tankId: 'ft1', tankName: 'Main Diesel Tank A', fuelType: 'Diesel', quantityLiters: 1500, unitCost: 0.85, totalCost: 1275, issuedTo: 'Generator', issuedToId: 'eq2', issuedToName: 'Generator GEN-001', costCenterCode: 'CC-DRL-001', issueDate: '2026-06-12', issuedBy: 'Robert Vance', runningHours: 450, status: 'Posted' },
      { id: 'fi3', issueNumber: 'FI-2026-003', tankId: 'ft2', tankName: 'Site Diesel Tank B', fuelType: 'Diesel', quantityLiters: 800, unitCost: 0.88, totalCost: 704, issuedTo: 'Rig', issuedToId: 'rig1', issuedToName: 'Rig Alpha', costCenterCode: 'CC-DRL-001', issueDate: '2026-06-13', issuedBy: 'Sven Larson', runningHours: 520, status: 'Posted' }
    ];
    this.fuelIssues.set(mockFuelIssues);

    // ── Inventory Reservations ───────────────────────────────────────────────
    const mockReservations: InventoryReservation[] = [
      {
        id: 'res1', reservationNumber: 'RES-2026-001', projectCode: 'PRJ-001',
        projectName: 'Permian Overland Drilling', requestedBy: 'Robert Vance',
        requestDate: '2026-06-01', requiredDate: '2026-06-15', status: 'Approved',
        items: [{ itemCode: 'DR-BIT-8.5-PDC', itemName: 'Drill Bit 8.5in PDC Premium', uom: 'EA', requestedQuantity: 3, reservedQuantity: 3, unitPrice: 8500 }],
        totalValue: 25500
      },
      {
        id: 'res2', reservationNumber: 'RES-2026-002', projectCode: 'PRJ-002',
        projectName: 'Midland Basin Support', requestedBy: 'Sarah Jenkins',
        requestDate: '2026-06-05', requiredDate: '2026-06-20', status: 'Pending',
        items: [{ itemCode: 'HSE-HARN-CLA', itemName: 'Safety Harness Class A', uom: 'EA', requestedQuantity: 10, reservedQuantity: 0, unitPrice: 150 }],
        totalValue: 1500
      }
    ];
    this.inventoryReservations.set(mockReservations);
  }


  private generateMockTimesheet(rigId: string, rigName: string, month: string): RigTimesheet {
    const days: TimesheetDayRow[] = [];
    const daysInMonth = 31;
    let totalOp = 0;
    let totalStandby = 0;
    let totalRepair = 0;
    let totalDowntime = 0;
    let totalMove = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      let op = 0;
      let standby = 0;
      let repair = 0;
      let downtime = 0;
      let move = 0;
      let comment = '';

      if (rigId === 'rig1') {
        // Mostly active
        if (d % 10 === 0) {
          repair = 4;
          downtime = 4;
          op = 16;
          comment = 'Scheduled top-drive seal check';
        } else if (d % 15 === 0) {
          standby = 8;
          op = 16;
          comment = 'Waiting on casing delivery boat';
        } else {
          op = 24;
        }
      } else if (rigId === 'rig2') {
        // In maintenance later in the month
        if (d > 20) {
          repair = 16;
          downtime = 16;
          standby = 8;
          op = 0;
          comment = 'BOP Recertification';
        } else {
          op = 20;
          standby = 4;
        }
      } else {
        // Rig 4: Mix of moving and active
        if (d <= 3) {
          move = 18;
          standby = 6;
          comment = 'Rig move to Plot 4';
        } else if (d === 4) {
          standby = 24;
          comment = 'Spud preparations';
        } else {
          op = 22;
          standby = 2;
        }
      }

      days.push({
        day: d,
        operatingHours: op,
        standbyHours: standby,
        repairHours: repair,
        downtimeHours: downtime,
        rigMoveHours: move,
        comments: comment || undefined
      });

      totalOp += op;
      totalStandby += standby;
      totalRepair += repair;
      totalDowntime += downtime;
      totalMove += move;
    }

    const totalHours = daysInMonth * 24;
    const utilizationRate = Math.round((totalOp / totalHours) * 1000) / 10;
    const downtimePercent = Math.round((totalDowntime / totalHours) * 1000) / 10;

    return {
      id: `${rigId}-ts-${month}`,
      rigId,
      rigName,
      month,
      days,
      totalOperatingHours: totalOp,
      utilizationRate,
      downtimePercent
    };
  }

  // --- STATS COMPUTATIONS (Signals-driven) ---
  readonly stats = computed(() => {
    const prs = this.purchaseRequests();
    const pos = this.purchaseOrders();
    const rfqs = this.rfqs();
    const vends = this.vendors();
    const items = this.inventoryItems();
    const times = this.timesheets();

    let totalOpHours = 0;
    times.forEach(t => totalOpHours += t.totalOperatingHours);

    return {
      totalPRs: prs.length,
      openRFQs: rfqs.filter(r => r.status === 'Sent' || r.status === 'Quotations Received').length,
      activePOs: pos.filter(p => p.status === 'Approved' || p.status === 'Pending Approval').length,
      vendorsCount: vends.length,
      equipmentCount: items.reduce((acc, i) => acc + i.quantity, 0),
      monthlyOperatingHours: totalOpHours
    };
  });

  // --- ACTIONS & MUTATORS ---

  addPurchaseRequest(pr: Omit<PurchaseRequest, 'id' | 'requestNumber' | 'status' | 'requestDate'>) {
    const prs = this.purchaseRequests();
    const num = `PR-2026-0${prs.length + 1}`;
    const newPr: PurchaseRequest = {
      ...pr,
      id: `pr${prs.length + 1}`,
      requestNumber: num,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Pending Approval'
    };
    this.purchaseRequests.update(val => [...val, newPr]);
    return newPr;
  }

  updatePRStatus(prId: string, status: PurchaseRequestStatus) {
    this.purchaseRequests.update(prs =>
      prs.map(p => p.id === prId ? { ...p, status } : p)
    );
  }

  addRFQ(rfq: Omit<RFQ, 'id' | 'rfqNumber' | 'status' | 'createdDate' | 'quotations'>) {
    const rfqs = this.rfqs();
    const num = `RFQ-2026-0${rfqs.length + 1}`;
    const newRfq: RFQ = {
      ...rfq,
      id: `rfq${rfqs.length + 1}`,
      rfqNumber: num,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Sent',
      quotations: []
    };
    this.rfqs.update(val => [...val, newRfq]);

    // Automatically update the source PR to "RFQ Created"
    this.updatePRStatus(rfq.purchaseRequestId, 'RFQ Created');
    return newRfq;
  }

  submitQuotation(rfqId: string, quotation: Omit<RFQQuotation, 'id'>) {
    this.rfqs.update(rfqs =>
      rfqs.map(r => {
        if (r.id !== rfqId) return r;
        const newQ: RFQQuotation = {
          ...quotation,
          id: `q${r.quotations.length + 1}`
        };
        const updatedQuotes = [...r.quotations, newQ];

        // Recalculate best price
        let minPrice = Infinity;
        updatedQuotes.forEach(q => {
          if (q.price < minPrice) minPrice = q.price;
        });

        const checkedQuotes = updatedQuotes.map(q => ({
          ...q,
          isBestPrice: q.price === minPrice,
          // Let's recommend if best price or low delivery time
          isRecommended: q.price === minPrice || q.deliveryWeeks <= 1
        }));

        return {
          ...r,
          status: 'Quotations Received',
          quotations: checkedQuotes
        };
      })
    );
  }

  createPOFromRFQ(rfqId: string, vendorId: string) {
    const rfq = this.rfqs().find(r => r.id === rfqId);
    const quote = rfq?.quotations.find(q => q.vendorId === vendorId);
    const pr = this.purchaseRequests().find(p => p.id === rfq?.purchaseRequestId);
    const vendor = this.vendors().find(v => v.id === vendorId);

    if (!rfq || !quote || !vendor || !pr) return null;

    const pos = this.purchaseOrders();
    const poNum = `PO-2026-0${pos.length + 1}`;

    const subtotal = quote.price;
    const taxAmount = Math.round(subtotal * (quote.taxPercent / 100));
    const whtPercent = 2; // Withholding tax 2%
    const whtAmount = Math.round(subtotal * (whtPercent / 100));
    const totalAmount = subtotal + taxAmount - whtAmount;

    const poItems: POItem[] = pr.items.map(item => ({
      id: `poi-${item.id}`,
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantity: item.quantity,
      uom: item.uom,
      unitPrice: Math.round(quote.price / item.quantity), // distribute price
      totalPrice: quote.price // or keep total
    }));

    const newPO: PurchaseOrder = {
      id: `po${pos.length + 1}`,
      poNumber: poNum,
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      vendorTaxNumber: vendor.taxNumber,
      vendorAddress: vendor.address,
      date: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + quote.deliveryWeeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      costCenter: pr.costCenter,
      paymentTerms: vendor.paymentTerms,
      status: 'Pending Approval',
      items: poItems,
      subtotal,
      taxPercent: quote.taxPercent,
      taxAmount,
      withholdingTaxPercent: whtPercent,
      withholdingTaxAmount: whtAmount,
      totalAmount,
      approvalWorkflow: [
        { role: 'Procurement Specialist', approverName: 'Jane Smith', status: 'Approved', actionDate: new Date().toISOString().split('T')[0], comments: 'Generated from quotation comparison recommendation.' },
        { role: 'Procurement Manager', approverName: 'Frank Jones', status: 'Pending' },
        { role: 'VP Operations', approverName: 'Marcus Aurelius', status: 'Pending' }
      ]
    };

    this.purchaseOrders.update(val => [...val, newPO]);

    // Update RFQ status
    this.rfqs.update(list =>
      list.map(r => r.id === rfqId ? { ...r, status: 'PO Created' } : r)
    );

    return newPO;
  }

  approvePO(poId: string, role: string, approverName: string, comments?: string) {
    this.purchaseOrders.update(pos =>
      pos.map(po => {
        if (po.id !== poId) return po;

        const updatedWorkflow = po.approvalWorkflow.map(step => {
          if (step.role === role) {
            return {
              ...step,
              status: 'Approved' as const,
              approverName,
              actionDate: new Date().toISOString().split('T')[0],
              comments
            };
          }
          return step;
        });

        // If all approved, transition PO status
        const allApproved = updatedWorkflow.every(step => step.status === 'Approved');

        return {
          ...po,
          approvalWorkflow: updatedWorkflow,
          status: allApproved ? ('Approved' as const) : po.status
        };
      })
    );
  }

  updateTimesheetDay(timesheetId: string, day: number, updatedRow: Partial<TimesheetDayRow>) {
    this.timesheets.update(sheets =>
      sheets.map(ts => {
        if (ts.id !== timesheetId) return ts;

        const updatedDays = ts.days.map(d =>
          d.day === day ? { ...d, ...updatedRow } : d
        );

        let totalOp = 0;
        let totalDowntime = 0;
        updatedDays.forEach(d => {
          totalOp += d.operatingHours;
          totalDowntime += d.downtimeHours;
        });

        const totalHours = ts.days.length * 24;
        const utilizationRate = Math.round((totalOp / totalHours) * 1000) / 10;
        const downtimePercent = Math.round((totalDowntime / totalHours) * 1000) / 10;

        return {
          ...ts,
          days: updatedDays,
          totalOperatingHours: totalOp,
          utilizationRate,
          downtimePercent
        };
      })
    );
  }

  // --- INVENTORY MUTATORS ---
  addInventoryItem(item: Omit<InventoryItem, 'id'>) {
    const items = this.inventoryItems();
    const newItem: InventoryItem = {
      ...item,
      id: `inv${items.length + 1}`
    };
    this.inventoryItems.update(val => [...val, newItem]);
    return newItem;
  }

  updateInventoryItem(id: string, updated: Partial<InventoryItem>) {
    this.inventoryItems.update(items =>
      items.map(item => item.id === id ? { ...item, ...updated } : item)
    );
  }

  deleteInventoryItem(id: string) {
    this.inventoryItems.update(items => items.filter(item => item.id !== id));
  }

  // --- ASSETS & EQUIPMENT MUTATORS ---
  addEquipment(eq: Omit<Equipment, 'id'>) {
    const eqs = this.equipment();
    const newEq: Equipment = {
      ...eq,
      id: `eq${eqs.length + 1}`
    };
    this.equipment.update(val => [...val, newEq]);
    return newEq;
  }

  updateEquipment(id: string, updated: Partial<Equipment>) {
    this.equipment.update(eqs =>
      eqs.map(eq => eq.id === id ? { ...eq, ...updated } : eq)
    );
  }

  deleteEquipment(id: string) {
    this.equipment.update(eqs => eqs.filter(eq => eq.id !== id));
  }

  addAssetHistory(history: Omit<AssetHistory, 'id' | 'date'>) {
    const histories = this.assetHistories();
    const newHistory: AssetHistory = {
      ...history,
      id: `h${histories.length + 1}`,
      date: new Date().toISOString().split('T')[0]
    };
    this.assetHistories.update(val => [newHistory, ...val]);
    return newHistory;
  }

  addBulkImportHistory(record: Omit<BulkImportRecord, 'id' | 'date'>) {
    const histories = this.bulkImportHistories();
    const newRecord: BulkImportRecord = {
      ...record,
      id: `b${histories.length + 1}`,
      date: new Date().toISOString().split('T')[0]
    };
    this.bulkImportHistories.update(val => [newRecord, ...val]);
    return newRecord;
  }

  // --- EXTENDED MUTATORS ---
  addWarehouse(wh: Omit<Warehouse, 'id'>) {
    const list = this.warehouses();
    const newWh: Warehouse = { ...wh, id: `wh${list.length + 1}` };
    this.warehouses.update(val => [...val, newWh]);
    return newWh;
  }

  addMRV(mrv: Omit<MRV, 'id' | 'voucherNumber' | 'status'>) {
    const list = this.mrvs();
    const num = `MRV-2026-0${list.length + 1}`;
    const newMRV: MRV = { ...mrv, id: `mrv${list.length + 1}`, voucherNumber: num, status: 'Draft' };
    this.mrvs.update(val => [...val, newMRV]);
    return newMRV;
  }

  updateMRVStatus(id: string, status: MRV['status']) {
    this.mrvs.update(list => list.map(item => item.id === id ? { ...item, status } : item));
    if (status === 'Posted') {
      const voucher = this.mrvs().find(item => item.id === id);
      if (voucher) {
        voucher.items.forEach(vitem => {
          const matched = this.inventoryItems().find(inv => inv.itemCode === vitem.itemCode);
          if (matched) {
            this.updateInventoryItem(matched.id, { quantity: matched.quantity + vitem.quantityReceived });
          } else {
            this.addInventoryItem({
              itemCode: vitem.itemCode,
              itemName: vitem.itemName,
              quantity: vitem.quantityReceived,
              minQuantity: 5,
              category: 'General Spares',
              uom: vitem.uom,
              location: 'Warehouse A',
              unitPrice: vitem.unitPrice,
              status: 'In Stock'
            });
          }
        });
      }
    }
  }

  addMIV(miv: Omit<MIV, 'id' | 'voucherNumber' | 'status'>) {
    const list = this.mivs();
    const num = `MIV-2026-0${list.length + 1}`;
    const newMIV: MIV = { ...miv, id: `miv${list.length + 1}`, voucherNumber: num, status: 'Draft' };
    this.mivs.update(val => [...val, newMIV]);
    return newMIV;
  }

  updateMIVStatus(id: string, status: MIV['status']) {
    this.mivs.update(list => list.map(item => item.id === id ? { ...item, status } : item));
    if (status === 'Posted') {
      const voucher = this.mivs().find(item => item.id === id);
      if (voucher) {
        voucher.items.forEach(vitem => {
          const matched = this.inventoryItems().find(inv => inv.itemCode === vitem.itemCode);
          if (matched) {
            const newQty = Math.max(0, matched.quantity - vitem.quantityIssued);
            this.updateInventoryItem(matched.id, {
              quantity: newQty,
              status: newQty === 0 ? 'Out of Stock' : newQty <= matched.minQuantity ? 'Low Stock' : 'In Stock'
            });
          }
        });
      }
    }
  }

  addTransfer(xfer: Omit<InternalTransfer, 'id' | 'transferNumber' | 'status'>) {
    const list = this.transfers();
    const num = `XFER-2026-0${list.length + 1}`;
    const newXfer: InternalTransfer = { ...xfer, id: `xfer${list.length + 1}`, transferNumber: num, status: 'Draft' };
    this.transfers.update(val => [...val, newXfer]);
    return newXfer;
  }

  updateTransferStatus(id: string, status: InternalTransfer['status']) {
    this.transfers.update(list => list.map(item => item.id === id ? { ...item, status } : item));
  }

  addAdjustment(adj: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'status'>) {
    const list = this.adjustments();
    const num = `ADJ-2026-0${list.length + 1}`;
    const newAdj: StockAdjustment = { ...adj, id: `adj${list.length + 1}`, adjustmentNumber: num, status: 'Draft' };
    this.adjustments.update(val => [...val, newAdj]);
    return newAdj;
  }

  updateAdjustmentStatus(id: string, status: StockAdjustment['status']) {
    this.adjustments.update(list => list.map(item => item.id === id ? { ...item, status } : item));
    if (status === 'Posted') {
      const adjustment = this.adjustments().find(item => item.id === id);
      if (adjustment) {
        adjustment.items.forEach(vitem => {
          const matched = this.inventoryItems().find(inv => inv.itemCode === vitem.itemCode);
          if (matched) {
            const newQty = Math.max(0, matched.quantity + (vitem.adjustmentType === 'Addition' ? vitem.adjustedQuantity : -vitem.adjustedQuantity));
            this.updateInventoryItem(matched.id, {
              quantity: newQty,
              status: newQty === 0 ? 'Out of Stock' : newQty <= matched.minQuantity ? 'Low Stock' : 'In Stock'
            });
          }
        });
      }
    }
  }

  addCamp(camp: Omit<Camp, 'id'>) {
    const list = this.camps();
    const newCamp: Camp = { ...camp, id: `c${list.length + 1}` };
    this.camps.update(val => [...val, newCamp]);
    return newCamp;
  }

  addVehicle(vehicle: Omit<Vehicle, 'id'>) {
    const list = this.vehicles();
    const newVehicle: Vehicle = { ...vehicle, id: `v${list.length + 1}` };
    this.vehicles.update(val => [...val, newVehicle]);
    return newVehicle;
  }

  addTripLog(log: Omit<TripLog, 'id'>) {
    const list = this.tripLogs();
    const newLog: TripLog = { ...log, id: `t${list.length + 1}` };
    this.tripLogs.update(val => [...val, newLog]);
    return newLog;
  }

  // ─── FUEL MANAGEMENT HELPERS ─────────────────────────────────────────────
  addFuelReceipt(receipt: Omit<FuelReceipt, 'id' | 'receiptNumber' | 'status'>) {
    const list = this.fuelReceipts();
    const num = `FR-2026-${String(list.length + 1).padStart(3, '0')}`;
    const newReceipt: FuelReceipt = { ...receipt, id: `fr-${Date.now()}`, receiptNumber: num, status: 'Draft' };
    this.fuelReceipts.update(val => [...val, newReceipt]);
    return newReceipt;
  }

  postFuelReceipt(id: string) {
    const receipt = this.fuelReceipts().find(r => r.id === id);
    if (receipt) {
      this.fuelTanks.update(tanks => tanks.map(t =>
        t.id === receipt.tankId
          ? { ...t, currentLevelLiters: Math.min(t.capacityLiters, t.currentLevelLiters + receipt.quantityLiters) }
          : t
      ));
      this.fuelReceipts.update(list => list.map(r => r.id === id ? { ...r, status: 'Posted' as const } : r));
    }
  }

  addFuelIssue(issue: Omit<FuelIssue, 'id' | 'issueNumber' | 'status'>) {
    const list = this.fuelIssues();
    const num = `FI-2026-${String(list.length + 1).padStart(3, '0')}`;
    const newIssue: FuelIssue = { ...issue, id: `fi-${Date.now()}`, issueNumber: num, status: 'Draft' };
    this.fuelIssues.update(val => [...val, newIssue]);
    return newIssue;
  }

  postFuelIssue(id: string) {
    const issue = this.fuelIssues().find(i => i.id === id);
    if (issue) {
      this.fuelTanks.update(tanks => tanks.map(t =>
        t.id === issue.tankId
          ? { ...t, currentLevelLiters: Math.max(0, t.currentLevelLiters - issue.quantityLiters) }
          : t
      ));
      this.fuelIssues.update(list => list.map(i => i.id === id ? { ...i, status: 'Posted' as const } : i));
    }
  }

  // ─── INVENTORY RESERVATION HELPERS ────────────────────────────────────────
  addReservation(res: Omit<InventoryReservation, 'id' | 'reservationNumber' | 'status'>) {
    const list = this.inventoryReservations();
    const num = `RES-2026-${String(list.length + 1).padStart(3, '0')}`;
    const newRes: InventoryReservation = { ...res, id: `res-${Date.now()}`, reservationNumber: num, status: 'Pending' };
    this.inventoryReservations.update(val => [...val, newRes]);
    return newRes;
  }

  approveReservation(id: string) {
    const res = this.inventoryReservations().find(r => r.id === id);
    if (!res) return;
    res.items.forEach(item => {
      const inv = this.inventoryItems().find(i => i.itemCode === item.itemCode);
      if (inv) {
        const newQty = Math.max(0, inv.quantity - item.requestedQuantity);
        this.updateInventoryItem(inv.id, {
          quantity: newQty,
          status: newQty === 0 ? 'Out of Stock' : newQty <= inv.minQuantity ? 'Low Stock' : 'In Stock'
        });
      }
    });
    this.inventoryReservations.update(list => list.map(r =>
      r.id === id
        ? { ...r, status: 'Approved' as const, items: r.items.map(i => ({ ...i, reservedQuantity: i.requestedQuantity })) }
        : r
    ));
  }

  releaseReservation(id: string) {
    const res = this.inventoryReservations().find(r => r.id === id);
    if (!res || res.status !== 'Approved') return;
    res.items.forEach(item => {
      const inv = this.inventoryItems().find(i => i.itemCode === item.itemCode);
      if (inv) {
        const newQty = inv.quantity + item.reservedQuantity;
        this.updateInventoryItem(inv.id, {
          quantity: newQty,
          status: newQty === 0 ? 'Out of Stock' : newQty <= inv.minQuantity ? 'Low Stock' : 'In Stock'
        });
      }
    });
    this.inventoryReservations.update(list => list.map(r =>
      r.id === id ? { ...r, status: 'Released' as const } : r
    ));
  }
}

