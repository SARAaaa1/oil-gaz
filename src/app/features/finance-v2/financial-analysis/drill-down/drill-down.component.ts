import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { FinanceV2MockService } from '../../shared/finance-v2-mock.service';
import { ApMockService } from '../../shared/ap-mock.service';
import { ArMockService } from '../../shared/ar-mock.service';
import { MockDataService } from '../../../../core/services/mock-data.service';

interface DrillStep {
  labelKey: string;
  type: string;
  id: string;
  amount?: number;
  date?: string;
  details?: any;
}

@Component({
  selector: 'app-financial-drill-down',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './drill-down.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialDrillDownComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly financeMock = inject(FinanceV2MockService);
  readonly apMock = inject(ApMockService);
  readonly arMock = inject(ArMockService);
  readonly mockData = inject(MockDataService);

  // ── Drill Down Navigation State ──────────────────────────────────
  readonly drillPath = signal<DrillStep[]>([]);
  readonly currentStepIndex = signal<number>(0);

  // Active step details
  readonly activeStep = computed<DrillStep | null>(() => {
    const path = this.drillPath();
    const idx = this.currentStepIndex();
    return (path.length > 0 && idx >= 0 && idx < path.length) ? path[idx] : null;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.financial_analysis' },
      { label: 'navigation.drill_down' }
    ]);

    // Parse query parameters
    this.route.queryParams.subscribe(params => {
      const type = params['type'] || 'revenue';
      const id = params['id'] || '4000';
      this.initDrillPath(type, id);
    });
  }

  // ── Initialize Audit Trail Path ───────────────────────────────────
  initDrillPath(type: string, id: string) {
    const path: DrillStep[] = [];

    // Step 1: Revenue Ledger
    path.push({
      labelKey: 'finance_v2.analysis.drill_step_revenue',
      type: 'revenue',
      id: '4000 (Revenue Ledger Account)',
      amount: 500000,
      date: '2025-06-15',
      details: {
        accountNameAr: 'إيرادات الخدمات التشغيلية',
        accountNameEn: 'Rig Services Revenue',
        balance: 2450000,
        currency: 'SAR'
      }
    });

    // Step 2: Invoice
    path.push({
      labelKey: 'finance_v2.analysis.drill_step_invoice',
      type: 'invoice',
      id: 'INV-2025-0042',
      amount: 525000,
      date: '2025-06-15',
      details: {
        customer: 'Saudi Aramco',
        contractRef: 'CONT-ARAMCO-2024-08',
        wccRef: 'WCC-ARAMCO-252',
        vatAmount: 750000,
        subtotal: 5000000,
        retention: 500000, // 10%
        grandTotal: 5250000
      }
    });

    // Step 3: Collection
    path.push({
      labelKey: 'finance_v2.analysis.drill_step_collection',
      type: 'collection',
      id: 'COL-2025-0019',
      amount: 4725000, // 90% paid after retention
      date: '2025-06-28',
      details: {
        bankName: 'SAB Bank Main A/C',
        refNumber: 'TRX-99882210',
        paymentMethod: 'Bank Transfer',
        clearingDate: '2025-06-29'
      }
    });

    // Step 4: Journal Entry
    path.push({
      labelKey: 'finance_v2.analysis.drill_step_je',
      type: 'je',
      id: 'JV-2025-0811',
      amount: 4725000,
      date: '2025-06-28',
      details: {
        description: 'Auto-Post: Client progress invoice collection - Aramco',
        lines: [
          { code: '112100', name: 'SAB Bank Main A/C', dr: 4725000, cr: 0, cc: 'HQ-FIN' },
          { code: '113000', name: 'Accounts Receivable (Aramco)', dr: 0, cr: 4725000, cc: 'CC-310' }
        ]
      }
    });

    // Step 5: Cash/Bank Ledger
    path.push({
      labelKey: 'finance_v2.analysis.drill_step_ledger',
      type: 'ledger',
      id: '112100 (SAB Bank Main A/C)',
      amount: 4725000,
      date: '2025-06-29',
      details: {
        currentBalance: 12450000,
        lastReconciliation: '2025-06-30',
        unreconciledItems: 3
      }
    });

    // Step 6: Payment Voucher (if matching outgoing)
    path.push({
      labelKey: 'finance_v2.analysis.drill_step_payment',
      type: 'payment',
      id: 'PV-2025-0314',
      amount: 150000,
      date: '2025-06-30',
      details: {
        vendorName: 'Saudi Aramco Fuel Supply',
        refPO: 'PO-2025-091',
        paymentMethod: 'Bank Transfer',
        description: 'Fuel depot refueling payment'
      }
    });

    // Adjust path based on params
    const typeIdx = path.findIndex(p => p.type === type);
    this.drillPath.set(path);
    this.currentStepIndex.set(typeIdx >= 0 ? typeIdx : 0);
  }

  // ── Navigation methods ────────────────────────────────────────────
  jumpToStep(index: number) {
    if (index >= 0 && index < this.drillPath().length) {
      this.currentStepIndex.set(index);
    }
  }

  formatAmount(val: number): string {
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
