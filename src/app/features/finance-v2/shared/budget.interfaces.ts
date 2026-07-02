// ═══════════════════════════════════════════════════════
//  Finance V2 — Budget Management Interfaces
// ═══════════════════════════════════════════════════════

export type BudgetCategory = 
  | 'Materials' 
  | 'Labor' 
  | 'Equipment' 
  | 'Subcontractors' 
  | 'Transportation' 
  | 'Fuel' 
  | 'Maintenance' 
  | 'Accommodation' 
  | 'Administration' 
  | 'Other';

export type BudgetStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Approved' 
  | 'Active' 
  | 'Closed' 
  | 'Cancelled';

export type BudgetLineStatus = 'Green' | 'Yellow' | 'Red';

// ── Budget Line ──────────────────────────────────────
export interface BudgetLine {
  id:              string;
  category:        BudgetCategory;
  costCenterCode:  string;
  costCenterName:  string;
  budgetAmount:    number;
  actualCost:      number;
  committedCost:   number;
  remainingBudget: number; // Budget - Actual - Committed
  forecastCost:    number;    // Actual + Committed
  variance:        number;        // Budget - Forecast
  variancePct:     number;     // Variance / Budget * 100
  status:          BudgetLineStatus; // Calculated: <80% Green, 80-100% Yellow, >100% Red
  notes:           string;
}

// ── Project Budget Header ────────────────────────────
export interface ProjectBudget {
  id:                   string;
  budgetNumber:         string;
  projectCode:          string;
  projectName:          string;
  projectManager:       string;
  client:               string;
  startDate:            string;
  endDate:              string;
  fiscalYear:           string;
  status:               BudgetStatus;
  currency:             string;
  approvedBy:           string;
  approvalDate:         string;
  createdBy:            string;
  createdDate:          string;
  lastUpdated:          string;
  lines:                BudgetLine[];
}

// ── Summary Metrics ──────────────────────────────────
export interface BudgetDashboardKpi {
  totalBudget:        number;
  actualCost:         number;
  committedCost:      number;
  availableBudget:    number;
  utilizationPct:     number;
  forecastCost:       number;
  forecastVariance:   number;
  overBudgetItemCount: number;
}
