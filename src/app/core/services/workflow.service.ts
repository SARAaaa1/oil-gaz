import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { 
  Contract, DAR, WCC, Invoice, Collection,
  ContractStatus, DARStatus, WCCStatus, InvoiceStatus, CollectionStatus,
  RateSheetItem, ContractMilestone, DARMaterialUsed, WCCLineItem, CollectionPayment, ApprovalStep
} from '../../shared/interfaces/workflow.interface';
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

    if (cachedContracts && cachedDars && cachedWccs && cachedInvoices && cachedCollections) {
      this.contracts.set(JSON.parse(cachedContracts));
      this.dars.set(JSON.parse(cachedDars));
      this.wccs.set(JSON.parse(cachedWccs));
      this.invoices.set(JSON.parse(cachedInvoices));
      this.collections.set(JSON.parse(cachedCollections));
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
  }

  resetAllData() {
    localStorage.removeItem('petroflow_contracts');
    localStorage.removeItem('petroflow_dars');
    localStorage.removeItem('petroflow_wccs');
    localStorage.removeItem('petroflow_invoices');
    localStorage.removeItem('petroflow_collections');
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
      details: 'All contracts, daily activity reports, completion certificates, invoices, and collections have been reset to mock template values.'
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

    this.contracts.set(mockContracts);
    this.dars.set(mockDars);
    this.wccs.set(mockWccs);
    this.invoices.set(mockInvoices);
    this.collections.set(mockCollections);
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
}
