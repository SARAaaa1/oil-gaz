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
import { ArMockService } from '../../shared/ar-mock.service';

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profitability.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfitabilityAnalysisComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly workflowService = inject(WorkflowService);
  readonly mockDataService = inject(MockDataService);
  readonly arMockService = inject(ArMockService);

  // ── Filters ───────────────────────────────────────────────────────
  readonly analysisBy = signal<string>('project'); // project | customer | equipment | costcenter
  readonly periodFilter = signal<string>('2025');

  // ── UI States ─────────────────────────────────────────────────────
  readonly searchQuery = signal<string>('');
  readonly toastMessage = signal<string>('');

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.financial_analysis' },
      { label: 'navigation.profitability' }
    ]);
  }

  // ── Top 10 Projects ────────────────────────────────────────────────
  readonly topProjects = computed(() => {
    return this.workflowService.projects().map(p => {
      const rev = p.contractValue || 1000000;
      const exp = rev * (0.6 + (Math.random() * 0.15)); // opex mock ratio
      const net = rev - exp;
      const margin = (net / rev) * 100;
      return {
        code: p.code,
        name: p.name,
        revenue: rev,
        expenses: exp,
        gross: rev * 0.35,
        net: net,
        margin: margin
      };
    }).sort((a, b) => b.net - a.net);
  });

  // ── Worst Performing Projects ──────────────────────────────────────
  readonly worstProjects = computed(() => {
    return [...this.topProjects()].reverse().slice(0, 5);
  });

  // ── Top Customers ─────────────────────────────────────────────────
  readonly topCustomers = computed(() => {
    const custs = ['Saudi Aramco', 'SABIC', 'Maaden', 'SWCC', 'NEOM Company'];
    return custs.map((c, idx) => {
      const rev = 5000000 - (idx * 900000);
      const exp = rev * (0.65 + (idx * 0.04));
      const net = rev - exp;
      const margin = (net / rev) * 100;
      return {
        name: c,
        revenue: rev,
        expenses: exp,
        gross: rev * 0.3,
        net: net,
        margin: margin
      };
    }).sort((a, b) => b.net - a.net);
  });

  // ── Top Equipment ─────────────────────────────────────────────────
  readonly topEquipment = computed(() => {
    return this.mockDataService.equipment().map(e => {
      const rev = (e.operatingHours * 150) || (e.purchaseCost * 0.4);
      // maintenance + fuel
      const woSum = this.mockDataService.workOrders()
        .filter(w => w.assetId === e.id)
        .reduce((s, w) => s + (w.laborHoursCost || 2000), 0);
      const fuelSum = this.mockDataService.fuelIssues()
        .filter(f => f.issuedToId === e.id || f.issuedToId === e.equipmentCode)
        .reduce((s, f) => s + (f.totalCost || 0), 0);
      const exp = woSum + fuelSum + (e.purchaseCost * 0.05) || 12000;
      const net = rev - exp;
      const margin = rev > 0 ? (net / rev) * 100 : 0;
      return {
        id: e.id,
        code: e.equipmentCode,
        name: e.equipmentName,
        category: e.category,
        revenue: rev,
        expenses: exp,
        net: net,
        margin: margin
      };
    }).sort((a, b) => b.net - a.net).slice(0, 10);
  });

  // ── Cost Center Profitability ─────────────────────────────────────
  readonly costCentersProfit = computed(() => {
    const list = this.workflowService.costCenters();
    return list.map((cc, idx) => {
      const rev = 1200000 - (idx * 150000);
      const exp = rev * (0.62 + (idx * 0.03));
      const net = rev - exp;
      const margin = (net / rev) * 100;
      return {
        code: cc.code,
        name: cc.name,
        revenue: rev,
        expenses: exp,
        net: net,
        margin: margin
      };
    }).sort((a, b) => b.net - a.net);
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
