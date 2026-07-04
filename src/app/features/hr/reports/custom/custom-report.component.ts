import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-reports-custom',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800">{{ 'hr.reports.custom_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.custom_subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <button (click)="resetBuilder()" class="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold">{{ 'hr.reports.custom_clear' | translate }}</button>
        <button (click)="exportData()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">{{ 'hr.reports.btn_export' | translate }}</button>
      </div>
    </div>

    <!-- Builder Workspace -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      <!-- Control Panel -->
      <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5 text-xs">
        
        <!-- Select Module -->
        <div>
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">{{ 'hr.reports.custom_select_module' | translate }}</label>
          <select [(ngModel)]="selectedModule" (change)="onModuleChange()" class="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none">
            <option value="employees">👥 {{ 'hr.reports.custom_module_employees' | translate }}</option>
            <option value="attendance">📅 {{ 'hr.reports.custom_module_attendance' | translate }}</option>
            <option value="leaves">🍂 {{ 'hr.reports.custom_module_leaves' | translate }}</option>
            <option value="payroll">💰 {{ 'hr.reports.custom_module_payroll' | translate }}</option>
            <option value="performance">🏆 {{ 'hr.reports.custom_module_performance' | translate }}</option>
          </select>
        </div>

        <!-- Select Fields -->
        <div>
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">{{ 'hr.reports.custom_select_fields' | translate }}</label>
          <div class="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            @for (f of availableFields(); track f.key) {
              <label class="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" [checked]="f.selected" (change)="toggleField(f)" class="w-4 h-4 rounded text-primary focus:ring-primary border-slate-350 accent-primary">
                <span>{{ f.label }}</span>
              </label>
            }
          </div>
        </div>

        <!-- Add Filter -->
        <div>
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider">{{ 'hr.reports.custom_add_filter' | translate }}</label>
          <div class="mt-1.5 space-y-2">
            <select [(ngModel)]="filterField" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none">
              <option value="">— Select Field —</option>
              @for (f of availableFields(); track f.key) {
                <option [value]="f.key">{{ f.label }}</option>
              }
            </select>
            <input [(ngModel)]="filterValue" type="text" placeholder="Value..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none">
          </div>
        </div>

      </div>

      <!-- Preview Table -->
      <div class="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[400px]">
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-xs">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                @for (h of activeHeaders(); track h.key) {
                  <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ h.label }}</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (row of filteredData(); track row) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  @for (h of activeHeaders(); track h.key) {
                    <td class="px-4 py-3 font-semibold text-slate-700">{{ row[h.key] }}</td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td [attr.colspan]="activeHeaders().length || 1" class="px-4 py-16 text-center text-slate-400 text-xs font-semibold">
                    <span class="text-3xl block mb-2">📊</span>
                    {{ 'hr.reports.custom_no_data' | translate }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{{ filteredData().length }} {{ 'hr.reports.custom_rows' | translate }}</span>
          <span>PetroFlow Custom Analytics</span>
        </div>
      </div>

    </div>

  </div>
  `
})
export class HrReportsCustomComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  selectedModule = 'employees';
  filterField = '';
  filterValue = '';

  // Configurable fields list based on selected module
  private fieldsMap: Record<string, { key: string; label: string; selected: boolean }[]> = {
    employees: [
      { key: 'id', label: 'ID', selected: true },
      { key: 'fullName', label: 'Full Name', selected: true },
      { key: 'departmentId', label: 'Department', selected: true },
      { key: 'jobTitleId', label: 'Job Title', selected: false },
      { key: 'hireDate', label: 'Hire Date', selected: false },
      { key: 'status', label: 'Status', selected: true }
    ],
    attendance: [
      { key: 'employeeName', label: 'Employee', selected: true },
      { key: 'date', label: 'Date', selected: true },
      { key: 'clockIn', label: 'Clock In', selected: true },
      { key: 'clockOut', label: 'Clock Out', selected: true },
      { key: 'status', label: 'Status', selected: true }
    ],
    leaves: [
      { key: 'employeeName', label: 'Employee', selected: true },
      { key: 'leaveType', label: 'Leave Type', selected: true },
      { key: 'startDate', label: 'Start Date', selected: true },
      { key: 'endDate', label: 'End Date', selected: true },
      { key: 'status', label: 'Status', selected: true }
    ],
    payroll: [
      { key: 'employeeName', label: 'Employee', selected: true },
      { key: 'month', label: 'Month', selected: true },
      { key: 'basicSalary', label: 'Basic Salary', selected: true },
      { key: 'allowances', label: 'Allowances', selected: true },
      { key: 'netSalary', label: 'Net Pay', selected: true }
    ],
    performance: [
      { key: 'employeeName', label: 'Employee', selected: true },
      { key: 'period', label: 'Period', selected: true },
      { key: 'overallScore', label: 'Score', selected: true },
      { key: 'finalRating', label: 'Rating', selected: true },
      { key: 'status', label: 'Status', selected: true }
    ]
  };

  availableFields = signal(this.fieldsMap['employees']);

  activeHeaders = computed(() => this.availableFields().filter(f => f.selected));

  onModuleChange() {
    this.availableFields.set(this.fieldsMap[this.selectedModule]);
    this.filterField = '';
    this.filterValue = '';
  }

  toggleField(field: any) {
    this.availableFields.update(list => list.map(f => f.key === field.key ? { ...f, selected: !f.selected } : f));
  }

  // Generate dataset dynamically from existing mock services
  private getRawData(): any[] {
    if (this.selectedModule === 'employees') {
      return this.hr.employees();
    } else if (this.selectedModule === 'attendance') {
      return this.hr.attendanceRecords();
    } else if (this.selectedModule === 'leaves') {
      return this.hr.leaveRequests();
    } else if (this.selectedModule === 'payroll') {
      return this.hr.payrollRecords();
    } else if (this.selectedModule === 'performance') {
      return this.hr.performanceEvals();
    }
    return [];
  }

  filteredData = computed(() => {
    let list = this.getRawData();
    const fField = this.filterField;
    const fVal = this.filterValue.toLowerCase();

    if (fField && fVal) {
      list = list.filter((row: any) => {
        const valStr = String(row[fField] || '').toLowerCase();
        return valStr.includes(fVal);
      });
    }

    return list;
  });

  resetBuilder() {
    this.filterField = '';
    this.filterValue = '';
    // Reset selections
    Object.keys(this.fieldsMap).forEach(k => {
      this.fieldsMap[k].forEach((f, idx) => {
        this.fieldsMap[k][idx].selected = idx < 4;
      });
    });
    this.availableFields.set(this.fieldsMap[this.selectedModule]);
  }

  exportData() {
    this.hr.notify.success('hr.common.success', 'Data exported successfully.');
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'navigation.reports' },
      { label: 'hr.reports.nav_custom' }
    ]);
  }
}
