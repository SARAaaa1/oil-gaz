import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-integration-finance',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.int_nav_finance' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">Exported Payroll and Insurance Journal Entries</p>
      </div>
      <button (click)="postToLedger()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">
        💸 Post to General Ledger
      </button>
    </div>

    <!-- Journals Grid -->
    <div class="space-y-4">
      @for (j of journals(); track j.id) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          
          <!-- Journal Header -->
          <div class="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="font-black text-slate-800 text-xs tracking-wider uppercase">{{ j.name }}</h3>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Reference: {{ j.ref }} · Date: {{ j.date }}</p>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-green-50 text-green-700 border-green-150">
              Draft
            </span>
          </div>

          <!-- Entries Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-slate-50 border-b border-slate-150">
                <tr>
                  <th class="px-4 py-2 text-left text-[9px] font-bold text-slate-400 uppercase">Account Code</th>
                  <th class="px-4 py-2 text-left text-[9px] font-bold text-slate-400 uppercase">Account Name</th>
                  <th class="px-4 py-2 text-left text-[9px] font-bold text-slate-400 uppercase">Narration</th>
                  <th class="px-4 py-2 text-right text-[9px] font-bold text-slate-400 uppercase">Debit (SAR)</th>
                  <th class="px-4 py-2 text-right text-[9px] font-bold text-slate-400 uppercase">Credit (SAR)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (entry of j.entries; track entry.accountCode) {
                  <tr class="hover:bg-slate-50/30">
                    <td class="px-4 py-2.5 font-bold text-slate-800">{{ entry.accountCode }}</td>
                    <td class="px-4 py-2.5 text-slate-500 font-semibold">{{ entry.accountName }}</td>
                    <td class="px-4 py-2.5 text-slate-400 font-semibold">{{ entry.narration }}</td>
                    <td class="px-4 py-2.5 text-right font-black text-slate-800">
                      {{ entry.debit ? (entry.debit | number:'1.2-2') : '—' }}
                    </td>
                    <td class="px-4 py-2.5 text-right font-black text-slate-800">
                      {{ entry.credit ? (entry.credit | number:'1.2-2') : '—' }}
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot class="bg-slate-50/50 border-t border-slate-100 font-black">
                <tr>
                  <td colspan="3" class="px-4 py-2.5 text-right text-slate-400 uppercase text-[9px]">Total</td>
                  <td class="px-4 py-2.5 text-right text-primary">{{ j.totalDebit | number:'1.2-2' }}</td>
                  <td class="px-4 py-2.5 text-right text-primary">{{ j.totalCredit | number:'1.2-2' }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      }
    </div>

  </div>
  `
})
export class HrIntegrationFinanceComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  readonly journals = signal([
    {
      id: 'j-1',
      name: 'Payroll Journal Entry',
      ref: 'JV-PR-2026-07',
      date: '2026-07-04',
      totalDebit: 2160000,
      totalCredit: 2160000,
      entries: [
        { accountCode: '501001', accountName: 'Direct Wages & Salaries', narration: 'Basic + Allowances July 2026', debit: 2160000, credit: 0 },
        { accountCode: '201005', accountName: 'Payroll Clearing Account', narration: 'Net Salary Clearing', debit: 0, credit: 1980000 },
        { accountCode: '202008', accountName: 'Withholding Taxes Payable', narration: 'Tax deductions July 2026', debit: 0, credit: 120000 },
        { accountCode: '202009', accountName: 'Social Insurance Payable', narration: 'GOSI employer/employee share', debit: 0, credit: 60000 }
      ]
    },
    {
      id: 'j-2',
      name: 'Loan Repayment Journal',
      ref: 'JV-LN-2026-07',
      date: '2026-07-04',
      totalDebit: 45000,
      totalCredit: 45000,
      entries: [
        { accountCode: '201005', accountName: 'Payroll Clearing Account', narration: 'Loan installments deduction', debit: 45000, credit: 0 },
        { accountCode: '105002', accountName: 'Employee Advances Receivable', narration: 'Employee advances collection', debit: 0, credit: 45000 }
      ]
    }
  ]);

  postToLedger() {
    this.hr.notify.success('hr.common.success', 'Journal entries posted to Finance ledger.');
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.int_title' },
      { label: 'hr.reports.int_nav_finance' }
    ]);
  }
}
