import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { WorkflowService } from '../../../../core/services/workflow.service';
import { MockDataService } from '../../../../core/services/mock-data.service';
import { FinanceV2MockService } from '../../shared/finance-v2-mock.service';

@Component({
  selector: 'app-job-cost-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './job-cost-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobCostAnalysisComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly workflowService = inject(WorkflowService);
  readonly mockDataService = inject(MockDataService);
  readonly financeMockService = inject(FinanceV2MockService);

  // ── Filters ───────────────────────────────────────────────────────
  readonly selectedProjCode = signal<string>('');
  readonly periodFilter = signal<string>('2025-Q1');

  // ── UI States ─────────────────────────────────────────────────────
  readonly searchQuery = signal<string>('');
  readonly toastMessage = signal<string>('');

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.financial_analysis' },
      { label: 'navigation.job_cost_analysis' }
    ]);

    // Auto-select first project
    const projs = this.workflowService.projects();
    if (projs.length > 0) {
      this.selectedProjCode.set(projs[0].code);
    }
  }

  // ── Active Project ────────────────────────────────────────────────
  readonly activeProject = computed(() => {
    const code = this.selectedProjCode();
    return this.workflowService.projects().find(p => p.code === code) || null;
  });

  // ── Job Cost Splits (Aggregated Direct Splits) ────────────────────
  
  // 1. Materials Split
  readonly materialCost = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    return this.mockDataService.mivs()
      .filter(m => m.destinationId === p.code || m.destinationId === p.costCenterCode)
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0) || (p.contractValue * 0.25);
  });

  // 2. Labor Split
  readonly laborCost = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    return this.mockDataService.timesheets()
      .filter(t => t.rigId === p.costCenterCode)
      .reduce((sum, t) => sum + (t.totalOperatingHours * 80), 0) || (p.contractValue * 0.20);
  });

  // 3. Equipment Split
  readonly equipmentCost = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    const woSum = this.mockDataService.workOrders()
      .filter(w => w.assetId === p.costCenterCode)
      .reduce((sum, w) => sum + (w.laborHoursCost || 2500), 0);
    const fuelSum = this.mockDataService.fuelIssues()
      .filter(f => f.costCenterCode === p.costCenterCode)
      .reduce((sum, f) => sum + (f.totalCost || 0), 0);
    return woSum + fuelSum || (p.contractValue * 0.15);
  });

  // 4. Subcontractor Split
  readonly subcontractorCost = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    return (p.contractValue * 0.12);
  });

  // 5. Indirect Split
  readonly indirectCost = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    return (p.contractValue * 0.08);
  });

  // 6. Overhead
  readonly overheadCost = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    return (p.contractValue * 0.05);
  });

  // 7. Total Cost & Revenue
  readonly totalCost = computed(() => {
    return this.materialCost() + this.laborCost() + this.equipmentCost() +
           this.subcontractorCost() + this.indirectCost() + this.overheadCost();
  });

  readonly projectRevenue = computed(() => {
    const p = this.activeProject();
    return p ? (p.contractValue || 1000000) : 1000000;
  });

  readonly profitMargin = computed(() => {
    const rev = this.projectRevenue();
    const cost = this.totalCost();
    return rev > 0 ? ((rev - cost) / rev) * 100 : 0;
  });

  // ── Breakdown List for Progress Bars ──────────────────────────────
  readonly costBreakdown = computed(() => {
    const tot = this.totalCost() || 1;
    return [
      { name: 'Materials Cost', code: '5110', value: this.materialCost(), pct: (this.materialCost() / tot) * 100, color: '#4f46e5' },
      { name: 'Labor Cost', code: '5120', value: this.laborCost(), pct: (this.laborCost() / tot) * 100, color: '#10b981' },
      { name: 'Equipment cost', code: '5135', value: this.equipmentCost(), pct: (this.equipmentCost() / tot) * 100, color: '#f59e0b' },
      { name: 'Subcontractors', code: '5150', value: this.subcontractorCost(), pct: (this.subcontractorCost() / tot) * 100, color: '#ec4899' },
      { name: 'Indirect Site Cost', code: '5160', value: this.indirectCost(), pct: (this.indirectCost() / tot) * 100, color: '#8b5cf6' },
      { name: 'Administrative Overheads', code: '5190', value: this.overheadCost(), pct: (this.overheadCost() / tot) * 100, color: '#6b7280' }
    ];
  });

  // ── Methods ───────────────────────────────────────────────────────
  formatAmount(val: number): string {
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  exportToExcel() {
    this.showToast('finance_v2.analysis.msg_exported');
  }

  exportToPDF() {
    this.showToast('finance_v2.analysis.msg_exported');
  }

  printReport() {
    window.print();
  }

  onDrillDown(type: string, id: string) {
    this.router.navigate(['/finance/drill-down'], { queryParams: { type, id } });
  }
}
