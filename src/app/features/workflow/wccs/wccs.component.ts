import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { WCC, DAR, Contract, WCCLineItem } from '../../../shared/interfaces/workflow.interface';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-wccs',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  template: `
    <div class="space-y-6 animate-fade-in text-xs font-semibold text-slate-500">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'workflow.wccs.title' | translate }}</h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'workflow.wccs.subtitle' | translate }}</p>
        </div>
        <button 
          *ngIf="canCreate()"
          (click)="openCreateModal()"
          class="px-4 py-2.5 bg-primary hover:bg-slate-800 text-white rounded-lg font-bold transition-all shadow-sm flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
          <span>{{ 'workflow.wccs.generate_btn' | translate }}</span>
        </button>
      </div>

      <!-- Grid Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <!-- WCC List Table (Left Columns) -->
        <div class="xl:col-span-2 space-y-4">
          <!-- Filters -->
          <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
            <div class="flex-1 relative">
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="{{ 'workflow.wccs.search_placeholder' | translate }}" 
                class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50"
              />
              <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div>
              <select 
                [(ngModel)]="statusFilter" 
                class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-bold focus:outline-none"
              >
                <option value="ALL">{{ 'workflow.wccs.all_statuses' | translate }}</option>
                <option value="Draft">{{ 'workflow.wccs.status_draft' | translate }}</option>
                <option value="Approved">{{ 'workflow.wccs.status_approved' | translate }}</option>
                <option value="Rejected">{{ 'workflow.wccs.status_rejected' | translate }}</option>
                <option value="Invoiced">{{ 'workflow.wccs.status_invoiced' | translate }}</option>
              </select>
            </div>
          </div>

          <!-- Table Ledger -->
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-slate-400 font-bold border-b border-slate-100 bg-slate-50/20 text-[10px] uppercase tracking-wider">
                    <th class="p-4 py-3">{{ 'workflow.wccs.col_details' | translate }}</th>
                    <th class="p-4 py-3">{{ 'workflow.wccs.col_contract' | translate }}</th>
                    <th class="p-4 py-3">{{ 'workflow.wccs.col_reports' | translate }}</th>
                    <th class="p-4 py-3">{{ 'workflow.wccs.col_status' | translate }}</th>
                    <th class="p-4 py-3 text-right">{{ 'workflow.wccs.col_value' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                  @for (wcc of filteredWccs(); track wcc.id) {
                    <tr 
                      (click)="selectWcc(wcc)"
                      class="hover:bg-indigo-50/25 transition-colors cursor-pointer"
                      [class.bg-indigo-50]="selectedWcc()?.id === wcc.id"
                    >
                      <td class="p-4">
                        <div class="font-bold text-slate-900 font-mono text-[11px]">{{ wcc.wccNumber }}</div>
                        <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{{ wcc.clientName }}</div>
                      </td>
                      <td class="p-4">
                        <div class="font-bold text-slate-800">{{ wcc.contractNumber }}</div>
                        <div class="text-[9px] text-slate-400 font-bold mt-0.5">{{ wcc.rigName }}</div>
                      </td>
                      <td class="p-4">
                        <div class="font-bold text-slate-700">{{ wcc.darNumbers.length }} DARs linked</div>
                        <div class="text-[9px] text-slate-400 font-semibold mt-0.5">
                          Period: {{ wcc.periodFrom | date:'d/MM' }} - {{ wcc.periodTo | date:'d/MM/yy' }}
                        </div>
                      </td>
                      <td class="p-4">
                        <span 
                          class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
                          [class.bg-green-50]="wcc.status === 'Approved'"
                          [class.text-success]="wcc.status === 'Approved'"
                          [class.bg-blue-50]="wcc.status === 'Invoiced'"
                          [class.text-blue-600]="wcc.status === 'Invoiced'"
                          [class.bg-amber-50]="wcc.status === 'Draft'"
                          [class.text-accent]="wcc.status === 'Draft'"
                          [class.bg-red-50]="wcc.status === 'Rejected'"
                          [class.text-danger]="wcc.status === 'Rejected'"
                        >
                          {{ wcc.status }}
                        </span>
                      </td>
                      <td class="p-4 text-right">
                        <span class="text-sm font-black text-slate-800">
                          {{ wcc.subtotal | currency:'USD':'symbol':'1.0-0' }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="p-8 text-center text-slate-400 font-bold">
                        {{ 'workflow.wccs.no_records' | translate }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Detail Drawer (Right Column) -->
        <div class="xl:col-span-1 space-y-6">
          @if (selectedWcc(); as wcc) {
            <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5 sticky top-6">
              
              <!-- Header controls -->
              <div class="pb-4 border-b border-slate-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{{ wcc.wccNumber }}</span>
                  <div class="flex items-center space-x-1.5">
                    @for (step of wcc.approvalWorkflow; track step.role) {
                      @if (step.status === 'Pending' && canApproveStep(step.role)) {
                        <button 
                          (click)="approveWccStep(wcc.id, step.role)" 
                          class="px-2 py-1 bg-green-50 hover:bg-green-100 text-success text-[10px] font-bold rounded uppercase tracking-wider border border-green-200 transition-colors"
                        >
                          Approve ({{ step.role.split(' ')[0] }})
                        </button>
                        <button 
                          (click)="rejectWccStep(wcc.id, step.role)" 
                          class="px-2 py-1 bg-red-50 hover:bg-red-100 text-danger text-[10px] font-bold rounded uppercase tracking-wider border border-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      }
                    }
                  </div>
                </div>
                <h2 class="text-base font-black text-slate-800 tracking-tight">{{ wcc.clientName }}</h2>
                <p class="text-[10px] text-slate-450 mt-1 font-semibold">Service Rig: <span class="font-bold text-slate-700">{{ wcc.rigName }}</span></p>
              </div>

              <!-- General metadata details -->
              <div class="grid grid-cols-2 gap-3.5 p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{{ 'workflow.wccs.contract_num' | translate }}</span>
                  <span class="text-slate-800 font-bold block mt-0.5">{{ wcc.contractNumber }}</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{{ 'workflow.wccs.period_covered' | translate }}</span>
                  <span class="text-slate-800 font-bold block mt-0.5 text-[10px]">{{ wcc.periodFrom | date:'d/MM' }} to {{ wcc.periodTo | date:'d/MM/yy' }}</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{{ 'workflow.wccs.operating_hours' | translate }}</span>
                  <span class="text-slate-700 font-bold block mt-0.5">{{ wcc.totalOperatingHours }} Hours</span>
                </div>
                <div>
                  <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">{{ 'workflow.wccs.prepared_by' | translate }}</span>
                  <span class="text-slate-700 font-bold block mt-0.5">{{ wcc.preparedBy }}</span>
                </div>
              </div>

              <!-- WCC Line Items breakdown -->
              <div>
                <h3 class="text-xs font-black text-slate-750 uppercase tracking-wider mb-2">{{ 'workflow.wccs.line_items' | translate }}</h3>
                <div class="space-y-2">
                  @for (item of wcc.lineItems; track item.id) {
                    <div class="p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded text-xs transition-colors">
                      <div class="flex justify-between items-start font-bold">
                        <span class="text-slate-750">{{ item.description }}</span>
                        <span class="text-slate-900 font-black shrink-0 ml-4">
                          {{ item.amount | currency:'USD':'symbol':'1.0-0' }}
                        </span>
                      </div>
                      <div class="flex justify-between items-center text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
                        <span>Quantity: {{ item.quantity | number:'1.0-2' }} {{ item.unit }}</span>
                        <span>Rate: {{ item.rate | currency:'USD':'symbol':'1.0-0' }}/{{ item.unit }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Linked DAR References -->
              <div>
                <h3 class="text-xs font-black text-slate-750 uppercase tracking-wider mb-2">{{ 'workflow.wccs.linked_dars' | translate }}</h3>
                <div class="flex flex-wrap gap-1.5">
                  @for (num of wcc.darNumbers; track num) {
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono font-bold">{{ num }}</span>
                  }
                </div>
              </div>

              <!-- Multistage Approval Workflow status -->
              <div>
                <h3 class="text-xs font-black text-slate-750 uppercase tracking-wider mb-2">{{ 'workflow.wccs.approval_gates' | translate }}</h3>
                <div class="space-y-2 text-[10px]">
                  @for (step of wcc.approvalWorkflow; track step.role) {
                    <div class="flex items-center justify-between p-2.5 rounded bg-slate-50/70 border border-slate-100">
                      <div>
                        <div class="font-bold text-slate-750">{{ step.role }}</div>
                        @if (step.approverName) {
                          <div class="text-[9px] text-slate-450 mt-0.5">Signed: {{ step.approverName }}</div>
                        }
                      </div>
                      <div class="flex items-center space-x-1.5 shrink-0">
                        <span 
                          class="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider"
                          [class.bg-green-50]="step.status === 'Approved'"
                          [class.text-success]="step.status === 'Approved'"
                          [class.bg-amber-50]="step.status === 'Pending'"
                          [class.text-accent]="step.status === 'Pending'"
                          [class.bg-red-50]="step.status === 'Rejected'"
                          [class.text-danger]="step.status === 'Rejected'"
                        >
                          {{ step.status }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Activity Log specific to this WCC -->
              <div class="pt-4 border-t border-slate-100">
                <h3 class="text-xs font-black text-slate-750 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ 'workflow.wccs.activity_log' | translate }}</span>
                </h3>
                <div class="max-h-52 overflow-y-auto">
                  <app-activity-timeline moduleFilter="WCC" [limit]="3"></app-activity-timeline>
                </div>
              </div>

            </div>
          } @else {
            <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 sticky top-6">
              <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p class="text-xs font-bold">Select any completion certificate ledger entry to review calculated lines, approve milestones, or generate client invoices.</p>
            </div>
          }
        </div>

      </div>

      <!-- GENERATE WCC DRAWER MODAL -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div (click)="closeModal()" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>
          
          <div class="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left">
            <!-- Header -->
            <div class="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 class="text-base font-black text-slate-800">{{ 'workflow.wccs.generate_btn' | translate }}</h2>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Bundle approved daily reports and match with contract rates</p>
              </div>
              <button (click)="closeModal()" class="p-1 rounded-lg text-slate-450 hover:bg-slate-50 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              
              <!-- Contract selector -->
              <div>
                <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Target Contract</label>
                <select 
                  [(ngModel)]="selectedContractId" 
                  (change)="onContractChange()"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-bold focus:outline-none"
                >
                  <option value="">Select Contract...</option>
                  @for (c of activeContracts(); track c.id) {
                    <option [value]="c.id">{{ c.contractNumber }} - {{ c.title }}</option>
                  }
                </select>
              </div>

              @if (selectedContractId) {
                <!-- Uncertified DARs Selection -->
                <div class="space-y-2">
                  <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider flex justify-between items-center">
                    <span>Approved & Uncertified Daily Activity Reports</span>
                    <span class="text-[10px] text-slate-400 font-bold">{{ availableDars().length }} Available</span>
                  </h3>
                  
                  <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    @for (dar of availableDars(); track dar.id) {
                      <div class="flex items-start space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/60 cursor-pointer" (click)="toggleDarSelection(dar.id)">
                        <input 
                          type="checkbox" 
                          [checked]="selectedDarIds.has(dar.id)"
                          class="mt-1 shrink-0" 
                        />
                        <div class="flex-1 text-[11px] font-bold text-slate-700">
                          <div class="flex justify-between">
                            <span class="font-mono text-slate-450">{{ dar.darNumber }}</span>
                            <span class="text-slate-800">{{ dar.reportDate | date:'d MMM y' }} ({{ dar.shift }})</span>
                          </div>
                          <div class="text-[9px] text-slate-400 mt-1 font-semibold">
                            Operating: {{ dar.operatingHours }}h | Standby: {{ dar.standbyHours }}h | Downtime: {{ dar.downtimeHours }}h
                          </div>
                          <div class="text-[9px] text-slate-500 mt-1 italic font-medium truncate">{{ dar.activitiesPerformed }}</div>
                        </div>
                      </div>
                    } @empty {
                      <p class="text-center py-6 text-slate-450 text-[11px]">All approved DARs for this contract have already been certified and invoiced.</p>
                    }
                  </div>
                </div>

                <!-- Preview generated WCC line items and values -->
                @if (selectedDarIds.size > 0) {
                  <div class="pt-4 border-t border-slate-100 space-y-3">
                    <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider">Preview Certificate line items</h3>
                    
                    <div class="space-y-2">
                      @for (li of previewLineItems(); track li.id) {
                        <div class="p-2.5 bg-slate-50/70 border border-slate-100 rounded text-[11px] font-bold text-slate-750 flex justify-between">
                          <div>
                            <div>{{ li.description }}</div>
                            <div class="text-[9px] text-slate-400 mt-1 uppercase font-semibold">
                              Quantity: {{ li.quantity | number:'1.0-2' }} {{ li.unit }} | Rate: <span>$</span>{{ li.rate | number }}/{{ li.unit }}
                            </div>
                          </div>
                          <span class="text-slate-900 shrink-0 font-black ml-4"><span>$</span>{{ li.amount | number }}</span>
                        </div>
                      }
                    </div>

                    <!-- Computed Total WCC Value -->
                    <div class="bg-indigo-50 border border-indigo-150 p-4 rounded-xl flex justify-between items-center text-indigo-950">
                      <div>
                        <span class="block text-[9px] uppercase font-bold tracking-wider text-indigo-400">Total Certified Amount</span>
                        <span class="text-xl font-black"><span>$</span>{{ computedSubtotal() | number }}</span>
                      </div>
                      <div class="text-right text-[10px] font-bold text-indigo-650">
                        <div>Period: {{ computedPeriodFrom() }} to {{ computedPeriodTo() }}</div>
                        <div class="mt-1">Operating: {{ computedOpHours() }}h | Standby: {{ computedStandbyHours() }}h</div>
                      </div>
                    </div>
                  </div>
                }
              }

            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50">
              <button (click)="closeModal()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-lg text-xs font-bold transition-colors">{{ 'workflow.rfqs.cancel' | translate }}</button>
              <button 
                (click)="saveWCC()" 
                [disabled]="selectedDarIds.size === 0"
                class="px-4.5 py-2 bg-primary hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {{ 'workflow.wccs.generate_btn' | translate }}
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WccsComponent implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly wccs = this.workflowService.wccs;
  readonly dars = this.workflowService.dars;
  readonly contracts = this.workflowService.contracts;
  readonly selectedWcc = signal<WCC | null>(null);

  // Filters
  searchQuery = '';
  statusFilter = 'ALL';

  // Form Drawer states
  isModalOpen = signal(false);
  selectedContractId = '';
  selectedDarIds = new Set<string>();

  readonly activeContracts = computed(() => 
    this.contracts().filter(c => c.status === 'Active')
  );

  // Load DARs that are Approved AND not linked to any existing WCC for the selected contract
  readonly availableDars = computed(() => {
    const contractId = this.selectedContractId;
    if (!contractId) return [];

    // find all DARs belonging to this contract
    const contractDars = this.dars().filter(d => d.contractId === contractId && d.status === 'Approved');
    
    // find all DAR IDs already linked to existing WCCs
    const linkedDarIds = new Set<string>();
    this.wccs().forEach(w => w.darIds.forEach(id => linkedDarIds.add(id)));

    // filter contractDars that are NOT linked
    return contractDars.filter(d => !linkedDarIds.has(d.id));
  });

  // Preview WCC computation based on chosen DARs
  readonly previewLineItems = computed<WCCLineItem[]>(() => {
    const contractId = this.selectedContractId;
    if (!contractId || this.selectedDarIds.size === 0) return [];

    const contract = this.contracts().find(c => c.id === contractId);
    if (!contract) return [];

    const list: WCCLineItem[] = [];
    const selectedDarsList = this.dars().filter(d => this.selectedDarIds.has(d.id));

    // accumulate operating, standby, repair, downtime hours
    let opHours = 0;
    let standbyHours = 0;
    let repairHours = 0;
    let downtimeHours = 0;

    selectedDarsList.forEach(d => {
      opHours += d.operatingHours;
      standbyHours += d.standbyHours;
      repairHours += d.repairHours;
      downtimeHours += d.downtimeHours;
    });

    // 1. Operating Rate (converts total operating hours to days based on contract rate sheet)
    const opRateItem = contract.rateSheet.find(rs => rs.description.includes('Operation') || rs.unit === 'DAY');
    if (opRateItem) {
      const days = opHours / 24;
      const rate = opRateItem.rate;
      list.push({
        id: 'li_op',
        description: `Rig Daily Operation Rate (${days.toFixed(2)} Days)`,
        unit: 'DAY',
        quantity: days,
        rate,
        amount: Math.round(days * rate)
      });
    }

    // 2. Standby hourly rate
    const standbyRateItem = contract.rateSheet.find(rs => rs.description.includes('Standby') || rs.unit === 'HOUR');
    if (standbyRateItem && standbyHours > 0) {
      list.push({
        id: 'li_standby',
        description: `Drill Crew Technical Standby (${standbyHours} Hours)`,
        unit: 'HOUR',
        quantity: standbyHours,
        rate: standbyRateItem.rate,
        amount: Math.round(standbyHours * standbyRateItem.rate)
      });
    }

    // 3. Downtime penalty rate sheet item (usually a negative rate!)
    const downtimeRateItem = contract.rateSheet.find(rs => rs.description.includes('Downtime') || rs.description.includes('Penalty'));
    if (downtimeRateItem && downtimeHours > 0) {
      list.push({
        id: 'li_downtime',
        description: `Downtime Operational Penalty Clause (${downtimeHours} Hours)`,
        unit: 'HOUR',
        quantity: downtimeHours,
        rate: downtimeRateItem.rate,
        amount: Math.round(downtimeHours * downtimeRateItem.rate) // usually rate is negative e.g. -2000
      });
    }

    return list;
  });

  readonly computedSubtotal = computed(() => 
    this.previewLineItems().reduce((sum, item) => sum + item.amount, 0)
  );

  readonly computedOpHours = computed(() => {
    let op = 0;
    this.dars().filter(d => this.selectedDarIds.has(d.id)).forEach(d => op += d.operatingHours);
    return op;
  });

  readonly computedStandbyHours = computed(() => {
    let s = 0;
    this.dars().filter(d => this.selectedDarIds.has(d.id)).forEach(d => s += d.standbyHours);
    return s;
  });

  readonly computedPeriodFrom = computed(() => {
    const dates = this.dars().filter(d => this.selectedDarIds.has(d.id)).map(d => d.reportDate).sort();
    return dates.length > 0 ? dates[0] : '';
  });

  readonly computedPeriodTo = computed(() => {
    const dates = this.dars().filter(d => this.selectedDarIds.has(d.id)).map(d => d.reportDate).sort();
    return dates.length > 0 ? dates[dates.length - 1] : '';
  });

  readonly filteredWccs = computed(() => {
    let list = this.wccs();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;

    if (status !== 'ALL') {
      if (status === 'Draft') {
        list = list.filter(w => w.status === 'Draft' || w.status === 'Pending Approval');
      } else {
        list = list.filter(w => w.status === status);
      }
    }

    if (query) {
      list = list.filter(w => 
        w.wccNumber.toLowerCase().includes(query) ||
        w.clientName.toLowerCase().includes(query) ||
        w.contractNumber.toLowerCase().includes(query) ||
        (w.rigName && w.rigName.toLowerCase().includes(query))
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.wccs.breadcrumb') }
    ]);

    const list = this.filteredWccs();
    if (list.length > 0) {
      this.selectedWcc.set(list[0]);
    }
  }

  selectWcc(wcc: WCC) {
    this.selectedWcc.set(wcc);
  }

  // --- Permissions and Multi-stage gates ---
  canCreate() {
    const role = this.authService.currentUser()?.role;
    return role === 'Super Admin' || role === 'General Manager' || role === 'Operations Manager' || role === 'Project Manager';
  }

  canApproveStep(role: string) {
    const currentRole = this.authService.currentUser()?.role;
    if (currentRole === 'Super Admin') return true;
    return currentRole === role;
  }

  approveWccStep(wccId: string, role: string) {
    const name = this.authService.currentUser()?.fullName || 'Manager';
    this.workflowService.approveWCC(wccId, role, name, `Approved from ${role} checkpoint.`);
    
    // Refresh selected WCC
    const updated = this.wccs().find(w => w.id === wccId);
    if (updated) this.selectedWcc.set(updated);
  }

  rejectWccStep(wccId: string, role: string) {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    const name = this.authService.currentUser()?.fullName || 'Manager';
    this.workflowService.rejectWCC(wccId, role, name, reason || 'Re-verification of mud log required.');
    
    const updated = this.wccs().find(w => w.id === wccId);
    if (updated) this.selectedWcc.set(updated);
  }

  // --- Form Modal actions ---
  openCreateModal() {
    this.selectedContractId = '';
    this.selectedDarIds.clear();
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onContractChange() {
    this.selectedDarIds.clear();
  }

  toggleDarSelection(id: string) {
    if (this.selectedDarIds.has(id)) {
      this.selectedDarIds.delete(id);
    } else {
      this.selectedDarIds.add(id);
    }
  }

  saveWCC() {
    if (!this.selectedContractId || this.selectedDarIds.size === 0) return;

    const contract = this.contracts().find(c => c.id === this.selectedContractId);
    if (!contract) return;

    const selectedDarsList = this.dars().filter(d => this.selectedDarIds.has(d.id));
    const darNumbers = selectedDarsList.map(d => d.darNumber);

    this.workflowService.createWCC({
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      clientName: contract.clientName,
      rigName: contract.rigName || 'Rig Alpha (Offshore)',
      periodFrom: this.computedPeriodFrom(),
      periodTo: this.computedPeriodTo(),
      darIds: Array.from(this.selectedDarIds),
      darNumbers,
      lineItems: this.previewLineItems(),
      subtotal: this.computedSubtotal(),
      totalOperatingHours: this.computedOpHours(),
      totalStandbyHours: this.computedStandbyHours(),
      preparedBy: this.authService.currentUser()?.fullName || 'Contracts specialist'
    });

    this.isModalOpen.set(false);
    
    // Select the new WCC (last in the list)
    const list = this.wccs();
    if (list.length > 0) {
      this.selectedWcc.set(list[list.length - 1]);
    }
  }
}
