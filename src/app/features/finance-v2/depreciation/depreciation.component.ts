import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AssetsMockService } from '../shared/assets-mock.service';
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
  readonly assetService       = inject(AssetsMockService);
  readonly branchService      = inject(BranchService);

  readonly showJournalDlg = signal(false);
  readonly branchFilter   = signal('All');

  // Filter Active assets that can be depreciated
  readonly depreciableAssets = computed(() => {
    const br = this.branchFilter();
    return this.assetService.assets().filter(a => {
      const matchStatus = a.status === 'Active' || a.status === 'Under Maintenance';
      const matchBranch = br === 'All' || (a.branchId || 'HeadOffice') === br;
      return matchStatus && matchBranch;
    });
  });

  // KPIs
  readonly totalMonthlyDep = computed(() => {
    return this.depreciableAssets().reduce((s, a) => s + this.assetService.calculateMonthlyDepreciation(a), 0);
  });

  readonly depreciatedCount = computed(() => {
    return this.depreciableAssets().filter(a => a.lastDepreciationDate === '2025-06-30').length;
  });

  readonly pendingCount = computed(() => {
    return this.depreciableAssets().filter(a => a.lastDepreciationDate !== '2025-06-30').length;
  });

  // Workflows
  postMonthlyDepreciation() {
    // Post mock depreciation for all active/maintenance assets
    const active = this.depreciableAssets();
    if (active.length === 0) return;

    this.assetService.assets.update(list =>
      list.map(a => {
        if (a.status !== 'Active' && a.status !== 'Under Maintenance') return a;
        const monthly = this.assetService.calculateMonthlyDepreciation(a);
        const newAcc  = a.accumulatedDepreciation + monthly;
        const newBook = Math.max(a.residualValue, a.originalCost - newAcc);
        return {
          ...a,
          accumulatedDepreciation: newAcc,
          currentBookValue: newBook,
          lastDepreciationDate: '2025-06-30'
        };
      })
    );

    this.notify.success('finance_v2.assets.msg.dep_posted', 'finance_v2.assets.msg.dep_posted_desc');
  }

  reverseDepreciation() {
    // Reverse last month's mock depreciation
    this.assetService.assets.update(list =>
      list.map(a => {
        if (a.status !== 'Active' && a.status !== 'Under Maintenance') return a;
        const monthly = this.assetService.calculateMonthlyDepreciation(a);
        const newAcc  = Math.max(0, a.accumulatedDepreciation - monthly);
        const newBook = a.originalCost - newAcc;
        return {
          ...a,
          accumulatedDepreciation: newAcc,
          currentBookValue: newBook,
          lastDepreciationDate: '2025-05-31'
        };
      })
    );

    this.notify.warning('finance_v2.assets.msg.dep_reversed', 'finance_v2.assets.msg.dep_reversed_desc');
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
  }
}
