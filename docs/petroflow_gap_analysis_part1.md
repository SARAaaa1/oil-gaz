# PetroFlow ERP — Enterprise GAP Analysis
## Part 1 of 3: Financial Management, HR & Workforce, Maintenance & Asset Reliability

> **Scope**: This document identifies everything missing from PetroFlow relative to production-grade Oil & Gas ERP standards. Existing modules (Procurement, Projects, Cost Centers, Sites, Equipment, MIV/MRV, Mobilization, Project 360) are treated as a confirmed baseline and are NOT redefined here.

---

## GAP-01: Financial Management — General Ledger & Accounts

### Business Purpose
Oil & Gas service companies must produce IFRS-compliant financial statements, support multi-entity consolidation, handle USD/EGP dual-currency books, and produce auditable GL postings for every operational transaction (PO, MIV, GRN, maintenance work order, payroll).

### Functional Requirements
1. Chart of Accounts (CoA) with 5-level hierarchy (Class → Group → Account → Sub-Account → Cost Element)
2. Double-entry Journal Entries auto-generated from every source transaction
3. Accounting periods (monthly close, year-end close, re-opening control)
4. Multi-currency: transaction currency, functional currency (EGP), reporting currency (USD)
5. Intercompany eliminations for multi-entity groups
6. Accounts Payable (AP) sub-ledger linked to vendor invoices and POs
7. Accounts Receivable (AR) sub-ledger linked to contract billing and progress certificates
8. Cash & Bank module with bank statement import and reconciliation
9. Fixed Assets register with depreciation schedules (SL, DB, UOP)
10. Revenue recognition per IFRS 15 (percentage of completion for long-term contracts)
11. Tax management: VAT, WHT, stamp duty; per-country tax codes
12. Period-end accruals and prepayments
13. Budget vs Actual variance reporting at GL level

### User Roles
| Role | Responsibility |
|:---|:---|
| Chief Accountant | Chart of Accounts setup, period close, financial statements |
| AP Accountant | Vendor invoice posting, 3-way match, payment runs |
| AR Accountant | Customer invoicing, receipt posting, aging reports |
| Treasury Officer | Bank reconciliation, cash position, FX deals |
| Tax Accountant | VAT returns, WHT certificates, tax ledger |
| CFO | Dashboard approvals, financial KPIs |
| External Auditor | Read-only GL access, audit trail reports |

### Screens & UI Pages
1. Chart of Accounts master — tree view with inline edit
2. Journal Entry form — debit/credit lines, period, attachments
3. GL Inquiry — filterable ledger drill-down (account, period, project, CC)
4. AP Invoice Register — linked to POs, 3-way match indicator
5. AP Aging Report — 0–30 / 31–60 / 61–90 / 90+ days buckets
6. AP Payment Run — batch selection, bank file generation
7. AR Invoice creation — from contract billing milestone
8. AR Aging Report
9. Bank Accounts list + Bank Statement import
10. Bank Reconciliation worksheet — matching engine
11. Fixed Assets register + depreciation schedule viewer
12. Tax Returns dashboard — VAT summary, WHT certificates
13. Period Close Checklist — sequential step approvals
14. Financial Statements — BS, P&L, CF (generated on demand)

### Database Entities
| Entity | Key Fields |
|:---|:---|
| `ChartOfAccount` | accountCode, accountName, level, type (Asset/Liability/Equity/Revenue/Expense), parentAccountCode, isActive |
| `AccountingPeriod` | periodId, year, month, status (Open/Closed/Locked), closedBy, closedAt |
| `JournalEntry` | jeNumber, periodId, entryDate, currency, exchangeRate, sourceDocType, sourceDocNumber, projectCode, costCenterCode, postedBy, isReversed |
| `JournalLine` | jeNumber (FK), lineNumber, accountCode, debitUSD, creditUSD, debitEGP, creditEGP, description |
| `APInvoice` | invoiceId, vendorCode, poNumber, grnNumber, invoiceDate, dueDate, currency, amountUSD, vatUSD, totalUSD, status, matchStatus |
| `APPayment` | paymentId, invoiceId, paymentDate, bankAccountId, amountUSD, reference |
| `ARInvoice` | invoiceId, customerCode, contractId, projectCode, milestoneId, invoiceDate, dueDate, amountUSD, vatUSD, totalUSD, status |
| `ARReceipt` | receiptId, invoiceId, receiptDate, bankAccountId, amountUSD |
| `BankAccount` | bankAccountId, bankName, accountNumber, currency, currentBalance |
| `BankStatement` | statementId, bankAccountId, statementDate, openingBalance, closingBalance |
| `BankStatementLine` | lineId, statementId, transactionDate, description, debitUSD, creditUSD, matchStatus, matchedDocId |
| `FixedAsset` | assetId, assetCode, assetName, categoryCode, purchaseDate, cost, accumulatedDepreciation, netBookValue, depreciationMethod, usefulLifeYears, serialNumber |
| `DepreciationSchedule` | scheduleId, assetId, period, depreciationCharge, nbv |
| `TaxCode` | taxCodeId, taxType (VAT/WHT), rate, glAccountCode, countryCode |
| `TaxTransaction` | txId, taxCodeId, sourceDocId, taxableAmountUSD, taxAmountUSD, period, status |

### TypeScript Interfaces
```typescript
export type JEStatus = 'Draft' | 'Posted' | 'Reversed';
export type APInvoiceStatus = 'Received' | 'Matched' | 'Approved' | 'Paid' | 'Disputed';
export type ARInvoiceStatus = 'Draft' | 'Sent' | 'PartiallyPaid' | 'Paid' | 'Overdue';
export type DepreciationMethod = 'StraightLine' | 'DecliningBalance' | 'UnitsOfProduction';

export interface JournalEntry {
  jeNumber: string;
  periodId: string;
  entryDate: string;
  sourceDocType: 'PO' | 'GRN' | 'MIV' | 'Invoice' | 'Manual' | 'Payroll' | 'Depreciation';
  sourceDocNumber: string;
  projectCode?: string;
  costCenterCode?: string;
  currency: 'USD' | 'EGP';
  exchangeRate: number;
  lines: JournalLine[];
  status: JEStatus;
  postedBy: string;
  description: string;
}

export interface JournalLine {
  lineNumber: number;
  accountCode: string;
  debitUSD: number;
  creditUSD: number;
  debitEGP: number;
  creditEGP: number;
  description: string;
}

export interface APInvoice {
  invoiceId: string;
  vendorCode: string;
  poNumber?: string;
  grnNumber?: string;
  invoiceDate: string;
  dueDate: string;
  currency: 'USD' | 'EGP';
  exchangeRate: number;
  subtotalUSD: number;
  vatUSD: number;
  whtUSD: number;
  totalUSD: number;
  status: APInvoiceStatus;
  matchStatus: '2-Way' | '3-Way' | 'Unmatched';
  projectCode: string;
  costCenterCode: string;
}

export interface FixedAsset {
  assetId: string;
  assetCode: string;
  assetName: string;
  categoryCode: string;
  serialNumber?: string;
  purchaseDate: string;
  purchaseCostUSD: number;
  accumulatedDepreciationUSD: number;
  netBookValueUSD: number;
  depreciationMethod: DepreciationMethod;
  usefulLifeYears: number;
  salvageValueUSD: number;
  isActive: boolean;
  linkedProjectCode?: string;
}
```

### NestJS API Endpoints
```
POST   /api/v1/finance/journal-entries          — Post JE
GET    /api/v1/finance/journal-entries          — Query with filters
GET    /api/v1/finance/gl-inquiry               — Ledger drill-down
POST   /api/v1/finance/ap/invoices              — Register AP invoice
PUT    /api/v1/finance/ap/invoices/:id/match    — Trigger 3-way match
POST   /api/v1/finance/ap/payment-runs          — Execute payment batch
POST   /api/v1/finance/ar/invoices              — Create AR invoice
POST   /api/v1/finance/ar/receipts              — Post customer receipt
POST   /api/v1/finance/bank/reconcile           — Submit reconciliation
GET    /api/v1/finance/fixed-assets             — Asset register
POST   /api/v1/finance/fixed-assets/:id/depreciate — Run depreciation
GET    /api/v1/finance/tax/vat-return           — Generate VAT return
POST   /api/v1/finance/periods/:id/close        — Close accounting period
```

### Workflow States
- **AP Invoice**: Received → 3-Way Match → Finance Approval → Payment Queue → Paid
- **AR Invoice**: Draft → Sent → Acknowledged → Partially Paid → Paid / Overdue
- **Journal Entry**: Draft → Reviewed → Posted → (Reversed)
- **Period Close**: Open → Pending Close → Finance Manager Approval → Closed → Locked

### Integrations with Existing Modules
| Source Event | GL Posting Generated |
|:---|:---|
| PO Approved | Dr: Commitment Ledger Cr: Budget Reserve |
| GRN Posted | Dr: Inventory / Asset Dr: VAT Receivable Cr: AP Accrual |
| MIV Issued | Dr: Project Expense Cr: Inventory |
| Equipment Allocation | Dr: Project Equipment Cost Cr: Internal Asset Revenue |
| Payroll Run | Dr: Salary Expense Cr: Payroll Payable |
| Depreciation Run | Dr: Depreciation Expense Cr: Accumulated Depreciation |

### Dashboard KPIs
- Cash Position (by bank account)
- AP Aging total (overdue > 30 days alert)
- AR Aging total (overdue > 30 days alert)
- Budget vs Actual variance % (per project, per CC)
- Revenue recognized this month vs plan
- Outstanding VAT payable

### Audit Requirements
All JEs must record: posted timestamp, user, IP address, source document chain. No posted JE may be deleted — only reversed with a counter-entry. Period close must log approver and timestamp.

---

## GAP-02: HR & Workforce Management

### Business Purpose
Oil & Gas field operations require strict crew rotation scheduling, HSE certification enforcement, camp accommodation assignment, payroll calculation with field allowances, and government-mandated labor compliance. Without this module, project planning is decoupled from actual workforce availability.

### Functional Requirements
1. Employee master with employment type (staff/contractor/expat), grade, department, project assignment
2. Crew rotation planning: A-crew / B-crew / C-crew scheduling with shift patterns
3. Payroll engine: basic salary, field allowances (rig allowance, offshore premium), overtime, deductions
4. Leave management: annual, sick, emergency, Hajj, unpaid — with accrual and balance tracking
5. Certification & competency tracking: expiry alerts, role prerequisites
6. Training records: courses, scores, certificates, instructor logs
7. Time & attendance: daily attendance logs, linked to operational timesheets
8. Camp accommodation: bed assignment, catering head count, logistics planning
9. Overtime approval workflow
10. Government compliance reports (labor authority, insurance, GOSI)

### User Roles
| Role | Responsibility |
|:---|:---|
| HR Manager | Employee master, policy setup, payroll authorization |
| Crew Coordinator | Rotation scheduling, accommodation assignment |
| Site Supervisor | Attendance logging, timesheet approval |
| Payroll Accountant | Payroll run, GL posting, bank file |
| Training Officer | Course management, certification tracking |
| Employee (Self-Service) | Leave requests, payslip view, training enrollment |

### Screens & UI Pages
1. Employee Master — profile, grade, documents, certifications
2. Crew Rotation Planner — Gantt/calendar view of A/B/C crew cycles
3. Attendance Board — daily check-in/out per project site
4. Leave Request form + approval dashboard
5. Payroll Run console — period selection, calculation preview, GL post
6. Payslip viewer (employee self-service)
7. Certification Registry — expiry heatmap, bulk upload
8. Training Calendar — enrollment, attendance, scores
9. Camp Accommodation Map — bed/room assignment grid
10. Overtime Approval queue

### Database Entities
| Entity | Key Fields |
|:---|:---|
| `Employee` | employeeId, name, nationalId, employmentType, gradeCode, departmentCode, projectCode, siteCode, hireDate, status |
| `CrewRotation` | rotationId, employeeId, projectCode, crewGroup (A/B/C), startDate, endDate, shiftPattern |
| `LeaveRequest` | leaveId, employeeId, leaveType, startDate, endDate, days, status, approvedBy |
| `LeaveBalance` | employeeId, leaveType, year, entitled, taken, remaining |
| `PayrollRun` | runId, periodYear, periodMonth, status, totalSalaryUSD, totalAllowanceUSD, totalDeductionUSD, netPayUSD, postedAt |
| `PayrollLine` | runId, employeeId, basicSalary, fieldAllowance, overtimePay, deductions, netPay, bankReference |
| `Certification` | certId, employeeId, certType, issuer, issueDate, expiryDate, documentRef, status |
| `TrainingRecord` | trainingId, employeeId, courseCode, courseName, completionDate, score, passed |
| `AttendanceLog` | logId, employeeId, siteCode, logDate, checkIn, checkOut, hoursWorked, approvedBy |
| `CampRoom` | roomId, siteCode, capacity, currentOccupants |
| `CampAssignment` | assignmentId, employeeId, roomId, checkInDate, checkOutDate |

### TypeScript Interfaces
```typescript
export type EmploymentType = 'Permanent' | 'Contractor' | 'Expat' | 'Casual';
export type LeaveType = 'Annual' | 'Sick' | 'Emergency' | 'Hajj' | 'Unpaid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface Employee {
  employeeId: string;
  fullName: string;
  nationalId: string;
  employmentType: EmploymentType;
  gradeCode: string;
  departmentCode: string;
  projectCode?: string;
  siteCode?: string;
  hireDate: string;
  basicSalaryUSD: number;
  fieldAllowanceUSD: number;
  status: 'Active' | 'OnLeave' | 'Terminated';
  certifications: string[];        // certId refs
  emergencyContact: { name: string; phone: string; relation: string };
}

export interface CrewRotation {
  rotationId: string;
  employeeId: string;
  projectCode: string;
  crewGroup: 'A' | 'B' | 'C';
  startDate: string;
  endDate: string;
  onDutyDays: number;
  offDutyDays: number;
}

export interface PayrollRun {
  runId: string;
  periodYear: number;
  periodMonth: number;
  lines: PayrollLine[];
  totalNetPayUSD: number;
  status: 'Draft' | 'Approved' | 'Posted' | 'BankFileSent';
  glJeNumber?: string;
}

export interface PayrollLine {
  employeeId: string;
  basicSalaryUSD: number;
  fieldAllowanceUSD: number;
  overtimePayUSD: number;
  deductionsUSD: number;
  netPayUSD: number;
}

export interface Certification {
  certId: string;
  employeeId: string;
  certType: string;             // e.g., 'H2S Awareness', 'BOSIET', 'Rigging'
  issuer: string;
  issueDate: string;
  expiryDate: string;
  isExpired: boolean;
  documentRef: string;
}
```

### NestJS API Endpoints
```
GET    /api/v1/hr/employees                        — Employee list with filters
POST   /api/v1/hr/employees                        — Create employee
PUT    /api/v1/hr/employees/:id                    — Update employee
GET    /api/v1/hr/rotations?projectCode=           — Crew rotation plan
POST   /api/v1/hr/rotations                        — Schedule rotation
POST   /api/v1/hr/leave/requests                   — Submit leave request
PUT    /api/v1/hr/leave/requests/:id/approve        — Approve/reject
GET    /api/v1/hr/certifications/expiring?days=30  — Expiry alert list
POST   /api/v1/hr/payroll/runs                     — Initiate payroll run
POST   /api/v1/hr/payroll/runs/:id/post            — Post payroll to GL
GET    /api/v1/hr/attendance?siteCode=&date=       — Daily attendance
POST   /api/v1/hr/camp/assignments                 — Assign accommodation
```

### Workflow States
- **Leave**: Draft → Supervisor Approval → HR Confirmation → Active Leave → Returned
- **Payroll Run**: Draft → Finance Review → CFO Approval → Posted → Bank File Sent
- **Overtime**: Requested → Site Supervisor Approve → HR Record → Payroll Include

### Dashboard KPIs
- Headcount by project / site
- Crew rotation compliance % (on-time mobilization)
- Certifications expiring in 30 days
- Attendance rate % (by site)
- Overtime cost MTD (vs budget)
- Leave liability accrual (USD)

### Audit Requirements
All payroll changes after approval must create an immutable audit record. Certification uploads must preserve original file hash. Leave balance adjustments require dual-approval.

---

## GAP-03: Maintenance & Asset Reliability

### Business Purpose
Drilling equipment (BOPs, mud pumps, top drives) requires rigorous Preventive Maintenance (PM) scheduling to meet client SLAs, insurance requirements, and regulatory certification. Unplanned breakdowns directly reduce project revenue and damage client relationships.

### Functional Requirements
1. Equipment registry linked to serialized assets (existing `SerializedItem`)
2. PM plans: frequency-based (calendar or meter-based running hours)
3. Work Order management: PM, corrective, breakdown
4. Spare parts catalog linked to Work Orders
5. Technician assignment and labor hours
6. Work order cost accumulation → PCTL posting
7. Reliability KPIs: MTBF, MTTR, OEE
8. Maintenance history report per serial number
9. Asset lifecycle management: commissioning → active → overhaul → decommission

### User Roles
| Role | Responsibility |
|:---|:---|
| Maintenance Manager | PM plan creation, WO approval, KPI review |
| Maintenance Technician | WO execution, parts consumption, time logging |
| Warehouse Keeper | Spare parts issue to WO, stock reservation |
| Asset Manager | Lifecycle decisions, decommission approval |
| Project Manager | WO impact on project cost & downtime visibility |

### Screens & UI Pages
1. Equipment Registry — linked to SerializedItem, with PM plan status
2. PM Calendar — Gantt of upcoming PM tasks per asset
3. Work Order list — filter by type, priority, status, asset
4. Work Order detail — task checklist, parts list, labor log
5. Spare Parts Catalog — BOM-style linked to equipment class
6. Breakdown Report form — instant WO creation on failure
7. Maintenance Cost Report — by asset, by project, by period
8. Reliability Dashboard — MTBF, MTTR, availability % per asset class

### Database Entities
| Entity | Key Fields |
|:---|:---|
| `MaintenancePlan` | planId, serialNumber, planType (Calendar/Meter), frequencyDays, frequencyHours, lastExecutedDate, nextDueDate, isActive |
| `WorkOrder` | woId, woNumber, woType (PM/Corrective/Breakdown), serialNumber, projectCode, costCenterCode, priority, assignedTechnicianId, scheduledDate, completedDate, status, totalCostUSD |
| `WorkOrderTask` | taskId, woId, taskDescription, isCompleted, completedAt, technicianId |
| `WorkOrderPart` | partId, woId, itemCode, quantityRequired, quantityIssued, unitCostUSD, totalCostUSD |
| `WorkOrderLabor` | laborId, woId, technicianId, hoursWorked, hourlyRateUSD, totalCostUSD |
| `BreakdownReport` | reportId, serialNumber, projectCode, reportedBy, reportedAt, symptomDescription, rootCause, correctiveAction |
| `SparePart` | partCode, partName, equipmentClass, compatibleModels, minStock, currentStock, warehouseId |

### TypeScript Interfaces
```typescript
export type WorkOrderType = 'PM' | 'Corrective' | 'Breakdown' | 'Overhaul';
export type WorkOrderStatus = 'Draft' | 'Scheduled' | 'InProgress' | 'PendingParts' | 'Completed' | 'Cancelled';
export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface WorkOrder {
  woId: string;
  woNumber: string;             // WO-YYYY-XXXXX
  woType: WorkOrderType;
  serialNumber: string;
  projectCode: string;
  siteCode: string;
  costCenterCode: string;
  priority: WorkOrderPriority;
  assignedTechnicianId: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  tasks: WorkOrderTask[];
  parts: WorkOrderPart[];
  laborLogs: WorkOrderLabor[];
  totalPartsUSD: number;
  totalLaborUSD: number;
  totalCostUSD: number;
  status: WorkOrderStatus;
  pctlTransactionId?: string;   // Link to ProjectCostTransaction after posting
}

export interface MaintenancePlan {
  planId: string;
  serialNumber: string;
  planType: 'Calendar' | 'Meter';
  frequencyDays?: number;
  frequencyHours?: number;
  lastExecutedDate?: string;
  lastExecutedHours?: number;
  nextDueDateEstimate: string;
  isActive: boolean;
  taskTemplates: { description: string; estimatedMinutes: number }[];
}

export interface ReliabilityMetrics {
  serialNumber: string;
  projectCode: string;
  periodStart: string;
  periodEnd: string;
  totalAvailableHours: number;
  breakdownCount: number;
  mtbfHours: number;            // Mean Time Between Failures
  mttrHours: number;            // Mean Time To Repair
  availabilityPercent: number;
  oeePercent: number;
}
```

### NestJS API Endpoints
```
GET    /api/v1/maintenance/plans?serialNumber=      — PM plans for asset
POST   /api/v1/maintenance/plans                    — Create PM plan
GET    /api/v1/maintenance/work-orders              — WO list with filters
POST   /api/v1/maintenance/work-orders              — Create WO (PM or breakdown)
PUT    /api/v1/maintenance/work-orders/:id/start    — Technician starts WO
PUT    /api/v1/maintenance/work-orders/:id/complete — Complete WO + post costs
POST   /api/v1/maintenance/breakdowns               — Report breakdown
GET    /api/v1/maintenance/reliability?serialNumber= — Reliability KPIs
GET    /api/v1/maintenance/calendar?month=          — Upcoming PM calendar
```

### Workflow States
- **PM Work Order**: Scheduled → Technician Assigned → In Progress → Pending Parts → Completed → Costs Posted
- **Breakdown WO**: Reported → Emergency Dispatch → In Progress → Root Cause Analysis → Completed
- **PM Plan Override**: Active → Suspended (project suspended) → Resumed

### Integrations with Existing Modules
- WO completion → auto-posts `MAINTENANCE_WO` entry to PCTL
- WO parts issue → creates MIV against equipment serial + project CC
- WO completion → updates `EquipmentUtilization.maintenanceHours`
- PM due date based on `EquipmentUtilization.runningHours` accumulated total
- Asset with open breakdown WO → blocks new `EquipmentAllocation`

### Dashboard KPIs
- Overdue PM tasks count (by site)
- Active breakdown WOs count
- MTBF trend (30/60/90 days)
- Maintenance cost % of project budget
- Spare parts stockout risk (items below minimum)
- WO completion rate (on-time %)
