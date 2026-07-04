import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-hr-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.subtitle' | translate }}</p>
      </div>

      <!-- Quick Directory Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (item of reportItems; track item.path) {
          <a [routerLink]="item.path" class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex items-start gap-4">
            <span class="text-3xl p-3 bg-slate-50 rounded-xl">{{ item.icon }}</span>
            <div class="space-y-1">
              <h3 class="font-black text-slate-800 text-xs tracking-wide uppercase">{{ item.label | translate }}</h3>
              <p class="text-[11px] text-slate-400 font-medium leading-relaxed">{{ item.desc | translate }}</p>
            </div>
          </a>
        }
      </div>
    </div>
  `
})
export class HrReportsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly router = inject(Router);
  readonly lang = inject(LanguageService);

  readonly reportItems = [
    { path: 'dashboard', label: 'hr.reports.nav_dashboard', desc: 'hr.reports.subtitle', icon: '📊' },
    { path: 'employees', label: 'hr.reports.nav_employees', desc: 'hr.reports.emp_subtitle', icon: '👥' },
    { path: 'recruitment', label: 'hr.reports.nav_recruitment', desc: 'hr.reports.rec_subtitle', icon: '🎯' },
    { path: 'attendance', label: 'hr.reports.nav_attendance', desc: 'hr.reports.att_subtitle', icon: '📅' },
    { path: 'leaves', label: 'hr.reports.nav_leaves', desc: 'hr.reports.leave_subtitle', icon: '🍂' },
    { path: 'payroll', label: 'hr.reports.nav_payroll', desc: 'hr.reports.pay_subtitle', icon: '💰' },
    { path: 'performance', label: 'hr.reports.nav_performance', desc: 'hr.reports.perf_subtitle', icon: '🏆' },
    { path: 'turnover', label: 'hr.reports.nav_turnover', desc: 'hr.reports.turn_subtitle', icon: '🔄' },
    { path: 'custom', label: 'hr.reports.nav_custom', desc: 'hr.reports.custom_subtitle', icon: '⚙️' }
  ];

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.title' }
    ]);
  }
}
