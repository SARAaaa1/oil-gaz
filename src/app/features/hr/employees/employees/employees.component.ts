import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { Employee } from '../../../../shared/interfaces/employee.interface';

@Component({
  selector: 'app-hr-employees-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.employees.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.employees.subtitle' | translate }}</p>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-1.5">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.employees.lbl_total' | translate }}</p>
          <p class="text-2xl font-black text-slate-850">{{ totalCount() }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-1.5">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.employees.lbl_active' | translate }}</p>
          <p class="text-2xl font-black text-green-600">{{ activeCount() }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-1.5">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.employees.lbl_leave' | translate }}</p>
          <p class="text-2xl font-black text-blue-600">{{ leaveCount() }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-1.5">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.employees.lbl_suspended' | translate }}</p>
          <p class="text-2xl font-black text-amber-600">{{ suspendedCount() }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-1.5">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.employees.lbl_resigned' | translate }}</p>
          <p class="text-2xl font-black text-slate-400">{{ resignedCount() }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.common.search' | translate }}</label>
          <input [(ngModel)]="searchQuery" type="text"
            [placeholder]="'hr.common.search_placeholder' | translate"
            class="w-full mt-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.common.department' | translate }}</label>
          <select [(ngModel)]="deptFilter"
            class="w-full mt-1.5 px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="ALL">{{ 'hr.common.all_departments' | translate }}</option>
            @for (dept of hrService.departments(); track dept.id) {
              <option [value]="dept.id">{{ dept.name }}</option>
            }
          </select>
        </div>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.common.status' | translate }}</label>
          <select [(ngModel)]="statusFilter"
            class="w-full mt-1.5 px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="ALL">{{ 'hr.common.all_statuses' | translate }}</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Suspended">Suspended</option>
            <option value="Resigned">Resigned</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.employees.lbl_designation' | translate }}</label>
          <input [(ngModel)]="titleFilter" type="text"
            placeholder="e.g. Engineer"
            class="w-full mt-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500">
        </div>
        <div class="flex items-end">
          <button (click)="resetFilters()"
            class="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors">
            🔄 {{ 'hr.common.reset' | translate }}
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th class="px-4 py-3">{{ 'hr.employees.col_code' | translate }}</th>
                <th class="px-4 py-3">{{ 'hr.employees.col_name' | translate }}</th>
                <th class="px-4 py-3">{{ 'hr.employees.col_title' | translate }}</th>
                <th class="px-4 py-3">{{ 'hr.employees.col_dept' | translate }}</th>
                <th class="px-4 py-3">{{ 'hr.employees.col_date' | translate }}</th>
                <th class="px-4 py-3 text-right">{{ 'hr.employees.col_salary' | translate }}</th>
                <th class="px-4 py-3 text-center">{{ 'hr.employees.col_status' | translate }}</th>
                <th class="px-4 py-3 text-center w-36">{{ 'hr.employees.col_actions' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 font-semibold text-slate-700">
              @for (emp of filteredEmployees(); track emp.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-4 py-3 text-slate-400 font-mono text-[10px]">{{ emp.employeeCode }}</td>
                  <td class="px-4 py-3 font-bold text-slate-800">{{ emp.fullName }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ emp.jobTitle }}</td>
                  <td class="px-4 py-3 text-slate-500">{{ getDeptName(emp.departmentId) }}</td>
                  <td class="px-4 py-3 text-slate-400 font-mono">{{ emp.joiningDate }}</td>
                  <td class="px-4 py-3 text-right text-slate-800">{{ emp.salary | number }} SAR</td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase"
                      [class]="getStatusClass(emp.status)">{{ emp.status }}</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <a [routerLink]="['/hr/employees/profile']" [queryParams]="{ id: emp.id }"
                        class="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold transition-all">
                        {{ 'hr.employees.btn_dossier' | translate }}
                      </a>
                      <button (click)="openQuickModal(emp)"
                        class="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all">
                        {{ 'hr.employees.btn_adjust' | translate }}
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-4 py-12 text-center">
                    <p class="text-3xl mb-2">👥</p>
                    <p class="text-sm font-bold text-slate-400">{{ 'hr.employees.lbl_no_emp' | translate }}</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Adjust Modal -->
      @if (showQuickModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div class="flex justify-between items-center border-b pb-3">
              <div>
                <h3 class="text-sm font-black text-slate-800">{{ 'hr.employees.modal_title' | translate }}</h3>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ selectedEmp()?.fullName }} · {{ selectedEmp()?.employeeCode }}</p>
              </div>
              <button (click)="closeQuickModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>

            <!-- Tab Bar -->
            <div class="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button (click)="modalTab.set('promote')" 
                class="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                [class.bg-white]="modalTab() === 'promote'"
                [class.text-slate-800]="modalTab() === 'promote'"
                [class.text-slate-500]="modalTab() !== 'promote'">
                {{ 'hr.employees.tab_promote' | translate }}
              </button>
              <button (click)="modalTab.set('transfer')"
                class="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                [class.bg-white]="modalTab() === 'transfer'"
                [class.text-slate-800]="modalTab() === 'transfer'"
                [class.text-slate-500]="modalTab() !== 'transfer'">
                {{ 'hr.employees.tab_transfer' | translate }}
              </button>
              <button (click)="modalTab.set('status')"
                class="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                [class.bg-white]="modalTab() === 'status'"
                [class.text-slate-800]="modalTab() === 'status'"
                [class.text-slate-500]="modalTab() !== 'status'">
                {{ 'hr.employees.tab_status' | translate }}
              </button>
            </div>

            <div class="text-xs space-y-3">
              <!-- Promote Tab -->
              @if (modalTab() === 'promote') {
                <div class="space-y-3">
                  <div>
                    <label class="font-bold text-slate-500">{{ 'hr.employees.lbl_new_title' | translate }}</label>
                    <input [(ngModel)]="promoForm.title" type="text"
                      class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  </div>
                  <div>
                    <label class="font-bold text-slate-500">{{ 'hr.employees.lbl_new_sal' | translate }}</label>
                    <input [(ngModel)]="promoForm.salary" type="number"
                      class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  </div>
                  <button (click)="submitPromotion()"
                    class="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-sm transition-all">
                    {{ 'hr.employees.btn_promo' | translate }}
                  </button>
                </div>
              }

              <!-- Transfer Tab -->
              @if (modalTab() === 'transfer') {
                <div class="space-y-3">
                  <div>
                    <label class="font-bold text-slate-500">{{ 'hr.employees.lbl_target_dept' | translate }}</label>
                    <select [(ngModel)]="transForm.deptId"
                      class="w-full mt-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                      @for (dept of hrService.departments(); track dept.id) {
                        <option [value]="dept.id">{{ dept.name }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="font-bold text-slate-500">{{ 'hr.employees.lbl_manager' | translate }}</label>
                    <input [(ngModel)]="transForm.manager" type="text"
                      class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  </div>
                  <button (click)="submitTransfer()"
                    class="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-sm transition-all">
                    {{ 'hr.employees.btn_trans' | translate }}
                  </button>
                </div>
              }

              <!-- Status Tab -->
              @if (modalTab() === 'status') {
                <div class="grid grid-cols-2 gap-3 pt-1">
                  <button (click)="suspendEmployee()"
                    class="py-4 bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 rounded-xl font-bold flex flex-col items-center gap-2 transition-all">
                    <span class="text-2xl">⏸️</span>
                    <span class="text-[10px]">{{ 'hr.employees.btn_susp' | translate }}</span>
                  </button>
                  <button (click)="terminateEmployee()"
                    class="py-4 bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 rounded-xl font-bold flex flex-col items-center gap-2 transition-all">
                    <span class="text-2xl">⏹️</span>
                    <span class="text-[10px]">{{ 'hr.employees.btn_term' | translate }}</span>
                  </button>
                </div>
              }
            </div>

            <div class="flex justify-end pt-2 border-t">
              <button (click)="closeQuickModal()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.close' | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrEmployeesListComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hrService = inject(HrMockService);

  searchQuery = '';
  deptFilter = 'ALL';
  statusFilter = 'ALL';
  titleFilter = '';

  showQuickModal = signal(false);
  selectedEmp = signal<Employee | null>(null);
  modalTab = signal<'promote' | 'transfer' | 'status'>('promote');

  promoForm = { title: '', salary: 10000 };
  transForm = { deptId: 'dept1', manager: '' };

  readonly totalCount     = computed(() => this.hrService.employees().length);
  readonly activeCount    = computed(() => this.hrService.employees().filter(e => e.status === 'Active').length);
  readonly leaveCount     = computed(() => this.hrService.employees().filter(e => e.status === 'On Leave').length);
  readonly suspendedCount = computed(() => this.hrService.employees().filter(e => e.status === 'Suspended').length);
  readonly resignedCount  = computed(() => this.hrService.employees().filter(e => e.status === 'Resigned').length);

  readonly filteredEmployees = computed(() => {
    let list = this.hrService.employees();
    const query = this.searchQuery.trim().toLowerCase();
    if (this.deptFilter !== 'ALL')   list = list.filter(e => e.departmentId === this.deptFilter);
    if (this.statusFilter !== 'ALL') list = list.filter(e => e.status === this.statusFilter);
    if (this.titleFilter.trim())     list = list.filter(e => e.jobTitle.toLowerCase().includes(this.titleFilter.trim().toLowerCase()));
    if (query) list = list.filter(e => e.fullName.toLowerCase().includes(query) || e.employeeCode.toLowerCase().includes(query) || e.phone.includes(query));
    return list;
  });

  getDeptName(id: string): string {
    return this.hrService.departments().find(d => d.id === id)?.name ?? '—';
  }

  resetFilters() {
    this.searchQuery = '';
    this.deptFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.titleFilter = '';
  }

  openQuickModal(emp: Employee) {
    this.selectedEmp.set(emp);
    this.promoForm = { title: emp.jobTitle, salary: emp.salary };
    this.transForm = { deptId: emp.departmentId, manager: emp.manager ?? '' };
    this.modalTab.set('promote');
    this.showQuickModal.set(true);
  }

  closeQuickModal() { this.showQuickModal.set(false); }

  submitPromotion() {
    const emp = this.selectedEmp();
    if (!emp || !this.promoForm.title.trim() || this.promoForm.salary <= 0) return;
    this.hrService.promoteEmployee(emp.id, this.promoForm.title, this.promoForm.salary);
    this.closeQuickModal();
  }

  submitTransfer() {
    const emp = this.selectedEmp();
    if (!emp || !this.transForm.deptId || !this.transForm.manager.trim()) return;
    this.hrService.transferEmployee(emp.id, this.transForm.deptId, this.transForm.manager);
    this.closeQuickModal();
  }

  suspendEmployee() {
    const emp = this.selectedEmp();
    if (emp) { this.hrService.suspendEmployee(emp.id); this.closeQuickModal(); }
  }

  terminateEmployee() {
    const emp = this.selectedEmp();
    if (emp) { this.hrService.terminateEmployee(emp.id); this.closeQuickModal(); }
  }

  getStatusClass(status: Employee['status']): string {
    switch (status) {
      case 'Active':    return 'bg-green-50 text-green-700 border border-green-100';
      case 'On Leave':  return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Probation': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Suspended': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Resigned':  return 'bg-slate-50 text-slate-500 border border-slate-200';
      default:          return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.employees.title' }
    ]);
  }
}
