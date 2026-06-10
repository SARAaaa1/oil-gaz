import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
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
          }
        ]
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
        data: { permission: 'view:inventory' }
      },
      {
        path: 'vendors',
        loadComponent: () => import('./features/vendors/vendors.component').then(m => m.VendorsComponent),
        data: { permission: 'view:vendors' }
      },
      {
        path: 'operations',
        children: [
          { path: '', redirectTo: 'rigs', pathMatch: 'full' },
          {
            path: 'rigs',
            loadComponent: () => import('./features/operations/rigs/rigs.component').then(m => m.RigsComponent),
            data: { permission: 'view:rigs' }
          },
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
      {
        path: 'finance',
        data: { permission: 'view:finance' },
        children: [
          { path: '', redirectTo: 'cost-centers', pathMatch: 'full' },
          {
            path: 'cost-centers',
            loadComponent: () => import('./features/finance/cost-centers/cost-centers.component').then(m => m.CostCentersComponent)
          }
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


