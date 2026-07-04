import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { Candidate } from '../../../../shared/interfaces/candidate.interface';

@Component({
  selector: 'app-hr-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.applications.title' | translate }}</h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.applications.subtitle' | translate }}</p>
        </div>
        <button (click)="openAddModal()"
          class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-sm self-start md:self-auto">
          ➕ {{ 'hr.applications.btn_add' | translate }}
        </button>
      </div>

      <!-- Advanced Filters -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <!-- Search -->
        <div class="lg:col-span-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.common.search' | translate }}</label>
          <input [(ngModel)]="searchQuery" type="text"
            [placeholder]="'hr.common.search_placeholder' | translate"
            class="w-full mt-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
        </div>
        <!-- Department -->
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.common.department' | translate }}</label>
          <select [(ngModel)]="deptFilter"
            class="w-full mt-1.5 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
            <option value="ALL">{{ 'hr.common.all_departments' | translate }}</option>
            <option value="Engineering">Engineering</option>
            <option value="Finance">Finance</option>
            <option value="HSE">HSE</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
        <!-- Position -->
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.common.position' | translate }}</label>
          <input [(ngModel)]="posFilter" type="text"
            placeholder="e.g. Drilling"
            class="w-full mt-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
        </div>
        <!-- Status -->
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.common.status' | translate }}</label>
          <select [(ngModel)]="statusFilter"
            class="w-full mt-1.5 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
            <option value="ALL">{{ 'hr.common.all_statuses' | translate }}</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Rejected">Rejected</option>
            <option value="Hired">Hired</option>
          </select>
        </div>
        <!-- Reset -->
        <div class="flex items-end">
          <button (click)="resetFilters()"
            class="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-655 text-xs font-bold rounded-lg transition-colors">
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
                <th class="px-4 py-3">{{ 'hr.applications.col_no' | translate }}</th>
                <th class="px-4 py-3">{{ 'hr.applications.col_name' | translate }}</th>
                <th class="px-4 py-3">{{ 'hr.applications.col_position' | translate }}</th>
                <th class="px-4 py-3">{{ 'hr.applications.col_dept' | translate }}</th>
                <th class="px-4 py-3">{{ 'hr.applications.col_date' | translate }}</th>
                <th class="px-4 py-3 text-center">{{ 'hr.applications.col_exp' | translate }}</th>
                <th class="px-4 py-3">{{ 'hr.applications.col_edu' | translate }}</th>
                <th class="px-4 py-3 text-right">{{ 'hr.applications.col_salary' | translate }}</th>
                <th class="px-4 py-3 text-center">{{ 'hr.common.status' | translate }}</th>
                <th class="px-4 py-3 text-center w-28">{{ 'hr.common.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 font-semibold text-slate-700">
              @for (app of filteredApplications(); track app.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-4 py-3 text-slate-400 font-mono text-[10px]">{{ app.id }}</td>
                  <td class="px-4 py-3 font-bold text-slate-800">{{ app.fullName }}</td>
                  <td class="px-4 py-3 text-slate-655">{{ app.position }}</td>
                  <td class="px-4 py-3 text-slate-500">{{ app.department }}</td>
                  <td class="px-4 py-3 text-slate-400 font-mono">{{ app.appliedDate }}</td>
                  <td class="px-4 py-3 text-center">{{ app.experienceYears }} {{ 'hr.dashboard.days' | translate }}</td>
                  <td class="px-4 py-3 text-slate-500 truncate max-w-32">{{ app.education }}</td>
                  <td class="px-4 py-3 text-right text-slate-800">{{ app.expectedSalary | number }} SAR</td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase"
                      [class]="getStatusClass(app.status)">
                      {{ app.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <button (click)="moveCandidate(app.id)" [disabled]="app.status !== 'New'"
                        class="p-1 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary transition-all disabled:opacity-40"
                        [title]="'hr.common.view' | translate">
                        ✔️
                      </button>
                      <button (click)="rejectCandidate(app.id)" [disabled]="app.status === 'Rejected' || app.status === 'Hired'"
                        class="p-1 rounded bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 transition-all disabled:opacity-40"
                        [title]="'hr.common.delete' | translate">
                        ❌
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="10" class="px-4 py-12 text-center text-slate-400">
                    <p class="text-sm font-bold">{{ 'hr.common.no_records' | translate }}</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="text-base font-black text-slate-800">{{ 'hr.applications.modal_title' | translate }}</h3>
              <button (click)="closeAddModal()" class="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.applications.label_name' | translate }}</label>
                <input [(ngModel)]="form.fullName" type="text" class="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.applications.label_email' | translate }}</label>
                <input [(ngModel)]="form.email" type="email" class="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.applications.label_phone' | translate }}</label>
                <input [(ngModel)]="form.phone" type="text" class="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.applications.label_pos' | translate }}</label>
                <input [(ngModel)]="form.position" type="text" class="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.applications.label_dept' | translate }}</label>
                <select [(ngModel)]="form.department" class="w-full mt-1 px-2 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="Engineering">Engineering</option>
                  <option value="Finance">Finance</option>
                  <option value="HSE">HSE</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.applications.label_exp' | translate }}</label>
                <input [(ngModel)]="form.experienceYears" type="number" class="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.applications.label_edu' | translate }}</label>
                <input [(ngModel)]="form.education" type="text" class="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.applications.label_sal' | translate }}</label>
                <input [(ngModel)]="form.expectedSalary" type="number" class="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t">
              <button (click)="closeAddModal()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
              <button (click)="submit()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.common.submit' | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrApplicationsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly hrService = inject(HrMockService);

  // Filter Models
  searchQuery = '';
  deptFilter = 'ALL';
  posFilter = '';
  statusFilter = 'ALL';

  // Modal Model
  showAddModal = signal(false);
  form = this.getEmptyForm();

  // Computed Filtered List
  readonly filteredApplications = computed(() => {
    let list = this.hrService.candidates();
    const query = this.searchQuery.trim().toLowerCase();
    const dept = this.deptFilter;
    const pos = this.posFilter.trim().toLowerCase();
    const status = this.statusFilter;

    if (dept !== 'ALL') {
      list = list.filter(a => a.department === dept);
    }
    if (pos) {
      list = list.filter(a => a.position.toLowerCase().includes(pos));
    }
    if (status !== 'ALL') {
      list = list.filter(a => a.status === status);
    }
    if (query) {
      list = list.filter(a => 
        a.fullName.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.phone.includes(query)
      );
    }

    return list;
  });

  resetFilters() {
    this.searchQuery = '';
    this.deptFilter = 'ALL';
    this.posFilter = '';
    this.statusFilter = 'ALL';
  }

  openAddModal() {
    this.form = this.getEmptyForm();
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  submit() {
    if (!this.form.fullName.trim() || !this.form.email.trim() || !this.form.phone.trim() || !this.form.position.trim()) {
      return;
    }
    const success = this.hrService.submitApplication(this.form);
    if (success) {
      this.closeAddModal();
    }
  }

  moveCandidate(id: string) {
    this.hrService.moveToCandidates(id);
  }

  rejectCandidate(id: string) {
    this.hrService.rejectCandidate(id);
  }

  getStatusClass(status: Candidate['status']): string {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Under Review': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Shortlisted': return 'bg-teal-50 text-teal-700 border border-teal-100';
      case 'Interviewing': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'Offered': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Hired': return 'bg-green-50 text-green-700 border border-green-100';
      case 'Rejected': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  }

  getEmptyForm() {
    return {
      fullName: '',
      email: '',
      phone: '',
      position: '',
      department: 'Engineering',
      experienceYears: 0,
      education: '',
      expectedSalary: 10000
    };
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.applications.title' }
    ]);
  }
}
