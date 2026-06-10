import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { 
  Contract, DAR, WCC, Invoice, Collection,
  ContractStatus, DARStatus, WCCStatus, InvoiceStatus, CollectionStatus,
  RateSheetItem, ContractMilestone, DARMaterialUsed, WCCLineItem, CollectionPayment, ApprovalStep
} from '../../shared/interfaces/workflow.interface';
import { 
  CostCenter, Project, EquipmentAssignment, AssetAssignment, 
  MaterialConsumption, EquipmentTransfer, LaborRecord 
} from '../../shared/interfaces/project.interface';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private readonly injector = inject(Injector);
  private readonly authService = inject(AuthService);

  // --- Signals Stores ---
  readonly contracts = signal<Contract[]>([]);
  readonly dars = signal<DAR[]>([]);
  readonly wccs = signal<WCC[]>([]);
  readonly invoices = signal<Invoice[]>([]);
  readonly collections = signal<Collection[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly costCenters = signal<CostCenter[]>([]);
  readonly equipmentAssignments = signal<EquipmentAssignment[]>([]);
  readonly assetAssignments = signal<AssetAssignment[]>([]);
  readonly materialConsumptions = signal<MaterialConsumption[]>([]);
  readonly equipmentTransfers = signal<EquipmentTransfer[]>([]);
  readonly laborRecords = signal<LaborRecord[]>([]);

  private get auditService(): AuditService {
    return this.injector.get(AuditService);
  }

  constructor() {
    this.loadState();
  }

  private loadState() {
    const cachedContracts = localStorage.getItem('petroflow_contracts');
    const cachedDars = localStorage.getItem('petroflow_dars');
    const cachedWccs = localStorage.getItem('petroflow_wccs');
    const cachedInvoices = localStorage.getItem('petroflow_invoices');
    const cachedCollections = localStorage.getItem('petroflow_collections');
    const cachedProjects = localStorage.getItem('petroflow_projects');
    const cachedCostCenters = localStorage.getItem('petroflow_costcenters');
    const cachedEqAssignments = localStorage.getItem('petroflow_eq_assignments');
    const cachedAssetAssignments = localStorage.getItem('petroflow_asset_assignments');
    const cachedMatConsumptions = localStorage.getItem('petroflow_mat_consumptions');
    const cachedTransfers = localStorage.getItem('petroflow_transfers');
    const cachedLabor = localStorage.getItem('petroflow_labor');

    if (cachedContracts && cachedDars && cachedWccs && cachedInvoices && cachedCollections && cachedProjects) {
      this.contracts.set(JSON.parse(cachedContracts));
      this.dars.set(JSON.parse(cachedDars));
      this.wccs.set(JSON.parse(cachedWccs));
      this.invoices.set(JSON.parse(cachedInvoices));
      this.collections.set(JSON.parse(cachedCollections));
      this.projects.set(JSON.parse(cachedProjects));
      this.costCenters.set(cachedCostCenters ? JSON.parse(cachedCostCenters) : []);
      this.equipmentAssignments.set(cachedEqAssignments ? JSON.parse(cachedEqAssignments) : []);
      this.assetAssignments.set(cachedAssetAssignments ? JSON.parse(cachedAssetAssignments) : []);
      this.materialConsumptions.set(cachedMatConsumptions ? JSON.parse(cachedMatConsumptions) : []);
      this.equipmentTransfers.set(cachedTransfers ? JSON.parse(cachedTransfers) : []);
      this.laborRecords.set(cachedLabor ? JSON.parse(cachedLabor) : []);
    } else {
      this.initializeMockData();
    }
  }

  private saveState() {
    localStorage.setItem('petroflow_contracts', JSON.stringify(this.contracts()));
    localStorage.setItem('petroflow_dars', JSON.stringify(this.dars()));
    localStorage.setItem('petroflow_wccs', JSON.stringify(this.wccs()));
    localStorage.setItem('petroflow_invoices', JSON.stringify(this.invoices()));
    localStorage.setItem('petroflow_collections', JSON.stringify(this.collections()));
    localStorage.setItem('petroflow_projects', JSON.stringify(this.projects()));
    localStorage.setItem('petroflow_costcenters', JSON.stringify(this.costCenters()));
    localStorage.setItem('petroflow_eq_assignments', JSON.stringify(this.equipmentAssignments()));
    localStorage.setItem('petroflow_asset_assignments', JSON.stringify(this.assetAssignments()));
    localStorage.setItem('petroflow_mat_consumptions', JSON.stringify(this.materialConsumptions()));
    localStorage.setItem('petroflow_transfers', JSON.stringify(this.equipmentTransfers()));
    localStorage.setItem('petroflow_labor', JSON.stringify(this.laborRecords()));
  }

  resetAllData() {
    localStorage.removeItem('petroflow_contracts');
    localStorage.removeItem('petroflow_dars');
    localStorage.removeItem('petroflow_wccs');
    localStorage.removeItem('petroflow_invoices');
    localStorage.removeItem('petroflow_collections');
    localStorage.removeItem('petroflow_projects');
    localStorage.removeItem('petroflow_costcenters');
    localStorage.removeItem('petroflow_eq_assignments');
    localStorage.removeItem('petroflow_asset_assignments');
    localStorage.removeItem('petroflow_mat_consumptions');
    localStorage.removeItem('petroflow_transfers');
    localStorage.removeItem('petroflow_labor');
    this.initializeMockData();
    
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Settings',
      entityName: 'All Workflow Modules',
      entityId: 'SYSTEM',
      action: 'Status Change',
      oldValue: 'Active Data',
      newValue: 'Reset to Factory Defaults',
      details: 'All contracts, daily activity reports, completion certificates, invoices, collections, projects, and cost centers have been reset to mock template values.'
    });
  }

  private initializeMockData() {
    // --- 1. MOCK CONTRACTS ---
    const mockContracts: Contract[] = [
      {
        id: 'con1',
        contractNumber: 'CON-2026-001',
        title: 'Rig Alpha Offshore Drilling Services',
        clientName: 'Chevron Energy Corp',
        clientContact: 'David Sterling',
        clientEmail: 'dsterling@chevron.com',
        type: 'Daily Rate',
        status: 'Active',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        value: 1850000,
        currency: 'USD',
        scope: 'Provision of offshore drilling operations including Rig Alpha crew, drilling supervision, daily rate services, and drilling tubular supplies.',
        rigId: 'rig1',
        rigName: 'Rig Alpha (Offshore)',
        projectManager: 'Robert Vance',
        retentionPercent: 10,
        paymentTerms: 'Net 30',
        createdDate: '2025-12-15',
        rateSheet: [
          { id: 'rs1_1', description: 'Offshore Drilling Daily Operation Rate', unit: 'DAY', rate: 45000, currency: 'USD' },
          { id: 'rs1_2', description: 'Drill Crew Standby Rate', unit: 'HOUR', rate: 1200, currency: 'USD' },
          { id: 'rs1_3', description: 'Equipment Breakdown Downtime Penalty', unit: 'HOUR', rate: -2000, currency: 'USD' },
          { id: 'rs1_4', description: 'Rig Move Mobilization Flat Rate', unit: 'JOB', rate: 75000, currency: 'USD' }
        ],
        milestones: [
          { id: 'ms1_1', title: 'Mobilization & Spud In', dueDate: '2026-01-10', completedDate: '2026-01-08', amount: 75000, status: 'Completed' },
          { id: 'ms1_2', title: 'Reach Depth of 10,000 Ft', dueDate: '2026-04-15', completedDate: '2026-04-10', amount: 150000, status: 'Completed' },
          { id: 'ms1_3', title: 'Reach Target Depth of 15,000 Ft', dueDate: '2026-08-30', amount: 250000, status: 'In Progress' }
        ]
      },
      {
        id: 'con2',
        contractNumber: 'CON-2026-002',
        title: 'Rig Beta Overhaul & Land Maintenance Services',
        clientName: 'Occidental Petroleum',
        clientContact: 'Martha Wayne',
        clientEmail: 'mwayne@oxy.com',
        type: 'Time & Material',
        status: 'Active',
        startDate: '2026-03-01',
        endDate: '2026-09-30',
        value: 650000,
        currency: 'USD',
        scope: 'Onsite BOP recertification, top drive overhaul, and mast safety integrity maintenance for Rig Beta.',
        rigId: 'rig2',
        rigName: 'Rig Beta (Land)',
        projectManager: 'Sarah Jenkins',
        retentionPercent: 5,
        paymentTerms: 'Net 45',
        createdDate: '2026-02-10',
        rateSheet: [
          { id: 'rs2_1', description: 'Senior Maintenance Engineer Hourly', unit: 'HOUR', rate: 150, currency: 'USD' },
          { id: 'rs2_2', description: 'Junior Mechanic Technical Support', unit: 'HOUR', rate: 95, currency: 'USD' },
          { id: 'rs2_3', description: 'Heavy Overhaul Lift Crane Service', unit: 'DAY', rate: 2500, currency: 'USD' }
        ],
        milestones: [
          { id: 'ms2_1', title: 'BOP Certification Approval', dueDate: '2026-05-20', completedDate: '2026-05-25', amount: 50000, status: 'Completed' },
          { id: 'ms2_2', title: 'Top Drive Overhaul Clearance', dueDate: '2026-07-15', amount: 80000, status: 'Pending' }
        ]
      },
      {
        id: 'con3',
        contractNumber: 'CON-2026-003',
        title: 'Rig Gamma Technical Standby Agreement',
        clientName: 'ExxonMobil Corp',
        clientContact: 'Peter Parker',
        clientEmail: 'pparker@exxon.com',
        type: 'Daily Rate',
        status: 'Draft',
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        value: 400000,
        currency: 'USD',
        scope: 'Standby readiness and preservation maintenance of Rig Gamma offshore Alaska.',
        rigId: 'rig3',
        rigName: 'Rig Gamma (Deepwater)',
        projectManager: 'David Miller',
        retentionPercent: 8,
        paymentTerms: 'Net 30',
        createdDate: '2026-05-28',
        rateSheet: [
          { id: 'rs3_1', description: 'Rig Standby Daily Preservation Rate', unit: 'DAY', rate: 15000, currency: 'USD' },
          { id: 'rs3_2', description: 'Preservation Crew Hourly Support', unit: 'HOUR', rate: 120, currency: 'USD' }
        ],
        milestones: [
          { id: 'ms3_1', title: 'Rig Mobilization Anchorage', dueDate: '2026-07-05', amount: 45000, status: 'Pending' }
        ]
      }
    ];

    // --- 2. MOCK DARs ---
    const mockDars: DAR[] = [
      {
        id: 'dar1',
        darNumber: 'DAR-2026-05-01',
        contractId: 'con1',
        contractNumber: 'CON-2026-001',
        rigId: 'rig1',
        rigName: 'Rig Alpha (Offshore)',
        reportDate: '2026-05-01',
        shift: 'Day',
        status: 'Approved',
        preparedBy: 'Robert Vance',
        operatingHours: 24,
        standbyHours: 0,
        repairHours: 0,
        downtimeHours: 0,
        totalHours: 24,
        fuelConsumption: 1250,
        fuelUnit: 'LITERS',
        materialsUsed: [
          { id: 'dm1_1', itemName: 'Bentonite Drilling Mud', quantity: 15, uom: 'BAGS', remarks: 'Used for mud viscosity' }
        ],
        activitiesPerformed: 'Completed drilling 8.5in hole from 12,400 ft to 12,650 ft. Ran casing survey, circulation successful.',
        hseIncidents: 'None. Safe operations. Tool box talk held at shift startup.',
        weatherConditions: 'Sea State: 1-2m swells. Wind speed: 12 knots. Clear visibility.',
        remarks: 'Operations went smoothly, ahead of project schedule.',
        attachments: ['casing_log_0501.pdf'],
        approvalWorkflow: [
          { role: 'Operations Manager', approverName: 'Marcus Aurelius', status: 'Approved', actionDate: '2026-05-01', comments: 'DAR validated with mud logs.' }
        ],
        submittedDate: '2026-05-01'
      },
      {
        id: 'dar2',
        darNumber: 'DAR-2026-05-02',
        contractId: 'con1',
        contractNumber: 'CON-2026-001',
        rigId: 'rig1',
        rigName: 'Rig Alpha (Offshore)',
        reportDate: '2026-05-02',
        shift: 'Day',
        status: 'Approved',
        preparedBy: 'Robert Vance',
        operatingHours: 16,
        standbyHours: 8,
        repairHours: 0,
        downtimeHours: 0,
        totalHours: 24,
        fuelConsumption: 1100,
        fuelUnit: 'LITERS',
        materialsUsed: [
          { id: 'dm2_1', itemName: 'Steel Pipes Casing Joint', quantity: 5, uom: 'JOINTS' }
        ],
        activitiesPerformed: 'Began running 5in steel pipes. Operations paused for 8 hours due to standby awaiting support vessel delivery.',
        hseIncidents: 'None.',
        weatherConditions: 'Calm waters. Swells under 0.5m.',
        remarks: 'Standby rate rs1_2 claimed for 8 hours.',
        attachments: [],
        approvalWorkflow: [
          { role: 'Operations Manager', approverName: 'Marcus Aurelius', status: 'Approved', actionDate: '2026-05-02', comments: 'Standby validated. Chevron rep signed standby log.' }
        ],
        submittedDate: '2026-05-02'
      },
      {
        id: 'dar3',
        darNumber: 'DAR-2026-05-03',
        contractId: 'con1',
        contractNumber: 'CON-2026-001',
        rigId: 'rig1',
        rigName: 'Rig Alpha (Offshore)',
        reportDate: '2026-05-03',
        shift: 'Day',
        status: 'Submitted',
        preparedBy: 'Robert Vance',
        operatingHours: 18,
        standbyHours: 0,
        repairHours: 6,
        downtimeHours: 6,
        totalHours: 24,
        fuelConsumption: 1320,
        fuelUnit: 'LITERS',
        materialsUsed: [
          { id: 'dm3_1', itemName: 'Top Drive O-Ring Seals', quantity: 2, uom: 'EA' }
        ],
        activitiesPerformed: 'Drilling from 12,650 ft. Experienced top drive hydraulic pressure drop. Suspended drilling, replaced seals.',
        hseIncidents: 'Small hydraulic oil splash, contained instantly. No crew injuries.',
        weatherConditions: 'Heavy wind, 25 knots. 3m swells.',
        remarks: '6 hours of repair/downtime penalty rs1_3 applicable.',
        attachments: ['seal_failure_report.pdf'],
        approvalWorkflow: [
          { role: 'Operations Manager', approverName: 'Marcus Aurelius', status: 'Pending' }
        ],
        submittedDate: '2026-05-03'
      },
      {
        id: 'dar4',
        darNumber: 'DAR-2026-05-21',
        contractId: 'con2',
        contractNumber: 'CON-2026-002',
        rigId: 'rig2',
        rigName: 'Rig Beta (Land)',
        reportDate: '2026-05-21',
        shift: 'Day',
        status: 'Approved',
        preparedBy: 'Sarah Jenkins',
        operatingHours: 8,
        standbyHours: 0,
        repairHours: 0,
        downtimeHours: 0,
        totalHours: 8,
        fuelConsumption: 300,
        fuelUnit: 'LITERS',
        materialsUsed: [],
        activitiesPerformed: 'BOP valve recertification tests. 8 technical billable hours.',
        hseIncidents: 'None.',
        weatherConditions: 'Dry, sunny. 35C.',
        remarks: 'Senior engineer worked 8 hours.',
        attachments: [],
        approvalWorkflow: [
          { role: 'Operations Manager', approverName: 'Marcus Aurelius', status: 'Approved', actionDate: '2026-05-22', comments: 'BOP tests signed.' }
        ],
        submittedDate: '2026-05-21'
      }
    ];

    // --- 3. MOCK WCCs ---
    const mockWccs: WCC[] = [
      {
        id: 'wcc1',
        wccNumber: 'WCC-2026-05-001',
        contractId: 'con1',
        contractNumber: 'CON-2026-001',
        clientName: 'Chevron Energy Corp',
        rigName: 'Rig Alpha (Offshore)',
        periodFrom: '2026-05-01',
        periodTo: '2026-05-02',
        darIds: ['dar1', 'dar2'],
        darNumbers: ['DAR-2026-05-01', 'DAR-2026-05-02'],
        status: 'Approved',
        totalOperatingHours: 40,
        totalStandbyHours: 8,
        lineItems: [
          { id: 'wli1_1', description: 'Offshore Drilling Daily Operation Rate (1.66 Days @ $45,000/day)', unit: 'DAY', quantity: 1.6666, rate: 45000, amount: 75000 },
          { id: 'wli1_2', description: 'Drill Crew Standby Rate (8 Hours @ $1,200/hr)', unit: 'HOUR', quantity: 8, rate: 1200, amount: 9600 }
        ],
        subtotal: 84600,
        preparedBy: 'Robert Vance',
        approvalWorkflow: [
          { role: 'Operations Manager', approverName: 'Marcus Aurelius', status: 'Approved', actionDate: '2026-05-04', comments: 'WCC generated from validated logs.' },
          { role: 'General Manager', approverName: 'Sven Larson', status: 'Approved', actionDate: '2026-05-05', comments: 'Client rep signed, matches contract milestones.' }
        ],
        createdDate: '2026-05-03',
        notes: 'Covers first two days of May operations. PR-2026-001 related casing items delivered.'
      },
      {
        id: 'wcc2',
        wccNumber: 'WCC-2026-05-002',
        contractId: 'con2',
        contractNumber: 'CON-2026-002',
        clientName: 'Occidental Petroleum',
        rigName: 'Rig Beta (Land)',
        periodFrom: '2026-05-21',
        periodTo: '2026-05-21',
        darIds: ['dar4'],
        darNumbers: ['DAR-2026-05-21'],
        status: 'Pending Approval',
        totalOperatingHours: 8,
        totalStandbyHours: 0,
        lineItems: [
          { id: 'wli2_1', description: 'Senior Maintenance Engineer Technical Hours', unit: 'HOUR', quantity: 8, rate: 150, amount: 1200 }
        ],
        subtotal: 1200,
        preparedBy: 'Sarah Jenkins',
        approvalWorkflow: [
          { role: 'Operations Manager', approverName: 'Marcus Aurelius', status: 'Approved', actionDate: '2026-05-22', comments: 'Verified' },
          { role: 'General Manager', approverName: 'Sven Larson', status: 'Pending' }
        ],
        createdDate: '2026-05-22'
      }
    ];

    // --- 4. MOCK INVOICES ---
    const mockInvoices: Invoice[] = [
      {
        id: 'inv1',
        invoiceNumber: 'INV-2026-05-101',
        contractId: 'con1',
        contractNumber: 'CON-2026-001',
        wccId: 'wcc1',
        wccNumber: 'WCC-2026-05-001',
        clientName: 'Chevron Energy Corp',
        clientContact: 'David Sterling',
        issueDate: '2026-05-06',
        dueDate: '2026-06-05',
        status: 'Sent',
        subtotal: 84600,
        vatPercent: 15,
        vatAmount: 12690,
        retentionPercent: 10,
        retentionAmount: 8460,
        withholdingTaxPercent: 2,
        withholdingTaxAmount: 1692,
        totalAmount: 97290, // subtotal + vat
        netPayable: 87138, // subtotal + vat - retention - wht
        currency: 'USD',
        paidAmount: 0,
        balanceDue: 87138,
        paymentTerms: 'Net 30',
        approvalWorkflow: [
          { role: 'Finance Manager', approverName: 'Frank Jones', status: 'Approved', actionDate: '2026-05-05', comments: 'Calculations matching WCC, VAT & WHT applied.' }
        ],
        createdDate: '2026-05-05',
        notes: 'Chevron Rig Alpha May-A operations invoice.'
      }
    ];

    // --- 5. MOCK COLLECTIONS ---
    const mockCollections: Collection[] = [
      {
        id: 'col1',
        collectionNumber: 'COL-2026-05-001',
        invoiceId: 'inv1',
        invoiceNumber: 'INV-2026-05-101',
        contractId: 'con1',
        contractNumber: 'CON-2026-001',
        clientName: 'Chevron Energy Corp',
        invoiceAmount: 87138,
        totalCollected: 0,
        outstandingBalance: 87138,
        currency: 'USD',
        status: 'Pending',
        dueDate: '2026-06-05',
        payments: [],
        agingDays: 29, // days since issue date 2026-05-06
        createdDate: '2026-05-06'
      }
    ];

    // --- 6. MOCK COST CENTERS ---
    const mockCostCenters: CostCenter[] = [
      { code: 'CC-CORP-01', name: 'Corporate Headquarters', type: 'Department', status: 'Active', description: 'General Corporate Overhead' },
      { code: 'CC-DRILL-01', name: 'Drilling Operations Dept', type: 'Operational', status: 'Active', description: 'Drilling Fleet Operational Management' },
      { code: 'CC-WH-A', name: 'Warehouse A Base', type: 'Warehouse', status: 'Active', description: 'Logistics Storage Base Alpha' },
      { code: 'CC-WH-B', name: 'Warehouse B Land Base', type: 'Warehouse', status: 'Active', description: 'Logistics Storage Base Beta' },
      { code: 'CC-PROJ-CON-2026-001', name: 'CC Rig Alpha Offshore', type: 'Project', parentCode: 'CC-DRILL-01', status: 'Active', description: 'Cost Center for Rig Alpha Contract' },
      { code: 'CC-PROJ-CON-2026-002', name: 'CC Rig Beta Overhaul', type: 'Project', parentCode: 'CC-DRILL-01', status: 'Active', description: 'Cost Center for Rig Beta Overhaul Contract' }
    ];

    // --- 7. MOCK PROJECTS ---
    const mockProjects: Project[] = [
      {
        code: 'PROJ-CON-2026-001',
        name: 'Rig Alpha Offshore Drilling Services',
        contractId: 'con1',
        contractNumber: 'CON-2026-001',
        customer: 'Chevron Energy Corp',
        contractValue: 1850000,
        consumedValue: 420000,
        remainingValue: 1430000,
        progressPercent: 23,
        status: 'Active',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        country: 'USA',
        region: 'Gulf of Mexico',
        siteName: 'Block-A42',
        gpsCoordinates: '28.3N, 89.6W',
        costCenterCode: 'CC-PROJ-CON-2026-001',
        preferredWarehouse: 'Warehouse A',
        nearestWarehouse: 'Warehouse A',
        distanceKm: 120,
        estimatedTransportationCost: 25000
      },
      {
        code: 'PROJ-CON-2026-002',
        name: 'Rig Beta Overhaul & Land Maintenance',
        contractId: 'con2',
        contractNumber: 'CON-2026-002',
        customer: 'Occidental Petroleum',
        contractValue: 650000,
        consumedValue: 185000,
        remainingValue: 465000,
        progressPercent: 28,
        status: 'Active',
        startDate: '2026-03-01',
        endDate: '2026-09-30',
        country: 'USA',
        region: 'Permian Basin',
        siteName: 'Pad-12',
        gpsCoordinates: '31.9N, 102.3W',
        costCenterCode: 'CC-PROJ-CON-2026-002',
        preferredWarehouse: 'Warehouse B',
        nearestWarehouse: 'Warehouse B',
        distanceKm: 45,
        estimatedTransportationCost: 8000
      }
    ];

    // --- 8. MOCK EQUIPMENT ASSIGNMENTS ---
    const mockEqAssignments: EquipmentAssignment[] = [
      {
        id: 'eqas1',
        equipmentId: 'eq1',
        equipmentName: 'Drill Rig Mast Alpha',
        serialNumber: 'SN-RGM-00123',
        projectCode: 'PROJ-CON-2026-001',
        siteName: 'Block-A42',
        assignedDate: '2026-01-05',
        status: 'Assigned',
        hoursUsed: 850,
        daysUsed: 150,
        costCenterCode: 'CC-PROJ-CON-2026-001'
      },
      {
        id: 'eqas2',
        equipmentId: 'eq2',
        equipmentName: 'Standby Power Gen 400kVA',
        serialNumber: 'SN-CAT-998822',
        projectCode: 'PROJ-CON-2026-001',
        siteName: 'Block-A42',
        assignedDate: '2026-01-10',
        status: 'Assigned',
        hoursUsed: 1200,
        daysUsed: 145,
        costCenterCode: 'CC-PROJ-CON-2026-001'
      },
      {
        id: 'eqas3',
        equipmentId: 'eq3',
        equipmentName: 'Heavy Overhaul Lift Crane',
        serialNumber: 'SN-LB-00994',
        projectCode: 'PROJ-CON-2026-002',
        siteName: 'Pad-12',
        assignedDate: '2026-03-05',
        returnedDate: '2026-05-25',
        status: 'Returned',
        hoursUsed: 320,
        daysUsed: 81,
        costCenterCode: 'CC-PROJ-CON-2026-002'
      }
    ];

    // --- 9. MOCK ASSET ASSIGNMENTS ---
    const mockAssetAssignments: AssetAssignment[] = [
      {
        id: 'as1',
        assetId: 'eq4',
        assetName: 'Crew Rig Transport Truck',
        serialNumber: 'SN-KW-55012',
        projectCode: 'PROJ-CON-2026-001',
        assignedDate: '2026-01-05',
        assignedTo: 'Robert Vance',
        location: 'Block-A42',
        costCenterCode: 'CC-PROJ-CON-2026-001',
        status: 'Active'
      },
      {
        id: 'as2',
        assetId: 'eq2',
        assetName: 'Standby Power Gen 400kVA',
        serialNumber: 'SN-CAT-998822',
        projectCode: 'PROJ-CON-2026-001',
        assignedDate: '2026-01-10',
        assignedTo: 'Robert Vance',
        location: 'Block-A42',
        costCenterCode: 'CC-PROJ-CON-2026-001',
        status: 'Active'
      }
    ];

    // --- 10. MOCK MATERIAL CONSUMPTIONS ---
    const mockMaterialConsumptions: MaterialConsumption[] = [
      {
        id: 'mc1',
        projectCode: 'PROJ-CON-2026-001',
        materialCode: 'DR-BIT-8.5-PDC',
        materialName: 'Drill Bit 8.5in PDC Premium',
        warehouse: 'Warehouse A',
        issuedQuantity: 2,
        consumedQuantity: 2,
        remainingQuantity: 0,
        costCenterCode: 'CC-PROJ-CON-2026-001',
        issueDate: '2026-01-15',
        docRef: 'MIV-0012',
        unitPrice: 8500
      },
      {
        id: 'mc2',
        projectCode: 'PROJ-CON-2026-001',
        materialCode: 'TUB-PIPE-5IN',
        materialName: 'Steel Pipes 5in Casing joints',
        warehouse: 'Warehouse A',
        issuedQuantity: 40,
        consumedQuantity: 30,
        remainingQuantity: 10,
        costCenterCode: 'CC-PROJ-CON-2026-001',
        issueDate: '2026-02-10',
        docRef: 'MIV-0028',
        unitPrice: 950
      }
    ];

    // --- 11. MOCK TRANSFERS ---
    const mockTransfers: EquipmentTransfer[] = [
      {
        transferNumber: 'TRF-001',
        equipmentId: 'eq2',
        equipmentName: 'Standby Power Gen 400kVA',
        fromLocation: 'Warehouse A',
        toLocation: 'Block-A42',
        projectCode: 'PROJ-CON-2026-001',
        costCenterCode: 'CC-PROJ-CON-2026-001',
        startDate: '2026-01-08',
        arrivalDate: '2026-01-09',
        transportationHours: 8,
        transportationCost: 1500,
        reason: 'Mobilization deployment for Rig Alpha pad standby.',
        status: 'Completed'
      },
      {
        transferNumber: 'TRF-002',
        equipmentId: 'eq3',
        equipmentName: 'Heavy Overhaul Lift Crane',
        fromLocation: 'Warehouse B',
        toLocation: 'Pad-12',
        projectCode: 'PROJ-CON-2026-002',
        costCenterCode: 'CC-PROJ-CON-2026-002',
        startDate: '2026-03-02',
        arrivalDate: '2026-03-04',
        transportationHours: 6,
        transportationCost: 2200,
        reason: 'Deployment for land rig BOP overhaul lift tasks.',
        status: 'Completed'
      }
    ];

    // --- 12. MOCK LABOR RECORDS ---
    const mockLabor: LaborRecord[] = [
      {
        id: 'lab1',
        projectCode: 'PROJ-CON-2026-001',
        employeeName: 'Robert Vance',
        role: 'Project Manager',
        regularHours: 450,
        overtimeHours: 60,
        hourlyRate: 85,
        overtimeRate: 125,
        totalCost: 45750,
        date: '2026-05-01'
      },
      {
        id: 'lab2',
        projectCode: 'PROJ-CON-2026-001',
        employeeName: 'Mark Jenkins',
        role: 'Drilling Specialist',
        regularHours: 320,
        overtimeHours: 80,
        hourlyRate: 65,
        overtimeRate: 95,
        totalCost: 28400,
        date: '2026-05-02'
      }
    ];

    this.contracts.set(mockContracts);
    this.dars.set(mockDars);
    this.wccs.set(mockWccs);
    this.invoices.set(mockInvoices);
    this.collections.set(mockCollections);
    this.projects.set(mockProjects);
    this.costCenters.set(mockCostCenters);
    this.equipmentAssignments.set(mockEqAssignments);
    this.assetAssignments.set(mockAssetAssignments);
    this.materialConsumptions.set(mockMaterialConsumptions);
    this.equipmentTransfers.set(mockTransfers);
    this.laborRecords.set(mockLabor);
    this.saveState();
  }

  // --- CONTRACT MUTATORS ---
  createContract(contract: Omit<Contract, 'id' | 'contractNumber' | 'createdDate'>) {
    const list = this.contracts();
    const newNum = `CON-2026-0${list.length + 1}`;
    const newContract: Contract = {
      ...contract,
      id: `con${list.length + 1}`,
      contractNumber: newNum,
      createdDate: new Date().toISOString().split('T')[0]
    };

    this.contracts.update(val => [...val, newContract]);
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Procurement',
      entityName: 'Contract',
      entityId: newContract.contractNumber,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newContract),
      details: `Created new contract ${newContract.contractNumber} - "${newContract.title}" for client ${newContract.clientName}.`
    });

    return newContract;
  }

  updateContract(contractId: string, updated: Partial<Contract>) {
    const old = this.contracts().find(c => c.id === contractId);
    if (!old) return;

    this.contracts.update(list =>
      list.map(c => c.id === contractId ? { ...c, ...updated } : c)
    );
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Procurement',
      entityName: 'Contract',
      entityId: old.contractNumber,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.contracts().find(c => c.id === contractId)),
      details: `Updated contract ${old.contractNumber} parameters.`
    });
  }

  approveContract(contractId: string, comments?: string) {
    const old = this.contracts().find(c => c.id === contractId);
    if (!old) return;

    this.updateContract(contractId, { status: 'Active' });

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Procurement',
      entityName: 'Contract',
      entityId: old.contractNumber,
      action: 'Approve',
      oldValue: old.status,
      newValue: 'Active',
      details: `Approved contract ${old.contractNumber} (Active). Comments: ${comments || 'None'}`
    });

    // Automatically generate project & cost center
    this.createProjectAndCostCenterFromContract(contractId);
  }

  private createProjectAndCostCenterFromContract(contractId: string) {
    const contract = this.contracts().find(c => c.id === contractId);
    if (!contract) return;

    const projectCode = contract.projectCode || `PROJ-${contract.contractNumber}`;
    const projectName = contract.projectName || contract.title;
    
    // 1. Cost Center
    const ccCode = contract.costCenterCode || `CC-${projectCode}`;
    const ccName = contract.costCenterName || `Project ${projectName} CC`;
    
    // Check if Cost Center exists
    const existsCC = this.costCenters().some(cc => cc.code === ccCode);
    if (!existsCC) {
      const newCC: CostCenter = {
        code: ccCode,
        name: ccName,
        type: 'Project',
        parentCode: contract.parentCostCenter || 'CC-DRILL-01',
        status: 'Active',
        description: `Cost Center automatically generated from Contract ${contract.contractNumber}`
      };
      this.costCenters.update(list => [...list, newCC]);
      
      this.auditService.log({
        user: 'System',
        role: 'Super Admin',
        module: 'Finance',
        entityName: 'Cost Center',
        entityId: ccCode,
        action: 'Create',
        oldValue: '',
        newValue: JSON.stringify(newCC),
        details: `Cost Center ${ccCode} automatically created from Contract ${contract.contractNumber}`
      });
    }

    // 2. Project Record
    const existsProj = this.projects().some(p => p.code === projectCode);
    if (!existsProj) {
      const newProj: Project = {
        code: projectCode,
        name: projectName,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        customer: contract.clientName || 'Unknown',
        contractValue: contract.value,
        consumedValue: 0,
        remainingValue: contract.value,
        progressPercent: 0,
        status: 'Active',
        startDate: contract.startDate,
        endDate: contract.endDate,
        country: contract.country || 'USA',
        region: contract.region || 'Gulf of Mexico',
        siteName: contract.siteName || 'Block-A42',
        gpsCoordinates: contract.gpsCoordinates || '0.0, 0.0',
        costCenterCode: ccCode,
        preferredWarehouse: contract.preferredWarehouse || 'Warehouse A',
        nearestWarehouse: contract.nearestWarehouse || 'Warehouse A',
        distanceKm: contract.distanceKm || 100,
        estimatedTransportationCost: contract.estimatedTransportationCost || 5000,
        // Currency snapshot from contract
        contractValueUSD: contract.value,
        contractValueEGP: contract.contractValueEGP,
        exchangeRateUSDtoEGP: contract.exchangeRateUSDtoEGP,
        rateSnapshotDate: contract.rateSnapshotDate
      };
      
      this.projects.update(list => [...list, newProj]);

      // Update Contract to link it
      this.updateContract(contractId, { 
        projectCode, 
        costCenterCode: ccCode,
        customer: contract.clientName,
        projectName
      });

      this.auditService.log({
        user: 'System',
        role: 'Super Admin',
        module: 'Operations',
        entityName: 'Project',
        entityId: projectCode,
        action: 'Create',
        oldValue: '',
        newValue: JSON.stringify(newProj),
        details: 'Project automatically generated from Contract'
      });
    }
    this.saveState();
  }

  rejectContract(contractId: string, comments?: string) {
    const old = this.contracts().find(c => c.id === contractId);
    if (!old) return;

    this.updateContract(contractId, { status: 'Suspended' });

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Procurement',
      entityName: 'Contract',
      entityId: old.contractNumber,
      action: 'Reject',
      oldValue: old.status,
      newValue: 'Suspended',
      details: `Suspended/Rejected contract ${old.contractNumber}. Comments: ${comments || 'None'}`
    });
  }

  // --- DAR MUTATORS ---
  createDAR(dar: Omit<DAR, 'id' | 'darNumber' | 'status' | 'approvalWorkflow'>) {
    const list = this.dars();
    const newNum = `DAR-${dar.reportDate}-${list.length + 1}`;
    const newDar: DAR = {
      ...dar,
      id: `dar${list.length + 1}`,
      darNumber: newNum,
      status: 'Draft',
      approvalWorkflow: [
        { role: 'Operations Manager', approverName: '', status: 'Pending' }
      ]
    };

    this.dars.update(val => [...val, newDar]);
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Daily Activity Report',
      entityId: newDar.darNumber,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newDar),
      details: `Created Daily Activity Report ${newDar.darNumber} for ${newDar.rigName}.`
    });

    return newDar;
  }

  updateDAR(darId: string, updated: Partial<DAR>) {
    const old = this.dars().find(d => d.id === darId);
    if (!old) return;

    this.dars.update(list =>
      list.map(d => d.id === darId ? { ...d, ...updated } : d)
    );
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Daily Activity Report',
      entityId: old.darNumber,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.dars().find(d => d.id === darId)),
      details: `Updated DAR ${old.darNumber} metrics.`
    });
  }

  submitDAR(darId: string) {
    const old = this.dars().find(d => d.id === darId);
    if (!old) return;

    this.updateDAR(darId, { 
      status: 'Submitted',
      submittedDate: new Date().toISOString().split('T')[0]
    });

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Daily Activity Report',
      entityId: old.darNumber,
      action: 'Status Change',
      oldValue: 'Draft',
      newValue: 'Submitted',
      details: `Submitted DAR ${old.darNumber} for management approval.`
    });
  }

  approveDAR(darId: string, approverName: string, comments?: string) {
    const old = this.dars().find(d => d.id === darId);
    if (!old) return;

    const newWorkflow: ApprovalStep[] = [
      { role: 'Operations Manager', approverName, status: 'Approved', actionDate: new Date().toISOString().split('T')[0], comments }
    ];

    this.updateDAR(darId, { 
      status: 'Approved',
      approvalWorkflow: newWorkflow
    });

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Daily Activity Report',
      entityId: old.darNumber,
      action: 'Approve',
      oldValue: 'Submitted',
      newValue: 'Approved',
      details: `Approved DAR ${old.darNumber}. Comments: ${comments || 'None'}`
    });
  }

  rejectDAR(darId: string, approverName: string, comments?: string) {
    const old = this.dars().find(d => d.id === darId);
    if (!old) return;

    const newWorkflow: ApprovalStep[] = [
      { role: 'Operations Manager', approverName, status: 'Rejected', actionDate: new Date().toISOString().split('T')[0], comments }
    ];

    this.updateDAR(darId, { 
      status: 'Rejected',
      approvalWorkflow: newWorkflow
    });

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Daily Activity Report',
      entityId: old.darNumber,
      action: 'Reject',
      oldValue: 'Submitted',
      newValue: 'Rejected',
      details: `Rejected DAR ${old.darNumber}. Reason: ${comments || 'None'}`
    });
  }

  // --- WCC MUTATORS ---
  createWCC(wcc: Omit<WCC, 'id' | 'wccNumber' | 'status' | 'createdDate' | 'approvalWorkflow'>) {
    const list = this.wccs();
    const newNum = `WCC-2026-05-0${list.length + 1}`;
    const newWcc: WCC = {
      ...wcc,
      id: `wcc${list.length + 1}`,
      wccNumber: newNum,
      status: 'Draft',
      approvalWorkflow: [
        { role: 'Operations Manager', approverName: '', status: 'Pending' },
        { role: 'General Manager', approverName: '', status: 'Pending' }
      ],
      createdDate: new Date().toISOString().split('T')[0]
    };

    this.wccs.update(val => [...val, newWcc]);
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Work Completion Certificate',
      entityId: newWcc.wccNumber,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newWcc),
      details: `Created Work Completion Certificate ${newWcc.wccNumber} with ${newWcc.darIds.length} DARs for ${newWcc.clientName}.`
    });

    return newWcc;
  }

  updateWCC(wccId: string, updated: Partial<WCC>) {
    const old = this.wccs().find(w => w.id === wccId);
    if (!old) return;

    this.wccs.update(list =>
      list.map(w => w.id === wccId ? { ...w, ...updated } : w)
    );
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Work Completion Certificate',
      entityId: old.wccNumber,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.wccs().find(w => w.id === wccId)),
      details: `Updated WCC ${old.wccNumber}.`
    });
  }

  approveWCC(wccId: string, role: string, approverName: string, comments?: string) {
    const old = this.wccs().find(w => w.id === wccId);
    if (!old) return;

    const newWorkflow = old.approvalWorkflow.map(step => {
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

    const allApproved = newWorkflow.every(step => step.status === 'Approved');
    const newStatus: WCCStatus = allApproved ? 'Approved' : 'Draft'; // It stays draft until fully approved

    this.updateWCC(wccId, {
      approvalWorkflow: newWorkflow,
      status: newStatus
    });

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Work Completion Certificate',
      entityId: old.wccNumber,
      action: 'Approve',
      oldValue: `Status: ${old.status}`,
      newValue: `Status: ${newStatus}`,
      details: `Approved step [${role}] for WCC ${old.wccNumber}. Total status: ${newStatus}. Comments: ${comments || 'None'}`
    });
  }

  rejectWCC(wccId: string, role: string, approverName: string, comments?: string) {
    const old = this.wccs().find(w => w.id === wccId);
    if (!old) return;

    const newWorkflow = old.approvalWorkflow.map(step => {
      if (step.role === role) {
        return {
          ...step,
          status: 'Rejected' as const,
          approverName,
          actionDate: new Date().toISOString().split('T')[0],
          comments
        };
      }
      return step;
    });

    this.updateWCC(wccId, {
      approvalWorkflow: newWorkflow,
      status: 'Rejected'
    });

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Work Completion Certificate',
      entityId: old.wccNumber,
      action: 'Reject',
      oldValue: `Status: ${old.status}`,
      newValue: 'Rejected',
      details: `WCC ${old.wccNumber} rejected by [${role}] approver. Comments: ${comments || 'None'}`
    });
  }

  // --- INVOICE MUTATORS ---
  createInvoice(inv: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'createdDate' | 'approvalWorkflow' | 'paidAmount' | 'balanceDue'>) {
    const list = this.invoices();
    const newNum = `INV-2026-05-10${list.length + 1}`;
    
    const newInv: Invoice = {
      ...inv,
      id: `inv${list.length + 1}`,
      invoiceNumber: newNum,
      status: 'Draft',
      paidAmount: 0,
      balanceDue: inv.netPayable,
      approvalWorkflow: [
        { role: 'Finance Manager', approverName: '', status: 'Pending' }
      ],
      createdDate: new Date().toISOString().split('T')[0]
    };

    this.invoices.update(val => [...val, newInv]);
    
    // Automatically transition the WCC status to "Invoiced"
    this.updateWCC(inv.wccId, { status: 'Invoiced' });
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'Invoice',
      entityId: newInv.invoiceNumber,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newInv),
      details: `Generated Invoice ${newInv.invoiceNumber} for WCC ${newInv.wccNumber} (Client: ${newInv.clientName}). Net Payable: $${newInv.netPayable}.`
    });

    return newInv;
  }

  updateInvoice(invoiceId: string, updated: Partial<Invoice>) {
    const old = this.invoices().find(i => i.id === invoiceId);
    if (!old) return;

    this.invoices.update(list =>
      list.map(i => i.id === invoiceId ? { ...i, ...updated } : i)
    );
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'Invoice',
      entityId: old.invoiceNumber,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.invoices().find(i => i.id === invoiceId)),
      details: `Updated invoice ${old.invoiceNumber}.`
    });
  }

  approveInvoice(invoiceId: string, approverName: string, comments?: string) {
    const old = this.invoices().find(i => i.id === invoiceId);
    if (!old) return;

    const newWorkflow: ApprovalStep[] = [
      { role: 'Finance Manager', approverName, status: 'Approved', actionDate: new Date().toISOString().split('T')[0], comments }
    ];

    // Mark as Approved and ready to send to client
    this.updateInvoice(invoiceId, {
      status: 'Approved',
      approvalWorkflow: newWorkflow
    });

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'Invoice',
      entityId: old.invoiceNumber,
      action: 'Approve',
      oldValue: 'Draft',
      newValue: 'Approved',
      details: `Finance approved Invoice ${old.invoiceNumber}. Ready to send. Comments: ${comments || 'None'}`
    });
  }

  sendInvoice(invoiceId: string) {
    const old = this.invoices().find(i => i.id === invoiceId);
    if (!old) return;

    this.updateInvoice(invoiceId, { status: 'Sent' });

    // Automatically create a Collection tracking log
    const cols = this.collections();
    const newCol: Collection = {
      id: `col${cols.length + 1}`,
      collectionNumber: `COL-2026-05-0${cols.length + 1}`,
      invoiceId: old.id,
      invoiceNumber: old.invoiceNumber,
      contractId: old.contractId,
      contractNumber: old.contractNumber,
      clientName: old.clientName,
      invoiceAmount: old.netPayable,
      totalCollected: 0,
      outstandingBalance: old.netPayable,
      currency: old.currency,
      status: 'Pending',
      dueDate: old.dueDate,
      payments: [],
      agingDays: 0,
      createdDate: new Date().toISOString().split('T')[0]
    };
    this.collections.update(val => [...val, newCol]);
    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'Invoice',
      entityId: old.invoiceNumber,
      action: 'Status Change',
      oldValue: 'Approved',
      newValue: 'Sent',
      details: `Invoice ${old.invoiceNumber} sent to client ${old.clientName}. Collection tracking COL-2026-05-0${cols.length + 1} initiated.`
    });
  }

  // --- COLLECTION MUTATORS ---
  addCollectionPayment(collectionId: string, payment: Omit<CollectionPayment, 'id'>) {
    const col = this.collections().find(c => c.id === collectionId);
    if (!col) return;

    const paymentId = `pmt_${col.payments.length + 1}`;
    const newPayment: CollectionPayment = {
      ...payment,
      id: paymentId
    };

    const updatedPayments = [...col.payments, newPayment];
    const totalCollected = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = col.invoiceAmount - totalCollected;

    let newStatus: CollectionStatus = 'Pending';
    if (balance <= 0) {
      newStatus = 'Fully Collected';
    } else if (totalCollected > 0) {
      newStatus = 'Partially Collected';
    }

    this.collections.update(list =>
      list.map(c => {
        if (c.id === collectionId) {
          return {
            ...c,
            payments: updatedPayments,
            totalCollected,
            outstandingBalance: balance,
            status: newStatus
          };
        }
        return c;
      })
    );

    // Sync Invoice status as well
    let newInvoiceStatus: InvoiceStatus = 'Sent';
    if (balance <= 0) {
      newInvoiceStatus = 'Paid';
    } else if (totalCollected > 0) {
      newInvoiceStatus = 'Partially Paid';
    }

    this.invoices.update(list =>
      list.map(i => {
        if (i.id === col.invoiceId) {
          return {
            ...i,
            paidAmount: totalCollected,
            balanceDue: balance,
            status: newInvoiceStatus
          };
        }
        return i;
      })
    );

    this.saveState();

    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'Collection Payment',
      entityId: col.collectionNumber,
      action: 'Create',
      oldValue: `Collected: $${col.totalCollected}`,
      newValue: `Collected: $${totalCollected}`,
      details: `Received payment of $${payment.amount} (Ref: ${payment.reference}, Method: ${payment.method}) for collection ${col.collectionNumber}. Outstanding balance: $${balance}.`
    });
  }

  // --- PROJECT CRUD ---
  createProject(project: Project) {
    this.projects.update(list => [...list, project]);
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Project',
      entityId: project.code,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(project),
      details: `Created new project "${project.name}" with code ${project.code}.`
    });
  }

  updateProject(code: string, updated: Partial<Project>) {
    const old = this.projects().find(p => p.code === code);
    if (!old) return;
    this.projects.update(list =>
      list.map(p => p.code === code ? { ...p, ...updated } : p)
    );
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Project',
      entityId: code,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.projects().find(p => p.code === code)),
      details: `Updated project ${code} properties.`
    });
  }

  deleteProject(code: string) {
    const old = this.projects().find(p => p.code === code);
    if (!old) return;
    this.projects.update(list => list.filter(p => p.code !== code));
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'Project',
      entityId: code,
      action: 'Reject',
      oldValue: JSON.stringify(old),
      newValue: '',
      details: `Deleted project ${code} ("${old.name}").`
    });
  }

  // --- COST CENTER CRUD ---
  createCostCenter(cc: CostCenter) {
    this.costCenters.update(list => [...list, cc]);
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'CostCenter',
      entityId: cc.code,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(cc),
      details: `Created new cost center "${cc.name}" (${cc.code}).`
    });
  }

  updateCostCenter(code: string, updated: Partial<CostCenter>) {
    const old = this.costCenters().find(c => c.code === code);
    if (!old) return;
    this.costCenters.update(list =>
      list.map(c => c.code === code ? { ...c, ...updated } : c)
    );
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'CostCenter',
      entityId: code,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.costCenters().find(c => c.code === code)),
      details: `Updated cost center ${code} properties.`
    });
  }

  deleteCostCenter(code: string) {
    const old = this.costCenters().find(c => c.code === code);
    if (!old) return;
    this.costCenters.update(list => list.filter(c => c.code !== code));
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Finance',
      entityName: 'CostCenter',
      entityId: code,
      action: 'Reject',
      oldValue: JSON.stringify(old),
      newValue: '',
      details: `Deleted cost center ${code} ("${old.name}").`
    });
  }

  // --- EQUIPMENT ASSIGNMENT MUTATORS ---
  createEquipmentAssignment(assignment: Omit<EquipmentAssignment, 'id'>) {
    const id = `eqas_${Math.random().toString(36).substr(2, 9)}`;
    const newAss: EquipmentAssignment = { ...assignment, id };
    this.equipmentAssignments.update(val => [...val, newAss]);
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'EquipmentAssignment',
      entityId: id,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newAss),
      details: `Assigned equipment "${assignment.equipmentName}" to project ${assignment.projectCode}.`
    });
    return newAss;
  }

  updateEquipmentAssignment(id: string, updated: Partial<EquipmentAssignment>) {
    const old = this.equipmentAssignments().find(a => a.id === id);
    if (!old) return;
    this.equipmentAssignments.update(list =>
      list.map(a => a.id === id ? { ...a, ...updated } : a)
    );
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'EquipmentAssignment',
      entityId: id,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.equipmentAssignments().find(a => a.id === id)),
      details: `Updated equipment assignment ${id} status/metrics.`
    });
  }

  // --- ASSET ASSIGNMENT MUTATORS ---
  createAssetAssignment(assignment: Omit<AssetAssignment, 'id'>) {
    const id = `as_${Math.random().toString(36).substr(2, 9)}`;
    const newAss: AssetAssignment = { ...assignment, id };
    this.assetAssignments.update(list => [...list, newAss]);
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'AssetAssignment',
      entityId: id,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newAss),
      details: `Assigned asset "${assignment.assetName}" to project ${assignment.projectCode}.`
    });
    return newAss;
  }

  updateAssetAssignment(id: string, updated: Partial<AssetAssignment>) {
    const old = this.assetAssignments().find(a => a.id === id);
    if (!old) return;
    this.assetAssignments.update(list =>
      list.map(a => a.id === id ? { ...a, ...updated } : a)
    );
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'AssetAssignment',
      entityId: id,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.assetAssignments().find(a => a.id === id)),
      details: `Updated asset assignment ${id}.`
    });
  }

  // --- MATERIAL CONSUMPTION MUTATORS ---
  createMaterialConsumption(consumption: Omit<MaterialConsumption, 'id'>) {
    const id = `mc_${Math.random().toString(36).substr(2, 9)}`;
    const newCons: MaterialConsumption = { ...consumption, id };
    this.materialConsumptions.update(list => [...list, newCons]);
    
    // Auto-update Project consumedValue
    const cost = consumption.consumedQuantity * consumption.unitPrice;
    const project = this.projects().find(p => p.code === consumption.projectCode);
    if (project) {
      const newConsumed = (project.consumedValue || 0) + cost;
      this.updateProject(project.code, {
        consumedValue: newConsumed,
        remainingValue: project.contractValue - newConsumed,
        progressPercent: Math.min(100, Math.round((newConsumed / project.contractValue) * 100))
      });
    }

    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'MaterialConsumption',
      entityId: id,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newCons),
      details: `Recorded consumption of ${consumption.consumedQuantity} units of ${consumption.materialName} on project ${consumption.projectCode}.`
    });
    return newCons;
  }

  // --- EQUIPMENT TRANSFER MUTATORS ---
  createEquipmentTransfer(transfer: EquipmentTransfer) {
    this.equipmentTransfers.update(list => [...list, transfer]);
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'EquipmentTransfer',
      entityId: transfer.transferNumber,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(transfer),
      details: `Initiated transfer of "${transfer.equipmentName}" from ${transfer.fromLocation} to ${transfer.toLocation}.`
    });
  }

  updateEquipmentTransfer(transferNumber: string, updated: Partial<EquipmentTransfer>) {
    const old = this.equipmentTransfers().find(t => t.transferNumber === transferNumber);
    if (!old) return;
    this.equipmentTransfers.update(list =>
      list.map(t => t.transferNumber === transferNumber ? { ...t, ...updated } : t)
    );
    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'EquipmentTransfer',
      entityId: transferNumber,
      action: 'Update',
      oldValue: JSON.stringify(old),
      newValue: JSON.stringify(this.equipmentTransfers().find(t => t.transferNumber === transferNumber)),
      details: `Updated transfer ${transferNumber} status.`
    });
  }

  // --- LABOR RECORD MUTATORS ---
  createLaborRecord(labor: Omit<LaborRecord, 'id'>) {
    const id = `lab_${Math.random().toString(36).substr(2, 9)}`;
    const totalCost = (labor.regularHours * labor.hourlyRate) + (labor.overtimeHours * labor.overtimeRate);
    const newLab: LaborRecord = { ...labor, id, totalCost };
    this.laborRecords.update(list => [...list, newLab]);

    // Auto-update Project consumedValue
    const project = this.projects().find(p => p.code === labor.projectCode);
    if (project) {
      const newConsumed = (project.consumedValue || 0) + totalCost;
      this.updateProject(project.code, {
        consumedValue: newConsumed,
        remainingValue: project.contractValue - newConsumed,
        progressPercent: Math.min(100, Math.round((newConsumed / project.contractValue) * 100))
      });
    }

    this.saveState();
    const user = this.authService.currentUser();
    this.auditService.log({
      user: user?.fullName || 'System',
      role: user?.role || 'Super Admin',
      module: 'Operations',
      entityName: 'LaborRecord',
      entityId: id,
      action: 'Create',
      oldValue: '',
      newValue: JSON.stringify(newLab),
      details: `Logged labor hours for ${labor.employeeName} (${labor.role}) on project ${labor.projectCode}.`
    });
    return newLab;
  }
}
