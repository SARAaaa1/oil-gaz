import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-reports-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-5" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div><h1 class="text-2xl font-black text-slate-800">{{ 'hr.reports.emp_title' | translate }}</h1><p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.emp_subtitle' | translate }}</p></div>
      <div class="flex gap-2">
        <button class="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_pdf' | translate }}</button>
        <button class="px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold">{{ 'hr.reports.export_excel' | translate }}</button>
      </div>
    </div>
    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-primary">{{ hr.employees().length }}</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.reports.exec_headcount' | translate }}</p></div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-green-600">{{ activeEmps() }}</p><p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.reports.emp_active' | translate }}</p></div>
      <div class="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center"><p class="text-3xl font-black text-amber-600">{{ newHires() }}</p><p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.reports.emp_new_hires' | translate }}</p></div>
      <div class="bg-slate-100 rounded-2xl border border-slate-200 shadow-sm p-4 text-center"><p class="text-3xl font-black text-slate-600">{{ avgTenure() }}</p><p class="text-[10px] font-bold text-slate-500 uppercase mt-1">{{ 'hr.reports.emp_avg_tenure' | translate }}</p></div>
    </div>
    <!-- Tabs -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="flex border-b border-slate-100 overflow-x-auto">
        @for (tab of tabs; track tab) {
          <button (click)="activeTab = tab" [class]="activeTab === tab ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-slate-500 hover:text-slate-700'" class="px-4 py-3 text-[11px] font-bold whitespace-nowrap transition-colors">{{ tab }}</button>
        }
      </div>
      <div class="p-4">
        @if (activeTab === 'By Department') {
          <table class="w-full text-xs">
            <thead class="bg-slate-50"><tr>
              <th class="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.emp_col_dept' | translate }}</th>
              <th class="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.emp_col_count' | translate }}</th>
              <th class="px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.emp_col_pct' | translate }}</th>
              <th class="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Distribution</th>
            </tr></thead>
            <tbody class="divide-y divide-slate-50">
              @for (d of deptTable(); track d.name) {
                <tr class="hover:bg-slate-50/50">
                  <td class="px-3 py-2.5 font-bold text-slate-800">{{ d.name }}</td>
                  <td class="px-3 py-2.5 text-center font-black text-primary">{{ d.count }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-600 font-semibold">{{ d.pct }}%</td>
                  <td class="px-3 py-2.5"><div class="bg-slate-100 rounded-full h-2 overflow-hidden"><div class="h-full bg-primary rounded-full" [style.width]="d.pct + '%'"></div></div></td>
                </tr>
              }
            </tbody>
          </table>
        }
        @if (activeTab === 'By Gender') {
          <div class="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
            @for (g of genderData(); track g.label) {
              <div class="text-center p-6 rounded-2xl border" [class]="g.bgClass">
                <p class="text-4xl font-black" [class]="g.textClass">{{ g.pct }}%</p>
                <p class="text-2xl mt-1">{{ g.icon }}</p>
                <p class="font-bold mt-2" [class]="g.textClass">{{ g.label }}</p>
                <p class="text-slate-500 text-sm font-semibold">{{ g.count }} employees</p>
              </div>
            }
          </div>
        }
        @if (activeTab === 'By Age Group') {
          <div class="space-y-3 pt-2">
            @for (a of ageData(); track a.label) {
              <div class="flex items-center gap-4">
                <div class="w-20 text-[11px] font-bold text-slate-600">{{ a.label }}</div>
                <div class="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden relative">
                  <div class="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all" [style.width]="a.pct + '%'"></div>
                  <span class="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-luminosity">{{ a.count }} ({{ a.pct }}%)</span>
                </div>
              </div>
            }
          </div>
        }
        @if (activeTab === 'By Status') {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            @for (s of statusData(); track s.label) {
              <div class="text-center p-4 rounded-2xl border" [class]="s.bgClass">
                <p class="text-3xl font-black" [class]="s.textClass">{{ s.count }}</p>
                <p class="text-[11px] font-bold mt-1" [class]="s.textClass">{{ s.label }}</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  </div>
  `
})
export class HrReportsEmployeesComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);
  activeTab = 'By Department';
  readonly tabs = ['By Department', 'By Gender', 'By Age Group', 'By Status'];
  readonly activeEmps = computed(() => Math.round(this.hr.employees().length * 0.92));
  readonly newHires = computed(() => 8);
  readonly avgTenure = computed(() => '3.4y');
  readonly deptTable = computed(() => {
    const total = this.hr.employees().length;
    return ['Engineering','HR','Finance','Operations','HSE','Maintenance','Drilling','IT','Legal'].map((name, i) => ({ name, count: 8 + i * 2, pct: Math.round((8 + i * 2) / (total || 1) * 100) })).sort((a, b) => b.count - a.count);
  });
  readonly genderData = computed(() => [
    { label: 'Male', count: Math.round(this.hr.employees().length * 0.73), pct: 73, icon: '👨', bgClass: 'border-blue-100 bg-blue-50', textClass: 'text-blue-700' },
    { label: 'Female', count: Math.round(this.hr.employees().length * 0.27), pct: 27, icon: '👩', bgClass: 'border-pink-100 bg-pink-50', textClass: 'text-pink-700' },
  ]);
  readonly ageData = computed(() => [
    { label: '20–25', count: 8, pct: 13 }, { label: '26–30', count: 14, pct: 23 },
    { label: '31–35', count: 16, pct: 27 }, { label: '36–40', count: 12, pct: 20 },
    { label: '41–50', count: 7, pct: 12 }, { label: '50+', count: 3, pct: 5 },
  ]);
  readonly statusData = computed(() => [
    { label: 'Active', count: 54, bgClass: 'border-green-100 bg-green-50', textClass: 'text-green-700' },
    { label: 'On Leave', count: 6, bgClass: 'border-amber-100 bg-amber-50', textClass: 'text-amber-700' },
    { label: 'Probation', count: 4, bgClass: 'border-blue-100 bg-blue-50', textClass: 'text-blue-700' },
    { label: 'Terminated', count: 2, bgClass: 'border-red-100 bg-red-50', textClass: 'text-red-700' },
  ]);
  ngOnInit() { this.bc.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'navigation.reports' }, { label: 'hr.reports.nav_employees' }]); }
}
