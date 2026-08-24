import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { FinanceApiService } from '../../../core/services/finance-api.service';
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
  private readonly financeApi      = inject(FinanceApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly langService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  // UI state
  readonly searchQuery       = signal('');
  readonly selectedAssetId   = signal<string | null>(null);
  readonly showScheduleModal = signal(false);
  readonly asOfDate          = signal(new Date().toISOString().split('T')[0]);
  readonly postingMonth      = signal(new Date().toISOString().slice(0, 7));
  readonly showPostModal     = signal(false);

  // API signals
  readonly apiDepreciationData   = signal<any[]>([]);
  readonly apiDepreciationTotals = signal<any>(null);
  readonly apiScheduleData       = signal<any[]>([]);
  readonly isLoading             = signal(false);
  readonly isPosting             = signal(false);
  readonly useApiData            = signal(false);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.asset_depreciation' }
    ]);
    this.loadDepreciation();
  }

  loadDepreciation() {
    this.isLoading.set(true);
    this.financeApi.getDepreciation(this.asOfDate()).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.apiDepreciationData.set(res.data);
          this.apiDepreciationTotals.set(res.totals);
          this.useApiData.set(true);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.useApiData.set(false);
        this.isLoading.set(false);
      }
    });
  }

  // ─── DEPRECIATION ROWS (API or local fallback) ──────────────────────
  readonly depreciationRows = computed<any[]>(() => {
    const q = this.searchQuery().toLowerCase();

    if (this.useApiData()) {
      const rows = this.apiDepreciationData();
      return !q ? rows : rows.filter((r: any) =>
        r.asset.equipmentName.toLowerCase().includes(q) ||
        r.asset.assetNumber.toLowerCase().includes(q) ||
        r.asset.category.toLowerCase().includes(q)
      );
    }

    // Local fallback from MockDataService
    const assets  = this.mockDataService.equipment();
    const cutoff  = this.asOfDate();
    return assets
      .filter(a => !q || a.equipmentName.toLowerCase().includes(q) || a.assetNumber.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
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

  // ─── TOTALS (API or local fallback) ────────────────────────────────────
  readonly totals = computed(() => {
    if (this.useApiData() && this.apiDepreciationTotals()) return this.apiDepreciationTotals();
    const rows = this.depreciationRows();
    return {
      totalCost:             rows.reduce((s: number, r: any) => s + r.asset.purchaseCost,          0),
      totalAccumulated:      rows.reduce((s: number, r: any) => s + r.accumulatedDepreciation,     0),
      totalNBV:              rows.reduce((s: number, r: any) => s + r.netBookValue,                0),
      totalAnnualCharge:     rows.reduce((s: number, r: any) => s + (r.fullyDepreciated ? 0 : r.annualDepreciation), 0),
      totalMonthlyCharge:    rows.reduce((s: number, r: any) => s + (r.fullyDepreciated ? 0 : r.monthlyDepreciation), 0),
      activeAssets:          rows.filter((r: any) => !r.fullyDepreciated).length,
      fullyDepreciatedCount: rows.filter((r: any) => r.fullyDepreciated).length
    };
  });

  // ─── DEPRECIATION SCHEDULE (for selected asset) ──────────────────────
  readonly selectedRow = computed(() =>
    this.depreciationRows().find(r => r.asset.id === this.selectedAssetId()) ?? null
  );

  readonly depreciationSchedule = computed<ScheduleLine[]>(() => {
    if (this.useApiData()) return this.apiScheduleData();

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

  // ─── ACTIONS ──────────────────────────────────────────────────────────────────
  openSchedule(assetId: string) {
    this.selectedAssetId.set(assetId);
    this.showScheduleModal.set(true);
    // Fetch schedule from API
    this.financeApi.getDepreciationSchedule(assetId).subscribe({
      next: (res: any) => this.apiScheduleData.set(res.schedule ?? res.data ?? []),
      error: () => this.apiScheduleData.set([])
    });
  }

  closeSchedule() {
    this.showScheduleModal.set(false);
    this.selectedAssetId.set(null);
  }

  // Post monthly depreciation — calls real API (DR 515000 / CR 142000 auto-posted by backend)
  postMonthlyDepreciation() {
    const month = this.postingMonth();
    this.isPosting.set(true);
    this.financeApi.postMonthlyDepreciation(month).subscribe({
      next: (res: any) => {
        this.isPosting.set(false);
        this.showPostModal.set(false);
        const d = res.data ?? res;
        this.notificationService.success(
          this.translate.instant('finance.depreciation.posted_title'),
          this.translate.instant('finance.depreciation.posted_desc', {
            amount: (d.totalCharge ?? 0).toFixed(2),
            month,
            count: d.assetsCount ?? 0
          })
        );
        this.loadDepreciation();
      },
      error: (err: any) => {
        this.isPosting.set(false);
        this.showPostModal.set(false);
        const msg = err?.error?.message || 'Failed to post depreciation';
        // Handle already-posted gracefully
        if (msg.includes('already posted') || msg.includes('already')) {
          this.notificationService.warning(
            this.translate.instant('finance.depreciation.already_posted_title'),
            this.translate.instant('finance.depreciation.already_posted_desc', { month })
          );
        } else {
          this.notificationService.danger(this.translate.instant('common.error'), msg);
        }
      }
    });
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  }
}
