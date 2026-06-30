import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { Equipment } from '../../../shared/interfaces/assets.interface';

interface DepreciationRow {
  asset: Equipment;
  usefulLifeYears: number;
  salvageValue: number;
  annualDepreciation: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  monthsElapsed: number;
  depreciationPercent: number;
  fullyDepreciated: boolean;
}

interface ScheduleLine {
  period: string;       // e.g. "2026-06"
  openingNBV: number;
  depreciation: number;
  closingNBV: number;
  cumulative: number;
}

@Component({
  selector: 'app-asset-depreciation',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './asset-depreciation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetDepreciationComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly financeService  = inject(FinanceCoreService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly langService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  // UI state
  readonly searchQuery       = signal('');
  readonly selectedAssetId   = signal<string | null>(null);
  readonly showScheduleModal = signal(false);
  readonly asOfDate          = signal(new Date().toISOString().split('T')[0]);
  readonly postingMonth      = signal(new Date().toISOString().slice(0, 7)); // YYYY-MM
  readonly showPostModal     = signal(false);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.asset_depreciation' }
    ]);
  }

  // ─── DEPRECIATION ROWS ────────────────────────────────────────────────
  readonly depreciationRows = computed<DepreciationRow[]>(() => {
    const assets  = this.mockDataService.equipment();
    const q       = this.searchQuery().toLowerCase();
    const cutoff  = this.asOfDate();

    return assets
      .filter(a =>
        !q ||
        a.equipmentName.toLowerCase().includes(q) ||
        a.assetNumber.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      )
      .map(asset => this.buildRow(asset, cutoff))
      .sort((a, b) => b.asset.purchaseCost - a.asset.purchaseCost);
  });

  private buildRow(asset: Equipment, cutoff: string): DepreciationRow {
    // Determine useful life by category (years)
    const usefulLifeYears = this.getUsefulLife(asset);
    const salvageValue    = +(asset.purchaseCost * 0.05).toFixed(2); // 5% residual
    const depreciableBase = asset.purchaseCost - salvageValue;

    // Months elapsed from purchase date to cutoff
    const purchaseDate   = new Date(asset.purchaseDate);
    const cutoffDate     = new Date(cutoff);
    const monthsElapsed  = Math.max(0,
      (cutoffDate.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (cutoffDate.getMonth()   - purchaseDate.getMonth())
    );
    const totalMonths = usefulLifeYears * 12;

    // Straight-line method
    const monthlyDepreciation  = +(depreciableBase / totalMonths).toFixed(2);
    const annualDepreciation   = +(monthlyDepreciation * 12).toFixed(2);
    const accumulated          = +Math.min(
      monthlyDepreciation * monthsElapsed,
      depreciableBase
    ).toFixed(2);
    const netBookValue         = +(asset.purchaseCost - accumulated).toFixed(2);
    const fullyDepreciated     = accumulated >= depreciableBase;
    const depreciationPercent  = +((accumulated / asset.purchaseCost) * 100).toFixed(1);

    return {
      asset,
      usefulLifeYears,
      salvageValue,
      annualDepreciation,
      monthlyDepreciation,
      accumulatedDepreciation: accumulated,
      netBookValue,
      monthsElapsed,
      depreciationPercent,
      fullyDepreciated
    };
  }

  private getUsefulLife(asset: Equipment): number {
    const map: Record<string, number> = {
      'Rig': 15, 'Generator': 10, 'Crane': 12, 'Truck': 7,
      'Pump': 8, 'Compressor': 10, 'Heavy Equipment': 10, 'Safety Equipment': 5
    };
    return map[asset.category] ?? 10;
  }

  // ─── TOTALS ───────────────────────────────────────────────────────────
  readonly totals = computed(() => {
    const rows = this.depreciationRows();
    return {
      totalCost:             rows.reduce((s, r) => s + r.asset.purchaseCost,          0),
      totalAccumulated:      rows.reduce((s, r) => s + r.accumulatedDepreciation,     0),
      totalNBV:              rows.reduce((s, r) => s + r.netBookValue,                0),
      totalAnnualCharge:     rows.reduce((s, r) => s + (r.fullyDepreciated ? 0 : r.annualDepreciation), 0),
      totalMonthlyCharge:    rows.reduce((s, r) => s + (r.fullyDepreciated ? 0 : r.monthlyDepreciation), 0),
      activeAssets:          rows.filter(r => !r.fullyDepreciated).length,
      fullyDepreciatedCount: rows.filter(r => r.fullyDepreciated).length
    };
  });

  // ─── DEPRECIATION SCHEDULE (for selected asset) ──────────────────────
  readonly selectedRow = computed(() =>
    this.depreciationRows().find(r => r.asset.id === this.selectedAssetId()) ?? null
  );

  readonly depreciationSchedule = computed<ScheduleLine[]>(() => {
    const row = this.selectedRow();
    if (!row) return [];

    const { asset, monthlyDepreciation, usefulLifeYears, salvageValue } = row;
    const depreciableBase = asset.purchaseCost - salvageValue;
    const totalMonths     = usefulLifeYears * 12;
    const lines: ScheduleLine[] = [];

    const start = new Date(asset.purchaseDate);
    let cumulative = 0;

    for (let m = 0; m < totalMonths; m++) {
      const d     = new Date(start.getFullYear(), start.getMonth() + m, 1);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const charge  = +Math.min(monthlyDepreciation, depreciableBase - cumulative).toFixed(2);
      if (charge <= 0) break;

      const opening = +(asset.purchaseCost - cumulative).toFixed(2);
      cumulative    = +(cumulative + charge).toFixed(2);
      const closing = +(asset.purchaseCost - cumulative).toFixed(2);

      lines.push({ period, openingNBV: opening, depreciation: charge, closingNBV: closing, cumulative });
    }

    return lines;
  });

  // ─── ACTIONS ──────────────────────────────────────────────────────────
  openSchedule(assetId: string) {
    this.selectedAssetId.set(assetId);
    this.showScheduleModal.set(true);
  }

  closeSchedule() {
    this.showScheduleModal.set(false);
    this.selectedAssetId.set(null);
  }

  // Post monthly depreciation GL entry for all active assets
  postMonthlyDepreciation() {
    const month = this.postingMonth();
    const rows  = this.depreciationRows().filter(r => !r.fullyDepreciated);

    if (rows.length === 0) {
      this.notificationService.warning(
        this.translate.instant('finance.depreciation.no_assets_title'),
        this.translate.instant('finance.depreciation.no_assets_desc')
      );
      this.showPostModal.set(false);
      return;
    }

    const totalCharge = +rows.reduce((s, r) => s + r.monthlyDepreciation, 0).toFixed(2);

    // Check if already posted for this month
    const alreadyPosted = this.financeService.journalEntries().some(
      e => e.reference === `DEPR-${month}` && e.status === 'Posted'
    );

    if (alreadyPosted) {
      this.notificationService.warning(
        this.translate.instant('finance.depreciation.already_posted_title'),
        this.translate.instant('finance.depreciation.already_posted_desc', { month })
      );
      this.showPostModal.set(false);
      return;
    }

    try {
      // Build lines: one debit line (Depreciation Expense) + one credit per cost center grouping
      // For simplicity: Dr. Equipment Maintenance Expenses (514000), Cr. Accumulated Depreciation (new sub-account under assets)
      // We use 130000 as proxy for Fixed Asset (already exists) — in real system we'd have a contra account
      this.financeService.postJournalEntry({
        date: `${month}-01`,
        reference: `DEPR-${month}`,
        description: this.translate.instant('finance.depreciation.gl_description', {
          month,
          count: rows.length
        }),
        lines: [
          {
            id: `dep_dr_${Date.now()}`,
            accountCode: '514000',
            accountName: 'Equipment Maintenance Expenses',
            debit: totalCharge,
            credit: 0,
            description: `Monthly depreciation charge — ${rows.length} assets — ${month}`
          },
          {
            id: `dep_cr_${Date.now()}`,
            accountCode: '130000',
            accountName: 'Inventory Asset',  // Proxy for Fixed Assets — represents value reduction
            debit: 0,
            credit: totalCharge,
            description: `Accumulated depreciation — ${month}`
          }
        ]
      });

      this.notificationService.success(
        this.translate.instant('finance.depreciation.posted_title'),
        this.translate.instant('finance.depreciation.posted_desc', {
          amount: totalCharge.toFixed(2),
          month,
          count: rows.length
        })
      );
    } catch (e: any) {
      this.notificationService.danger(
        this.translate.instant('common.error'),
        e.message
      );
    }

    this.showPostModal.set(false);
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  }
}
