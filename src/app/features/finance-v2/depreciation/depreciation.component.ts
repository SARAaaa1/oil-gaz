import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { FixedAsset } from '../shared/assets.interfaces';
import { BranchService } from '../shared/branch.service';

@Component({
  selector: 'app-finv2-depreciation',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './depreciation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2DepreciationComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);

  readonly depreciationEntries = signal<any[]>([]);
  readonly depreciationTotals = signal<any>(null);
  readonly isLoading = signal(false);
  readonly isPosting = signal(false);
  readonly asOfDate = signal('2025-06-30');

  readonly showJournalDlg = signal(false);
  readonly branchFilter   = signal('All');

  // Filter Active assets that can be depreciated
  readonly depreciableAssets = computed(() => {
    return this.depreciationEntries();
  });

  // KPIs
  readonly totalMonthlyDep = computed(() => {
    return this.depreciationTotals()?.totalMonthlyCharge ?? 0;
  });

  readonly depreciatedCount = computed(() => {
    return this.depreciationTotals()?.depreciatedCount ?? 0;
  });

  readonly pendingCount = computed(() => {
    return this.depreciationTotals()?.pendingCount ?? 0;
  });

  // Workflows
  postMonthlyDepreciation() {
    this.isPosting.set(true);
    this.financeApi.postMonthlyDepreciation(this.asOfDate()).subscribe({
      next: res => {
        this.notify.success('finance_v2.assets.msg.dep_posted', res.message);
        this.isPosting.set(false);
        this.loadDepreciation();
      },
      error: () => this.isPosting.set(false)
    });
  }

  reverseDepreciation() {
    // API does not support reversing yet
    this.notify.warning('finance_v2.assets.msg.dep_reversed', 'API does not support reversing yet');
  }

  /** Computes monthly depreciation from asset fields — replaces removed assetService call */
  calculateMonthlyDepreciation(a: any): number {
    const depreciableBase = (a.originalCost ?? 0) - (a.residualValue ?? 0);
    const usefulLifeMonths = (a.usefulLifeYears ?? a.usefulLife ?? 1) * 12;
    return usefulLifeMonths > 0 ? depreciableBase / usefulLifeMonths : 0;
  }

  // Helpers
  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.assets.title' },
      { label: 'finance_v2.assets.depreciation' }
    ]);
    this.loadDepreciation();
  }

  loadDepreciation() {
    this.isLoading.set(true);
    this.financeApi.getDepreciation(this.asOfDate()).subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          const mapped = raw.map((d: any) => ({
            id: d.id ?? d._id,
            assetCode: d.assetCode ?? d.code ?? '',
            assetName: d.assetName ?? d.nameEn ?? d.name ?? '',
            category: d.category ?? 'Equipment',
            originalCost: d.originalCost ?? d.acquisitionCost ?? 0,
            residualValue: d.residualValue ?? 0,
            usefulLifeYears: d.usefulLifeYears ?? d.usefulLife ?? 5,
            accumulatedDepreciation: d.accumulatedDepreciation ?? 0,
            monthlyCharge: d.monthlyCharge ?? d.depreciationAmount ?? 0,
            currentBookValue: d.currentBookValue ?? d.netBookValue ?? 0,
            status: d.status ?? 'Active'
          }));
          this.depreciationEntries.set(mapped);
        }
        if (res?.totals) {
          this.depreciationTotals.set(res.totals);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
