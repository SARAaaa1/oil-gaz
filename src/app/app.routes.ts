import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  // ─── Public route — no login required (share in job ads) ─────────────────
  {
    path: 'apply',
    loadComponent: () => import('./features/hr/recruitment/apply/apply.component').then(m => m.HrApplyComponent),
    title: 'تقديم طلب توظيف — PetroFlow'
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [permissionGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { permission: 'view:dashboard' }
      },
      // ─── User Profile ──────────────────────────────────────────────────────
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        title: 'الملف الشخصي — PetroFlow'
      },
      {
        path: 'procurement',
        data: { permission: 'view:procurement' },
        children: [
          { path: '', redirectTo: 'purchase-requests', pathMatch: 'full' },
          {
            path: 'purchase-requests',
            loadComponent: () => import('./features/procurement/purchase-requests/purchase-requests.component').then(m => m.PurchaseRequestsComponent)
          },
          {
            path: 'rfqs',
            loadComponent: () => import('./features/procurement/rfqs/rfqs.component').then(m => m.RfqsComponent)
          },
          {
            path: 'quotation-comparison',
            loadComponent: () => import('./features/procurement/quotation-comparison/quotation-comparison.component').then(m => m.QuotationComparisonComponent)
          },
          {
            path: 'purchase-orders',
            loadComponent: () => import('./features/procurement/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent)
          },
          {
            path: 'inspection',
            loadComponent: () => import('./features/procurement/inspection/inspection.component').then(m => m.InspectionComponent)
          }
        ]
      },
      {
        path: 'vendor-portal',
        data: { permission: 'view:vendor_portal' },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/vendor-portal/dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'rfqs',
            loadComponent: () => import('./features/vendor-portal/rfqs/rfqs.component').then(m => m.RfqsComponent)
          },
          {
            path: 'rfqs/:id',
            loadComponent: () => import('./features/vendor-portal/rfq-details/rfq-details.component').then(m => m.RfqDetailsComponent)
          },
          {
            path: 'rfqs/:id/submit',
            loadComponent: () => import('./features/vendor-portal/submit-quotation/submit-quotation.component').then(m => m.SubmitQuotationComponent)
          },
          {
            path: 'history',
            loadComponent: () => import('./features/vendor-portal/history/history.component').then(m => m.HistoryComponent)
          }
        ]
      },
      {
        path: 'inventory',
        data: { permission: 'view:inventory' },
        children: [
          { path: '', loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent) },
          { path: 'goods-receipts', loadComponent: () => import('./features/inventory/goods-receipts/goods-receipts.component').then(m => m.GoodsReceiptsComponent) },
          { path: 'item-ledger', loadComponent: () => import('./features/inventory/item-ledger/item-ledger.component').then(m => m.ItemLedgerComponent) },
          { path: 'stock-summary', loadComponent: () => import('./features/inventory/stock-summary/stock-summary.component').then(m => m.StockSummaryComponent) }
        ]
      },
      {
        path: 'vendors',
        loadComponent: () => import('./features/vendors/vendors.component').then(m => m.VendorsComponent),
        data: { permission: 'view:vendors' }
      },
      {
        path: 'masters',
        children: [
          { path: 'items', loadComponent: () => import('./features/masters/items/items.component').then(m => m.ItemsComponent) },
          { path: 'warehouses', loadComponent: () => import('./features/masters/warehouses/warehouses.component').then(m => m.WarehousesComponent) }
        ]
      },
      {
        path: 'assets',
        children: [
          { path: '', redirectTo: 'register', pathMatch: 'full' },
          {
            path: 'register',
            loadComponent: () => import('./features/assets/assets.component').then(m => m.AssetsComponent),
            title: 'سجل الأصول والمعدات — PetroFlow'
          },
          {
            path: 'rigs',
            loadComponent: () => import('./features/operations/rigs/rigs.component').then(m => m.RigsComponent),
            title: 'سجل أسطول الحفارات — PetroFlow'
          },
          {
            path: 'camps',
            loadComponent: () => import('./features/operations/camps/camps.component').then(m => m.CampsComponent),
            title: 'المخيمات والكرافانات — PetroFlow'
          },
          {
            path: 'fleet',
            loadComponent: () => import('./features/operations/fleet/fleet.component').then(m => m.FleetComponent),
            title: 'إدارة الأسطول والمركبات — PetroFlow'
          },
          {
            path: 'fuel',
            loadComponent: () => import('./features/operations/fuel/fuel.component').then(m => m.FuelComponent),
            title: 'إدارة الوقود والمحروقات — PetroFlow'
          },
          {
            path: 'maintenance',
            loadComponent: () => import('./features/maintenance/maintenance.component').then(m => m.MaintenanceComponent),
            title: 'الصيانة الوقائية وأوامر الإصلاح — PetroFlow'
          }
        ]
      },

      {
        path: 'operations',
        children: [
          { path: '', redirectTo: 'timesheets', pathMatch: 'full' },
          { path: 'rigs', redirectTo: '/assets/rigs', pathMatch: 'full' },
          { path: 'camps', redirectTo: '/assets/camps', pathMatch: 'full' },
          { path: 'fleet', redirectTo: '/assets/fleet', pathMatch: 'full' },
          { path: 'fuel', redirectTo: '/assets/fuel', pathMatch: 'full' },
          {
            path: 'timesheets',
            loadComponent: () => import('./features/operations/timesheets/timesheets.component').then(m => m.TimesheetsComponent),
            data: { permission: 'view:timesheets' }
          },
          {
            path: 'projects',
            loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent),
            data: { permission: 'view:projects' }
          }
        ]
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        data: { permission: 'view:reports' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        data: { permission: 'view:settings' }
      },
      // Projects is now under /operations/projects — redirect old path for backward compat
      { path: 'projects', redirectTo: '/operations/projects', pathMatch: 'full' },
      // ══════════════════════════════════════════════════════════
      // /finance — Redirects to finance-v2 (v1 deprecated)
      // financial-analysis pages kept here (sidebar links to /finance/*)
      // ══════════════════════════════════════════════════════════
      {
        path: 'finance',
        data: { permission: 'view:finance' },
        children: [
          // Core redirects → finance-v2
          { path: '',                    redirectTo: '/finance-v2/dashboard',           pathMatch: 'full' },
          { path: 'cost-centers',        redirectTo: '/finance-v2/cost-centers',        pathMatch: 'full' },
          { path: 'chart-of-accounts',   redirectTo: '/finance-v2/chart-of-accounts',   pathMatch: 'full' },
          { path: 'general-ledger',      redirectTo: '/finance-v2/general-ledger',      pathMatch: 'full' },
          { path: 'journal-entries',     redirectTo: '/finance-v2/journal-entries',     pathMatch: 'full' },
          { path: 'ap',                  redirectTo: '/finance-v2/ap/vendor-invoices-draft', pathMatch: 'full' },
          { path: 'supplier-invoices',   redirectTo: '/finance-v2/ap/vendor-invoices-approved', pathMatch: 'full' },
          { path: 'payment-vouchers',    redirectTo: '/finance-v2/ap/payments',         pathMatch: 'full' },
          { path: 'ar',                  redirectTo: '/finance-v2/ar/customer-invoices', pathMatch: 'full' },
          { path: 'cash-bank',           redirectTo: '/finance-v2/treasury/banks',      pathMatch: 'full' },
          { path: 'cost-control',        redirectTo: '/finance-v2/budget',              pathMatch: 'full' },
          { path: 'financial-statements',redirectTo: '/finance-v2/trial-balance',       pathMatch: 'full' },
          { path: 'vat-report',          redirectTo: '/finance-v2/taxes/vat',           pathMatch: 'full' },
          { path: 'asset-depreciation',  redirectTo: '/finance-v2/assets/depreciation', pathMatch: 'full' },
          { path: 'budget',              redirectTo: '/finance-v2/budget',              pathMatch: 'full' },
          { path: 'period-close',        redirectTo: '/finance-v2/admin/period-close',  pathMatch: 'full' },

          // Financial Analysis — kept under /finance/* (sidebar links here)
          {
            path: 'project-analysis',
            loadComponent: () => import('./features/finance-v2/financial-analysis/project-analysis/project-analysis.component').then(m => m.ProjectAnalysisComponent)
          },
          {
            path: 'cost-center-analysis',
            loadComponent: () => import('./features/finance-v2/financial-analysis/cost-center-analysis/cost-center-analysis.component').then(m => m.CostCenterAnalysisComponent)
          },
          {
            path: 'equipment-analysis',
            loadComponent: () => import('./features/finance-v2/financial-analysis/equipment-analysis/equipment-analysis.component').then(m => m.EquipmentAnalysisComponent)
          },
          {
            path: 'job-cost-analysis',
            loadComponent: () => import('./features/finance-v2/financial-analysis/job-cost-analysis/job-cost-analysis.component').then(m => m.JobCostAnalysisComponent)
          },
          {
            path: 'profitability',
            loadComponent: () => import('./features/finance-v2/financial-analysis/profitability/profitability.component').then(m => m.ProfitabilityAnalysisComponent)
          },
          {
            path: 'drill-down',
            loadComponent: () => import('./features/finance-v2/financial-analysis/drill-down/drill-down.component').then(m => m.FinancialDrillDownComponent)
          }
        ]
      },

      // ══════════════════════════════════════════════════════════
      // FINANCE V2 — New Finance Module (Migration Phase)
      // Old /finance routes are kept below and remain accessible.
      // These new routes are independent and will replace the old
      // ones after full migration is approved page by page.
      // ══════════════════════════════════════════════════════════
      {
        path: 'finance-v2',
        data: { permission: 'view:finance' },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

          // ── Core Finance ──
          { path: 'dashboard',         loadComponent: () => import('./features/finance-v2/dashboard/dashboard.component').then(m => m.FinV2DashboardComponent) },
          { path: 'chart-of-accounts', loadComponent: () => import('./features/finance-v2/chart-of-accounts/chart-of-accounts.component').then(m => m.FinV2ChartOfAccountsComponent) },
          { path: 'cost-centers',      loadComponent: () => import('./features/finance-v2/cost-centers/cost-centers.component').then(m => m.FinV2CostCentersComponent) },
          { path: 'journal-entries',   loadComponent: () => import('./features/finance-v2/journal-entries/journal-entries.component').then(m => m.FinV2JournalEntriesComponent) },
          { path: 'general-ledger',    loadComponent: () => import('./features/finance-v2/general-ledger/general-ledger.component').then(m => m.FinV2GeneralLedgerComponent) },
          { path: 'trial-balance',     loadComponent: () => import('./features/finance-v2/trial-balance/trial-balance.component').then(m => m.FinV2TrialBalanceComponent) },

          // ── Accounts Payable ──
          { path: 'ap/suppliers',                loadComponent: () => import('./features/finance-v2/ap/suppliers/suppliers.component').then(m => m.FinV2ApSuppliersComponent) },
          { path: 'ap/vendor-invoices-draft',    loadComponent: () => import('./features/finance-v2/ap/vendor-invoices-draft/vendor-invoices-draft.component').then(m => m.FinV2ApVendorInvoicesDraftComponent) },
          { path: 'ap/vendor-invoices-approved', loadComponent: () => import('./features/finance-v2/ap/vendor-invoices-approved/vendor-invoices-approved.component').then(m => m.FinV2ApVendorInvoicesApprovedComponent) },
          { path: 'ap/ready-for-payment',        loadComponent: () => import('./features/finance-v2/ap/ready-for-payment/ready-for-payment.component').then(m => m.FinV2ApReadyForPaymentComponent) },
          { path: 'ap/payments',                 loadComponent: () => import('./features/finance-v2/ap/payments/payments.component').then(m => m.FinV2ApPaymentsComponent) },

          // ── Accounts Receivable ──
          { path: 'ar/customers',         loadComponent: () => import('./features/finance-v2/ar/customers/customers.component').then(m => m.FinV2CustomersComponent) },
          { path: 'ar/customer-invoices', loadComponent: () => import('./features/finance-v2/ar/customer-invoices/customer-invoices.component').then(m => m.FinV2CustomerInvoicesComponent) },
          { path: 'ar/collections',       loadComponent: () => import('./features/finance-v2/ar/collections/collections.component').then(m => m.FinV2CollectionsComponent) },

          // ── Treasury ──
          { path: 'treasury/cash',      loadComponent: () => import('./features/finance-v2/treasury/cash/cash.component').then(m => m.FinV2CashComponent) },
          { path: 'treasury/banks',     loadComponent: () => import('./features/finance-v2/treasury/banks/banks.component').then(m => m.FinV2BanksComponent) },
          { path: 'treasury/transfers', loadComponent: () => import('./features/finance-v2/treasury/transfers/transfers.component').then(m => m.FinV2TransfersComponent) },
          { path: 'treasury/reconciliation', loadComponent: () => import('./features/finance-v2/treasury/reconciliation/reconciliation.component').then(m => m.FinV2ReconciliationComponent) },

          // ── Assets ──
          { path: 'assets/fixed-assets',  loadComponent: () => import('./features/finance-v2/fixed-assets/fixed-assets.component').then(m => m.FinV2FixedAssetsComponent) },
          { path: 'assets/depreciation',  loadComponent: () => import('./features/finance-v2/depreciation/depreciation.component').then(m => m.FinV2DepreciationComponent) },

          // ── Budget ──
          { path: 'budget', loadComponent: () => import('./features/finance-v2/budget/budget.component').then(m => m.FinV2BudgetComponent) },

          // ── Taxes ──
          { path: 'taxes/vat', loadComponent: () => import('./features/finance-v2/vat/vat.component').then(m => m.FinV2VatComponent) },

          // ── Reports ──
          { path: 'reports', loadComponent: () => import('./features/finance-v2/reports/reports.component').then(m => m.FinV2ReportsComponent) },

          // ── Administration ──
          { path: 'admin/period-close', loadComponent: () => import('./features/finance-v2/period-close/period-close.component').then(m => m.FinV2PeriodCloseComponent) },
        ]
      },

      {
        path: 'hse',
        loadComponent: () => import('./features/hse/hse.component').then(m => m.HseComponent)
      },

      {
        path: 'hr',
        data: { permission: 'view:dashboard' },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', loadComponent: () => import('./features/hr/dashboard/dashboard.component').then(m => m.HrDashboardComponent) },
          
          // Recruitment
          { path: 'recruitment/applications', loadComponent: () => import('./features/hr/recruitment/applications/applications.component').then(m => m.HrApplicationsComponent) },
          { path: 'recruitment/candidates', loadComponent: () => import('./features/hr/recruitment/candidates/candidates.component').then(m => m.HrCandidatesComponent) },
          { path: 'recruitment/interviews', loadComponent: () => import('./features/hr/recruitment/interviews/interviews.component').then(m => m.HrInterviewsComponent) },
          { path: 'recruitment/hiring', loadComponent: () => import('./features/hr/recruitment/hiring/hiring.component').then(m => m.HrHiringComponent) },
          { path: 'recruitment/onboarding', loadComponent: () => import('./features/hr/recruitment/onboarding/onboarding.component').then(m => m.HrOnboardingComponent) },

          // Employees
          { path: 'employees', loadComponent: () => import('./features/hr/employees/employees/employees.component').then(m => m.HrEmployeesListComponent) },
          { path: 'employees/profile', loadComponent: () => import('./features/hr/employees/profile/profile.component').then(m => m.HrProfileComponent) },
          { path: 'employees/documents', loadComponent: () => import('./features/hr/employees/documents/documents.component').then(m => m.HrDocumentsComponent) },

          // Organization
          { path: 'organization/departments', loadComponent: () => import('./features/hr/organization/departments/departments.component').then(m => m.HrDepartmentsComponent) },
          { path: 'organization/jobs', loadComponent: () => import('./features/hr/organization/jobs/jobs.component').then(m => m.HrJobsComponent) },
          { path: 'organization/grades', loadComponent: () => import('./features/hr/organization/grades/grades.component').then(m => m.HrGradesComponent) },
          { path: 'organization/locations', loadComponent: () => import('./features/hr/organization/locations/locations.component').then(m => m.HrLocationsComponent) },
          { path: 'organization/employment-types', loadComponent: () => import('./features/hr/organization/employment-types/employment-types.component').then(m => m.HrEmploymentTypesComponent) },
          { path: 'organization/contract-types', loadComponent: () => import('./features/hr/organization/contract-types/contract-types.component').then(m => m.HrContractTypesComponent) },
          { path: 'organization/structure', loadComponent: () => import('./features/hr/organization/structure/structure.component').then(m => m.HrStructureComponent) },

          // Attendance & Time Management
          { path: 'attendance', loadComponent: () => import('./features/hr/attendance/attendance/attendance.component').then(m => m.HrAttendanceComponent) },
          { path: 'attendance/dashboard', loadComponent: () => import('./features/hr/attendance/dashboard/dashboard.component').then(m => m.HrAttendanceDashboardComponent) },
          { path: 'attendance/history', loadComponent: () => import('./features/hr/attendance/history/history.component').then(m => m.HrAttendanceHistoryComponent) },
          { path: 'attendance/import', loadComponent: () => import('./features/hr/attendance/import/import.component').then(m => m.HrAttendanceImportComponent) },
          { path: 'attendance/shifts', loadComponent: () => import('./features/hr/attendance/shifts/shifts.component').then(m => m.HrShiftsComponent) },
          { path: 'attendance/schedules', loadComponent: () => import('./features/hr/attendance/schedules/schedules.component').then(m => m.HrWorkSchedulesComponent) },
          { path: 'attendance/overtime', loadComponent: () => import('./features/hr/attendance/overtime/overtime.component').then(m => m.HrOvertimeComponent) },
          { path: 'attendance/permissions', loadComponent: () => import('./features/hr/attendance/permissions/permissions.component').then(m => m.HrPermissionsComponent) },
          { path: 'attendance/trips', loadComponent: () => import('./features/hr/attendance/trips/trips.component').then(m => m.HrBusinessTripsComponent) },
          { path: 'attendance/exceptions', loadComponent: () => import('./features/hr/attendance/exceptions/exceptions.component').then(m => m.HrAttendanceExceptionsComponent) },

          // Leaves
          { path: 'leaves/requests', loadComponent: () => import('./features/hr/leaves/requests/requests.component').then(m => m.HrLeaveRequestsComponent) },
          { path: 'leaves/approval', loadComponent: () => import('./features/hr/leaves/approval/approval.component').then(m => m.HrLeaveApprovalComponent) },
          { path: 'leaves/balance', loadComponent: () => import('./features/hr/leaves/balance/balance.component').then(m => m.HrLeaveBalanceComponent) },

          // Payroll Management
          { path: 'payroll/setup', loadComponent: () => import('./features/hr/payroll/setup/setup.component').then(m => m.HrPayrollSetupComponent) },
          { path: 'payroll/run', loadComponent: () => import('./features/hr/payroll/run/run.component').then(m => m.HrPayrollRunComponent) },
          { path: 'payroll/list', loadComponent: () => import('./features/hr/payroll/list/list.component').then(m => m.HrPayrollListComponent) },
          { path: 'payroll/details/:id', loadComponent: () => import('./features/hr/payroll/details/details.component').then(m => m.HrPayrollDetailsComponent) },

          // Performance Management
          { path: 'performance/dashboard', loadComponent: () => import('./features/hr/performance/dashboard/dashboard.component').then(m => m.HrPerfDashboardComponent) },
          { path: 'performance/templates', loadComponent: () => import('./features/hr/performance/templates/templates.component').then(m => m.HrPerformanceTemplatesComponent) },
          { path: 'performance/reviews', loadComponent: () => import('./features/hr/performance/reviews/reviews.component').then(m => m.HrPerformanceReviewsComponent) },
          { path: 'performance/goals', loadComponent: () => import('./features/hr/performance/goals/goals.component').then(m => m.HrPerformanceGoalsComponent) },
          { path: 'performance/competencies', loadComponent: () => import('./features/hr/performance/competencies/competencies.component').then(m => m.HrPerformanceCompetenciesComponent) },
          { path: 'performance/results', loadComponent: () => import('./features/hr/performance/results/results.component').then(m => m.HrPerformanceResultsComponent) },

          // Phase 9 — Reports & Analytics
          { path: 'reports', loadComponent: () => import('./features/hr/reports/reports.component').then(m => m.HrReportsComponent) },
          { path: 'reports/dashboard', loadComponent: () => import('./features/hr/reports/exec-dashboard/exec-dashboard.component').then(m => m.HrReportsExecDashboardComponent) },
          { path: 'reports/employees', loadComponent: () => import('./features/hr/reports/employees/employees-report.component').then(m => m.HrReportsEmployeesComponent) },
          { path: 'reports/recruitment', loadComponent: () => import('./features/hr/reports/recruitment/recruitment-report.component').then(m => m.HrReportsRecruitmentComponent) },
          { path: 'reports/attendance', loadComponent: () => import('./features/hr/reports/attendance/attendance-report.component').then(m => m.HrReportsAttendanceComponent) },
          { path: 'reports/leaves', loadComponent: () => import('./features/hr/reports/leaves/leaves-report.component').then(m => m.HrReportsLeavesComponent) },
          { path: 'reports/payroll', loadComponent: () => import('./features/hr/reports/payroll/payroll-report.component').then(m => m.HrReportsPayrollComponent) },
          { path: 'reports/performance', loadComponent: () => import('./features/hr/reports/performance/performance-report.component').then(m => m.HrReportsPerformanceComponent) },
          { path: 'reports/turnover', loadComponent: () => import('./features/hr/reports/turnover/turnover-report.component').then(m => m.HrReportsTurnoverComponent) },
          { path: 'reports/custom', loadComponent: () => import('./features/hr/reports/custom/custom-report.component').then(m => m.HrReportsCustomComponent) },

          // Phase 10 — Workflow & Automation
          { path: 'workflow/dashboard', loadComponent: () => import('./features/hr/workflow/dashboard/workflow-dashboard.component').then(m => m.HrWorkflowDashboardComponent) },
          { path: 'workflow/approvals', loadComponent: () => import('./features/hr/workflow/approvals/approvals.component').then(m => m.HrWorkflowApprovalsComponent) },
          { path: 'workflow/notifications', loadComponent: () => import('./features/hr/workflow/notifications/notifications.component').then(m => m.HrWorkflowNotificationsComponent) },
          { path: 'workflow/automation', loadComponent: () => import('./features/hr/workflow/automation/automation.component').then(m => m.HrWorkflowAutomationComponent) },

          // Phase 11 — ERP Integration
          { path: 'integration/overview', loadComponent: () => import('./features/hr/integration/overview/integration-overview.component').then(m => m.HrIntegrationOverviewComponent) },
          { path: 'integration/finance', loadComponent: () => import('./features/hr/integration/finance/integration-finance.component').then(m => m.HrIntegrationFinanceComponent) },
          { path: 'integration/assets', loadComponent: () => import('./features/hr/integration/assets/integration-assets.component').then(m => m.HrIntegrationAssetsComponent) },

          // Phase 12 — Enterprise Features
          { path: 'org-chart', loadComponent: () => import('./features/hr/enterprise/org-chart/org-chart.component').then(m => m.HrOrgChartComponent) },
          { path: 'self-service', loadComponent: () => import('./features/hr/enterprise/self-service/self-service.component').then(m => m.HrSelfServiceComponent) },
          { path: 'training', loadComponent: () => import('./features/hr/enterprise/training/training.component').then(m => m.HrTrainingComponent) },
          { path: 'documents/expiry', loadComponent: () => import('./features/hr/enterprise/doc-expiry/doc-expiry.component').then(m => m.HrDocExpiryComponent) },
          { path: 'executive', loadComponent: () => import('./features/hr/enterprise/executive/executive.component').then(m => m.HrExecutiveComponent) },
          { path: 'audit', loadComponent: () => import('./features/hr/enterprise/audit/audit.component').then(m => m.HrAuditComponent) },

          // Settings & Admin
          { path: 'settings', loadComponent: () => import('./features/hr/settings/settings.component').then(m => m.HrSettingsComponent) },

          // ─── Admin — Users, Roles, Departments ────────────────────────
          { path: 'admin/users',       loadComponent: () => import('./features/hr/admin/users/users.component').then(m => m.HrAdminUsersComponent),           title: 'إدارة المستخدمين — PetroFlow' },
          { path: 'admin/roles',       loadComponent: () => import('./features/hr/admin/roles/roles.component').then(m => m.HrAdminRolesComponent),             title: 'إدارة الأدوار — PetroFlow' },
          { path: 'admin/departments', loadComponent: () => import('./features/hr/admin/departments/departments.component').then(m => m.HrDepartmentsComponent), title: 'إدارة الأقسام — PetroFlow' },
          { path: 'admin/permissions', loadComponent: () => import('./features/hr/admin/permissions/permissions.component').then(m => m.HrAdminPermissionsComponent) }

        ]
      },

      {
        path: 'activity-logs',
        loadComponent: () => import('./features/audit/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent),
        data: { permission: 'view:dashboard' }
      },
      {
        path: 'audit-trail',
        loadComponent: () => import('./features/audit/audit-trail/audit-trail.component').then(m => m.AuditTrailComponent),
        data: { permission: 'view:settings' }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'workflow',
        data: { permission: 'view:dashboard' },
        children: [
          { path: '', redirectTo: 'contracts', pathMatch: 'full' },
          {
            path: 'contracts',
            loadComponent: () => import('./features/workflow/contracts/contracts.component').then(m => m.ContractsComponent)
          },
          {
            path: 'dars',
            loadComponent: () => import('./features/workflow/dars/dars.component').then(m => m.DarsComponent)
          },
          {
            path: 'wccs',
            loadComponent: () => import('./features/workflow/wccs/wccs.component').then(m => m.WccsComponent)
          },
          {
            path: 'invoices',
            loadComponent: () => import('./features/workflow/invoices/invoices.component').then(m => m.InvoicesComponent)
          },
          {
            path: 'collections',
            loadComponent: () => import('./features/workflow/collections/collections.component').then(m => m.CollectionsComponent)
          }
        ]
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];


