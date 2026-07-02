// ═══════════════════════════════════════════════════════
//  Finance V2 — Automation & Period Close Interfaces
// ═══════════════════════════════════════════════════════

export type PeriodStatus = 
  | 'Open' 
  | 'Soft Close' 
  | 'Review' 
  | 'Ready To Close' 
  | 'Closed' 
  | 'Locked';

export type ChecklistStatus = 
  | 'Not Started' 
  | 'In Progress' 
  | 'Completed' 
  | 'Blocked' 
  | 'Skipped';

export type RuleStatus = 'Active' | 'Paused' | 'Running' | 'Failed' | 'Completed';

export type IssueSeverity = 'Warning' | 'Error' | 'Info';

// ── Checklist Items ──────────────────────────────────
export interface ChecklistItem {
  id:            string;
  name:          string;
  status:        ChecklistStatus;
  completedBy:   string;
  completedDate: string;
  notes:         string;
}

// ── Automation Engine Rules ──────────────────────────
export interface AutomationRule {
  id:          string;
  name:        string;
  description: string;
  frequency:   string;
  lastRun:     string;
  nextRun:     string;
  status:      RuleStatus;
  result:      string;
  log:         string;
}

// ── Validation Warning & Errors ──────────────────────
export interface ValidationIssue {
  id:             string;
  severity:       IssueSeverity;
  module:         string;
  title:          string;
  description:    string;
  recommendation: string;
}

// ── Financial Audit Trail ────────────────────────────
export interface AuditTrailRow {
  id:          string;
  date:        string;
  time:        string;
  user:        string;
  module:      string;
  action:      string;
  document:    string;
  beforeValue: string;
  afterValue:  string;
  ip:          string;
  status:      'Success' | 'Warning' | 'Failed';
}

// ── Period Closing Dashboard KPIs ───────────────────
export interface PeriodCloseKpis {
  fiscalYear:                 string;
  accountingPeriod:           string;
  status:                     PeriodStatus;
  pendingTasks:               number;
  completedTasks:             number;
  unpostedJournals:           number;
  draftDocuments:             number;
  pendingVendorPayments:      number;
  pendingCustomerCollections: number;
  pendingVatSettlement:       number;
  pendingAssetDepreciation:   number;
  pendingBudgetReviews:       number;
  auditIssues:                number;
}
