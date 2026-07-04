import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { Employee, EmployeeAsset } from '../../../../shared/interfaces/employee.interface';

@Component({
  selector: 'app-hr-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      @if (selectedEmp()) {
        <!-- Profile Banner -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-3xl flex-shrink-0">
                👤
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-850 tracking-tight">{{ selectedEmp()?.fullName }}</h2>
                <p class="text-xs text-slate-500 font-semibold mt-0.5">
                  {{ selectedEmp()?.jobTitle }} · {{ getDeptName(selectedEmp()?.departmentId) }}
                </p>
                <div class="flex items-center gap-2 mt-1.5">
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase"
                    [class]="getStatusClass(selectedEmp()?.status)">
                    {{ selectedEmp()?.status }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono font-bold">{{ selectedEmp()?.employeeCode }}</span>
                </div>
              </div>
            </div>

            <!-- Profile Completion -->
            <div class="w-full sm:max-w-xs space-y-2">
              <div class="flex justify-between text-[10px] font-bold text-slate-500">
                <span>{{ 'hr.profile.lbl_completion' | translate }}</span>
                <span class="text-indigo-650">85%</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-600 rounded-full" style="width:85%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)"
              class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
              [class.bg-white]="activeTab() === tab.id"
              [class.shadow-sm]="activeTab() === tab.id"
              [class.text-slate-850]="activeTab() === tab.id"
              [class.text-slate-500]="activeTab() !== tab.id">
              {{ tab.label | translate }}
            </button>
          }
        </div>

        <!-- Tab Content -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-xs text-slate-700">

          <!-- Personal Information -->
          @if (activeTab() === 'personal') {
            <div class="space-y-4">
              <div class="flex justify-between items-center border-b pb-3">
                <h3 class="text-sm font-black text-slate-800">{{ 'hr.profile.tab_personal' | translate }}</h3>
                <button (click)="saveProfile()"
                  class="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all">
                  {{ 'hr.profile.btn_save' | translate }}
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">First Name</label>
                  <input type="text" [value]="selectedEmp()?.firstName || selectedEmp()?.fullName"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Second Name</label>
                  <input type="text" [value]="selectedEmp()?.secondName"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Third Name</label>
                  <input type="text" [value]="selectedEmp()?.thirdName"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Fourth Name</label>
                  <input type="text" [value]="selectedEmp()?.fourthName"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">National ID</label>
                  <input type="text" [value]="selectedEmp()?.nationalId"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Passport No.</label>
                  <input type="text" [value]="selectedEmp()?.passportNumber"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Gender</label>
                  <input type="text" [value]="selectedEmp()?.gender"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Nationality</label>
                  <input type="text" [value]="selectedEmp()?.nationality"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Birth Date</label>
                  <input type="text" [value]="selectedEmp()?.birthDate"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Age</label>
                  <input type="number" [value]="selectedEmp()?.age"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Marital Status</label>
                  <input type="text" [value]="selectedEmp()?.maritalStatus"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Religion</label>
                  <input type="text" [value]="selectedEmp()?.religion"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
              </div>
            </div>
          }

          <!-- Employment Info -->
          @if (activeTab() === 'employment') {
            <div class="space-y-4">
              <div class="flex justify-between items-center border-b pb-3">
                <h3 class="text-sm font-black text-slate-800">{{ 'hr.profile.tab_employment' | translate }}</h3>
                <button (click)="saveProfile()"
                  class="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all">
                  {{ 'hr.profile.btn_save' | translate }}
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Job Title</label>
                  <input type="text" [value]="selectedEmp()?.jobTitle"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Reporting Manager</label>
                  <input type="text" [value]="selectedEmp()?.manager"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Employment Type</label>
                  <input type="text" [value]="selectedEmp()?.employmentType"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Contract Type</label>
                  <input type="text" [value]="selectedEmp()?.contractType"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Hire Date</label>
                  <input type="text" [value]="selectedEmp()?.joiningDate"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Probation End Date</label>
                  <input type="text" [value]="selectedEmp()?.probationEndDate"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Cost Center</label>
                  <input type="text" [value]="selectedEmp()?.costCenter"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Work Location</label>
                  <input type="text" [value]="selectedEmp()?.workLocation"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Active Shift</label>
                  <input type="text" [value]="selectedEmp()?.shift"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Insurance No.</label>
                  <input type="text" [value]="selectedEmp()?.insuranceNumber"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
              </div>
            </div>
          }

          <!-- Contact Info -->
          @if (activeTab() === 'contact') {
            <div class="space-y-4">
              <div class="flex justify-between items-center border-b pb-3">
                <h3 class="text-sm font-black text-slate-800">{{ 'hr.profile.tab_contact' | translate }}</h3>
                <button (click)="saveProfile()"
                  class="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all">
                  {{ 'hr.profile.btn_save' | translate }}
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Phone</label>
                  <input type="text" [value]="selectedEmp()?.phone"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Corporate Email</label>
                  <input type="email" [value]="selectedEmp()?.email"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Emergency Contact</label>
                  <input type="text" [value]="selectedEmp()?.emergencyContactName"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div>
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Emergency Phone</label>
                  <input type="text" [value]="selectedEmp()?.emergencyContactPhone"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
                <div class="col-span-2">
                  <label class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Home Address</label>
                  <input type="text" [value]="selectedEmp()?.address"
                    class="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800">
                </div>
              </div>
            </div>
          }

          <!-- Salary -->
          @if (activeTab() === 'salary') {
            <div class="space-y-4">
              <h3 class="text-sm font-black text-slate-800 border-b pb-3">{{ 'hr.profile.tab_salary' | translate }}</h3>
              <div class="bg-slate-50 rounded-xl border border-slate-100 p-5 max-w-sm space-y-3">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-slate-500">{{ 'hr.profile.lbl_basic' | translate }}</span>
                  <span class="font-black text-slate-800">{{ selectedEmp()?.salary | number }} SAR</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-slate-500">{{ 'hr.profile.lbl_housing' | translate }}</span>
                  <span class="font-black text-slate-800">{{ (selectedEmp()?.salary ?? 0) * 0.1 | number }} SAR</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-slate-500">{{ 'hr.profile.lbl_trans' | translate }}</span>
                  <span class="font-black text-slate-800">800 SAR</span>
                </div>
                <div class="flex justify-between items-center text-xs border-t border-slate-200 pt-3">
                  <span class="font-black text-slate-700">{{ 'hr.profile.lbl_gross' | translate }}</span>
                  <span class="font-black text-primary text-sm">{{ (selectedEmp()?.salary ?? 0) * 1.1 + 800 | number }} SAR</span>
                </div>
              </div>
            </div>
          }

          <!-- Attendance & Leaves -->
          @if (activeTab() === 'attendance') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2">
                <h4 class="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">Biometric Sync Logs</h4>
                <p class="text-xs text-slate-600 font-bold mt-2">{{ 'hr.profile.lbl_days_present' | translate }}</p>
                <p class="text-xs text-slate-600 font-bold">{{ 'hr.profile.lbl_biometric_status' | translate }}</p>
              </div>
              <div class="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                <h4 class="font-bold text-slate-800 text-xs border-b border-slate-200 pb-2">Leave Balances</h4>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-600 font-bold">{{ 'hr.profile.lbl_annual_bal' | translate }}</span>
                  <strong class="text-slate-800">30 Days</strong>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-600 font-bold">{{ 'hr.profile.lbl_sick_bal' | translate }}</span>
                  <strong class="text-slate-800">15 Days</strong>
                </div>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-slate-600 font-bold">{{ 'hr.profile.lbl_used_bal' | translate }}</span>
                  <strong class="text-slate-800">0 Days</strong>
                </div>
              </div>
            </div>
          }

          <!-- Assets -->
          @if (activeTab() === 'assets') {
            <div class="space-y-4">
              <div class="flex justify-between items-center border-b pb-3">
                <h3 class="text-sm font-black text-slate-800">{{ 'hr.profile.tab_assets' | translate }}</h3>
                <button (click)="openAssignAssetModal()"
                  class="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all">
                  {{ 'hr.profile.btn_assign' | translate }}
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                      <th class="px-4 py-2.5">{{ 'hr.profile.col_name' | translate }}</th>
                      <th class="px-4 py-2.5">{{ 'hr.profile.col_code' | translate }}</th>
                      <th class="px-4 py-2.5">{{ 'hr.profile.col_assigned' | translate }}</th>
                      <th class="px-4 py-2.5">{{ 'hr.profile.col_returned' | translate }}</th>
                      <th class="px-4 py-2.5 text-center">{{ 'hr.profile.col_status' | translate }}</th>
                      <th class="px-4 py-2.5 text-center w-20">{{ 'hr.profile.col_action' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50 font-semibold text-slate-700">
                    @for (ast of selectedEmp()?.assets; track ast.id) {
                      <tr class="hover:bg-slate-50/40 transition-colors">
                        <td class="px-4 py-2.5 font-bold text-slate-800">{{ ast.name }}</td>
                        <td class="px-4 py-2.5 text-slate-500 font-mono">{{ ast.assetCode }}</td>
                        <td class="px-4 py-2.5 text-slate-400 font-mono">{{ ast.assignedDate }}</td>
                        <td class="px-4 py-2.5 text-slate-400 font-mono">{{ ast.returnedDate || '—' }}</td>
                        <td class="px-4 py-2.5 text-center">
                          <span class="inline-block px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase"
                            [class]="ast.status === 'Assigned' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-200'">
                            {{ ast.status }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          @if (ast.status === 'Assigned') {
                            <button (click)="returnAsset(ast.id)"
                              class="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 font-bold rounded text-[10px] transition-all">
                              {{ 'hr.profile.btn_return' | translate }}
                            </button>
                          } @else {
                            <span class="text-slate-400">—</span>
                          }
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-slate-400 text-xs">
                          {{ 'hr.profile.lbl_no_assets' | translate }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- History Timeline -->
          @if (activeTab() === 'history') {
            <div class="space-y-1">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">{{ 'hr.profile.tab_history' | translate }}</p>
              <div class="relative pl-6 border-l-2 border-slate-100 space-y-5">
                @for (evt of selectedEmp()?.history; track evt.id) {
                  <div class="relative">
                    <span class="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white flex-shrink-0"></span>
                    <p class="font-black text-slate-800 text-xs">{{ evt.type }}</p>
                    <p class="text-[11px] text-slate-500 font-semibold mt-0.5 leading-relaxed">{{ evt.details }}</p>
                    <p class="text-[10px] text-slate-400 font-semibold mt-0.5 font-mono">{{ evt.date }} · {{ evt.performedBy }}</p>
                  </div>
                } @empty {
                  <p class="text-slate-400 text-xs">No history recorded yet.</p>
                }
              </div>
            </div>
          }

        </div>
      } @else {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <p class="text-4xl mb-3">👤</p>
          <p class="text-sm font-bold text-slate-400">Select an employee from the list to view their profile dossier.</p>
        </div>
      }
    </div>

    <!-- Assign Asset Modal -->
    @if (showAssetModal()) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div class="flex justify-between items-center border-b pb-2">
            <h3 class="text-sm font-black text-slate-800">{{ 'hr.profile.modal_title' | translate }}</h3>
            <button (click)="closeAssignAssetModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="font-bold text-slate-500">{{ 'hr.profile.lbl_type' | translate }}</label>
              <select [(ngModel)]="assetForm.name"
                class="w-full mt-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Phone">Phone</option>
                <option value="SIM">SIM Card</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Access Card">Access Card</option>
                <option value="Office Keys">Office Keys</option>
                <option value="Uniform">Uniform</option>
                <option value="Safety Equipment">Safety Equipment</option>
              </select>
            </div>
            <div>
              <label class="font-bold text-slate-500">{{ 'hr.profile.lbl_serial' | translate }}</label>
              <input [(ngModel)]="assetForm.code" type="text" placeholder="e.g. ASSET-LP-998"
                class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2 border-t">
            <button (click)="closeAssignAssetModal()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
            <button (click)="submitAssignAsset()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.profile.btn_assign_action' | translate }}</button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hrService = inject(HrMockService);

  empId = signal<string | null>(null);
  activeTab = signal<string>('personal');
  showAssetModal = signal(false);
  assetForm = { name: 'Laptop' as EmployeeAsset['name'], code: '' };

  readonly tabs = [
    { id: 'personal',   label: 'hr.profile.tab_personal'   },
    { id: 'employment', label: 'hr.profile.tab_employment' },
    { id: 'contact',    label: 'hr.profile.tab_contact'    },
    { id: 'salary',     label: 'hr.profile.tab_salary'     },
    { id: 'attendance', label: 'hr.profile.tab_attendance' },
    { id: 'assets',     label: 'hr.profile.tab_assets'     },
    { id: 'history',    label: 'hr.profile.tab_history'    },
  ] as const;

  readonly selectedEmp = computed(() => {
    const id = this.empId();
    if (!id) return null;
    return this.hrService.employees().find(e => e.id === id) ?? null;
  });

  getDeptName(id?: string): string {
    if (!id) return '';
    return this.hrService.departments().find(d => d.id === id)?.name ?? '';
  }

  saveProfile() {
    this.hrService.notify.success('hr.common.msg_profile_saved', 'Employee dossier updated.');
  }

  openAssignAssetModal() {
    this.assetForm = { name: 'Laptop', code: `ASSET-${Math.floor(1000 + Math.random() * 9000)}` };
    this.showAssetModal.set(true);
  }
  closeAssignAssetModal() { this.showAssetModal.set(false); }

  submitAssignAsset() {
    const emp = this.selectedEmp();
    if (!emp || !this.assetForm.code.trim()) return;
    this.hrService.assignAsset(emp.id, this.assetForm.name, this.assetForm.code);
    this.closeAssignAssetModal();
  }

  returnAsset(assetId: string) {
    const emp = this.selectedEmp();
    if (emp) this.hrService.returnAsset(emp.id, assetId);
  }

  getStatusClass(status?: Employee['status']): string {
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
      { label: 'hr.profile.title' }
    ]);
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      this.empId.set(id ?? (this.hrService.employees()[0]?.id ?? null));
    });
  }
}
