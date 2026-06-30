import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';

export interface ChecklistItem {
  key: string;
  labelKey: string;
  checked: boolean;
}

export interface FiscalPeriod {
  id: string;       // e.g. "2026-06"
  year: number;
  month: number;    // 1–12
  label: string;    // "June 2026"
  status: 'Open' | 'Closed' | 'Locked';
  closedBy?: string;
  closedDate?: string;
  journalCount: number;
  checklist: ChecklistItem[];
  notes: string;
}

const PERIOD_KEY = 'petroflow_fiscal_periods';
const MONTHS_EN  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_AR  = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function defaultChecklist(): ChecklistItem[] {
  return [
    { key: 'ap_reconciled',   labelKey: 'finance.period_close.check_ap',          checked: false },
    { key: 'ar_reconciled',   labelKey: 'finance.period_close.check_ar',          checked: false },
    { key: 'gl_balanced',     labelKey: 'finance.period_close.check_gl',          checked: false },
    { key: 'depreciation',    labelKey: 'finance.period_close.check_depreciation', checked: false },
    { key: 'bank_rec',        labelKey: 'finance.period_close.check_bank',        checked: false },
    { key: 'vat_filed',       labelKey: 'finance.period_close.check_vat',         checked: false },
    { key: 'expenses_booked', labelKey: 'finance.period_close.check_expenses',    checked: false },
  ];
}

@Component({
  selector: 'app-period-close',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './period-close.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeriodCloseComponent implements OnInit {
  private readonly financeService   = inject(FinanceCoreService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly langService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly selectedYear   = signal<number>(new Date().getFullYear());
  readonly periods        = signal<FiscalPeriod[]>([]);
  readonly selectedPeriod = signal<FiscalPeriod | null>(null);
  readonly showDetail     = signal<boolean>(false);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.period_close' }
    ]);
    this.loadPeriods();
  }

  private loadPeriods() {
    const cached = localStorage.getItem(PERIOD_KEY);
    if (cached) {
      this.periods.set(JSON.parse(cached));
    } else {
      this.generatePeriods(this.selectedYear());
    }
  }

  generatePeriods(year: number) {
    const entries = this.financeService.journalEntries();
    const periods: FiscalPeriod[] = [];

    for (let m = 1; m <= 12; m++) {
      const id  = `${year}-${String(m).padStart(2,'0')}`;
      const now = new Date();
      const isCurrentOrPast = year < now.getFullYear() || (year === now.getFullYear() && m <= now.getMonth() + 1);

      const jCount = entries.filter(e => e.date.startsWith(id) && e.status === 'Posted').length;

      periods.push({
        id, year, month: m,
        label: `${MONTHS_EN[m-1]} ${year}`,
        status: 'Open',
        journalCount: jCount,
        checklist: defaultChecklist(),
        notes: ''
      });
    }

    this.periods.set(periods);
    this.savePeriods();
  }

  private savePeriods() {
    localStorage.setItem(PERIOD_KEY, JSON.stringify(this.periods()));
  }

  // ─── COMPUTED ─────────────────────────────────────────────────────────
  readonly filteredPeriods = computed(() => {
    const year = this.selectedYear();
    const entries = this.financeService.journalEntries();

    return this.periods()
      .filter(p => p.year === year)
      .map(p => ({
        ...p,
        journalCount: entries.filter(e => e.date.startsWith(p.id) && e.status === 'Posted').length,
        checklistDone: p.checklist.filter(c => c.checked).length,
        checklistTotal: p.checklist.length,
        canClose: p.checklist.every(c => c.checked) && p.status === 'Open',
        isCurrentMonth: p.id === new Date().toISOString().slice(0,7)
      }));
  });

  readonly summaryStats = computed(() => {
    const periods = this.filteredPeriods();
    return {
      closed: periods.filter(p => p.status === 'Closed' || p.status === 'Locked').length,
      open:   periods.filter(p => p.status === 'Open').length,
      totalEntries: periods.reduce((s, p) => s + p.journalCount, 0)
    };
  });

  // ─── ACTIONS ──────────────────────────────────────────────────────────
  openDetail(period: any) {
    // Sync from main list
    const found = this.periods().find(p => p.id === period.id) ?? period;
    this.selectedPeriod.set({ ...found });
    this.showDetail.set(true);
  }

  toggleChecklistItem(key: string) {
    const period = this.selectedPeriod();
    if (!period || period.status !== 'Open') return;

    const updated: FiscalPeriod = {
      ...period,
      checklist: period.checklist.map(c => c.key === key ? { ...c, checked: !c.checked } : c)
    };
    this.selectedPeriod.set(updated);
    // Persist to main list
    this.periods.update(list => list.map(p => p.id === period.id ? updated : p));
    this.savePeriods();
  }

  updateNotes(val: string) {
    const period = this.selectedPeriod();
    if (!period) return;
    const updated = { ...period, notes: val };
    this.selectedPeriod.set(updated);
    this.periods.update(list => list.map(p => p.id === period.id ? updated : p));
    this.savePeriods();
  }

  closePeriod() {
    const period = this.selectedPeriod();
    if (!period) return;

    const allChecked = period.checklist.every(c => c.checked);
    if (!allChecked) {
      this.notificationService.warning(
        this.translate.instant('finance.period_close.incomplete_title'),
        this.translate.instant('finance.period_close.incomplete_desc')
      );
      return;
    }

    const updated: FiscalPeriod = {
      ...period,
      status: 'Closed',
      closedBy: 'Current User',
      closedDate: new Date().toISOString().split('T')[0]
    };

    this.selectedPeriod.set(updated);
    this.periods.update(list => list.map(p => p.id === period.id ? updated : p));
    this.savePeriods();

    this.notificationService.success(
      this.translate.instant('finance.period_close.closed_title'),
      this.translate.instant('finance.period_close.closed_desc', { period: period.label })
    );
    this.showDetail.set(false);
  }

  reopenPeriod() {
    const period = this.selectedPeriod();
    if (!period) return;

    const updated: FiscalPeriod = { ...period, status: 'Open', closedBy: undefined, closedDate: undefined };
    this.selectedPeriod.set(updated);
    this.periods.update(list => list.map(p => p.id === period.id ? updated : p));
    this.savePeriods();

    this.notificationService.success(
      this.translate.instant('finance.period_close.reopened_title'),
      this.translate.instant('finance.period_close.reopened_desc', { period: period.label })
    );
    this.showDetail.set(false);
  }

  getStatusClass(status: string): string {
    return status === 'Closed' ? 'bg-emerald-100 text-emerald-700'
      : status === 'Locked'   ? 'bg-slate-200 text-slate-600'
      : 'bg-blue-100 text-blue-700';
  }

  getMonthLabel(m: number): string {
    return this.langService.currentLang() === 'ar' ? MONTHS_AR[m-1] : MONTHS_EN[m-1];
  }

  /** Zero-pad month number for display — e.g. 1 → "01" */
  padMonth(m: number): string {
    return String(m).padStart(2, '0');
  }

  /** Count checked items in currently selected period */
  get checkedCount(): number {
    return this.selectedPeriod()?.checklist.filter(c => c.checked).length ?? 0;
  }

  /** Total checklist items in currently selected period */
  get checklistTotal(): number {
    return this.selectedPeriod()?.checklist.length ?? 0;
  }
}
