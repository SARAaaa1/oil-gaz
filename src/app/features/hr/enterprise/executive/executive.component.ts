import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-executive',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.ent_exec_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.ent_exec_subtitle' | translate }}</p>
      </div>
      <button (click)="printReport()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">
        🖨️ Print Board Report
      </button>
    </div>

    <!-- Core Enterprise KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Hiring KPIs -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 class="font-black text-slate-800 text-xs tracking-wider uppercase flex items-center justify-between">
          <span>Hiring KPIs</span>
          <span class="text-primary text-base">🎯</span>
        </h3>
        <div class="grid grid-cols-2 gap-3 text-center">
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p class="text-xl font-black text-slate-850">84%</p>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Acceptance Rate</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p class="text-xl font-black text-slate-850">18 Days</p>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Avg Time to Hire</p>
          </div>
        </div>
      </div>

      <!-- Financial & Payroll KPIs -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 class="font-black text-slate-800 text-xs tracking-wider uppercase flex items-center justify-between">
          <span>Payroll & Costs</span>
          <span class="text-green-600 text-base">💵</span>
        </h3>
        <div class="grid grid-cols-2 gap-3 text-center">
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p class="text-xl font-black text-slate-850">SAR 2.16M</p>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Total Net Payroll</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p class="text-xl font-black text-slate-850">SAR 12.4K</p>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Average Salary</p>
          </div>
        </div>
      </div>

      <!-- Attendance & Health -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h3 class="font-black text-slate-800 text-xs tracking-wider uppercase flex items-center justify-between">
          <span>Attendance & Absence</span>
          <span class="text-amber-500 text-base">📅</span>
        </h3>
        <div class="grid grid-cols-2 gap-3 text-center">
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p class="text-xl font-black text-slate-850">94.2%</p>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Attendance Rate</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p class="text-xl font-black text-slate-850">4.8%</p>
            <p class="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Turnover Rate</p>
          </div>
        </div>
      </div>

    </div>

    <!-- Company Performance & Talent Pool -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Top Departments -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 class="text-xs font-black text-slate-700 uppercase">🏆 Top Departments by Performance</h3>
        <div class="space-y-3">
          @for (d of deptRanks(); track d.name) {
            <div class="flex items-center gap-3">
              <div class="w-24 text-[11px] font-bold text-slate-600 truncate">{{ d.name }}</div>
              <div class="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-750" [style.width]="d.score + '%'"></div>
              </div>
              <span class="text-xs font-black text-slate-800 w-8 text-right">{{ d.score }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Training & Skills Hub -->
      <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 class="text-xs font-black text-slate-700 uppercase">🎓 Training & Development</h3>
        <div class="space-y-3 text-xs">
          <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="font-bold text-slate-650">Total Training Sessions</span>
            <span class="font-black text-primary">8 sessions</span>
          </div>
          <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="font-bold text-slate-650">Total Certified Staff</span>
            <span class="font-black text-primary">24 employees</span>
          </div>
          <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="font-bold text-slate-650">YTD Budget Spent</span>
            <span class="font-black text-green-600">SAR 152,000</span>
          </div>
        </div>
      </div>

    </div>

  </div>
  `
})
export class HrExecutiveComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  readonly deptRanks = signal([
    { name: 'Drilling', score: 88 },
    { name: 'Engineering', score: 85 },
    { name: 'HSE', score: 84 },
    { name: 'Finance', score: 81 },
    { name: 'HR', score: 79 }
  ]);

  printReport() {
    window.print();
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.ent_exec_title' }
    ]);
  }
}
