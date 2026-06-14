import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Project } from '../../../shared/interfaces/project.interface';

interface ProjectCostSummary {
  projectCode: string;
  projectName: string;
  costCenterCode: string;
  budget: number;
  committedCost: number;
  actualCost: number;
  totalCost: number;
  remainingBudget: number;
  variancePercent: number;
  status: string;
}

interface CostLedgerEntry {
  date: string;
  docType: 'PO' | 'MIV' | 'Invoice' | 'Asset Assignment';
  docNumber: string;
  description: string;
  category: 'Materials' | 'Equipment' | 'Labor' | 'Other';
  amount: number;
  type: 'Committed' | 'Actual';
}

@Component({
  selector: 'app-cost-control',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './cost-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CostControlComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  protected readonly Math = Math;

  // Raw signals from services
  readonly projects = this.workflowService.projects;
  readonly purchaseOrders = this.mockDataService.purchaseOrders;
  readonly mivs = this.mockDataService.mivs;
  readonly supplierInvoices = this.mockDataService.supplierInvoices;
  readonly assetAssignments = this.mockDataService.assetAssignments;

  // UI States
  readonly selectedProjectCode = signal<string>('All');
  readonly costCategoryFilter = signal<string>('All');

  // Aggregated Cost List for all projects
  readonly projectCostSummaries = computed<ProjectCostSummary[]>(() => {
    const projList = this.projects();
    const poList = this.purchaseOrders();
    const mivList = this.mivs();
    const invoiceList = this.supplierInvoices();

    return projList.map(proj => {
      // 1. Committed cost from POs (Pending or Approved, not completed/fully invoiced yet)
      const projectPOs = poList.filter(po => po.costCenter === proj.costCenterCode && po.status !== 'Draft');
      const committedCost = projectPOs.reduce((sum, po) => sum + po.totalAmount, 0);

      // 2. Actual cost: Supplier Invoices (Unpaid/Paid) + MIVs (Material Issues)
      // MIVs issued to this project
      const projectMIVs = mivList.filter(m => 
        (m.issueTo === 'Project' && m.destinationId === proj.code) || 
        (m.issueTo === 'Cost Center' && m.destinationId === proj.costCenterCode)
      );
      const mivCost = projectMIVs.reduce((sum, miv) => sum + miv.totalAmount, 0);

      // Invoices linked to this project's POs
      const poIds = projectPOs.map(p => p.id);
      const projectInvoices = invoiceList.filter(inv => inv.poId && poIds.includes(inv.poId));
      const invoiceCost = projectInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

      // To avoid double counting (PO vs invoice), in mock logic let's add MIV cost + Invoice cost
      // or if no invoices are posted, show PO costs. Let's make it realistic:
      // Actual = MIV cost + Invoice cost. Committed = PO cost - Invoice cost (remaining commitment)
      const actualCost = mivCost + invoiceCost;
      const remainingCommitment = Math.max(0, committedCost - invoiceCost);

      const totalCost = actualCost + remainingCommitment;
      const remainingBudget = proj.contractValue - totalCost;
      const variancePercent = proj.contractValue > 0 ? (totalCost / proj.contractValue) * 100 : 0;

      return {
        projectCode: proj.code,
        projectName: proj.name,
        costCenterCode: proj.costCenterCode,
        budget: proj.contractValue,
        committedCost: remainingCommitment,
        actualCost: actualCost,
        totalCost: totalCost,
        remainingBudget: remainingBudget,
        variancePercent: variancePercent,
        status: proj.status
      };
    });
  });

  // Filtered summary for the dashboard KPI cards
  readonly activeSummary = computed(() => {
    const list = this.projectCostSummaries();
    const code = this.selectedProjectCode();

    if (code === 'All') {
      const budget = list.reduce((sum, p) => sum + p.budget, 0);
      const committed = list.reduce((sum, p) => sum + p.committedCost, 0);
      const actual = list.reduce((sum, p) => sum + p.actualCost, 0);
      const total = committed + actual;
      const remaining = budget - total;
      const pct = budget > 0 ? (total / budget) * 100 : 0;

      return {
        budget, committed, actual, total, remaining, pct
      };
    } else {
      const proj = list.find(p => p.projectCode === code);
      return proj ? {
        budget: proj.budget,
        committed: proj.committedCost,
        actual: proj.actualCost,
        total: proj.totalCost,
        remaining: proj.remainingBudget,
        pct: proj.variancePercent
      } : { budget: 0, committed: 0, actual: 0, total: 0, remaining: 0, pct: 0 };
    }
  });

  // Detailed Cost Ledger for selected project
  readonly costLedger = computed<CostLedgerEntry[]>(() => {
    const code = this.selectedProjectCode();
    if (code === 'All') return [];

    const proj = this.projects().find(p => p.code === code);
    if (!proj) return [];

    const ledger: CostLedgerEntry[] = [];
    const ccCode = proj.costCenterCode;

    // 1. PO Commitments
    this.purchaseOrders()
      .filter(po => po.costCenter === ccCode && po.status !== 'Draft')
      .forEach(po => {
        ledger.push({
          date: po.date,
          docType: 'PO',
          docNumber: po.poNumber,
          description: `Commitment for: ${po.items.map(i => i.itemName).join(', ')}`,
          category: 'Materials',
          amount: po.totalAmount,
          type: 'Committed'
        });
      });

    // 2. MIV Issues (Warehouse issues)
    this.mivs()
      .filter(m => 
        (m.issueTo === 'Project' && m.destinationId === proj.code) || 
        (m.issueTo === 'Cost Center' && m.destinationId === ccCode)
      )
      .forEach(m => {
        ledger.push({
          date: m.issueDate,
          docType: 'MIV',
          docNumber: m.voucherNumber,
          description: `Issued materials: ${m.items.map(i => i.itemName).join(', ')}`,
          category: 'Materials',
          amount: m.totalAmount,
          type: 'Actual'
        });
      });

    // 3. Supplier Invoices (Vendor expenses)
    const poIds = this.purchaseOrders().filter(po => po.costCenter === ccCode).map(p => p.id);
    this.supplierInvoices()
      .filter(inv => inv.poId && poIds.includes(inv.poId))
      .forEach(inv => {
        ledger.push({
          date: inv.invoiceDate,
          docType: 'Invoice',
          docNumber: inv.invoiceNumber,
          description: `Vendor Invoice: ${inv.vendorName} (Terms: ${inv.paymentTerms})`,
          category: 'Other',
          amount: inv.totalAmount,
          type: 'Actual'
        });
      });

    // 4. Asset Assignments (Mock allocation costs, e.g. rig/equipment allocation)
    this.assetAssignments()
      .filter(a => a.assignedToId === code || a.assignedToId === ccCode)
      .forEach(a => {
        ledger.push({
          date: a.assignmentDate || new Date().toISOString().split('T')[0],
          docType: 'Asset Assignment',
          docNumber: a.assetNumber,
          description: `Allocated equipment: ${a.equipmentName} to ${a.assignedToName}`,
          category: 'Equipment',
          amount: 1500, // mock operational cost allocation
          type: 'Actual'
        });
      });

    // Sort by date (most recent first)
    return ledger.sort((a, b) => b.date.localeCompare(a.date));
  });

  // Filtered cost ledger list
  readonly filteredCostLedger = computed(() => {
    let list = this.costLedger();
    const category = this.costCategoryFilter();

    if (category !== 'All') {
      list = list.filter(e => e.category === category);
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.cost_control' }
    ]);
  }
}
