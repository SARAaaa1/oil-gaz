import { Injectable, signal, computed } from '@angular/core';
import { PurchaseRequest, PurchaseRequestItem, PurchaseRequestStatus } from '../../shared/interfaces/purchase-request.interface';
import { RFQ, RFQQuotation, RFQStatus } from '../../shared/interfaces/rfq.interface';
import { PurchaseOrder, POItem, PurchaseOrderStatus } from '../../shared/interfaces/purchase-order.interface';
import { Vendor, VendorTimelineEvent, VendorLedgerEntry, VendorDocument } from '../../shared/interfaces/vendor.interface';
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

  // Phase 5 signals — Vendor Enterprise
  readonly vendorTimeline = signal<VendorTimelineEvent[]>([]);
  readonly vendorLedger = signal<VendorLedgerEntry[]>([]);
  readonly vendorDocuments = signal<VendorDocument[]>([]);

  constructor() {
    this.initializeMockData();
  }


  private initializeMockData() {
    // 1. Vendors
    const mockVendors: Vendor[] = [
      {
        id: 'v1', vendorCode: 'VND-GOS-001', vendorName: 'Global Oilfield Solutions',
        arabicName: 'الحلول العالمية لحقول النفط', taxNumber: 'TX-88992211',
        vatNumber: 'VAT-99001122', commercialRegistration: 'CR-101009988',
        address: '1220 Petroleum Way, Houston TX 77001', country: 'USA',
        contactPerson: 'Mark Peterson', contactEmail: 'm.peterson@globaloilfield.com',
        contactPhone: '+1-555-0199', paymentTerms: 'Net 30', currency: 'USD',
        rating: 4.8, status: 'Active', category: 'Drilling Services', approvalStatus: 'Approved',
        totalOrders: 14, totalSpend: 485000, lastTransactionDate: '2026-05-20',
        totalRFQs: 18, awardedRFQs: 14, participatedRFQs: 18,
        totalDeliveries: 14, onTimeDeliveries: 12, totalDeliveredQty: 420, acceptedQty: 408,
        lateDeliveries: 2, rejectedDeliveries: 1, openInvoices: 2, paidInvoices: 12,
        bankAccounts: [{ bankName: 'HSBC Corporate', accountNumber: '120-889922-001', iban: 'AE12HSBC0000120889922001', currency: 'USD' }],
        contactPersons: [{ name: 'Mark Peterson', role: 'Sales Account Manager', email: 'm.peterson@globaloilfield.com', phone: '+1-555-0199' }]
      },
      {
        id: 'v2', vendorCode: 'VND-APX-002', vendorName: 'APEX Industrial Supplies',
        arabicName: 'أبيكس للتوريدات الصناعية', taxNumber: 'TX-44558833',
        vatNumber: 'VAT-44558833', commercialRegistration: 'CR-101007766',
        address: '850 Industrial Blvd, Dallas TX 75201', country: 'USA',
        contactPerson: 'Jane Sterling', contactEmail: 'j.sterling@apexind.com',
        contactPhone: '+1-555-0145', paymentTerms: 'Net 45', currency: 'USD',
        rating: 4.2, status: 'Active', category: 'General', approvalStatus: 'Approved',
        totalOrders: 9, totalSpend: 178500, lastTransactionDate: '2026-05-19',
        totalRFQs: 12, awardedRFQs: 9, participatedRFQs: 12,
        totalDeliveries: 9, onTimeDeliveries: 7, totalDeliveredQty: 280, acceptedQty: 270,
        lateDeliveries: 2, rejectedDeliveries: 1, openInvoices: 1, paidInvoices: 8,
        bankAccounts: [{ bankName: 'Chase Commercial', accountNumber: '5544-3322-11', iban: 'US88CHAS00005544332211', currency: 'USD' }],
        contactPersons: [{ name: 'Jane Sterling', role: 'Customer Support Lead', email: 'j.sterling@apexind.com', phone: '+1-555-0145' }]
      },
      {
        id: 'v3', vendorCode: 'VND-VAL-003', vendorName: 'Valero Drilling Supplies',
        arabicName: 'فاليرو لمستلزمات الحفر', taxNumber: 'TX-11223344',
        vatNumber: 'VAT-11223344', commercialRegistration: 'CR-101005544',
        address: '400 Refinery Rd, San Antonio TX 78201', country: 'Saudi Arabia',
        contactPerson: 'Carlos Ruiz', contactEmail: 'c.ruiz@valerods.com',
        contactPhone: '+1-555-0182', paymentTerms: 'Net 15', currency: 'SAR',
        rating: 4.5, status: 'Active', category: 'Tubulars', approvalStatus: 'Approved',
        totalOrders: 7, totalSpend: 312000, lastTransactionDate: '2026-05-18',
        totalRFQs: 10, awardedRFQs: 7, participatedRFQs: 10,
        totalDeliveries: 7, onTimeDeliveries: 7, totalDeliveredQty: 210, acceptedQty: 205,
        lateDeliveries: 0, rejectedDeliveries: 0, openInvoices: 1, paidInvoices: 6,
        bankAccounts: [{ bankName: 'Saudi National Bank', accountNumber: '2030-1122-002', iban: 'SA80SNB0000020301122002', currency: 'SAR' }],
        contactPersons: [{ name: 'Carlos Ruiz', role: 'Operations Officer', email: 'c.ruiz@valerods.com', phone: '+1-555-0182' }]
      },
      {
        id: 'v4', vendorCode: 'VND-HSE-004', vendorName: 'HSE Safety First Inc',
        arabicName: 'بيئة وصحة أولاً للسلامة', taxNumber: 'TX-55443322',
        vatNumber: 'VAT-55443322', commercialRegistration: 'CR-101003322',
        address: '99 Safety Way, Houston TX 77002', country: 'USA',
        contactPerson: 'Sarah Connor', contactEmail: 's.connor@hsesafety.com',
        contactPhone: '+1-555-0123', paymentTerms: 'Net 30', currency: 'USD',
        rating: 4.9, status: 'Active', category: 'HSE', approvalStatus: 'Approved',
        totalOrders: 11, totalSpend: 95000, lastTransactionDate: '2026-06-01',
        totalRFQs: 14, awardedRFQs: 11, participatedRFQs: 14,
        totalDeliveries: 11, onTimeDeliveries: 11, totalDeliveredQty: 330, acceptedQty: 325,
        lateDeliveries: 0, rejectedDeliveries: 1, openInvoices: 0, paidInvoices: 11,
        bankAccounts: [{ bankName: 'Wells Fargo Corporate', accountNumber: '9988-7766-55', iban: 'US99WELS00009988776655', currency: 'USD' }],
        contactPersons: [{ name: 'Sarah Connor', role: 'HSE Compliance Specialist', email: 's.connor@hsesafety.com', phone: '+1-555-0123' }]
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
        id: 'pr1', requestNumber: 'PR-2026-0001',
        documentNumber: 'PR-2026-0001', procurementChain: '0001', rootProcurementNumber: 'PR-2026-0001',
        chainId: 'PC-2026-0001',
        department: 'Drilling Operations', costCenter: 'CC-DRL-001',
        chargeType: 'Project Cost', projectId: 'PRJ-001', projectName: 'Permian Overland Drilling',
        requestDate: '2026-05-10', requiredDate: '2026-06-15', status: 'Approved',
        description: 'Critical drill bits and casing joints required for Rig Alpha offshore drilling.',
        requestedBy: 'Robert Vance', reservationCreated: true,
        items: [
          { id: 'pri1', itemType: 'Inventory Item', itemCode: 'DR-BIT-8.5-PDC', itemName: 'Drill Bit 8.5in PDC Premium', quantity: 2, uom: 'EA', notes: 'Needed for sandstone segment', currentStock: 8, reservedQty: 2, availableQty: 6, shortageQty: 0 },
          { id: 'pri2', itemType: 'Inventory Item', itemCode: 'TUB-PIPE-5IN', itemName: 'Steel Pipes 5in Casing joints', quantity: 40, uom: 'JOINTS', notes: 'Grade L80', currentStock: 200, reservedQty: 40, availableQty: 160, shortageQty: 0 }
        ]
      },
      {
        id: 'pr2', requestNumber: 'PR-2026-0002',
        documentNumber: 'PR-2026-0002', procurementChain: '0002', rootProcurementNumber: 'PR-2026-0002',
        chainId: 'PC-2026-0002',
        department: 'Maintenance & Engineering', costCenter: 'CC-MNT-002',
        chargeType: 'Asset Cost', assetId: 'eq1', assetName: 'Rig Beta — Mud Pump A',
        requestDate: '2026-05-15', requiredDate: '2026-06-10', status: 'RFQ Created',
        description: 'Replacement hydraulic pump unit and seals for Rig Beta overhaul.',
        requestedBy: 'Sarah Jenkins',
        items: [
          { id: 'pri3', itemType: 'Inventory Item', itemCode: 'HY-PUMP-HP450', itemName: 'Hydraulic Pump HP-450 Seal Unit', quantity: 1, uom: 'EA', notes: 'Immediate replacement needed', currentStock: 2, reservedQty: 1, availableQty: 1, shortageQty: 0 }
        ]
      },
      {
        id: 'pr3', requestNumber: 'PR-2026-0003',
        documentNumber: 'PR-2026-0003', procurementChain: '0003', rootProcurementNumber: 'PR-2026-0003',
        chainId: 'PC-2026-0003',
        department: 'HSE & Safety', costCenter: 'CC-HSE-001',
        chargeType: 'General Overhead',
        requestDate: '2026-05-28', requiredDate: '2026-06-20', status: 'Pending Approval',
        description: 'Annual safety gear replenishing and multi-gas detector replacement.',
        requestedBy: 'David Miller',
        items: [
          { id: 'pri4', itemType: 'Inventory Item', itemCode: 'HSE-HARN-CLA', itemName: 'Safety Harness Class A Full Body', quantity: 20, uom: 'EA', notes: 'For offshore rig crews', currentStock: 45, reservedQty: 10, availableQty: 35, shortageQty: 0 },
          { id: 'pri5', itemType: 'Inventory Item', itemCode: 'HSE-DET-GAS', itemName: 'Multi-Gas Detector Portable', quantity: 12, uom: 'EA', notes: 'Must be calibrated for H2S', currentStock: 5, reservedQty: 0, availableQty: 5, shortageQty: 7, allowPartialIssue: true, fulfillFromStock: 5, fulfillByPurchase: 7 }
        ]
      },
      {
        id: 'pr4', requestNumber: 'PR-2026-0004',
        documentNumber: 'PR-2026-0004', procurementChain: '0004', rootProcurementNumber: 'PR-2026-0004',
        chainId: 'PC-2026-0004',
        department: 'Logistics', costCenter: 'CC-LOG-004',
        chargeType: 'General Overhead',
        requestDate: '2026-06-01', requiredDate: '2026-07-01', status: 'Draft',
        description: 'Heavy duty grease drums and lifting straps for Warehouse B.',
        requestedBy: 'System Scheduler',
        items: [
          { id: 'pri6', itemType: 'Inventory Item', itemCode: 'LUB-GRE-DRUM', itemName: 'Premium Rig Grease (55 Gal)', quantity: 15, uom: 'DRUM', notes: 'Restock min level', currentStock: 8, reservedQty: 0, availableQty: 8, shortageQty: 7, allowPartialIssue: true, fulfillFromStock: 8, fulfillByPurchase: 7 }
        ]
      },
      {
        id: 'pr5', requestNumber: 'PR-2026-0005',
        documentNumber: 'PR-2026-0005', procurementChain: '0005', rootProcurementNumber: 'PR-2026-0005',
        chainId: 'PC-2026-0005',
        department: 'HSE & Safety', costCenter: 'CC-HSE-003',
        chargeType: 'General Overhead',
        requestDate: '2026-06-01', requiredDate: '2026-06-25', status: 'Approved',
        description: 'HSE compliance equipment and safety upgrades.',
        requestedBy: 'David Miller',
        items: [
          { id: 'pri7', itemType: 'Inventory Item', itemCode: 'HSE-DET-GAS', itemName: 'Multi-Gas Detector Portable', quantity: 5, uom: 'EA', notes: 'Must be calibrated for H2S', currentStock: 5, reservedQty: 0, availableQty: 5, shortageQty: 0 }
        ]
      }
    ];
    this.purchaseRequests.set(mockPRs);

    // RFQ-2026-0002-0001 is the 1st RFQ under PR-0002
    // RFQ-2026-0003-0001 is the 1st RFQ under PR-0003
    const mockRFQs: RFQ[] = [
      {
        id: 'rfq1',
        rfqNumber: 'RFQ-2026-0002-0001',
        documentNumber: 'RFQ-2026-0002-0001',
        procurementChain: '0002-0001',
        rootProcurementNumber: 'PR-2026-0002',
        chainId: 'PC-2026-0002',
        parentDocumentId: 'pr2',
        parentDocumentNumber: 'PR-2026-0002',
        purchaseRequestId: 'pr2',
        purchaseRequestNumber: 'PR-2026-0002',
        chargeType: 'Asset Cost', assetId: 'eq1', assetName: 'Rig Beta — Mud Pump A', costCenter: 'CC-MNT-002',
        title: 'Hydraulic Pump HP-450 & Seal Kits',
        createdDate: '2026-05-16',
        deadlineDate: '2026-05-25',
        status: 'Fully Responded',
        vendors: [
          { vendorId: 'v1', vendorName: 'Global Oilfield Solutions', contactEmail: 'm.peterson@globaloilfield.com', status: 'Submitted', invitationSentDate: '2026-05-16', quotationSubmittedDate: '2026-05-20' },
          { vendorId: 'v2', vendorName: 'APEX Industrial Supplies', contactEmail: 'j.sterling@apexind.com', status: 'Submitted', invitationSentDate: '2026-05-16', quotationSubmittedDate: '2026-05-19' },
          { vendorId: 'v3', vendorName: 'Valero Drilling Supplies', contactEmail: 'c.ruiz@valerods.com', status: 'Submitted', invitationSentDate: '2026-05-16', quotationSubmittedDate: '2026-05-18' }
        ],
        quotations: [
          {
            id: 'q1', quotationSequence: 1,
            quotationNumber: 'QTN-2026-0002-0001-0001',
            procurementChain: '0002-0001-0001',
            vendorId: 'v2', vendorName: 'APEX Industrial Supplies',
            price: 12500, deliveryWeeks: 2, taxPercent: 15, taxAmount: 1875, totalAmount: 14375,
            notes: 'Ex-stocks. Standard 1 year warranty included.',
            submissionDate: '2026-05-19', status: 'Submitted', paymentTerms: 'Net 30',
            attachments: [{ name: 'APEX-Quote-1982.pdf', size: '1.2 MB', type: 'application/pdf', url: '#' }],
            items: [{ itemCode: 'HY-PUMP-HP450', itemName: 'Hydraulic Pump HP-450 Seal Unit', uom: 'EA', quantity: 1, unitPrice: 12500, totalPrice: 12500 }]
          },
          {
            id: 'q2', quotationSequence: 2,
            quotationNumber: 'QTN-2026-0002-0001-0002',
            procurementChain: '0002-0001-0002',
            vendorId: 'v1', vendorName: 'Global Oilfield Solutions',
            price: 11200, deliveryWeeks: 4, taxPercent: 15, taxAmount: 1680, totalAmount: 12880,
            isBestPrice: true,
            notes: 'Direct factory pricing. Lead time 4 weeks ship.',
            submissionDate: '2026-05-20', status: 'Submitted', paymentTerms: 'Net 30',
            attachments: [{ name: 'GOS-RFQ-PriceList.xlsx', size: '420 KB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', url: '#' }],
            items: [{ itemCode: 'HY-PUMP-HP450', itemName: 'Hydraulic Pump HP-450 Seal Unit', uom: 'EA', quantity: 1, unitPrice: 11200, totalPrice: 11200 }]
          },
          {
            id: 'q3', quotationSequence: 3,
            quotationNumber: 'QTN-2026-0002-0001-0003',
            procurementChain: '0002-0001-0003',
            vendorId: 'v3', vendorName: 'Valero Drilling Supplies',
            price: 13800, deliveryWeeks: 1, taxPercent: 15, taxAmount: 2070, totalAmount: 15870,
            isRecommended: true,
            notes: 'Expedited shipping. Available for next-day dispatch.',
            submissionDate: '2026-05-18', status: 'Submitted', paymentTerms: 'Net 15',
            attachments: [{ name: 'Valero-Drilling-Proposal.pdf', size: '2.5 MB', type: 'application/pdf', url: '#' }],
            items: [{ itemCode: 'HY-PUMP-HP450', itemName: 'Hydraulic Pump HP-450 Seal Unit', uom: 'EA', quantity: 1, unitPrice: 13800, totalPrice: 13800 }]
          }
        ]
      },
      {
        id: 'rfq2',
        rfqNumber: 'RFQ-2026-0003-0001',
        documentNumber: 'RFQ-2026-0003-0001',
        procurementChain: '0003-0001',
        rootProcurementNumber: 'PR-2026-0003',
        chainId: 'PC-2026-0003',
        parentDocumentId: 'pr3',
        parentDocumentNumber: 'PR-2026-0003',
        purchaseRequestId: 'pr3',
        purchaseRequestNumber: 'PR-2026-0003',
        chargeType: 'General Overhead', costCenter: 'CC-HSE-001',
        title: 'Safety Gear & H2S Multi-Gas Detectors',
        createdDate: '2026-05-29',
        deadlineDate: '2026-06-08',
        status: 'Awarded',
        vendors: [
          { vendorId: 'v4', vendorName: 'HSE Safety First Inc', contactEmail: 's.connor@hsesafety.com', status: 'Pending', invitationSentDate: '2026-05-29' },
          { vendorId: 'v2', vendorName: 'APEX Industrial Supplies', contactEmail: 'j.sterling@apexind.com', status: 'Accepted', invitationSentDate: '2026-05-29', quotationSubmittedDate: '2026-06-01' }
        ],
        quotations: [
          {
            id: 'q4', quotationSequence: 1,
            quotationNumber: 'QTN-2026-0003-0001-0001',
            procurementChain: '0003-0001-0001',
            vendorId: 'v2', vendorName: 'APEX Industrial Supplies',
            price: 17000, deliveryWeeks: 2, taxPercent: 15, taxAmount: 2550, totalAmount: 19550,
            notes: 'Available from stock.',
            submissionDate: '2026-06-01', status: 'Accepted', paymentTerms: 'Net 45',
            items: [
              { itemCode: 'DR-BIT-8.5-PDC', itemName: 'Drill Bit 8.5in PDC Premium', uom: 'EA', quantity: 2, unitPrice: 8500, totalPrice: 17000 }
            ]
          }
        ]
      },
      {
        id: 'rfq3',
        rfqNumber: 'RFQ-2026-0005-0001',
        documentNumber: 'RFQ-2026-0005-0001',
        procurementChain: '0005-0001',
        rootProcurementNumber: 'PR-2026-0005',
        chainId: 'PC-2026-0005',
        parentDocumentId: 'pr5',
        parentDocumentNumber: 'PR-2026-0005',
        purchaseRequestId: 'pr5',
        purchaseRequestNumber: 'PR-2026-0005',
        chargeType: 'Direct Cost', costCenter: 'CC-HSE-003',
        title: 'HSE Compliance Equipment',
        createdDate: '2026-06-05',
        deadlineDate: '2026-06-15',
        status: 'Sent',
        vendors: [
          { vendorId: 'v3', vendorName: 'SafeGuard HSE Solutions', contactEmail: 'contact@safeguard.com', status: 'Pending', invitationSentDate: '2026-06-05' },
          { vendorId: 'v4', vendorName: 'HSE Safety First Inc', contactEmail: 's.connor@hsesafety.com', status: 'Pending', invitationSentDate: '2026-06-05' },
          { vendorId: 'v2', vendorName: 'APEX Industrial Supplies', contactEmail: 'j.sterling@apexind.com', status: 'Pending', invitationSentDate: '2026-06-05' }
        ],
        quotations: []
      }
    ];
    this.rfqs.set(mockRFQs);

    // PO-2026-0002-0001-0002-0001 → PR-0002, RFQ-0001, QTN-0002 (best price from Global Oilfield), PO seq 0001
    const mockPOs: PurchaseOrder[] = [
      {
        id: 'po1',
        poNumber: 'PO-2026-0002-0001-0002-0001',
        documentNumber: 'PO-2026-0002-0001-0002-0001',
        procurementChain: '0002-0001-0002-0001',
        rootProcurementNumber: 'PR-2026-0002',
        quotationNumber: 'QTN-2026-0002-0001-0002',
        chainId: 'PC-2026-0002',
        parentDocumentId: 'rfq1',
        parentDocumentNumber: 'RFQ-2026-0002-0001',
        rfqId: 'rfq1',
        rfqNumber: 'RFQ-2026-0002-0001',
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
        totalAmount: 12656,
        chargeType: 'Project Cost',
        projectId: 'PRJ-001',
        projectName: 'Permian Overland Drilling',
        items: [{
          id: 'poi1', itemCode: 'HY-PUMP-HP450', itemName: 'Hydraulic Pump HP-450 Seal Unit',
          quantity: 1, unitPrice: 11200, uom: 'EA', totalPrice: 11200
        }],
        approvalWorkflow: [
          { role: 'Procurement Specialist', approverName: 'Jane Smith', status: 'Approved', actionDate: '2026-05-25', comments: 'Cheapest option selected from RFQ' },
          { role: 'Procurement Manager', approverName: 'Frank Jones', status: 'Approved', actionDate: '2026-05-26', comments: 'Budget matches cost center allocations' },
          { role: 'VP Operations', approverName: 'Marcus Aurelius', status: 'Approved', actionDate: '2026-05-26', comments: 'Essential rig spares release' }
        ]
      },
      {
        id: 'po2',
        poNumber: 'PO-2026-0003-0001-0001-0001',
        documentNumber: 'PO-2026-0003-0001-0001-0001',
        procurementChain: '0003-0001-0001-0001',
        rootProcurementNumber: 'PR-2026-0003',
        quotationNumber: 'QTN-2026-0003-0001-0001',
        chainId: 'PC-2026-0003',
        parentDocumentId: 'rfq2',
        parentDocumentNumber: 'RFQ-2026-0003-0001',
        rfqId: 'rfq2',
        rfqNumber: 'RFQ-2026-0003-0001',
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
        chargeType: 'Project Cost',
        projectId: 'PRJ-002',
        projectName: 'Midland Basin Support',
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
      },
      {
        id: 'po3',
        poNumber: 'PO-2026-0005-0001-0001-0001',
        documentNumber: 'PO-2026-0005-0001-0001-0001',
        procurementChain: '0005-0001-0001-0001',
        rootProcurementNumber: 'PR-2026-0005',
        quotationNumber: 'QTN-2026-0005-0001-0001',
        chainId: 'PC-2026-0005',
        parentDocumentId: 'rfq3',
        parentDocumentNumber: 'RFQ-2026-0005-0001',
        rfqId: 'rfq3',
        rfqNumber: 'RFQ-2026-0005-0001',
        vendorId: 'v3',
        vendorName: 'SafeGuard HSE Solutions',
        vendorTaxNumber: 'TX-99001144',
        vendorAddress: '200 Safety Blvd, Odessa TX 79761',
        date: '2026-06-10',
        deliveryDate: '2026-06-28',
        costCenter: 'CC-HSE-003',
        paymentTerms: 'Net 30',
        status: 'Approved',
        subtotal: 8400,
        taxPercent: 15,
        taxAmount: 1260,
        withholdingTaxPercent: 2,
        withholdingTaxAmount: 168,
        totalAmount: 9492,
        chargeType: 'Direct Cost',
        projectId: 'PRJ-003',
        projectName: 'Rig Delta HSE Compliance',
        items: [
          { id: 'poi3a', itemCode: 'HSE-HARN-CLA', itemName: 'Safety Harness Class A Full Body', quantity: 20, unitPrice: 150, uom: 'EA', totalPrice: 3000 },
          { id: 'poi3b', itemCode: 'HSE-DET-GAS', itemName: 'Multi-Gas Detector Portable', quantity: 8, unitPrice: 420, uom: 'EA', totalPrice: 3360 },
          { id: 'poi3c', itemCode: 'LUB-GRE-DRUM', itemName: 'Premium Rig Grease (55 Gal)', quantity: 6, unitPrice: 350, uom: 'DRUM', totalPrice: 2100 }
        ],
        approvalWorkflow: [
          { role: 'Procurement Specialist', approverName: 'Jane Smith', status: 'Approved', actionDate: '2026-06-10', comments: 'HSE compliance order - priority.' },
          { role: 'Procurement Manager', approverName: 'Frank Jones', status: 'Approved', actionDate: '2026-06-11', comments: 'Approved within HSE budget envelope.' },
          { role: 'VP Operations', approverName: 'Marcus Aurelius', status: 'Approved', actionDate: '2026-06-12', comments: 'Mandatory safety compliance. Approved.' }
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
      },
      {
        id: 'ins3',
        requestNumber: 'IR-2026-003',
        poId: 'po3',
        poNumber: 'PO-2026-0005-0001-0001-0001',
        vendorId: 'v3',
        vendorName: 'SafeGuard HSE Solutions',
        requestDate: '2026-06-13',
        status: 'Pending',
        items: [
          { itemCode: 'HSE-HARN-CLA', itemName: 'Safety Harness Class A Full Body', uom: 'EA', quantityOrdered: 20, quantityReceived: 20, quantityAccepted: 20, quantityRejected: 0, status: 'Pending' },
          { itemCode: 'HSE-DET-GAS', itemName: 'Multi-Gas Detector Portable', uom: 'EA', quantityOrdered: 8, quantityReceived: 8, quantityAccepted: 8, quantityRejected: 0, status: 'Pending' },
          { itemCode: 'LUB-GRE-DRUM', itemName: 'Premium Rig Grease (55 Gal)', uom: 'DRUM', quantityOrdered: 6, quantityReceived: 6, quantityAccepted: 6, quantityRejected: 0, status: 'Pending' }
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
      openRFQs: rfqs.filter(r => r.status === 'Sent' || r.status === 'Partially Responded' || r.status === 'Fully Responded').length,
      activePOs: pos.filter(p => p.status === 'Approved' || p.status === 'Pending Approval').length,
      vendorsCount: vends.length,
      equipmentCount: items.reduce((acc, i) => acc + i.quantity, 0),
      monthlyOperatingHours: totalOpHours
    };
  });

  // --- ACTIONS & MUTATORS ---

  addPurchaseRequest(pr: Omit<PurchaseRequest, 'id' | 'requestNumber' | 'chainId' | 'status' | 'requestDate' | 'documentNumber' | 'procurementChain' | 'rootProcurementNumber'>) {
    const prs = this.purchaseRequests();
    const seq = String(prs.length + 1).padStart(4, '0');
    const year = new Date().getFullYear();
    const num = `PR-${year}-${seq}`;
    const chainId = `PC-${year}-${seq}`;
    const newPr: PurchaseRequest = {
      ...pr,
      id: `pr${prs.length + 1}`,
      requestNumber: num,
      documentNumber: num,
      procurementChain: seq,
      rootProcurementNumber: num,
      chainId,
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
    // Auto-create reservation and stock issue MIV on approval
    if (status === 'Approved') {
      const pr = this.purchaseRequests().find(p => p.id === prId);
      if (pr) {
        if (!pr.reservationCreated) {
          this.createReservationFromPR(pr);
        }

        // Auto-create Store Issue Voucher (MIV) for in-stock inventory items
        const mivItems: MIVItem[] = [];
        let totalVal = 0;
        pr.items.forEach(item => {
          if (item.itemType === 'Inventory Item') {
            const avail = this.getInventoryAvailability(item.itemCode);
            const issueQty = item.fulfillFromStock ?? Math.min(item.quantity, avail.availableQty);
            if (issueQty > 0) {
              const matchedInv = this.inventoryItems().find(inv => inv.itemCode === item.itemCode);
              const price = matchedInv?.unitPrice ?? 0;
              mivItems.push({
                itemCode: item.itemCode,
                itemName: item.itemName,
                quantityRequested: item.quantity,
                quantityIssued: issueQty,
                unitPrice: price,
                totalPrice: price * issueQty,
                uom: item.uom,
                inventoryCreditAcc: '1201-01',
                consumptionDebitAcc: '5102-04'
              });
              totalVal += price * issueQty;
            }
          }
        });

        if (mivItems.length > 0) {
          const list = this.mivs();
          const num = `MIV-2026-0${list.length + 1}`;
          const newMIV: MIV = {
            id: `miv-${pr.id}`,
            voucherNumber: num,
            issueTo: pr.chargeType === 'Project Cost' ? 'Project' : 'Cost Center',
            destinationId: pr.projectId || pr.projectName || pr.costCenter,
            referenceNumber: pr.requestNumber,
            requestedBy: pr.requestedBy,
            approvedBy: 'Auto System',
            issueDate: new Date().toISOString().split('T')[0],
            status: 'Posted',
            items: mivItems,
            totalAmount: totalVal
          };

          // Append MIV record
          this.mivs.update(val => [...val, newMIV]);

          // Deduct from warehouse stock
          mivItems.forEach(vitem => {
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
  }

  addRFQ(rfq: Omit<RFQ, 'id' | 'rfqNumber' | 'status' | 'createdDate' | 'quotations' | 'chainId' | 'parentDocumentId' | 'parentDocumentNumber' | 'documentNumber' | 'procurementChain' | 'rootProcurementNumber'> & { chainId?: string; parentDocumentId?: string; parentDocumentNumber?: string; }) {
    const rfqs = this.rfqs();
    // Inherit dimensions from source PR
    const sourcePR = this.purchaseRequests().find(p => p.id === rfq.purchaseRequestId);
    const prChain = sourcePR?.procurementChain || '0000';
    const prRFQs = rfqs.filter(r => r.purchaseRequestId === rfq.purchaseRequestId);
    const rfqSeq = String(prRFQs.length + 1).padStart(4, '0');
    const year = new Date().getFullYear();
    const num = `RFQ-${year}-${prChain}-${rfqSeq}`;

    const newRfq: RFQ = {
      ...rfq,
      id: `rfq${rfqs.length + 1}`,
      rfqNumber: num,
      documentNumber: num,
      procurementChain: `${prChain}-${rfqSeq}`,
      rootProcurementNumber: sourcePR?.documentNumber || '',
      chainId: rfq.chainId || sourcePR?.chainId || `PC-${year}-${prChain}`,
      parentDocumentId: rfq.parentDocumentId || rfq.purchaseRequestId,
      parentDocumentNumber: rfq.parentDocumentNumber || sourcePR?.requestNumber || '',
      chargeType: rfq.chargeType || sourcePR?.chargeType,
      projectId: rfq.projectId || sourcePR?.projectId,
      projectName: rfq.projectName || sourcePR?.projectName,
      assetId: rfq.assetId || sourcePR?.assetId,
      assetName: rfq.assetName || sourcePR?.assetName,
      costCenter: rfq.costCenter || sourcePR?.costCenter,
      requiredDeliveryDate: sourcePR?.requiredDate || '',
      requester: sourcePR?.requestedBy || '',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      quotations: []
    };
    this.rfqs.update(val => [...val, newRfq]);
    this.updatePRStatus(rfq.purchaseRequestId, 'RFQ Created');
    return newRfq;
  }

  sendRFQ(rfqId: string) {
    this.rfqs.update(list =>
      list.map(r => {
        if (r.id !== rfqId) return r;

        // Log vendor timeline events for RFQ Emails Sent
        r.vendors.forEach(v => {
          const newEvent = {
            id: `ev-rfq-${Math.random().toString(36).substr(2, 9)}`,
            vendorId: v.vendorId,
            date: new Date().toISOString().split('T')[0],
            eventType: 'RFQ Email Sent' as const,
            title: 'RFQ Invitation Sent',
            description: `RFQ Email Sent for ${r.rfqNumber}: "${r.title}"`,
            referenceNumber: r.rfqNumber,
            performedBy: 'Jane Smith (Procurement Specialist)'
          };
          this.vendorTimeline.update(evs => [...evs, newEvent]);
        });

        // Set invitation date for vendors
        const updatedVendors = r.vendors.map(v => ({
          ...v,
          status: 'Pending' as const,
          invitationSentDate: new Date().toISOString().split('T')[0]
        }));

        return {
          ...r,
          status: 'Sent' as const,
          vendors: updatedVendors
        };
      })
    );
  }

  resendRFQ(rfqId: string) {
    const rfq = this.rfqs().find(r => r.id === rfqId);
    if (!rfq) return;

    rfq.vendors.forEach(v => {
      const newEvent = {
        id: `ev-rfq-res-${Math.random().toString(36).substr(2, 9)}`,
        vendorId: v.vendorId,
        date: new Date().toISOString().split('T')[0],
        eventType: 'RFQ Email Sent' as const,
        title: 'RFQ Invitation Re-sent',
        description: `RFQ Email Re-sent for ${rfq.rfqNumber}: "${rfq.title}"`,
        referenceNumber: rfq.rfqNumber,
        performedBy: 'Jane Smith (Procurement Specialist)'
      };
      this.vendorTimeline.update(evs => [...evs, newEvent]);
    });

    this.rfqs.update(list =>
      list.map(r => {
        if (r.id !== rfqId) return r;
        const updatedVendors = r.vendors.map(v => ({
          ...v,
          invitationSentDate: new Date().toISOString().split('T')[0]
        }));
        return {
          ...r,
          vendors: updatedVendors
        };
      })
    );
  }

  closeRFQ(rfqId: string) {
    this.rfqs.update(list =>
      list.map(r => r.id === rfqId ? { ...r, status: 'Closed' as const } : r)
    );
  }

  cancelRFQ(rfqId: string) {
    this.rfqs.update(list =>
      list.map(r => r.id === rfqId ? { ...r, status: 'Cancelled' as const } : r)
    );
  }


  // ── Inventory Availability ────────────────────────────────────────────────
  getInventoryAvailability(itemCode: string): { currentStock: number; reservedQty: number; availableQty: number } {
    const item = this.inventoryItems().find(i => i.itemCode === itemCode);
    if (!item) return { currentStock: 0, reservedQty: 0, availableQty: 0 };
    const reserved = this.inventoryReservations()
      .filter(r => r.status === 'Approved' || r.status === 'Partially Reserved')
      .reduce((sum, res) => {
        const ri = res.items.find(i => i.itemCode === itemCode);
        return sum + (ri?.reservedQuantity ?? 0);
      }, 0);
    return { currentStock: item.quantity, reservedQty: reserved, availableQty: Math.max(0, item.quantity - reserved) };
  }

  // ── Reservation from PR ──────────────────────────────────────────────────
  createReservationFromPR(pr: PurchaseRequest) {
    const inventoryItems = pr.items.filter(i => i.itemType === 'Inventory Item' && (i.availableQty ?? 0) > 0);
    if (inventoryItems.length === 0) return;
    const seq = String(this.inventoryReservations().length + 1).padStart(4, '0');
    const reservation: InventoryReservation = {
      id: `res-${pr.id}`,
      reservationNumber: `RES-${new Date().getFullYear()}-${seq}`,
      projectCode: pr.projectId || pr.costCenter,
      projectName: pr.projectName || pr.department,
      requestedBy: pr.requestedBy,
      requestDate: new Date().toISOString().split('T')[0],
      requiredDate: pr.requiredDate,
      status: 'Approved',
      items: inventoryItems.map(i => ({
        itemCode: i.itemCode, itemName: i.itemName, uom: i.uom,
        requestedQuantity: i.fulfillFromStock ?? Math.min(i.quantity, i.availableQty ?? i.quantity),
        reservedQuantity: i.fulfillFromStock ?? Math.min(i.quantity, i.availableQty ?? i.quantity),
        unitPrice: this.inventoryItems().find(inv => inv.itemCode === i.itemCode)?.unitPrice ?? 0
      })),
      totalValue: 0,
      notes: `Auto-reserved from PR ${pr.requestNumber}`
    };
    this.inventoryReservations.update(v => [...v, reservation]);
    // Mark PR as reservation created
    this.purchaseRequests.update(prs => prs.map(p => p.id === pr.id ? { ...p, reservationCreated: true } : p));
  }

  submitQuotation(rfqId: string, quotation: Omit<RFQQuotation, 'id' | 'procurementChain' | 'quotationNumber' | 'quotationSequence'>) {
    this.rfqs.update(rfqs =>
      rfqs.map(r => {
        if (r.id !== rfqId) return r;
        const qtnSeq = r.quotations.length + 1;
        const qtnSeqStr = String(qtnSeq).padStart(4, '0');
        const year = new Date().getFullYear();
        const qtnNum = `QT-${year}-${r.procurementChain}-${qtnSeqStr}`;

        // Detailed line item calculations
        const quoteItems = (quotation.items || []).map(item => {
          const discountAmt = Math.round(item.quantity * item.unitPrice * ((item.discountPercent || 0) / 100));
          const netPrice = (item.quantity * item.unitPrice) - discountAmt;
          const taxAmt = Math.round(netPrice * ((item.taxPercent || 0) / 100));
          const lineTotal = quotation.taxIncluded ? netPrice : (netPrice + taxAmt);
          return {
            ...item,
            discountAmount: discountAmt,
            taxAmount: taxAmt,
            totalPrice: lineTotal
          };
        });

        const subtotal = quoteItems.length > 0
          ? quoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
          : (quotation.subtotal || quotation.price || 0);

        const discountAmount = quoteItems.length > 0
          ? quoteItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0)
          : (quotation.discountAmount || 0);

        const taxAmount = quoteItems.length > 0
          ? quoteItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0)
          : (quotation.taxAmount || 0);

        const totalAmount = quoteItems.length > 0
          ? (quotation.taxIncluded ? (subtotal - discountAmount) : (subtotal - discountAmount + taxAmount))
          : (quotation.totalAmount || (subtotal + taxAmount));

        const newQ: RFQQuotation = {
          ...quotation,
          id: `q${r.quotations.length + 1}`,
          quotationNumber: qtnNum,
          quotationSequence: qtnSeq,
          procurementChain: `${r.procurementChain}-${qtnSeqStr}`,
          status: 'Submitted',
          items: quoteItems,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          price: subtotal, // backward compat
          
          // propagate cost allocation dimensions
          chargeType: r.chargeType,
          projectId: r.projectId,
          projectName: r.projectName,
          assetId: r.assetId,
          assetName: r.assetName,
          costCenter: r.costCenter
        };

        const updatedQuotes = [...r.quotations.filter(q => q.vendorId !== quotation.vendorId), newQ];

        // Recalculate best price
        let minPrice = Infinity;
        updatedQuotes.forEach(q => {
          if (q.totalAmount < minPrice) minPrice = q.totalAmount;
        });

        const checkedQuotes = updatedQuotes.map(q => ({
          ...q,
          isBestPrice: q.totalAmount === minPrice,
          isRecommended: q.totalAmount === minPrice || q.deliveryWeeks <= 1
        }));

        const updatedVendors = r.vendors.map(v => 
          v.vendorId === quotation.vendorId
            ? { ...v, status: 'Submitted' as const, quotationSubmittedDate: new Date().toISOString().split('T')[0] }
            : v
        );

        const submittedCount = updatedVendors.filter(v => v.status === 'Submitted' || v.status === 'Under Review').length;
        const totalCount = updatedVendors.length;
        const newStatus = submittedCount === totalCount ? 'Fully Responded' as const : 'Partially Responded' as const;

        // Log vendor timeline event for Quotation Submitted
        const newEvent = {
          id: `ev-qt-${Math.random().toString(36).substr(2, 9)}`,
          vendorId: quotation.vendorId,
          date: new Date().toISOString().split('T')[0],
          eventType: 'Quotation Submitted' as const,
          title: 'Quotation Submitted',
          description: `Quotation ${qtnNum} submitted for RFQ ${r.rfqNumber} ($${totalAmount.toLocaleString()})`,
          referenceNumber: qtnNum,
          amount: totalAmount,
          performedBy: quotation.vendorContactPerson || 'Supplier Representative'
        };
        this.vendorTimeline.update(evs => [...evs, newEvent]);

        return {
          ...r,
          status: newStatus,
          vendors: updatedVendors,
          quotations: checkedQuotes
        };
      })
    );
  }

  awardQuotation(rfqId: string, vendorId: string) {
    const rfq = this.rfqs().find(r => r.id === rfqId);
    if (!rfq || rfq.status === 'Awarded') return;

    this.rfqs.update(rfqs =>
      rfqs.map(r => {
        if (r.id !== rfqId) return r;
        const winningQuote = r.quotations.find(q => q.vendorId === vendorId);
        if (!winningQuote) return r;

        const updatedVendors = r.vendors.map(v => 
          v.vendorId === vendorId
            ? { ...v, status: 'Accepted' as const }
            : { ...v, status: v.status === 'Submitted' ? 'Rejected' as const : v.status }
        );
        const updatedQuotes = r.quotations.map(q => 
          q.vendorId === vendorId
            ? { ...q, status: 'Accepted' as const }
            : { ...q, status: q.status === 'Submitted' ? 'Rejected' as const : q.status }
        );

        // Log vendor timeline for award
        const newEvent = {
          id: `ev-aw-${Math.random().toString(36).substr(2, 9)}`,
          vendorId: vendorId,
          date: new Date().toISOString().split('T')[0],
          eventType: 'Evaluation Completed' as const,
          title: 'Quotation Awarded',
          description: `Quotation ${winningQuote.quotationNumber} awarded for RFQ ${r.rfqNumber}`,
          referenceNumber: winningQuote.quotationNumber,
          performedBy: 'Jane Smith (Procurement Specialist)'
        };
        this.vendorTimeline.update(evs => [...evs, newEvent]);

        return {
          ...r,
          status: 'Awarded' as const,
          awardedVendorId: vendorId,
          awardedVendorName: winningQuote.vendorName,
          awardedQuotationId: winningQuote.id,
          awardedQuotationNumber: winningQuote.quotationNumber,
          vendors: updatedVendors,
          quotations: updatedQuotes
        };
      })
    );
  }

  rejectQuotation(rfqId: string, vendorId: string) {
    this.rfqs.update(rfqs =>
      rfqs.map(r => {
        if (r.id !== rfqId) return r;
        const updatedVendors = r.vendors.map(v => 
          v.vendorId === vendorId ? { ...v, status: 'Rejected' as const } : v
        );
        const updatedQuotes = r.quotations.map(q => 
          q.vendorId === vendorId ? { ...q, status: 'Rejected' as const } : q
        );
        return {
          ...r,
          vendors: updatedVendors,
          quotations: updatedQuotes
        };
      })
    );
  }

  requestRevision(rfqId: string, vendorId: string) {
    this.rfqs.update(rfqs =>
      rfqs.map(r => {
        if (r.id !== rfqId) return r;
        const updatedVendors = r.vendors.map(v => 
          v.vendorId === vendorId ? { ...v, status: 'Revision Requested' as const } : v
        );
        const updatedQuotes = r.quotations.map(q => 
          q.vendorId === vendorId ? { ...q, status: 'Revision Requested' as const } : q
        );

        // Log timeline event for clarification
        const newEvent = {
          id: `ev-rev-${Math.random().toString(36).substr(2, 9)}`,
          vendorId: vendorId,
          date: new Date().toISOString().split('T')[0],
          eventType: 'Clarification' as const,
          title: 'Revision Requested',
          description: `Requested commercial clarification / revision on quotation for RFQ ${r.rfqNumber}`,
          referenceNumber: r.rfqNumber,
          performedBy: 'Jane Smith (Procurement Specialist)'
        };
        this.vendorTimeline.update(evs => [...evs, newEvent]);

        return {
          ...r,
          vendors: updatedVendors,
          quotations: updatedQuotes
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
    const quotePOList = pos.filter(p => p.quotationNumber === quote.quotationNumber);
    const poSeq = String(quotePOList.length + 1).padStart(4, '0');
    const year = new Date().getFullYear();
    const poNum = `PO-${year}-${quote.procurementChain.replace('QTN-', '').replace('QT-', '')}-${poSeq}`;

    const subtotal = quote.subtotal || quote.price;
    const taxAmount = quote.taxAmount;
    const whtPercent = 2; // Withholding tax 2%
    const whtAmount = Math.round(subtotal * (whtPercent / 100));
    const totalAmount = quote.totalAmount - whtAmount;

    // Distribute line items correctly
    const poItems: POItem[] = quote.items && quote.items.length > 0
      ? quote.items.map((qi, index) => ({
          id: `poi-${quote.id}-${index}-${Date.now()}`,
          itemCode: qi.itemCode,
          itemName: qi.itemName,
          quantity: qi.quantity,
          uom: qi.uom,
          unitPrice: qi.unitPrice,
          totalPrice: qi.totalPrice
        }))
      : pr.items.map(item => ({
          id: `poi-${item.id}`,
          itemCode: item.itemCode,
          itemName: item.itemName,
          quantity: item.quantity,
          uom: item.uom,
          unitPrice: Math.round(quote.price / item.quantity),
          totalPrice: quote.price
        }));

    const newPO: PurchaseOrder = {
      id: `po${pos.length + 1}`,
      poNumber: poNum,
      documentNumber: poNum,
      procurementChain: `${quote.procurementChain.replace('QTN-', '').replace('QT-', '')}-${poSeq}`,
      rootProcurementNumber: pr.documentNumber,
      quotationNumber: quote.quotationNumber,
      chainId: rfq.chainId || pr.chainId || `PC-${year}-${quote.procurementChain}`,
      parentDocumentId: rfq.id,
      parentDocumentNumber: rfq.documentNumber,
      rfqId: rfq.id,
      rfqNumber: rfq.documentNumber,
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      vendorTaxNumber: vendor.taxNumber,
      vendorAddress: vendor.address,
      vendorContact: `${quote.vendorContactPerson || vendor.contactPerson} (${quote.vendorEmail || vendor.contactEmail})`,
      date: new Date().toISOString().split('T')[0],
      deliveryDate: quote.validityDate || new Date(Date.now() + quote.deliveryWeeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryAddress: 'Rig Delta Warehouse, Sector 3, Ghawar Field, Saudi Arabia',
      costCenter: pr.costCenter,
      paymentTerms: quote.paymentTerms || vendor.paymentTerms,
      status: 'Pending Approval',
      items: poItems,
      subtotal,
      taxPercent: quote.taxPercent,
      taxAmount,
      withholdingTaxPercent: whtPercent,
      withholdingTaxAmount: whtAmount,
      totalAmount,

      // Commercial Terms details
      advancePayment: 10, // 10% standard advance
      deliveryPayment: 80, // 80% on delivery
      retentionAmount: 10, // 10% retention
      otherPaymentConditions: 'Retention released after 6 months of successful operations.',

      // Signatures
      companyRepresentative: 'Sophia Sterling (Finance Manager)',
      supplierRepresentative: quote.vendorContactPerson || 'Authorized Representative',

      // Cost allocation propagation
      chargeType: pr.chargeType,
      projectId: pr.projectId,
      projectName: pr.projectName,
      assetId: pr.assetId,
      assetName: pr.assetName,

      approvalWorkflow: [
        { role: 'Procurement Specialist', approverName: 'Jane Smith', status: 'Approved', actionDate: new Date().toISOString().split('T')[0], comments: 'Generated from quotation comparison recommendation.' },
        { role: 'Procurement Manager', approverName: 'Frank Jones', status: 'Pending' },
        { role: 'VP Operations', approverName: 'Marcus Aurelius', status: 'Pending' }
      ]
    };

    this.purchaseOrders.update(val => [...val, newPO]);

    // Enforce Generation Rules: Lock RFQ and award winning quote, reject others
    this.rfqs.update(list =>
      list.map(r => r.id === rfqId ? { ...r, status: 'Awarded' as const } : r)
    );

    // ── Log Vendor Chronological Communication Events ──
    const vendorEvents = [
      {
        id: `ev-po-${Math.random().toString(36).substr(2, 9)}`,
        vendorId: vendor.id,
        date: newPO.date,
        eventType: 'PO Sent' as const,
        title: 'Purchase Order Issued',
        description: `Purchase Order ${newPO.poNumber} issued and dispatched to vendor.`,
        referenceNumber: newPO.poNumber,
        amount: newPO.totalAmount,
        performedBy: 'Sophia Sterling (Finance Manager)'
      }
    ];

    vendorEvents.forEach(ev => {
      this.vendorTimeline.update(list => [...list, ev]);
    });

    return newPO;
  }


  approvePO(poId: string, role: string, approverName: string, comments?: string) {
    this.purchaseOrders.update(pos => {
      let transitioned = false;
      const updated = pos.map(po => {
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
        if (allApproved && po.status !== 'Approved') {
          transitioned = true;
        }

        return {
          ...po,
          approvalWorkflow: updatedWorkflow,
          status: allApproved ? ('Approved' as const) : po.status
        };
      });

      if (transitioned) {
        const po = updated.find(p => p.id === poId);
        if (po) {
          // Auto-create inspection request on PO approval
          setTimeout(() => {
            this.createInspectionRequestFromPO(po);
          });
        }
      }

      return updated;
    });
  }

  createInspectionRequestFromPO(po: PurchaseOrder) {
    const list = this.inspectionRequests();
    if (list.some(r => r.poId === po.id)) return;

    const reqNum = `IR-2026-0${list.length + 1}`;
    const newReq: InspectionRequest = {
      id: `ins-${Date.now()}`,
      requestNumber: reqNum,
      poId: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      items: po.items.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        quantityOrdered: item.quantity,
        quantityReceived: item.quantity,
        quantityAccepted: item.quantity,
        quantityRejected: 0,
        status: 'Pending'
      }))
    };

    this.inspectionRequests.update(val => [...val, newReq]);
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
    const seq = String(list.length + 1).padStart(4, '0');
    const num = `MRV-2026-${seq}`;
    const newMRV: MRV = { ...mrv, id: `mrv${list.length + 1}`, voucherNumber: num, status: 'Draft' };
    this.mrvs.update(val => [...val, newMRV]);
    return newMRV;
  }

  updateMRVStatus(id: string, status: MRV['status']) {
    this.mrvs.update(list => list.map(item => item.id === id ? { ...item, status } : item));
    const voucher = this.mrvs().find(item => item.id === id);
    if (voucher && (status === 'Posted' || status === 'Approved')) {
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

      if (voucher.poId) {
        this.checkAndUpdatePOCompletionStatus(voucher.poId);
      }
    }
  }

  checkAndUpdatePOCompletionStatus(poId: string) {
    const po = this.purchaseOrders().find(p => p.id === poId);
    if (!po) return;

    // Get all approved/posted MRVs for this PO
    const linkedMRVs = this.mrvs().filter(m => m.poId === poId && (m.status === 'Posted' || m.status === 'Approved'));
    
    // Check if all items are fully received
    let allReceived = true;
    po.items.forEach(poItem => {
      const receivedSum = linkedMRVs.reduce((sum, mrv) => {
        const mrvItem = mrv.items.find(mi => mi.itemCode === poItem.itemCode);
        return sum + (mrvItem ? mrvItem.quantityReceived : 0);
      }, 0);

      if (receivedSum < poItem.quantity) {
        allReceived = false;
      }
    });

    if (allReceived) {
      this.purchaseOrders.update(pos => 
        pos.map(p => p.id === poId ? { ...p, status: 'Completed' as const } : p)
      );
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

