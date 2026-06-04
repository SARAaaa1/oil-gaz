import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { Collection, CollectionPayment } from '../../../shared/interfaces/workflow.interface';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  template: `
    <div class="space-y-6 animate-fade-in text-xs font-semibold text-slate-500">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">Collections & Accounts Receivable</h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">Track customer payments, aging outstanding balances, and record wire/check transaction receipts</p>
        </div>
      </div>

      <!-- Financial Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div class="bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div class="p-3 rounded-lg bg-red-50 text-danger shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span class="block uppercase tracking-wider text-[8px] text-slate-400 font-bold">Total Accounts Receivable (A/R)</span>
            <span class="text-lg font-black text-slate-850 block mt-0.5">{{ totalAR() | currency:'USD':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <div class="bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div class="p-3 rounded-lg bg-green-50 text-success shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span class="block uppercase tracking-wider text-[8px] text-slate-400 font-bold">Total Collected Cash Flow</span>
            <span class="text-lg font-black text-slate-850 block mt-0.5">{{ totalCollected() | currency:'USD':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <div class="bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div class="p-3 rounded-lg bg-amber-50 text-accent shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span class="block uppercase tracking-wider text-[8px] text-slate-400 font-bold">Active Collection Records</span>
            <span class="text-lg font-black text-slate-850 block mt-0.5">{{ collections().length }} Accounts</span>
          </div>
        </div>
      </div>

      <!-- Main Columns Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <!-- Collections Ledger Table (Left Columns) -->
        <div class="xl:col-span-2 space-y-4">
          <!-- Filters -->
          <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
            <div class="flex-1 relative">
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Search Collection #, Client, invoice, PM..." 
                class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50"
              />
              <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div>
              <select 
                [(ngModel)]="statusFilter" 
                class="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-750 font-bold focus:outline-none"
              >
                <option value="ALL">All Accounts</option>
                <option value="Pending">Pending Receipt</option>
                <option value="Partially Collected">Partially Collected</option>
                <option value="Fully Collected">Fully Collected</option>
              </select>
            </div>
          </div>

          <!-- Table -->
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs font-semibold text-slate-650">
                <thead>
                  <tr class="text-slate-400 font-bold border-b border-slate-100 bg-slate-50/20 text-[10px] uppercase tracking-wider">
                    <th class="p-4 py-3">Collection Details</th>
                    <th class="p-4 py-3">Outstanding Invoice</th>
                    <th class="p-4 py-3">Aging Timeline</th>
                    <th class="p-4 py-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                  @for (col of filteredCollections(); track col.id) {
                    <tr 
                      (click)="selectCollection(col)"
                      class="hover:bg-indigo-50/25 transition-colors cursor-pointer"
                      [class.bg-indigo-50]="selectedCollection()?.id === col.id"
                    >
                      <td class="p-4">
                        <div class="font-bold text-slate-900 font-mono text-[11px]">{{ col.collectionNumber }}</div>
                        <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{{ col.clientName }}</div>
                      </td>
                      <td class="p-4">
                        <div class="font-bold text-slate-800">{{ col.invoiceNumber }}</div>
                        <div class="text-[9px] text-slate-400 font-bold mt-0.5">Contract: {{ col.contractNumber }}</div>
                      </td>
                      <td class="p-4">
                        <div class="flex items-center space-x-2">
                          <span 
                            class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0"
                            [class.bg-green-50]="col.status === 'Fully Collected'"
                            [class.text-success]="col.status === 'Fully Collected'"
                            [class.bg-blue-50]="col.status === 'Partially Collected'"
                            [class.text-blue-600]="col.status === 'Partially Collected'"
                            [class.bg-amber-50]="col.status === 'Pending'"
                            [class.text-accent]="col.status === 'Pending'"
                          >
                            {{ col.status }}
                          </span>
                          <span class="text-[9px] text-slate-400 font-semibold" *ngIf="col.status !== 'Fully Collected'">
                            Aging: <span class="font-bold text-slate-700">{{ col.agingDays }}d</span>
                          </span>
                        </div>
                      </td>
                      <td class="p-4 text-right">
                        <span class="text-sm font-black text-slate-800">
                          {{ col.outstandingBalance | currency:col.currency:'symbol':'1.0-0' }}
                        </span>
                        <div class="text-[9px] text-slate-400 font-bold mt-0.5">
                          Invoice: {{ col.invoiceAmount | currency:col.currency:'symbol':'1.0-0' }}
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="p-8 text-center text-slate-400 font-bold">
                        No active outstanding collections tracked.
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
          @if (selectedCollection(); as col) {
            <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5 sticky top-6">
              
              <!-- Title controls -->
              <div class="pb-4 border-b border-slate-100">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{{ col.collectionNumber }}</span>
                  @if (col.status !== 'Fully Collected' && canRegister()) {
                    <button 
                      (click)="openPaymentModal()" 
                      class="px-3 py-1 bg-green-50 hover:bg-green-100 text-success text-[10px] font-black rounded border border-green-200 transition-colors uppercase tracking-wider"
                    >
                      Receive Payment
                    </button>
                  }
                </div>
                <h2 class="text-base font-black text-slate-800 tracking-tight">{{ col.clientName }}</h2>
                <p class="text-[10px] text-slate-450 mt-1 font-semibold">Payment target due: <span class="font-bold text-slate-750">{{ col.dueDate | date:'d MMM y' }}</span></p>
              </div>

              <!-- Balance stats progress bar -->
              <div class="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs font-semibold">
                <div class="flex justify-between">
                  <span class="text-slate-400 uppercase font-bold text-[9px] tracking-wider">Collected cash flow</span>
                  <span class="text-slate-700 font-bold">{{ col.totalCollected | currency:col.currency }} / {{ col.invoiceAmount | currency:col.currency }}</span>
                </div>
                
                <div class="w-full bg-slate-200 rounded-full h-2 flex overflow-hidden">
                  <div class="bg-success h-full transition-all duration-550" [style.width.%]="(col.totalCollected/col.invoiceAmount)*100"></div>
                </div>

                <div class="pt-2.5 border-t border-slate-200 flex justify-between items-center text-slate-900 font-bold">
                  <span class="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Outstanding Balance Due</span>
                  <span class="text-base font-black text-red-650">
                    {{ col.outstandingBalance | currency:col.currency }}
                  </span>
                </div>
              </div>

              <!-- General details list -->
              <div class="space-y-2 text-xs text-slate-650">
                <div class="flex justify-between">
                  <span class="text-slate-400">Invoice Number</span>
                  <span class="font-bold text-slate-800">{{ col.invoiceNumber }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Contract Associated</span>
                  <span class="font-bold text-slate-800">{{ col.contractNumber }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Aging Duration</span>
                  <span class="font-bold text-slate-800">{{ col.agingDays }} Days Outstanding</span>
                </div>
              </div>

              <!-- Payments Received history -->
              <div>
                <h3 class="text-xs font-black text-slate-750 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Receipts ledger</span>
                  <span class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">{{ col.payments.length }} Received</span>
                </h3>
                <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
                  @for (p of col.payments; track p.id) {
                    <div class="p-2.5 bg-slate-50 rounded border border-slate-150 text-[11px] font-bold text-slate-700 space-y-1">
                      <div class="flex justify-between items-center">
                        <span class="text-slate-800">Wire ref: {{ p.reference }}</span>
                        <span class="text-green-700 font-black">{{ p.amount | currency:col.currency }}</span>
                      </div>
                      <div class="flex justify-between text-[9px] text-slate-450 font-bold uppercase tracking-wider">
                        <span>Method: {{ p.method }}</span>
                        <span>Date: {{ p.date | date:'d MMM y' }}</span>
                      </div>
                      @if (p.remarks) {
                        <div class="text-[9px] text-slate-450 italic font-semibold pt-0.5">Remarks: "{{ p.remarks }}"</div>
                      }
                    </div>
                  } @empty {
                    <div class="p-4 text-center bg-slate-50/50 rounded border border-slate-100 text-slate-450 text-[10px] font-bold">
                      No payments received for this collection yet.
                    </div>
                  }
                </div>
              </div>

              <!-- Activity Log specific to this Collection -->
              <div class="pt-4 border-t border-slate-100">
                <h3 class="text-xs font-black text-slate-750 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Collections audit feed</span>
                </h3>
                <div class="max-h-52 overflow-y-auto">
                  <app-activity-timeline moduleFilter="Collections" [limit]="3"></app-activity-timeline>
                </div>
              </div>

            </div>
          } @else {
            <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 sticky top-6">
              <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p class="text-xs font-bold">Select any collection account ledger item to view client ledger reports, record payment receipts, or audit wire transfers.</p>
            </div>
          }
        </div>

      </div>

      <!-- RECEIVE PAYMENT DRAWER MODAL -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div (click)="closeModal()" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>
          
          <div class="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left">
            <!-- Header -->
            <div class="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 class="text-base font-black text-slate-800">Record Payment Receipt</h2>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Register customer wire transfers and offset accounts receivable balances</p>
              </div>
              <button (click)="closeModal()" class="p-1 rounded-lg text-slate-450 hover:bg-slate-50 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              @if (selectedCollection(); as col) {
                <div class="space-y-4 font-semibold text-xs text-slate-600">
                  <div class="bg-indigo-50 border border-indigo-150 p-4 rounded-xl flex justify-between items-center text-indigo-950 font-bold">
                    <div>
                      <span class="block text-[8px] uppercase tracking-wider text-indigo-400">Total Outstanding Balance</span>
                      <span class="text-xl font-black">{{ col.outstandingBalance | currency:col.currency }}</span>
                    </div>
                    <div class="text-right text-[10px] font-bold text-indigo-650">
                      <div>Invoice ref: {{ col.invoiceNumber }}</div>
                      <div>Client: {{ col.clientName }}</div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Receipt Date</label>
                    <input type="date" [(ngModel)]="formModel.date" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none" />
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Amount Received</label>
                      <input type="number" [(ngModel)]="formModel.amount" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-indigo-500/50" />
                    </div>
                    <div>
                      <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Payment Method</label>
                      <select [(ngModel)]="formModel.method" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-850 font-bold focus:outline-none">
                        <option value="Bank Transfer">Bank Transfer (Swift)</option>
                        <option value="Wire Transfer">Wire Transfer (ACH)</option>
                        <option value="Check">Check Deposit</option>
                        <option value="Cash">Cash Receipt</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Payment Reference / Transaction ID</label>
                    <input type="text" [(ngModel)]="formModel.reference" placeholder="e.g. SWIFT Ref #, Check #" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none" />
                  </div>

                  <div>
                    <label class="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Receipt Remarks</label>
                    <textarea [(ngModel)]="formModel.remarks" rows="2" placeholder="e.g. Chevron May drilling installment payment clearance." class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500/50"></textarea>
                  </div>

                </div>
              }
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50">
              <button (click)="closeModal()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-lg text-xs font-bold transition-colors">Cancel</button>
              <button (click)="savePayment()" class="px-4.5 py-2 bg-primary hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">Record Payment</button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionsComponent implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly collections = this.workflowService.collections;
  readonly selectedCollection = signal<Collection | null>(null);

  // Filters
  searchQuery = '';
  statusFilter = 'ALL';

  // Form states
  isModalOpen = signal(false);
  formModel: any = {
    date: '',
    amount: 0,
    method: 'Bank Transfer',
    reference: '',
    remarks: ''
  };

  // computed totals
  readonly totalAR = computed(() => 
    this.collections().reduce((sum, c) => sum + c.outstandingBalance, 0)
  );

  readonly totalCollected = computed(() => 
    this.collections().reduce((sum, c) => sum + c.totalCollected, 0)
  );

  readonly filteredCollections = computed(() => {
    let list = this.collections();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;

    if (status !== 'ALL') {
      list = list.filter(c => c.status === status);
    }

    if (query) {
      list = list.filter(c => 
        c.collectionNumber.toLowerCase().includes(query) ||
        c.invoiceNumber.toLowerCase().includes(query) ||
        c.clientName.toLowerCase().includes(query) ||
        c.contractNumber.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.collections.breadcrumb') }
    ]);

    const list = this.filteredCollections();
    if (list.length > 0) {
      this.selectedCollection.set(list[0]);
    }
  }

  selectCollection(col: Collection) {
    this.selectedCollection.set(col);
  }

  // --- Role Check Permissions ---
  canRegister() {
    const role = this.authService.currentUser()?.role;
    // Finance Manager or Super Admin can register collected cash payments
    return role === 'Super Admin' || role === 'Finance Manager' || role === 'General Manager';
  }

  // --- Payment Modal actions ---
  openPaymentModal() {
    const col = this.selectedCollection();
    if (!col) return;

    this.formModel = {
      date: new Date().toISOString().split('T')[0],
      amount: col.outstandingBalance,
      method: 'Bank Transfer',
      reference: '',
      remarks: ''
    };
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  savePayment() {
    const col = this.selectedCollection();
    if (!col) return;

    const amt = Number(this.formModel.amount) || 0;
    if (amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (amt > col.outstandingBalance) {
      alert(`Payment amount ($${amt}) exceeds outstanding balance ($${col.outstandingBalance}).`);
      return;
    }
    if (!this.formModel.reference) {
      alert('Please enter a payment reference code (e.g. Swift ID/Check #).');
      return;
    }

    this.workflowService.addCollectionPayment(col.id, this.formModel);
    this.isModalOpen.set(false);

    // Refresh selected collection details
    const updated = this.collections().find(c => c.id === col.id);
    if (updated) {
      this.selectedCollection.set(updated);
    }
  }
}
