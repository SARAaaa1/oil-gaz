# PetroFlow ERP — Enterprise GAP Analysis
## Part 2 of 3: HSE, Contract Management, CRM, Inventory, Fleet, Documents & Admin

---

## GAP-04: HSE (Health, Safety & Environment)

### Business Purpose
Oil & Gas operations carry fatal risk. Clients (Aramco, ADNOC, EGPC) mandate ISO 45001 / ISO 14001 compliance, zero-tolerance incident reporting, and verifiable Permit-to-Work systems. An HSE gap in the ERP means paper-based processes that cannot be audited, creating legal liability and contract disqualification risk.

### Functional Requirements
1. Incident reporting: near-miss, first-aid, LTI, fatality — with OSHA/RIDDOR classification
2. Safety observations (positive and unsafe acts/conditions)
3. Permit to Work (PTW): Hot Work, Cold Work, Confined Space, Electrical Isolation, Lifting
4. Risk Assessment (RA) library with ALARP sign-off
5. Toolbox Talk records (daily safety briefings) with attendance list
6. Environmental compliance: waste manifests, spill logs, air/water monitoring
7. HSE audit tracking with finding closure workflow
8. Leading/lagging KPI dashboards (LTI Rate, Near-Miss Rate, PTW compliance %)

### User Roles
| Role | Responsibility |
|:---|:---|
| HSE Manager | Policy setup, audit program, KPI review |
| Site HSE Officer | Daily observations, PTW issuance, toolbox talks |
| Site Supervisor | Incident reporting, RA sign-off, PTW authorization |
| Operations Director | KPI review, serious incident escalation |
| Employee | Safety observations, toolbox talk attendance confirmation |

### Screens & UI Pages
1. Incident Report form — multi-step: details → classification → investigation → corrective actions
2. Safety Observation feed — card-based with photo attachments
3. PTW creation wizard — type selection → hazard checklist → isolations → approval chain → active → close-out
4. Risk Assessment register — matrix view (likelihood × severity heat map)
5. Toolbox Talk log — date, topic, attendees with digital sign-off
6. Environmental Log — waste type, quantity, disposal method, manifest number
7. HSE Audit list — findings, corrective actions, due dates, closure status
8. HSE Dashboard — LTI frequency rate, near-miss trend, open findings count

### Database Entities
| Entity | Key Fields |
|:---|:---|
| `Incident` | incidentId, projectCode, siteCode, incidentDate, type (NearMiss/FirstAid/LTI/Fatality), description, injuredPersonId, bodyPart, causeCategory, lostDays, status |
| `IncidentInvestigation` | investigationId, incidentId, investigatorIds, rootCause, correctiveActions, completedDate |
| `SafetyObservation` | obsId, projectCode, reportedBy, observationDate, type (Positive/Unsafe), description, photoRefs, status |
| `PermitToWork` | ptwId, ptwNumber, ptwType, projectCode, siteCode, workDescription, issuedBy, authorizedBy, startDateTime, endDateTime, status, hazardChecklist |
| `RiskAssessment` | raId, projectCode, activityDescription, hazards, likelihoodScore, severityScore, riskLevel, controls, approvedBy |
| `ToolboxTalk` | tbtId, projectCode, siteCode, talkDate, topic, conductedBy, attendeeIds |
| `HseAudit` | auditId, projectCode, auditDate, auditorName, scope, findings, criticalFindings, closureDeadline, status |
| `HseFinding` | findingId, auditId, description, severity, assignedTo, dueDate, closedAt, evidenceRef |

### TypeScript Interfaces
```typescript
export type IncidentType = 'NearMiss' | 'FirstAid' | 'MedicalTreatment' | 'LostTimeInjury' | 'Fatality' | 'PropertyDamage';
export type PTWType = 'HotWork' | 'ColdWork' | 'ConfinedSpace' | 'ElectricalIsolation' | 'Lifting' | 'Excavation';
export type PTWStatus = 'Draft' | 'PendingAuthorization' | 'Active' | 'Suspended' | 'ClosedOut' | 'Cancelled';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Incident {
  incidentId: string;
  projectCode: string;
  siteCode: string;
  incidentDate: string;
  type: IncidentType;
  description: string;
  injuredPersonId?: string;
  lostWorkDays: number;
  causeCategory: string;
  status: 'Reported' | 'UnderInvestigation' | 'Closed';
  correctiveActions: { action: string; assignedTo: string; dueDate: string; completed: boolean }[];
}

export interface PermitToWork {
  ptwId: string;
  ptwNumber: string;
  ptwType: PTWType;
  projectCode: string;
  siteCode: string;
  workDescription: string;
  issuedBy: string;
  authorizedBy?: string;
  startDateTime: string;
  endDateTime: string;
  hazardChecklist: { item: string; confirmed: boolean }[];
  status: PTWStatus;
}

export interface HseKpis {
  projectCode: string;
  period: string;
  manHoursWorked: number;
  ltiCount: number;
  ltiFrequencyRate: number;      // LTIFR = (LTI × 200000) / manhours
  nearMissCount: number;
  firstAidCount: number;
  openFindingsCount: number;
  ptwCompliancePercent: number;
}
```

### NestJS API Endpoints
```
POST   /api/v1/hse/incidents                         — Report incident
PUT    /api/v1/hse/incidents/:id/investigate          — Submit investigation
POST   /api/v1/hse/observations                      — Log safety observation
POST   /api/v1/hse/ptw                               — Create PTW
PUT    /api/v1/hse/ptw/:id/authorize                 — Authorize PTW
PUT    /api/v1/hse/ptw/:id/close                     — Close out PTW
POST   /api/v1/hse/toolbox-talks                     — Log toolbox talk
GET    /api/v1/hse/kpis?projectCode=&period=         — HSE KPI summary
POST   /api/v1/hse/audits                            — Create HSE audit
PUT    /api/v1/hse/audits/:id/findings/:fid/close    — Close finding
```

### Integrations
- Incident with LTI → blocks project from "Active" to auto-status "Suspended" pending investigation
- Open PTW required before any WO of type HotWork/ConfinedSpace can start
- HSE audit critical finding → blocks new equipment allocation until closed

---

## GAP-05: Contract Management — Billing, Variations & Claims

### Business Purpose
Long-term service contracts in Oil & Gas are rarely static. Day-rate contracts, lump-sum EPC contracts, and re-measurable contracts all require change order management, progress billing, retention handling, and claims processing. Without this, revenue leakage is significant.

### Functional Requirements
1. Contract master with billing type (day-rate / lump-sum / re-measurable / unit-rate)
2. Change Order (CO) management: client-initiated and contractor-initiated
3. Variation Orders: scope extension pricing and approval
4. Progress Certificates: monthly/milestone-based billing with client approval
5. Retention management: holdback % on invoices, release on completion/DLP
6. Claims management: EOT (Extension of Time), additional cost claims
7. Contract renewal workflow
8. Contract Closeout: final account settlement, punch list clearance

### User Roles
| Role | Responsibility |
|:---|:---|
| Contracts Manager | Contract master setup, CO approval, claims submission |
| Commercial Director | Variation pricing approval, claims strategy |
| Finance Manager | Progress certificate billing, retention release |
| Legal Counsel | Contract review, claim documentation |
| Customer (Portal) | Progress certificate acknowledgment, CO approval |

### Screens & UI Pages
1. Contract master detail — rates, milestones, payment terms, retention %
2. Change Order register — CO number, scope, value, status
3. Progress Certificate wizard — period, quantities, previous, cumulative, current
4. Retention Ledger — invoiced retention, released, outstanding
5. Claims register — claim type, value, supporting docs, status
6. Contract Closeout form — punch list, final account, DLP calendar

### Database Entities
| Entity | Key Fields |
|:---|:---|
| `Contract` | contractId, customerCode, projectCode, billingType, contractValueUSD, startDate, endDate, retentionPercent, paymentTermsDays, status |
| `ChangeOrder` | coId, contractId, coNumber, type (ClientInitiated/ContractorInitiated), scopeDescription, valueChangeUSD, status, approvedDate |
| `ProgressCertificate` | pcId, contractId, periodStart, periodEnd, grossValueUSD, retentionDeductUSD, previousCertifiedUSD, currentDueUSD, status |
| `RetentionLedger` | retentionId, contractId, invoiceId, withheldUSD, releasedUSD, releaseDate, releaseCondition |
| `ContractClaim` | claimId, contractId, claimType (EOT/AdditionalCost), valueUSD, daysRequested, submissionDate, status |

### TypeScript Interfaces
```typescript
export type BillingType = 'DayRate' | 'LumpSum' | 'ReMeasurable' | 'UnitRate' | 'CostPlus';
export type ContractStatus = 'Draft' | 'UnderReview' | 'Approved' | 'Active' | 'Suspended' | 'Completed' | 'Closed' | 'Disputed';
export type ChangeOrderStatus = 'Submitted' | 'UnderNegotiation' | 'Approved' | 'Rejected' | 'Withdrawn';
export type ProgressCertStatus = 'Draft' | 'Submitted' | 'ClientApproved' | 'Invoiced' | 'Paid';

export interface ProgressCertificate {
  pcId: string;
  contractId: string;
  projectCode: string;
  periodStart: string;
  periodEnd: string;
  grossValueUSD: number;
  retentionDeductionUSD: number;
  previousCertifiedUSD: number;
  currentCertDueUSD: number;
  vatUSD: number;
  totalInvoiceUSD: number;
  status: ProgressCertStatus;
  clientApprovedBy?: string;
  clientApprovedDate?: string;
  linkedARInvoiceId?: string;
}

export interface ChangeOrder {
  coId: string;
  coNumber: string;
  contractId: string;
  type: 'ClientInitiated' | 'ContractorInitiated';
  scopeDescription: string;
  valueChangeUSD: number;
  durationChangeDays: number;
  submittedDate: string;
  status: ChangeOrderStatus;
  approvedDate?: string;
  attachments: string[];
}
```

### NestJS API Endpoints
```
GET    /api/v1/contracts                                — Contract list
POST   /api/v1/contracts/:id/change-orders              — Submit CO
PUT    /api/v1/contracts/:id/change-orders/:coId/approve
POST   /api/v1/contracts/:id/progress-certificates      — Create PC
PUT    /api/v1/contracts/:id/progress-certificates/:pcId/submit
POST   /api/v1/contracts/:id/claims                     — Submit claim
GET    /api/v1/contracts/:id/retention-ledger            — Retention balance
```

---

## GAP-06: Inventory Enhancements

### Business Purpose
The existing MIV/MRV system handles transaction movement, but lacks the planning and counting controls required for warehouse management at remote field sites where stock accuracy is critical and procurement lead times are long.

### Functional Requirements
1. Cycle counting — rolling partial counts by warehouse zone
2. Full physical stock count — annual freeze and recount
3. Inventory adjustments with reason codes and dual approval
4. Min/Max replenishment planning with auto-PR generation
5. Reorder point (ROP) and Economic Order Quantity (EOQ) policies
6. Batch and Lot tracking for chemicals, consumables, drill bits
7. Expiry date tracking with FEFO (First Expired First Out) picking
8. Shelf-life alerts (30/60/90 days to expiry)

### Database Entities & TypeScript Interfaces
```typescript
export type CountStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Approved';
export type AdjustmentReason = 'CycleCount' | 'Damage' | 'Expiry' | 'SystemError' | 'SupplierError';

export interface CycleCountPlan {
  countId: string;
  warehouseId: string;
  zones: string[];
  scheduledDate: string;
  countedBy: string;
  status: CountStatus;
  lines: CycleCountLine[];
}

export interface CycleCountLine {
  itemCode: string;
  systemQty: number;
  physicalQty: number;
  varianceQty: number;
  varianceValueUSD: number;
  adjustmentApproved: boolean;
}

export interface InventoryAdjustment {
  adjustmentId: string;
  warehouseId: string;
  adjustmentDate: string;
  reason: AdjustmentReason;
  approvedBy: string;
  lines: { itemCode: string; adjustmentQty: number; unitCostUSD: number; totalImpactUSD: number }[];
  glJeNumber?: string;
}

export interface InventoryBatch {
  batchId: string;
  itemCode: string;
  lotNumber: string;
  expiryDate?: string;
  manufactureDate?: string;
  quantityOnHand: number;
  warehouseId: string;
  isFEFO: boolean;
}

export interface ReplenishmentPolicy {
  itemCode: string;
  warehouseId: string;
  minStockQty: number;
  maxStockQty: number;
  reorderPointQty: number;
  eoqQty: number;
  leadTimeDays: number;
  autoRaisePR: boolean;
}
```

---

## GAP-07: Fleet Management

### Business Purpose
Field operations rely on a fleet of light vehicles, heavy transport, and specialized rigging trucks. Without fleet management, fuel costs are uncontrolled, vehicle availability is unknown, and maintenance is reactive.

### Functional Requirements
1. Vehicle master registry (VIN, type, capacity, registration, insurance expiry)
2. Driver assignment per trip / per project
3. Trip logs: origin, destination, distance, fuel consumed
4. GPS integration (webhook/API from tracking device)
5. Fuel consumption tracking vs benchmarks
6. Fleet maintenance work orders (linked to GAP-03 Maintenance module)
7. Insurance and registration expiry alerts

### Database Entities & TypeScript Interfaces
```typescript
export interface Vehicle {
  vehicleId: string;
  plateNumber: string;
  vin: string;
  type: 'LightVehicle' | 'HeavyTransport' | 'SpecializedRig' | 'Bus';
  makeModel: string;
  year: number;
  assignedProjectCode?: string;
  assignedDriverId?: string;
  currentOdometerKm: number;
  insuranceExpiryDate: string;
  registrationExpiryDate: string;
  status: 'Available' | 'InUse' | 'Maintenance' | 'Decommissioned';
}

export interface TripLog {
  tripId: string;
  vehicleId: string;
  driverId: string;
  projectCode: string;
  tripDate: string;
  originLocation: string;
  destinationLocation: string;
  distanceKm: number;
  fuelConsumedLiters: number;
  fuelCostUSD: number;
  purpose: string;
}

export interface GpsPing {
  vehicleId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  engineOn: boolean;
}
```

---

## GAP-08: Document Management

### Business Purpose
Oil & Gas contracts generate thousands of documents (drawings, procedures, certificates, RFIs, permits). Without a structured DMS, critical documents are lost, versions are mixed, and audit trails are missing.

### Functional Requirements
1. Hierarchical folder structure tied to project / site / module
2. Version control with major/minor versioning
3. Approval routing for controlled documents
4. Electronic signature integration (DocuSign compatible)
5. Document expiry tracking (certificates, procedures)
6. Full-text search across document metadata

### TypeScript Interfaces
```typescript
export type DocumentStatus = 'Draft' | 'UnderReview' | 'Approved' | 'Superseded' | 'Obsolete';

export interface Document {
  documentId: string;
  documentCode: string;        // DOC-PRJ-XXX-001
  title: string;
  category: string;
  projectCode?: string;
  version: string;             // e.g., 'Rev 3'
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  fileRef: string;             // S3 / blob URL
  expiryDate?: string;
  approvalChain: { role: string; approver: string; status: string; actionDate?: string }[];
  tags: string[];
}
```

---

## GAP-09: Administration — RBAC, Audit & Master Data

### Functional Requirements
1. User management with SSO integration (Azure AD / Okta)
2. Role-Based Access Control: granular permissions per module, action (Create/Read/Update/Delete/Approve), and data scope (own / team / company)
3. Approval Matrix Engine: configurable approval thresholds per transaction type and amount
4. System-wide notification center with email/SMS/in-app delivery
5. Master Data Management: unit of measure, item categories, account codes, document types
6. Full system audit log (every API mutation with before/after values)

### TypeScript Interfaces
```typescript
export interface Permission {
  permissionId: string;
  module: string;
  action: 'Create' | 'Read' | 'Update' | 'Delete' | 'Approve' | 'Post';
  scope: 'Own' | 'Team' | 'Project' | 'Company';
}

export interface Role {
  roleId: string;
  roleName: string;
  permissions: Permission[];
}

export interface ApprovalRule {
  ruleId: string;
  transactionType: string;      // e.g., 'PurchaseOrder', 'PRRequest', 'Payroll'
  thresholdUSD: number;
  requiredApproverRole: string;
  sequenceOrder: number;
  isMandatory: boolean;
}

export interface AuditLog {
  auditId: string;
  timestamp: string;
  userId: string;
  ipAddress: string;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeSnapshot: Record<string, unknown>;
  afterSnapshot: Record<string, unknown>;
}

export interface SystemNotification {
  notificationId: string;
  recipientUserId: string;
  channel: 'InApp' | 'Email' | 'SMS';
  title: string;
  body: string;
  relatedModule: string;
  relatedDocId: string;
  isRead: boolean;
  sentAt: string;
}
```

### Permissions Matrix (Critical Rows)
| Module | Requisitioner | Dept Manager | Procurement Mgr | Finance Mgr | CFO | Site Supervisor | HSE Officer |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Create PR | ✅ | ✅ | ✅ | — | — | ✅ | — |
| Approve PR | — | ✅ | ✅ | — | — | — | — |
| Create PO | — | — | ✅ | — | — | — | — |
| Approve PO >$10k | — | — | — | ✅ | — | — | — |
| Approve PO >$50k | — | — | — | — | ✅ | — | — |
| Post Journal Entry | — | — | — | ✅ | — | — | — |
| Issue PTW | — | — | — | — | — | ✅ | ✅ |
| Report Incident | — | — | — | — | — | ✅ | ✅ |
| Approve Payroll | — | — | — | ✅ | ✅ | — | — |
| Create Work Order | — | — | — | — | — | ✅ | — |
