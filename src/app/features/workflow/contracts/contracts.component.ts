import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { Contract, RateSheetItem, ContractMilestone, ContractStatus, ContractType } from '../../../shared/interfaces/workflow.interface';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">Contracts Management</h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">Manage Oil & Gas operations service agreements, rate sheets, and milestone payments</p>
        </div>
        <button 
          *ngIf="canCreate()"
          (click)="openCreateModal()"
          class="px-4.5 py-2.5 bg-primary hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Contract</span>
        </button>
      </div>

      <!-- Main Layout Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <!-- Contracts Ledger List (Left Column) -->
        <div class="xl:col-span-2 space-y-4">
          <!-- Filters Toolbar -->
          <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-xs font-semibold text-slate-500 flex flex-col md:flex-row gap-3">
            <div class="flex-1 relative">
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Search by contract #, title, client, rig, or PM..." 
                class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50"
              />
              <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div class="flex gap-2">
              <select 
                [(ngModel)]="statusFilter" 
                class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-bold focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Suspended">Suspended</option>
              </select>

              <select 
                [(ngModel)]="typeFilter" 
                class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-bold focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="Daily Rate">Daily Rate</option>
                <option value="Time & Material">Time & Material</option>
                <option value="Lump Sum">Lump Sum</option>
              </select>
            </div>
          </div>

          <!-- Cards List -->
          <div class="space-y-3">
            @for (contract of filteredContracts(); track contract.id) {
              <div 
                (click)="selectContract(contract)"
                class="bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-sm relative group"
                [class.border-indigo-500]="selectedContract()?.id === contract.id"
                [class.border-slate-100]="selectedContract()?.id !== contract.id"
                [class.bg-indigo-50]="selectedContract()?.id === contract.id"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-center space-x-2">
                      <span class="text-xs font-mono font-bold text-slate-400 bg-slate-150 px-2 py-0.5 rounded">
                        {{ contract.contractNumber }}
                      </span>
                      <span 
                        class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
                        [class.bg-green-50]="contract.status === 'Active'"
                        [class.text-success]="contract.status === 'Active'"
                        [class.bg-amber-50]="contract.status === 'Draft'"
                        [class.text-accent]="contract.status === 'Draft'"
                        [class.bg-red-50]="contract.status === 'Suspended'"
                        [class.text-danger]="contract.status === 'Suspended'"
                        [class.bg-slate-100]="contract.status === 'Completed'"
                        [class.text-slate-650]="contract.status === 'Completed'"
                      >
                        {{ contract.status }}
                      </span>
                    </div>
                    <h3 class="text-sm font-bold text-slate-800 mt-2 group-hover:text-primary transition-colors">
                      {{ contract.title }}
                    </h3>
                    <p class="text-xs text-slate-500 font-semibold mt-1">Client: {{ contract.clientName }}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-bold text-slate-400 block">{{ contract.type }}</span>
                    <span class="text-sm font-black text-slate-800 mt-1 block">
                      {{ contract.value | currency:contract.currency:'symbol':'1.0-0' }}
                    </span>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-3 border-t border-slate-50 text-[10px] font-semibold text-slate-400">
                  <div>
                    <span class="block uppercase tracking-wider text-[8px] text-slate-350">Rig Site</span>
                    <span class="text-slate-700 font-bold block mt-0.5">{{ contract.rigName || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="block uppercase tracking-wider text-[8px] text-slate-350">Duration</span>
                    <span class="text-slate-700 font-bold block mt-0.5">{{ contract.startDate | date:'d MMM y' }} - {{ contract.endDate | date:'d MMM y' }}</span>
                  </div>
                  <div>
                    <span class="block uppercase tracking-wider text-[8px] text-slate-350">Project Manager</span>
                    <span class="text-slate-700 font-bold block mt-0.5">{{ contract.projectManager }}</span>
                  </div>
                  <div>
                    <span class="block uppercase tracking-wider text-[8px] text-slate-350">Rate Items</span>
                    <span class="text-slate-700 font-bold block mt-0.5">{{ contract.rateSheet.length }} Defined</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="bg-white p-12 text-center rounded-xl border border-slate-100 shadow-sm text-slate-400">
                <svg class="w-12 h-12 mx-auto mb-3 text-slate-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-sm font-bold">No contracts matching active filtration criteria</p>
              </div>
            }
          </div>
        </div>

        <!-- Details / Action / Log Drawer (Right Column) -->
        <div class="xl:col-span-1 space-y-6">
          @if (selectedContract(); as contract) {
            <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5 sticky top-6">
              
              <!-- Title Summary -->
              <div class="pb-4 border-b border-slate-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{{ contract.contractNumber }}</span>
                  <div class="flex items-center space-x-1.5">
                    <!-- Actions Menu depending on status -->
                    @if (contract.status === 'Draft' && canApprove()) {
                      <button (click)="approveContract(contract.id)" class="px-2 py-1 bg-green-50 hover:bg-green-100 text-success text-[10px] font-extrabold rounded uppercase tracking-wider transition-colors border border-green-200">Approve</button>
                      <button (click)="rejectContract(contract.id)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-danger text-[10px] font-extrabold rounded uppercase tracking-wider transition-colors border border-red-200">Reject</button>
                    }
                    @if (contract.status === 'Active' && canEdit()) {
                      <button (click)="openEditModal(contract)" class="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 text-[10px] font-extrabold rounded uppercase tracking-wider transition-colors border border-slate-200">Edit</button>
                    }
                  </div>
                </div>
                <h2 class="text-base font-black text-slate-800 tracking-tight">{{ contract.title }}</h2>
                <p class="text-[10px] text-slate-450 mt-1 font-semibold italic">{{ contract.scope }}</p>
              </div>

              <!-- General Stats -->
              <div class="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-xs font-semibold text-slate-500">
                <div>
                  <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Contract Value</span>
                  <span class="text-slate-800 font-bold text-sm block mt-0.5">{{ contract.value | currency:contract.currency:'symbol':'1.0-0' }}</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Billing Type</span>
                  <span class="text-slate-800 font-bold block mt-0.5">{{ contract.type }}</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Payment Terms</span>
                  <span class="text-slate-700 font-bold block mt-0.5">{{ contract.paymentTerms }}</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Retention Rate</span>
                  <span class="text-slate-700 font-bold block mt-0.5">{{ contract.retentionPercent }}%</span>
                </div>
              </div>

              <!-- Rate Sheet Items Section -->
              <div>
                <h3 class="text-xs font-black text-slate-750 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Rate Sheet</span>
                  <span class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">{{ contract.rateSheet.length }} Items</span>
                </h3>
                <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  @for (item of contract.rateSheet; track item.id) {
                    <div class="flex justify-between items-center p-2 bg-slate-50/50 hover:bg-slate-50 rounded border border-slate-100 text-xs transition-colors">
                      <div class="font-semibold text-slate-700">
                        <div>{{ item.description }}</div>
                        <div class="text-[9px] text-slate-400 font-bold">Billing Unit: {{ item.unit }}</div>
                      </div>
                      <span class="font-bold text-slate-800 whitespace-nowrap shrink-0 ml-4">
                        {{ item.rate | currency:item.currency:'symbol':'1.2-2' }}/{{ item.unit }}
                      </span>
                    </div>
                  }
                </div>
              </div>

              <!-- Milestones Progress -->
              <div>
                <h3 class="text-xs font-black text-slate-750 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Milestones & Payments</span>
                  <span class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">{{ contract.milestones.length }} Total</span>
                </h3>
                <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  @for (m of contract.milestones; track m.id) {
                    <div class="p-2 bg-slate-50/50 rounded border border-slate-100 text-xs">
                      <div class="flex justify-between items-start">
                        <span class="font-bold text-slate-750">{{ m.title }}</span>
                        <span 
                          class="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider"
                          [class.bg-green-50]="m.status === 'Completed'"
                          [class.text-success]="m.status === 'Completed'"
                          [class.bg-amber-50]="m.status === 'In Progress'"
                          [class.text-accent]="m.status === 'In Progress'"
                          [class.bg-slate-100]="m.status === 'Pending'"
                          [class.text-slate-500]="m.status === 'Pending'"
                        >
                          {{ m.status }}
                        </span>
                      </div>
                      <div class="flex justify-between items-center mt-2 text-[9px] text-slate-400 font-semibold">
                        <span>Due: {{ m.dueDate | date:'d MMM y' }}</span>
                        <span class="text-slate-700 font-bold"><span>$</span>{{ m.amount | number }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Activity Log specific to this contract -->
              <div class="pt-4 border-t border-slate-100">
                <h3 class="text-xs font-black text-slate-750 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Contract Activity Audit</span>
                </h3>
                <div class="max-h-60 overflow-y-auto">
                  <app-activity-timeline moduleFilter="Contracts" [limit]="4"></app-activity-timeline>
                </div>
              </div>

            </div>
          } @else {
            <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 sticky top-6">
              <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p class="text-xs font-bold">Select any contract ledger entry to inspect rate sheets, milestone payments, and status controls.</p>
            </div>
          }
        </div>

      </div>

      <!-- CREATE/EDIT CONTRACT DRAWER MODAL -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div (click)="closeModal()" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>
          
          <div class="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left text-xs font-semibold text-slate-500">
            <!-- Modal Header -->
            <div class="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 class="text-base font-black text-slate-800">{{ isEditMode() ? 'Edit Contract' : 'Create Contract' }}</h2>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Setup new customer scope, rate items, and payment schedules</p>
              </div>
              <button (click)="closeModal()" class="p-1 rounded-lg text-slate-450 hover:bg-slate-50 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              
              <!-- Form Fields -->
              <div class="space-y-3.5">
                <div>
                  <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Contract Title</label>
                  <input type="text" [(ngModel)]="formModel.title" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Client Name</label>
                    <input type="text" [(ngModel)]="formModel.clientName" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">PM Assigned</label>
                    <input type="text" [(ngModel)]="formModel.projectManager" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Client Contact Email</label>
                    <input type="email" [(ngModel)]="formModel.clientEmail" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Client Phone</label>
                    <input type="text" [(ngModel)]="formModel.clientContact" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Contract Type</label>
                    <select [(ngModel)]="formModel.type" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-bold focus:outline-none">
                      <option value="Daily Rate">Daily Rate</option>
                      <option value="Time & Material">Time & Material</option>
                      <option value="Lump Sum">Lump Sum</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Target Rig Site</label>
                    <select [(ngModel)]="formModel.rigId" (change)="onRigChange()" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-bold focus:outline-none">
                      <option value="">No Rig Associated</option>
                      <option value="rig1">Rig Alpha (Offshore)</option>
                      <option value="rig2">Rig Beta (Land)</option>
                      <option value="rig3">Rig Gamma (Deepwater)</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Start Date</label>
                    <input type="date" [(ngModel)]="formModel.startDate" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">End Date</label>
                    <input type="date" [(ngModel)]="formModel.endDate" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Value Amount</label>
                    <input type="number" [(ngModel)]="formModel.value" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Retention %</label>
                    <input type="number" [(ngModel)]="formModel.retentionPercent" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Payment Terms</label>
                    <input type="text" [(ngModel)]="formModel.paymentTerms" placeholder="e.g. Net 30" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Scope of Work Summary</label>
                  <textarea [(ngModel)]="formModel.scope" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50"></textarea>
                </div>
              </div>

              <!-- Rate Sheet Editor -->
              <div class="pt-4 border-t border-slate-100">
                <div class="flex justify-between items-center mb-2">
                  <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">Rate Items Defined</h3>
                  <button type="button" (click)="addRateSheetRow()" class="text-xs text-primary hover:underline font-bold">+ Add Rate Item</button>
                </div>
                
                <div class="space-y-2">
                  @for (rate of formModel.rateSheet; track $index) {
                    <div class="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <input type="text" [(ngModel)]="rate.description" placeholder="Description" class="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-slate-850 focus:outline-none" />
                      <input type="text" [(ngModel)]="rate.unit" placeholder="Unit" class="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-slate-850 text-center focus:outline-none" />
                      <input type="number" [(ngModel)]="rate.rate" placeholder="Rate" class="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-slate-850 text-right focus:outline-none" />
                      <button (click)="removeRateSheetRow($index)" class="text-red-500 hover:text-red-650 p-1 shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Milestones Editor -->
              <div class="pt-4 border-t border-slate-100">
                <div class="flex justify-between items-center mb-2">
                  <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">Milestones defined</h3>
                  <button type="button" (click)="addMilestoneRow()" class="text-xs text-primary hover:underline font-bold">+ Add Milestone</button>
                </div>

                <div class="space-y-2">
                  @for (m of formModel.milestones; track $index) {
                    <div class="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <input type="text" [(ngModel)]="m.title" placeholder="Milestone Title" class="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-slate-850 focus:outline-none" />
                      <input type="date" [(ngModel)]="m.dueDate" class="w-32 bg-white border border-slate-200 rounded px-2 py-1 text-slate-850 text-center focus:outline-none" />
                      <input type="number" [(ngModel)]="m.amount" placeholder="Amount" class="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-slate-850 text-right focus:outline-none" />
                      <button (click)="removeMilestoneRow($index)" class="text-red-500 hover:text-red-650 p-1 shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50">
              <button (click)="closeModal()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-lg text-xs font-bold transition-colors">Cancel</button>
              <button (click)="saveContract()" class="px-4.5 py-2 bg-primary hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">Save Contract</button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractsComponent implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly contracts = this.workflowService.contracts;
  readonly selectedContract = signal<Contract | null>(null);

  // Filter conditions
  searchQuery = '';
  statusFilter = 'ALL';
  typeFilter = 'ALL';

  // Form states
  isModalOpen = signal(false);
  isEditMode = signal(false);
  editingContractId = '';
  formModel: any = {
    title: '',
    clientName: '',
    clientContact: '',
    clientEmail: '',
    type: 'Daily Rate',
    startDate: '',
    endDate: '',
    value: 0,
    currency: 'USD',
    scope: '',
    rigId: '',
    rigName: '',
    projectManager: '',
    retentionPercent: 10,
    paymentTerms: 'Net 30',
    rateSheet: [],
    milestones: []
  };

  // computed filtered list
  readonly filteredContracts = computed(() => {
    let list = this.contracts();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;
    const type = this.typeFilter;

    if (status !== 'ALL') {
      list = list.filter(c => c.status === status);
    }
    if (type !== 'ALL') {
      list = list.filter(c => c.type === type);
    }

    if (query) {
      list = list.filter(c => 
        c.contractNumber.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.clientName.toLowerCase().includes(query) ||
        (c.rigName && c.rigName.toLowerCase().includes(query)) ||
        c.projectManager.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.contracts.breadcrumb') }
    ]);

    // Preselect the first contract
    const list = this.filteredContracts();
    if (list.length > 0) {
      this.selectedContract.set(list[0]);
    }
  }

  selectContract(contract: Contract) {
    this.selectedContract.set(contract);
  }

  // --- Role Check Permissions ---
  canCreate() {
    const role = this.authService.currentUser()?.role;
    return role === 'Super Admin' || role === 'General Manager' || role === 'Procurement Manager' || role === 'Project Manager';
  }

  canEdit() {
    return this.canCreate();
  }

  canApprove() {
    const role = this.authService.currentUser()?.role;
    return role === 'Super Admin' || role === 'General Manager';
  }

  // --- Action Mutators ---
  approveContract(id: string) {
    this.workflowService.approveContract(id, 'Approved by assigned authority');
    // update current selected contract details
    const updated = this.contracts().find(c => c.id === id);
    if (updated) {
      this.selectedContract.set(updated);
    }
  }

  rejectContract(id: string) {
    this.workflowService.rejectContract(id, 'Suspended by administrative decision');
    const updated = this.contracts().find(c => c.id === id);
    if (updated) {
      this.selectedContract.set(updated);
    }
  }

  // --- Modal Forms ---
  openCreateModal() {
    this.isEditMode.set(false);
    this.editingContractId = '';
    this.formModel = {
      title: '',
      clientName: '',
      clientContact: '',
      clientEmail: '',
      type: 'Daily Rate',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 100000,
      currency: 'USD',
      scope: '',
      rigId: '',
      rigName: '',
      projectManager: this.authService.currentUser()?.fullName || 'Project Manager',
      retentionPercent: 10,
      paymentTerms: 'Net 30',
      rateSheet: [
        { id: 'new_1', description: 'Daily Rate Spud Operation', unit: 'DAY', rate: 25000, currency: 'USD' }
      ],
      milestones: [
        { id: 'mnew_1', title: 'Phase 1 Completion Spud', dueDate: new Date().toISOString().split('T')[0], amount: 25000, status: 'Pending' }
      ]
    };
    this.isModalOpen.set(true);
  }

  openEditModal(contract: Contract) {
    this.isEditMode.set(true);
    this.editingContractId = contract.id;
    this.formModel = JSON.parse(JSON.stringify(contract)); // deep copy
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onRigChange() {
    const id = this.formModel.rigId;
    if (id === 'rig1') this.formModel.rigName = 'Rig Alpha (Offshore)';
    else if (id === 'rig2') this.formModel.rigName = 'Rig Beta (Land)';
    else if (id === 'rig3') this.formModel.rigName = 'Rig Gamma (Deepwater)';
    else this.formModel.rigName = '';
  }

  addRateSheetRow() {
    this.formModel.rateSheet.push({
      id: `new_${Date.now()}`,
      description: '',
      unit: 'DAY',
      rate: 0,
      currency: 'USD'
    });
  }

  removeRateSheetRow(index: number) {
    this.formModel.rateSheet.splice(index, 1);
  }

  addMilestoneRow() {
    this.formModel.milestones.push({
      id: `mnew_${Date.now()}`,
      title: '',
      dueDate: new Date().toISOString().split('T')[0],
      amount: 0,
      status: 'Pending'
    });
  }

  removeMilestoneRow(index: number) {
    this.formModel.milestones.splice(index, 1);
  }

  saveContract() {
    if (!this.formModel.title || !this.formModel.clientName) {
      alert('Please fill out contract title and client name.');
      return;
    }

    if (this.isEditMode()) {
      this.workflowService.updateContract(this.editingContractId, this.formModel);
      const updated = this.contracts().find(c => c.id === this.editingContractId);
      if (updated) {
        this.selectedContract.set(updated);
      }
    } else {
      const created = this.workflowService.createContract({
        ...this.formModel,
        status: 'Draft'
      });
      this.selectedContract.set(created);
    }
    this.isModalOpen.set(false);
  }
}
