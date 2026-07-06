import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BranchService } from './branch.service';
import { AccountBranch } from './finance-v2.interfaces';

@Component({
  selector: 'app-finance-branch-selector',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="flex items-center gap-2">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0" *ngIf="showLabel">
        {{ 'finance_v2.coa.branch_filter' | translate }}
      </span>
      <select [value]="activeBranch()" (change)="onBranchChange($any($event.target).value)"
        class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all">
        <option *ngIf="allowAll" value="All">{{ 'finance_v2.coa.branch_all' | translate }}</option>
        <option value="HeadOffice">🏢 {{ 'finance_v2.coa.branch_head_office' | translate }}</option>
        <option value="FreeZone">🏭 {{ 'finance_v2.coa.branch_free_zone' | translate }}</option>
      </select>
    </div>
  `
})
export class BranchSelectorComponent {
  private readonly branchService = inject(BranchService);
  
  @Input() allowAll = true;
  @Input() showLabel = true;
  @Output() branchChanged = new EventEmitter<AccountBranch | 'All'>();

  activeBranch() {
    return this.branchService.activeBranch();
  }

  onBranchChange(value: AccountBranch | 'All') {
    this.branchService.activeBranch.set(value);
    this.branchChanged.emit(value);
  }
}
