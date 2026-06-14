# PetroFlow ERP — Enterprise GAP Analysis
## Part 3 of 3: Technical Architecture Review, Module Map, Roadmap & Estimations

---

## GAP-10: Technical Architecture Gaps (Angular 19 + NestJS)

### 10.1 Missing Angular Feature Modules
| Missing Module | Gap Description |
|:---|:---|
| `FinanceModule` | No GL, AP, AR, Bank Rec, Fixed Asset stores or components |
| `HrModule` | No employee master, payroll, rotation, or leave management |
| `MaintenanceModule` | Work Order store and PM calendar missing |
| `HseModule` | No Incident, PTW, or Safety Observation components |
| `ContractBillingModule` | Progress Certificate and Change Order flows missing |
| `FleetModule` | No vehicle registry, trip log, or GPS feed consumer |
| `DocumentModule` | No file repository, version control, or e-signature flow |
| `ReportsModule` | No structured report runner — currently all ad-hoc in components |
| `NotificationCenter` | No global notification inbox — alerts are ephemeral toasts only |
| `ApprovalMatrixEngine` | Approval thresholds are hardcoded per component; must be data-driven |

### 10.2 Missing Signal Stores
```typescript
// Required stores not yet defined:
FinanceStore          — GL balances, AP aging, AR aging, period status
HrStore               — headcount, rotation schedule, leave balances
MaintenanceStore      — WO queue, PM calendar, reliability metrics
HseStore              — incident register, open PTWs, HSE KPIs
ContractBillingStore  — progress certs, CO register, retention ledger
FleetStore            — vehicle positions, trip logs, fuel stats
DocumentStore         — file index, pending approvals, expiry alerts
ReportStore           — saved report configurations, scheduled outputs
NotificationStore     — unread count, notification inbox signal
ApprovalQueueStore    — pending approval items across all modules
```

### 10.3 Missing NestJS Services & Infrastructure
| Gap | Description |
|:---|:---|
| `LedgerPostingService` | Central orchestrator that converts any source transaction → JournalEntry. Currently each module posts independently with no consistency guarantee. |
| `BudgetGuardService` | Reusable NestJS guard/interceptor checking CC remaining budget before any write operation. |
| `ApprovalEngineService` | Data-driven approval routing based on `ApprovalRule` matrix — transaction type × amount × role hierarchy. |
| `NotificationDispatchService` | Fan-out service: in-app + email (SendGrid/SES) + SMS (Twilio) with template engine. |
| `ReportGeneratorService` | Scheduled and on-demand report runner outputting PDF/Excel using Bull queue. |
| `CurrencyConversionService` | Daily FX rate fetch (CBE/Bloomberg feed) + historical rate lookup for posted transactions. |
| `AuditInterceptor` | NestJS interceptor applied globally — captures before/after state for every mutating request. |
| `FileStorageService` | Abstraction over S3/Azure Blob — upload, download, signed URL, virus scan hook. |

### 10.4 Missing Background Jobs (Bull / BullMQ)
| Job | Trigger | Purpose |
|:---|:---|:---|
| `DepreciationJob` | Monthly cron (1st of month 01:00) | Run fixed asset depreciation for all assets, post GL entries |
| `PMDueDateJob` | Daily cron (06:00) | Check `MaintenancePlan.nextDueDateEstimate`; auto-create WO if due within 7 days |
| `CertificationExpiryJob` | Daily cron (07:00) | Alert HR and employee if certification expires within 30 days |
| `BudgetAlertJob` | On every PCTL posting | Recalculate CC remaining budget; alert PM if < 15% remaining |
| `HoursDepletionJob` | On every utilization log | Check hours utilization %; alert PM if ≥ 90% |
| `VehicleExpiryJob` | Daily cron | Alert fleet manager if insurance/registration expires within 30 days |
| `DocumentExpiryJob` | Daily cron | Alert document owner if controlled document expires within 30 days |
| `ARAgingJob` | Daily cron | Reclassify AR invoices into aging buckets; trigger dunning if > 30 days |
| `ReportSchedulerJob` | Configurable per report | Run saved report templates and email to distribution lists |
| `FxRateUpdateJob` | Daily cron (08:00) | Fetch latest USD/EGP exchange rate and update `ExchangeRate` table |

### 10.5 Missing Caching Strategy
| Data Type | Cache Layer | TTL | Invalidation Trigger |
|:---|:---|:---|:---|
| Chart of Accounts tree | Redis | 24h | Any CoA write |
| Exchange Rates | Redis | 1h | `FxRateUpdateJob` completes |
| User permissions / roles | Redis | 15min | Role assignment change |
| Project 360 Snapshot | Redis | 5min | Any PCTL posting for that project |
| Equipment current location | Redis | 2min | Transfer status → Received |
| Cost Center budget summary | Redis | 1min | Any CC cost update |
| Report output (non-live) | Redis | 1h | Manual cache bust |

### 10.6 Missing Security Requirements
| Security Control | Status | Recommendation |
|:---|:---|:---|
| JWT expiry + refresh token rotation | Partial | Enforce 15-min access token, 7-day sliding refresh |
| API rate limiting | Missing | 100 req/min per user, 1000 req/min per service using NestJS `ThrottlerModule` |
| Field-level encryption | Missing | Encrypt PII fields (nationalId, bankAccount, salary) at rest using AES-256 |
| Row-level security (RLS) | Missing | Postgres RLS policies enforcing `projectCode` and `companyId` scope |
| CORS & CSP headers | Partial | Enforce strict CSP; allowlist API origins |
| Input sanitization | Partial | Apply `class-validator` + `class-sanitizer` on all DTOs |
| Audit log immutability | Missing | Write audit logs to append-only table with trigger preventing DELETE/UPDATE |
| Secret management | Missing | Move all secrets to HashiCorp Vault or AWS Secrets Manager |
| Multi-tenant data isolation | Missing | Add `tenantId` to all entities; enforce via global TypeORM subscriber |

### 10.7 Missing Database Indexes
```sql
-- Performance-critical indexes not yet defined:
CREATE INDEX idx_pctl_project_date  ON project_cost_transaction(project_code, transaction_date);
CREATE INDEX idx_pctl_cc_date       ON project_cost_transaction(cost_center_code, transaction_date);
CREATE INDEX idx_worder_serial      ON work_order(serial_number, status);
CREATE INDEX idx_miv_project        ON material_issue_voucher(project_code, issue_date);
CREATE INDEX idx_allocation_project ON equipment_allocation(destination_project_code, status);
CREATE INDEX idx_utilization_serial ON equipment_utilization(serial_number, log_date);
CREATE INDEX idx_audit_entity       ON audit_log(entity_type, entity_id, timestamp DESC);
CREATE INDEX idx_employee_project   ON employee(project_code, status);
CREATE INDEX idx_incident_project   ON incident(project_code, incident_date DESC);
CREATE INDEX idx_gl_account_period  ON journal_line(account_code, period_id);
```

### 10.8 Missing DTOs (NestJS)
```typescript
// Examples of missing request/response DTOs:
export class CreateWorkOrderDto {
  @IsString() @IsNotEmpty() serialNumber: string;
  @IsEnum(WorkOrderType) woType: WorkOrderType;
  @IsString() projectCode: string;
  @IsString() costCenterCode: string;
  @IsEnum(WorkOrderPriority) priority: WorkOrderPriority;
  @IsDateString() scheduledDate: string;
  @IsArray() tasks: { description: string; estimatedMinutes: number }[];
}

export class PostLedgerTransactionDto {
  @IsEnum(LedgerTransactionType) transactionType: LedgerTransactionType;
  @IsString() sourceDocNumber: string;
  @IsString() projectCode: string;
  @IsString() siteCode: string;
  @IsString() costCenterCode: string;
  @IsNumber() @Min(0) amountUSD: number;
  @IsBoolean() isCredit: boolean;
  @IsDateString() transactionDate: string;
}

export class ApproveLeaveRequestDto {
  @IsString() approverId: string;
  @IsEnum(['Approved', 'Rejected']) decision: 'Approved' | 'Rejected';
  @IsOptional() @IsString() comments?: string;
}
```

---

## GAP-11: Complete ERP Module Map

```
PetroFlow ERP
├── PHASE 1 (COMPLETE)
│   ├── Procurement Management
│   │   ├── Purchase Requisitions
│   │   ├── Request for Quotation (RFQ)
│   │   ├── Supplier Quotations & Comparison
│   │   ├── Purchase Orders
│   │   └── Supplier Registry
│   └── Receiving & Inspection
│       ├── Receiving Ledger
│       ├── Goods Receipt Notes (GRN)
│       └── Serial Number Tagger
│
├── PHASE 2 (IN PROGRESS)
│   ├── Project Management
│   │   ├── Contract-to-Project Conversion
│   │   ├── Project 360 Dashboard
│   │   ├── Project Cost Transaction Ledger (PCTL)
│   │   ├── Project Timeline
│   │   └── Contract Hours Tracker
│   ├── Site Operations
│   ├── Cost Centers
│   ├── Equipment Allocation & Transfers
│   ├── Material Issue & Return (MIV/MRV)
│   ├── Equipment Utilization
│   └── Mobilization & Demobilization
│
├── PHASE 3 (NEXT — see roadmap)
│   ├── Maintenance & Asset Reliability
│   │   ├── Preventive Maintenance Plans
│   │   ├── Work Orders (PM/Corrective/Breakdown)
│   │   ├── Spare Parts Planning
│   │   └── Reliability KPIs (MTBF, MTTR, OEE)
│   ├── Inventory Enhancements
│   │   ├── Cycle Counting
│   │   ├── Physical Stock Count
│   │   ├── Inventory Adjustments
│   │   ├── Min/Max & Reorder Policies
│   │   └── Batch/Lot/Expiry Tracking
│   └── HSE Management
│       ├── Incident Reporting
│       ├── Safety Observations
│       ├── Permit to Work (PTW)
│       ├── Risk Assessments
│       ├── Toolbox Talks
│       └── HSE Audits
│
├── PHASE 4
│   ├── Financial Management
│   │   ├── General Ledger & Chart of Accounts
│   │   ├── Journal Entries (auto + manual)
│   │   ├── Accounts Payable
│   │   ├── Accounts Receivable
│   │   ├── Cash & Bank Reconciliation
│   │   ├── Fixed Assets & Depreciation
│   │   ├── Tax Management (VAT/WHT)
│   │   └── Revenue Recognition (IFRS 15)
│   ├── Contract Billing & Variations
│   │   ├── Progress Certificates
│   │   ├── Change Orders
│   │   ├── Variations
│   │   ├── Claims Management
│   │   └── Retention Handling
│   └── HR & Workforce
│       ├── Employee Master
│       ├── Crew Rotations
│       ├── Leave Management
│       ├── Payroll Engine
│       ├── Certification Tracking
│       ├── Training Records
│       ├── Time & Attendance
│       └── Camp Accommodation
│
└── PHASE 5
    ├── Fleet Management
    ├── Document Management (DMS)
    ├── CRM & Commercial (Tenders, Bids, Opportunities)
    ├── Executive Analytics & BI Dashboards
    └── Administration
        ├── RBAC & Approval Matrix Engine
        ├── Notification Center
        └── Master Data Management
```

---

## GAP-12: Development Roadmap

| Phase | Duration | Focus | Business Value |
|:---|:---|:---|:---|
| **Phase 3** | 3 months | Maintenance, Inventory Enhancements, HSE | Compliance, asset uptime, inventory accuracy |
| **Phase 4** | 4 months | Finance (GL/AP/AR), Contract Billing, HR/Payroll | Revenue collection, cost control, regulatory compliance |
| **Phase 5** | 3 months | Fleet, DMS, CRM, Analytics, Administration | Commercial growth, operational visibility, security maturity |

### Phase 3 Sprint Plan (12 weeks)
| Week | Deliverable |
|:---|:---|
| 1–2 | Work Order module (PM + Corrective + Breakdown) backend + frontend |
| 3–4 | PM Plan engine + PM Calendar UI |
| 5–6 | Spare Parts catalog + WO parts issue (MIV integration) |
| 7–8 | HSE Incident module + PTW workflow |
| 9–10 | Inventory cycle counting + adjustments + batch/lot tracking |
| 11–12 | Reliability KPI dashboard + HSE KPI dashboard + integration testing |

---

## GAP-13: Dependency Matrix

| Module | Depends On | Enables |
|:---|:---|:---|
| Financial GL | Project Cost Ledger (PCTL), Procurement PO, HR Payroll | Financial Statements, Tax Returns |
| Accounts Payable | Procurement PO, GRN, Supplier Registry | Vendor Payments, 3-Way Match |
| Accounts Receivable | Contract Billing, Progress Certs | Revenue Recognition, Cash Collection |
| Maintenance WO | Equipment Registry (SerializedItem), Spare Parts Inventory, PCTL | Reliability KPIs, Asset Lifecycle |
| HSE PTW | Work Orders, Employee Registry | Incident Prevention, Regulatory Compliance |
| HR Payroll | Employee Master, Attendance, Overtime, Leave | GL Salary Posting, Labor Cost per Project |
| Contract Billing | Contract Master, Project 360, Progress Certs | AR Invoice Generation, Revenue Recognition |
| Crew Rotation | Employee Master, Project Master, Site Master | Manpower Planning, Camp Accommodation |
| Fleet Management | Vehicle Registry, Trip Logs, Maintenance WO | Fuel Cost per Project, GPS Tracking |

---

## GAP-14: Estimated Scale

### Screens Count
| Phase | Module | Estimated Screens |
|:---|:---|:---|
| 1 (done) | Procurement + Receiving | 12 |
| 2 (in progress) | Projects + Equipment + MIV/MRV + 360 Dashboard | 22 |
| 3 | Maintenance + Inventory Enhancements + HSE | 28 |
| 4 | Finance + Contract Billing + HR | 45 |
| 5 | Fleet + DMS + CRM + Analytics + Admin | 30 |
| **Total** | | **~137 screens** |

### API Endpoints Count
| Phase | Estimated Endpoints |
|:---|:---|
| 1–2 (done/in-progress) | ~90 |
| 3 | ~65 |
| 4 | ~110 |
| 5 | ~55 |
| **Total** | **~320 endpoints** |

### Database Tables Count
| Category | Estimated Tables |
|:---|:---|
| Procurement & Receiving | 14 |
| Projects & Cost Centers & Sites | 18 |
| Equipment & Utilization | 12 |
| Financial (GL/AP/AR/Tax/FA) | 22 |
| HR & Payroll | 16 |
| Maintenance | 10 |
| HSE | 10 |
| Contract Billing | 8 |
| Inventory Enhancements | 8 |
| Fleet | 6 |
| DMS | 5 |
| Admin/Auth/Audit | 8 |
| **Total** | **~137 tables** |

---

## GAP-15: Suggested Microservice Boundaries

| Service | Responsibility | Separate DB Schema |
|:---|:---|:---:|
| `core-api` | Auth, RBAC, Audit, Notifications, Master Data | ✅ |
| `procurement-service` | PR, RFQ, Quotation, PO, Supplier Registry | ✅ |
| `receiving-service` | Inspection, GRN, Serial Number Tagger | Shared with procurement |
| `project-service` | Project master, PCTL, Timeline, 360 Dashboard | ✅ |
| `inventory-service` | Warehouse, MIV, MRV, Cycle Count, Batches | ✅ |
| `equipment-service` | Allocation, Transfer, Utilization, Asset History | ✅ |
| `maintenance-service` | PM Plans, Work Orders, Reliability KPIs | ✅ |
| `hse-service` | Incidents, PTW, Observations, Audits | ✅ |
| `finance-service` | GL, AP, AR, Bank, Fixed Assets, Tax | ✅ |
| `hr-service` | Employee, Payroll, Leave, Rotations, Training | ✅ |
| `contract-billing-service` | Progress Certs, Change Orders, Retention | Shared with project |
| `fleet-service` | Vehicles, Trips, GPS Ingestion | ✅ |
| `document-service` | File storage, versioning, approval routing | ✅ |
| `report-service` | Report runner, scheduler, PDF/Excel output | Shared (read replica) |

### Inter-Service Communication
- **Synchronous**: REST over internal load balancer for real-time lookups (budget check, serial number query)
- **Asynchronous**: RabbitMQ / AWS SQS for event-driven flows:
  - `contract.approved` → project-service creates project + CC
  - `wo.completed` → project-service posts PCTL entry
  - `grn.posted` → finance-service creates AP accrual JE
  - `payroll.approved` → finance-service creates salary GL entries

---

## GAP-16: Risks & Architecture Concerns

| # | Risk | Severity | Mitigation |
|:---|:---|:---|:---|
| R1 | **PCTL becomes a monolith bottleneck**: Every module writes to a single ledger table. Under high volume (maintenance + procurement + HR simultaneously), writes may contend. | HIGH | Partition `project_cost_transaction` by `project_code`; use Postgres table partitioning. Add write-through queue (BullMQ) to decouple source transactions from ledger posts. |
| R2 | **Angular Signals store coherence**: Multiple stores (ProjectStore, LogisticsStore, MaterialsStore) holding overlapping project data can drift out of sync. | HIGH | Define a single `ProjectContextService` as the authority for selected project context. All stores subscribe to it via effect(). Never store project code in more than one signal. |
| R3 | **Multi-currency precision errors**: Mixing USD/EGP calculations across services with floating-point arithmetic will produce rounding errors in financial statements. | HIGH | Store all monetary values as INTEGER cents (× 100). Use Decimal.js for any computed aggregations. Never use JavaScript `number` for money. |
| R4 | **Background job reliability**: Cron jobs for depreciation, PM due dates, and FX rates have no retry mechanism currently. A failed depreciation run silently skips an asset. | MEDIUM | Use BullMQ with retry (3 attempts, exponential backoff). Store job execution log in DB. Alert on any job that fails all retries. |
| R5 | **Serial number uniqueness enforcement**: Serial numbers are strings validated at application layer. A race condition during bulk import could create duplicates. | MEDIUM | Add `UNIQUE` constraint on `serialized_item.serial_number` at DB level. Use DB-level upsert (ON CONFLICT DO NOTHING) for bulk imports. |
| R6 | **Audit log volume**: A system with 320 endpoints and ~200 daily active users will generate ~50,000 audit rows per day. Without archiving, the table grows to millions of rows within months. | MEDIUM | Partition `audit_log` by month. Archive partitions older than 12 months to cold storage (S3). Maintain index on `(entity_type, entity_id)` only on hot partitions. |
| R7 | **Offline / low-connectivity sites**: Remote field sites (Western Desert, offshore) have intermittent internet. Field operators cannot rely on always-online Angular SPA. | MEDIUM | Implement Angular PWA with IndexedDB offline queue. Sync on reconnect using optimistic conflict resolution (last-write-wins for operational logs, manual resolution for financial posts). |
| R8 | **Approval workflow rigidity**: Currently approval chains are partially hardcoded in components. As the business scales, changing approval rules requires a code release. | MEDIUM | Implement `ApprovalEngineService` driven by the `ApprovalRule` database table. Rules can be modified by admins without code changes. |
| R9 | **HSE data sensitivity**: Incident data containing personal injury information has GDPR/local privacy law implications. | LOW-MED | Separate PII (injured person identity) into an encrypted sub-table. Anonymize reports for external HSE statistics exports. |
| R10 | **Report performance**: Full project profitability reports aggregating across PCTL, utilization, MIV, and HR cost tables will be slow on large projects. | LOW | Implement a read-model (materialized view or separate analytics schema) updated by async jobs. Reports read from the materialized view, not the OLTP tables. |
