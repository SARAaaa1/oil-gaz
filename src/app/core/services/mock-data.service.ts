import { Injectable, signal, computed } from '@angular/core';
import { PurchaseRequest, PurchaseRequestItem, PurchaseRequestStatus } from '../../shared/interfaces/purchase-request.interface';
import { RFQ, RFQQuotation, RFQStatus } from '../../shared/interfaces/rfq.interface';
import { PurchaseOrder, POItem, PurchaseOrderStatus } from '../../shared/interfaces/purchase-order.interface';
import { InventoryItem } from '../../shared/interfaces/inventory.interface';
import { Vendor } from '../../shared/interfaces/vendor.interface';
import { Rig, RigTimesheet, TimesheetDayRow } from '../../shared/interfaces/operations.interface';
import { Equipment, AssetHistory, BulkImportRecord } from '../../shared/interfaces/assets.interface';

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

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // 1. Vendors
    const mockVendors: Vendor[] = [
      {
        id: 'v1',
        vendorName: 'Global Oilfield Solutions',
        taxNumber: 'TX-88992211',
        address: '1220 Petroleum Way, Houston TX 77001',
        contactPerson: 'Mark Peterson',
        contactEmail: 'm.peterson@globaloilfield.com',
        contactPhone: '+1-555-0199',
        paymentTerms: 'Net 30',
        status: 'Active'
      },
      {
        id: 'v2',
        vendorName: 'APEX Industrial Supplies',
        taxNumber: 'TX-44558833',
        address: '850 Industrial Blvd, Dallas TX 75201',
        contactPerson: 'Jane Sterling',
        contactEmail: 'j.sterling@apexind.com',
        contactPhone: '+1-555-0145',
        paymentTerms: 'Net 45',
        status: 'Active'
      },
      {
        id: 'v3',
        vendorName: 'Valero Drilling Supplies',
        taxNumber: 'TX-11223344',
        address: '400 Refinery Rd, San Antonio TX 78201',
        contactPerson: 'Carlos Ruiz',
        contactEmail: 'c.ruiz@valerods.com',
        contactPhone: '+1-555-0182',
        paymentTerms: 'Net 15',
        status: 'Active'
      },
      {
        id: 'v4',
        vendorName: 'HSE Safety First Inc',
        taxNumber: 'TX-55443322',
        address: '99 Safety Way, Houston TX 77002',
        contactPerson: 'Sarah Connor',
        contactEmail: 's.connor@hsesafety.com',
        contactPhone: '+1-555-0123',
        paymentTerms: 'Net 30',
        status: 'Active'
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
}
