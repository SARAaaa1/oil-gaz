import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-hr-performance-reports',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.performance_reports.title' | translate }}</h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.performance_reports.subtitle' | translate }}</p>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center bg-slate-50/50">
        <div class="w-16 h-16 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mx-auto mb-4 text-xl">
          ⚙️
        </div>
        <h3 class="text-base font-black text-slate-800">{{ 'hr.common.placeholder_title' | translate }}</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-2">{{ 'hr.common.placeholder_desc' | translate }}</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrPerformanceReportsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.performance_reports.title' }
    ]);
  }
}
