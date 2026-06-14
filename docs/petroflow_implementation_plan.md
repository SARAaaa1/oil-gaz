# PetroFlow ERP: Master Implementation Roadmap & GAP Confirmation

This document maps the currently implemented modules of PetroFlow ERP against the target state, establishes priorities for missing components, and defines the step-by-step roadmap for execution.

---

## 1. System Mapping: Existing vs. Missing

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PetroFlow ERP Modules                         │
├──────────────────────────┬─────────────────────────────────────────────┤
│   EXISTING SYSTEM        │              MISSING MODULES                │
│   (Already Implemented)  │              (Target Core)                  │
├──────────────────────────┼─────────────────────────────────────────────┤
│ • Procurement Mgmt       │ • General Ledger & Chart of Accounts        │
│   (PR, RFQ, PO, Vendors) │ • Accounts Payable & Receivable (AP/AR)     │
│ • Inventory Mgmt         │ • Fixed Assets & Depreciation Accounting    │
│   (MIV/MRV, Movements)   │ • HR Core, Crew Rotations & Payroll Engine  │
│ • Operations & Projects  │ • Preventive & Corrective Maintenance (WOs) │
│   (Allocations, CCs)     │ • HSE (Incidents, PTW, Risk Matrix)         │
│                          │ • Contracts Billing & Variations (CO/Claims)│
│                          │ • Fleet, DMS, Admin (RBAC, Approval Matrix) │
└──────────────────────────┴─────────────────────────────────────────────┘
```

---

## 2. Priority Grouping of Missing Modules

To ensure the technical integrity of the ERP, we group the missing modules into three priority categories.

### 2.1 Critical Priority (ERP Core Integrity)
Without these, the system is a collection of silos. They must be built first to establish unified cost tracking, security, and authorization controls.
- **General Ledger (GL) & Chart of Accounts (CoA)**: Central destination for all transactional postings.
- **Accounts Payable (AP) & Accounts Receivable (AR)**: Sub-ledgers for settling supplier invoices and client billing.
- **RBAC & Approval Matrix Engine**: Replaces hardcoded values with data-driven roles and threshold-based approvals.
- **Audit Logging System**: Compliance history for every database mutation.

### 2.2 High Priority (Operational Execution & Compliance)
Directly impacts day-to-day work, manpower scheduling, asset uptime, and safety rules at rig sites.
- **HR, Crew Rotations & Payroll**: Manages field schedules, accommodations, certifications, and payroll with field allowances.
- **Maintenance & Asset Reliability**: Preventive maintenance plans and corrective/breakdown Work Orders.
- **HSE (Health, Safety & Environment)**: Incidents, daily safety logs, toolbox talks, and Permit to Work (PTW).

### 2.3 Medium Priority (Supporting & Business Growth Layers)
- **Contracts Billing, Variations & Claims**: Captures progress certificates, retention, and scope variations.
- **Fleet & Vehicle Logistics**: Tracks fuel, trip logs, and vehicle inspections.
- **Document Management System (DMS)**: Multi-version drawings, certificates, and e-signatures.
- **CRM & Tender Management**: Commercial bidding and business development tracking.

---

## 3. Execution Phases

We will execute the development in five incremental phases:

```
┌────────────────────────────────────────────────────────┐
│ PHASE 1: Financial Core (GL, AP, AR, Tax, Bank)        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 2: Administrative Core (Approval Engine, RBAC)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 3: HR, Crew Rotations & Payroll                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 4: Maintenance & HSE Operations                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 5: Contract Billing & Variations                 │
└────────────────────────────────────────────────────────┘
```

---

## 4. Immediate Step Planning

Once this plan is confirmed, we will begin with:
- **Phase 1, Module 1: General Ledger & Chart of Accounts (GL/CoA)**
  - Database schema: journal entries, journal lines, chart of accounts tree.
  - NestJS API: account creations, posting journals, balance queries.
  - Angular Frontend: Tree view of accounts, journal posting interface.
  - Integrations: Auto-routing of MIV/MRV issues and PO allocations.
