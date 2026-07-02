import { Injectable, signal, computed } from '@angular/core';
import { FixedAsset, AssetHistoryEvent, AssetStatus, AssetCategory, DepreciationMethod } from './assets.interfaces';

@Injectable({ providedIn: 'root' })
export class AssetsMockService {

  // ── Fixed Assets List Signal ───────────────────────────────────────
  readonly assets = signal<FixedAsset[]>([
    {
      id: 'ast01',
      assetCode: 'AST-GEN-001',
      assetName: 'Cummins 500kVA Diesel Generator Set',
      serialNumber: 'CUM-500-998811',
      category: 'Generators',
      projectCode: 'PRJ-001',
      projectName: 'Saudi Aramco Pipeline',
      costCenterCode: 'CC-PRJ-001-A',
      costCenterName: 'Dhahran Excavation A',
      warehouseCode: 'WH-HQ-01',
      supplierName: 'Saudi Diesel Equipment Ltd',
      purchaseOrderNumber: 'PO-2025-015',
      purchaseInvoiceNumber: 'INV-AP-105',
      purchaseDate: '2025-01-10',
      capitalizationDate: '2025-01-15',
      usefulLifeYears: 5,
      usefulLifeMonths: 60,
      depreciationMethod: 'Straight Line',
      originalCost: 240_000,
      residualValue: 24_000,
      currentBookValue: 222_000, // Original - Acc (240k - 18k)
      accumulatedDepreciation: 18_000, // 5 months depreciated (Jan-May @ 3.6k/month)
      status: 'Active',
      location: 'Dhahran Camp Sector C',
      assignedEmployee: 'Abdullah Al-Harbi',
      department: 'Operations',
      warrantyExpiry: '2027-01-10',
      insuranceExpiry: '2026-01-10',
      qrCodeUrl: 'assets/mock-qr.png',
      notes: 'HQ primary site diesel power unit',
      lastDepreciationDate: '2025-05-31',
      history: [
        { id: 'h01_1', eventDate: '2025-01-10', type: 'Purchase', description: 'Asset purchased from Saudi Diesel', user: 'Reem Al-Muaiqel' },
        { id: 'h01_2', eventDate: '2025-01-15', type: 'Capitalization', description: 'Asset capitalized and placed in service', user: 'Sara Al-Rasheed' }
      ]
    },
    {
      id: 'ast02',
      assetCode: 'AST-RIG-002',
      assetName: 'Drilling Rig Mast Section 1500HP',
      serialNumber: 'RIG-MAST-882200',
      category: 'Rig Equipment',
      projectCode: 'PRJ-001',
      projectName: 'Saudi Aramco Pipeline',
      costCenterCode: 'CC-PRJ-001-B',
      costCenterName: 'Dhahran Drilling B',
      warehouseCode: 'WH-HQ-01',
      supplierName: 'National Oilwell Varco',
      purchaseOrderNumber: 'PO-2025-001',
      purchaseInvoiceNumber: 'INV-AP-002',
      purchaseDate: '2025-02-01',
      capitalizationDate: '2025-02-10',
      usefulLifeYears: 10,
      usefulLifeMonths: 120,
      depreciationMethod: 'Straight Line',
      originalCost: 1_200_000,
      residualValue: 120_000,
      currentBookValue: 1_164_000, // 4 months @ 9k/month (1200k - 36k)
      accumulatedDepreciation: 36_000,
      status: 'Active',
      location: 'Dhahran Site Section B',
      assignedEmployee: 'Fahad Al-Malki',
      department: 'Exploration',
      warrantyExpiry: '2028-02-01',
      insuranceExpiry: '2026-02-01',
      qrCodeUrl: 'assets/mock-qr.png',
      notes: '1500HP heavy drilling mast assembly',
      lastDepreciationDate: '2025-05-31',
      history: [
        { id: 'h02_1', eventDate: '2025-02-01', type: 'Purchase', description: 'Rig mast acquired', user: 'Reem Al-Muaiqel' },
        { id: 'h02_2', eventDate: '2025-02-10', type: 'Capitalization', description: 'Asset capitalized', user: 'Sara Al-Rasheed' }
      ]
    },
    {
      id: 'ast03',
      assetCode: 'AST-VEH-003',
      assetName: 'Ford F-150 Pickup Truck 4x4',
      serialNumber: '1FTFW1EF8KF883391',
      category: 'Vehicles',
      projectCode: 'PRJ-004',
      projectName: 'SWCC Desalination Support',
      costCenterCode: 'CC-PRJ-004-A',
      costCenterName: 'SWCC Intake Site',
      warehouseCode: 'WH-JED-02',
      supplierName: 'Al Jazirah Vehicles',
      purchaseOrderNumber: 'PO-2025-098',
      purchaseInvoiceNumber: 'INV-AP-991',
      purchaseDate: '2025-03-01',
      capitalizationDate: '2025-03-05',
      usefulLifeYears: 5,
      usefulLifeMonths: 60,
      depreciationMethod: 'Straight Line',
      originalCost: 180_000,
      residualValue: 18_000,
      currentBookValue: 171_900, // 3 months @ 2.7k/month (180k - 8.1k)
      accumulatedDepreciation: 8_100,
      status: 'Active',
      location: 'Riyadh Site Office',
      assignedEmployee: 'Jamil Al-Saeed',
      department: 'Logistics',
      warrantyExpiry: '2028-03-01',
      insuranceExpiry: '2026-03-01',
      qrCodeUrl: 'assets/mock-qr.png',
      notes: 'Field supervisor transport truck',
      lastDepreciationDate: '2025-05-31',
      history: [
        { id: 'h03_1', eventDate: '2025-03-01', type: 'Purchase', description: 'Truck purchased', user: 'Reem Al-Muaiqel' },
        { id: 'h03_2', eventDate: '2025-03-05', type: 'Capitalization', description: 'Truck capitalized', user: 'Sara Al-Rasheed' }
      ]
    },
    {
      id: 'ast04',
      assetCode: 'AST-CRN-004',
      assetName: 'Liebherr Tower Crane 280 EC-H',
      serialNumber: 'LIEB-280-9988',
      category: 'Cranes',
      projectCode: 'PRJ-001',
      projectName: 'Saudi Aramco Pipeline',
      costCenterCode: 'CC-PRJ-001-C',
      costCenterName: 'Dhahran Logistics C',
      warehouseCode: 'WH-HQ-01',
      supplierName: 'Liebherr Saudi Arabia',
      purchaseOrderNumber: 'PO-2025-010',
      purchaseInvoiceNumber: 'INV-AP-012',
      purchaseDate: '2025-01-05',
      capitalizationDate: '2025-01-10',
      usefulLifeYears: 8,
      usefulLifeMonths: 96,
      depreciationMethod: 'Straight Line',
      originalCost: 960_000,
      residualValue: 96_000,
      currentBookValue: 915_000, // 5 months @ 9k/month (960k - 45k)
      accumulatedDepreciation: 45_000,
      status: 'Under Maintenance',
      location: 'Dhahran Yard C',
      assignedEmployee: 'Yaser Al-Qahtani',
      department: 'Operations',
      warrantyExpiry: '2027-01-05',
      insuranceExpiry: '2026-01-05',
      qrCodeUrl: 'assets/mock-qr.png',
      notes: 'Primary material handler yard crane',
      lastDepreciationDate: '2025-05-31',
      history: [
        { id: 'h04_1', eventDate: '2025-01-05', type: 'Purchase', description: 'Crane purchased', user: 'Reem Al-Muaiqel' },
        { id: 'h04_2', eventDate: '2025-01-10', type: 'Capitalization', description: 'Crane capitalized', user: 'Sara Al-Rasheed' },
        { id: 'h04_3', eventDate: '2025-06-15', type: 'Maintenance', description: 'Scheduled hydraulic overhaul', user: 'Fahad Al-Malki' }
      ]
    },
    {
      id: 'ast05',
      assetCode: 'AST-BLD-005',
      assetName: 'HQ Riyadh Warehouse Building',
      serialNumber: 'BLD-HQ-RYD-05',
      category: 'Buildings',
      projectCode: '',
      projectName: 'Corporate General',
      costCenterCode: 'CC-HQ',
      costCenterName: 'HQ Riyadh',
      warehouseCode: 'WH-HQ-01',
      supplierName: 'Saudi Construction Corp',
      purchaseOrderNumber: 'PO-2023-001',
      purchaseInvoiceNumber: 'INV-AP-2023-998',
      purchaseDate: '2023-01-01',
      capitalizationDate: '2023-01-05',
      usefulLifeYears: 25,
      usefulLifeMonths: 300,
      depreciationMethod: 'Straight Line',
      originalCost: 3_000_000,
      residualValue: 300_000,
      currentBookValue: 2_739_000, // 29 months @ 9k/month (3000k - 261k)
      accumulatedDepreciation: 261_000,
      status: 'Active',
      location: 'Olaya District Riyadh',
      assignedEmployee: 'Abdullah Al-Harbi',
      department: 'Corporate',
      warrantyExpiry: '2033-01-01',
      insuranceExpiry: '2026-01-01',
      qrCodeUrl: 'assets/mock-qr.png',
      notes: 'Central storage warehouse building',
      lastDepreciationDate: '2025-05-31',
      history: [
        { id: 'h05_1', eventDate: '2023-01-01', type: 'Purchase', description: 'Building contract signed', user: 'Abdullah Al-Harbi' },
        { id: 'h05_2', eventDate: '2023-01-05', type: 'Capitalization', description: 'Building in service capitalization', user: 'Sara Al-Rasheed' }
      ]
    },
    {
      id: 'ast06',
      assetCode: 'AST-FLT-006',
      assetName: 'Toyota 5-Ton Forklift Diesel',
      serialNumber: 'TOY-FL-22819',
      category: 'Forklifts',
      projectCode: 'PRJ-004',
      projectName: 'SWCC Desalination Support',
      costCenterCode: 'CC-PRJ-004-C',
      costCenterName: 'SWCC Site Camp',
      warehouseCode: 'WH-JED-02',
      supplierName: 'Toyota Material Handling',
      purchaseOrderNumber: 'PO-2025-110',
      purchaseInvoiceNumber: 'INV-AP-115',
      purchaseDate: '2025-04-01',
      capitalizationDate: '2025-04-05',
      usefulLifeYears: 5,
      usefulLifeMonths: 60,
      depreciationMethod: 'Straight Line',
      originalCost: 120_000,
      residualValue: 12_000,
      currentBookValue: 116_400, // 2 months @ 1.8k/month (120k - 3.6k)
      accumulatedDepreciation: 3_600,
      status: 'Disposed',
      location: 'SWCC Site Warehouse',
      assignedEmployee: 'Sultan Al-Otaibi',
      department: 'Logistics',
      warrantyExpiry: '2028-04-01',
      insuranceExpiry: '2026-04-01',
      qrCodeUrl: 'assets/mock-qr.png',
      notes: 'Disposed due to electrical system damage',
      lastDepreciationDate: '2025-05-31',
      history: [
        { id: 'h06_1', eventDate: '2025-04-01', type: 'Purchase', description: 'Forklift purchased', user: 'Reem Al-Muaiqel' },
        { id: 'h06_2', eventDate: '2025-04-05', type: 'Capitalization', description: 'Forklift capitalized', user: 'Sara Al-Rasheed' },
        { id: 'h06_3', eventDate: '2025-06-25', type: 'Disposal', description: 'Forklift disposed due to damage', user: 'Abdullah Al-Harbi' }
      ]
    },
    {
      id: 'ast07',
      assetCode: 'AST-PC-007',
      assetName: 'Dell OptiPlex 7090 Desktop PC',
      serialNumber: 'DELL-OPT-7788',
      category: 'IT Equipment',
      projectCode: '',
      projectName: 'Corporate General',
      costCenterCode: 'CC-HQ',
      costCenterName: 'HQ Riyadh',
      warehouseCode: 'WH-HQ-01',
      supplierName: 'Dell Saudi Arabia Ltd',
      purchaseOrderNumber: 'PO-2025-220',
      purchaseInvoiceNumber: 'INV-AP-225',
      purchaseDate: '2025-05-01',
      capitalizationDate: '', // Draft / Purchased state — NOT capitalized yet
      usefulLifeYears: 3,
      usefulLifeMonths: 36,
      depreciationMethod: 'Straight Line',
      originalCost: 6_000,
      residualValue: 600,
      currentBookValue: 6_000, // No depreciation yet
      accumulatedDepreciation: 0,
      status: 'Purchased',
      location: 'HQ Riyadh Finance Office',
      assignedEmployee: 'Sara Al-Rasheed',
      department: 'Finance',
      warrantyExpiry: '2028-05-01',
      insuranceExpiry: '',
      qrCodeUrl: 'assets/mock-qr.png',
      notes: 'New accountant workstation computer',
      lastDepreciationDate: '',
      history: [
        { id: 'h07_1', eventDate: '2025-05-01', type: 'Purchase', description: 'Dell computer purchased', user: 'Reem Al-Muaiqel' }
      ]
    }
  ]);

  // ── Dashboard metrics computed signal ──────────────────────────────
  readonly kpis = computed(() => {
    const list = this.assets();
    const total = list.length;
    const value = list.reduce((s, a) => s + a.originalCost, 0);
    const accDep = list.reduce((s, a) => s + a.accumulatedDepreciation, 0);
    const net = value - accDep;
    const active = list.filter(a => a.status === 'Active' || a.status === 'Under Maintenance').length;
    const pending = list.filter(a => a.status === 'Draft' || a.status === 'Purchased').length;
    const disposed = list.filter(a => a.status === 'Disposed' || a.status === 'Sold' || a.status === 'Retired').length;
    const maint = list.filter(a => a.status === 'Under Maintenance').length;

    return {
      totalAssets: total,
      totalAssetValue: value,
      accumulatedDepreciation: accDep,
      netBookValue: net,
      assetsInService: active,
      assetsConstruction: pending,
      disposedAssets: disposed,
      maintenanceDue: maint
    };
  });

  // ── Asset Action methods ──────────────────────────────────────────
  capitalizeAsset(id: string) {
    this.assets.update(list =>
      list.map(a => {
        if (a.id !== id) return a;
        const newEvent: AssetHistoryEvent = {
          id: `h-cap-${Date.now()}`,
          eventDate: '2025-07-02',
          type: 'Capitalization',
          description: 'Asset capitalized and placed in service',
          user: 'Sara Al-Rasheed'
        };
        return {
          ...a,
          status: 'Active' as const,
          capitalizationDate: '2025-07-02',
          history: [...a.history, newEvent]
        };
      })
    );
  }

  transferAsset(id: string, newLocation: string, newPM: string) {
    this.assets.update(list =>
      list.map(a => {
        if (a.id !== id) return a;
        const newEvent: AssetHistoryEvent = {
          id: `h-tr-${Date.now()}`,
          eventDate: '2025-07-02',
          type: 'Transfer',
          description: `Asset transferred to ${newLocation} (Responsible: ${newPM})`,
          user: 'Sara Al-Rasheed'
        };
        return {
          ...a,
          location: newLocation,
          assignedEmployee: newPM,
          history: [...a.history, newEvent]
        };
      })
    );
  }

  disposeAsset(id: string, reason: string) {
    this.assets.update(list =>
      list.map(a => {
        if (a.id !== id) return a;
        const newEvent: AssetHistoryEvent = {
          id: `h-disp-${Date.now()}`,
          eventDate: '2025-07-02',
          type: 'Disposal',
          description: `Asset disposed: ${reason}`,
          user: 'Sara Al-Rasheed'
        };
        return {
          ...a,
          status: 'Disposed' as const,
          history: [...a.history, newEvent]
        };
      })
    );
  }

  calculateMonthlyDepreciation(a: FixedAsset): number {
    if (a.status !== 'Active' && a.status !== 'Under Maintenance') return 0;
    if (!a.capitalizationDate) return 0;
    
    // Straight Line Monthly Depreciation formula
    const depreciableAmt = a.originalCost - a.residualValue;
    return depreciableAmt > 0 && a.usefulLifeMonths > 0 ? Math.round(depreciableAmt / a.usefulLifeMonths) : 0;
  }
}
