import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-item-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6 animate-fade-in printable-container">
      <!-- Header (Hidden on print unless configured, handled via print class) -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">
            {{ 'inventory.item_ledger_title' | translate }}
          </h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">
            {{ 'inventory.item_ledger_subtitle' | translate }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button 
            (click)="exportToCSV()" 
            [disabled]="!selectedItemCode()"
            class="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ 'inventory.export_excel' | translate }}
          </button>
          <button 
            (click)="printReport()" 
            [disabled]="!selectedItemCode()"
            class="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {{ 'inventory.print' | translate }}
          </button>
        </div>
      </div>

      <!-- Filters Section (No-Print) -->
      <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 no-print text-xs font-semibold text-slate-700">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Item Selector -->
          <div class="space-y-1">
            <label class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {{ 'inventory.select_item' | translate }} *
            </label>
            <select 
              [(ngModel)]="selectedItemCode" 
              class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-slate-400"
            >
              <option value="" disabled>{{ 'inventory.select_item' | translate }}</option>
              @for (item of inventory(); track item.id) {
                <option [value]="item.itemCode">{{ item.itemCode }} - {{ item.itemName }}</option>
              }
            </select>
          </div>

          <!-- Warehouse Selector -->
          <div class="space-y-1">
            <label class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {{ 'inventory.select_warehouse' | translate }}
            </label>
            <select 
              [(ngModel)]="selectedWarehouseId" 
              class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-slate-400"
            >
              <option value="all">{{ 'inventory.all_warehouses' | translate }}</option>
              @for (wh of warehouses(); track wh.id) {
                <option [value]="wh.id">{{ wh.name }}</option>
              }
            </select>
          </div>

          <!-- Project Selector -->
          <div class="space-y-1">
            <label class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {{ 'inventory.select_project' | translate }}
            </label>
            <select 
              [(ngModel)]="selectedProjectId" 
              class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-slate-400"
            >
              <option value="all">{{ 'inventory.all_projects' | translate }}</option>
              @for (proj of projectsList(); track proj.code) {
                <option [value]="proj.code">{{ proj.code }} - {{ proj.name }}</option>
              }
            </select>
          </div>

          <!-- Start Date -->
          <div class="space-y-1">
            <label class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {{ 'inventory.start_date' | translate }}
            </label>
            <input 
              type="date" 
              [(ngModel)]="dateFrom" 
              class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400" 
            />
          </div>

          <!-- End Date -->
          <div class="space-y-1">
            <label class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {{ 'inventory.end_date' | translate }}
            </label>
            <input 
              type="date" 
              [(ngModel)]="dateTo" 
              class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-400" 
            />
          </div>
        </div>
      </div>

      <!-- Report Content (Visible on Print) -->
      @if (selectedItemCode()) {
        <div class="space-y-6 printable-report">
          <!-- Print-Only Header -->
          <div class="hidden print-header border-b border-slate-200 pb-4 mb-4">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-xl font-bold text-slate-900">{{ 'inventory.item_ledger_title' | translate }}</h1>
                <p class="text-[10px] text-slate-500 font-semibold">{{ 'inventory.item_ledger_subtitle' | translate }}</p>
              </div>
              <div class="text-right text-[9px] text-slate-400">
                <p>Printed: {{ printDate | date:'medium' }}</p>
                <p>Warehouse: {{ getWarehouseName(selectedWarehouseId()) }}</p>
                <p>Project: {{ getProjectName(selectedProjectId()) }}</p>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div><strong>Item:</strong> {{ selectedItemCode() }} - {{ ledgerData().itemName }}</div>
              <div><strong>Date Range:</strong> {{ dateFrom() || 'Inception' }} to {{ dateTo() || 'Present' }}</div>
            </div>
          </div>

          <!-- Summary Metrics Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <!-- Opening Balance -->
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {{ 'inventory.opening_balance' | translate }}
              </span>
              <p class="text-base font-black text-slate-800 font-mono">
                {{ ledgerData().openingBalance }} <span class="text-[10px] text-slate-400 font-medium">{{ ledgerData().uom }}</span>
              </p>
            </div>

            <!-- Total Inflows -->
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {{ 'inventory.purchases' | translate }} / {{ 'inventory.transfers_in' | translate }}
              </span>
              <p class="text-base font-black text-green-600 font-mono">
                +{{ totalInflows() }} <span class="text-[10px] text-slate-400 font-medium">{{ ledgerData().uom }}</span>
              </p>
            </div>

            <!-- Total Outflows -->
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {{ 'inventory.consumption' | translate }} / {{ 'inventory.transfers_out' | translate }}
              </span>
              <p class="text-base font-black text-red-500 font-mono">
                -{{ totalOutflows() }} <span class="text-[10px] text-slate-400 font-medium">{{ ledgerData().uom }}</span>
              </p>
            </div>

            <!-- Closing Balance -->
            <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm bg-slate-50/50">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {{ 'inventory.closing_balance' | translate }}
              </span>
              <p class="text-base font-black text-slate-900 font-mono">
                {{ ledgerData().closingBalance }} <span class="text-[10px] text-slate-400 font-medium">{{ ledgerData().uom }}</span>
              </p>
            </div>
          </div>

          <!-- Ledger Table -->
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div class="p-4 bg-slate-50/20 border-b border-slate-100 flex items-center justify-between no-print">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {{ 'inventory.transaction_history' | translate }}
              </h3>
              <span class="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                {{ ledgerData().transactions.length }} {{ 'inventory.total_items' | translate }}
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="text-slate-400 font-bold border-b border-slate-100 bg-slate-50/20">
                    <th class="p-4 py-3">{{ 'inventory.import_date' | translate }}</th>
                    <th class="p-4 py-3">{{ 'inventory.item_type' | translate }}</th>
                    <th class="p-4 py-3">{{ 'inventory.col_item_code' | translate }}</th>
                    <th class="p-4 py-3">{{ 'inventory.description' | translate }}</th>
                    <th class="p-4 py-3 text-right bg-green-50/20 text-green-700">{{ 'inventory.purchases' | translate }} (In)</th>
                    <th class="p-4 py-3 text-right bg-red-50/20 text-red-700">{{ 'inventory.consumption' | translate }} (Out)</th>
                    <th class="p-4 py-3 text-right font-bold text-slate-700">{{ 'inventory.running_balance' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                  <!-- Opening Balance Row -->
                  <tr class="bg-slate-50/30 font-bold text-slate-800">
                    <td class="p-4 text-slate-400">{{ dateFrom() || '2026-06-01' | date:'mediumDate' }}</td>
                    <td class="p-4 uppercase tracking-wider text-[10px] text-slate-400">Balance</td>
                    <td class="p-4 font-mono">-</td>
                    <td class="p-4">{{ 'inventory.opening_balance' | translate }}</td>
                    <td class="p-4 text-right bg-green-50/10">-</td>
                    <td class="p-4 text-right bg-red-50/10">-</td>
                    <td class="p-4 text-right font-mono text-slate-900">{{ ledgerData().openingBalance }}</td>
                  </tr>

                  <!-- Transactions -->
                  @for (tx of ledgerData().transactions; track tx.docNo + tx.type) {
                    <tr class="hover:bg-slate-50/50 transition-colors">
                      <td class="p-4 text-slate-500 font-mono">{{ tx.date | date:'mediumDate' }}</td>
                      <td class="p-4">
                        <span 
                          class="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider font-mono"
                          [class.bg-green-50]="tx.type === 'Purchase' || tx.type === 'Purchase Receipt' || tx.type === 'Transfer In' || tx.type === 'Returns'"
                          [class.text-green-700]="tx.type === 'Purchase' || tx.type === 'Purchase Receipt' || tx.type === 'Transfer In' || tx.type === 'Returns'"
                          [class.bg-rose-50]="tx.type === 'Consumption' || tx.type === 'Transfer Out' || tx.type === 'Contractor Issue'"
                          [class.text-rose-700]="tx.type === 'Consumption' || tx.type === 'Transfer Out' || tx.type === 'Contractor Issue'"
                          [class.bg-slate-100]="tx.type.includes('Adjustment')"
                          [class.text-slate-600]="tx.type.includes('Adjustment')"
                        >
                          {{ tx.type }}
                        </span>
                      </td>
                      <td class="p-4 font-mono font-bold text-indigo-650">{{ tx.docNo }}</td>
                      <td class="p-4 text-slate-500 font-semibold">{{ tx.description }}</td>
                      <td class="p-4 text-right font-mono font-bold text-green-600 bg-green-50/10">
                        {{ tx.qtyIn > 0 ? '+' + tx.qtyIn : '-' }}
                      </td>
                      <td class="p-4 text-right font-mono font-bold text-red-500 bg-red-50/10">
                        {{ tx.qtyOut > 0 ? '-' + tx.qtyOut : '-' }}
                      </td>
                      <td class="p-4 text-right font-mono font-bold text-slate-900">
                        {{ tx.runningBalance }}
                      </td>
                    </tr>
                  } @empty {
                    <!-- Empty State in Range -->
                    @if (ledgerData().transactions.length === 0) {
                      <tr>
                        <td colspan="7" class="p-8 text-center text-slate-400 font-semibold">
                          {{ 'inventory.no_transactions' | translate }}
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      } @else {
        <!-- Select Item Prompt -->
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 font-semibold no-print">
          <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p>{{ 'inventory.select_item' | translate }}</p>
        </div>
      }
    </div>

    <!-- Print Only Styles -->
    <style>
      @media print {
        /* Hide all UI elements except the report wrapper */
        body {
          background-color: white !important;
          color: black !important;
        }
        .no-print, 
        .sidebar-container, 
        .topbar-container, 
        header, 
        footer, 
        nav, 
        button, 
        .breadcrumbs-container {
          display: none !important;
        }
        .printable-container {
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }
        .print-header {
          display: block !important;
        }
        .bg-white {
          background-color: white !important;
          border: none !important;
          box-shadow: none !important;
        }
        .bg-slate-50\\/20, .bg-slate-50\\/30, .bg-slate-50\\/10, .bg-green-50\\/10, .bg-red-50\\/10 {
          background-color: transparent !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        th, td {
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 8px !important;
        }
      }
    </style>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemLedgerComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // Filter Signals
  readonly selectedItemCode = signal<string>('');
  readonly selectedWarehouseId = signal<string>('all');
  readonly selectedProjectId = signal<string>('all');
  
  // Date signals - initialize to June 2026 to show data instantly
  readonly dateFrom = signal<string>('2026-06-01');
  readonly dateTo = signal<string>('2026-06-30');

  // Core Data Stores (Signals)
  readonly inventory = this.mockDataService.inventoryItems;
  readonly warehouses = this.mockDataService.warehouses;
  
  readonly printDate = new Date();

  // Unified Projects list merging mock-data and workflow projects
  readonly projectsList = computed(() => {
    const list = [
      { code: 'PRJ-001', name: 'Permian Overland Drilling' },
      { code: 'PRJ-002', name: 'Midland Basin Support' },
      { code: 'PRJ-003', name: 'Eagle Ford Shale Development' }
    ];
    const wfProjects = this.workflowService.projects().map(p => ({ code: p.code, name: p.name }));
    const result = [...list];
    wfProjects.forEach(wp => {
      if (!result.some(p => p.code === wp.code)) {
        result.push(wp);
      }
    });
    return result;
  });

  // Calculate Opening, Running, and Closing Balances Dynamically
  readonly ledgerData = computed(() => {
    const itemCode = this.selectedItemCode();
    const warehouseId = this.selectedWarehouseId();
    const projectId = this.selectedProjectId();
    const startStr = this.dateFrom();
    const endStr = this.dateTo();

    if (!itemCode) {
      return {
        openingBalance: 0,
        transactions: [],
        closingBalance: 0,
        uom: 'EA',
        itemName: ''
      };
    }

    const inventoryRegistry = this.inventory();
    const itemRegistryInfo = inventoryRegistry.find(i => i.itemCode === itemCode);
    const uom = itemRegistryInfo?.uom || 'EA';
    const itemName = itemRegistryInfo?.itemName || '';
    const itemLocation = itemRegistryInfo?.location || '';
    
    let itemHomeWarehouseId = '';
    if (itemLocation === 'Warehouse A') itemHomeWarehouseId = 'w1';
    else if (itemLocation === 'Warehouse B') itemHomeWarehouseId = 'w2';

    let inceptionStock = 0;
    if (itemCode === 'DR-BIT-8.5-PDC') {
      inceptionStock = 9;
    } else if (itemCode === 'HY-PUMP-HP450') {
      inceptionStock = 0;
    } else if (itemCode === 'HSE-HARN-CLA') {
      inceptionStock = 55;
    } else if (itemCode === 'HSE-DET-GAS') {
      inceptionStock = 0;
    } else if (itemCode === 'LUB-GRE-DRUM') {
      inceptionStock = 13;
    } else if (itemCode === 'TUB-PIPE-5IN') {
      inceptionStock = 180;
    } else {
      inceptionStock = itemRegistryInfo?.quantity || 0;
    }

    let baseStock = 0;
    if (warehouseId === 'all') {
      baseStock = inceptionStock;
    } else {
      if (warehouseId === 'w1') {
        if (itemCode === 'DR-BIT-8.5-PDC') baseStock = 9;
        else if (itemCode === 'HSE-HARN-CLA') baseStock = 55;
        else if (itemLocation === 'Warehouse A' || itemLocation === 'Houston Main Station') baseStock = inceptionStock;
        else baseStock = 0;
      } else if (warehouseId === 'w2') {
        if (itemCode === 'LUB-GRE-DRUM') baseStock = 13;
        else if (itemLocation === 'Warehouse B' || itemLocation === 'Permian Base Yard') baseStock = inceptionStock;
        else baseStock = 0;
      } else {
        baseStock = 0;
      }
    }

    const allEvents: any[] = [];

    // 1. MRV (Receipts)
    const mrvsList = this.mockDataService.mrvs();
    mrvsList.forEach(m => {
      if (m.status !== 'Posted' && m.status !== 'Approved') return;
      if (warehouseId !== 'all' && m.warehouseId !== warehouseId) return;

      if (projectId !== 'all') {
        const matchProj = m.projectId === projectId || m.projectName === projectId;
        if (!matchProj) return;
      }

      m.items.forEach(it => {
        if (it.itemCode === itemCode) {
          allEvents.push({
            date: m.receivedDate,
            type: 'Purchase Receipt',
            docNo: m.voucherNumber,
            ref: m.poNumber || 'N/A',
            description: `Purchased from ${m.supplierName}`,
            qtyIn: it.quantityReceived,
            qtyOut: 0,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
            warehouseId: m.warehouseId,
            projectId: m.projectId || ''
          });
        }
      });
    });

    // 2. MIV (Issues)
    const mivsList = this.mockDataService.mivs();
    mivsList.forEach(m => {
      if (m.status !== 'Posted' && m.status !== 'Approved') return;

      if (projectId !== 'all') {
        const matchProj = m.destinationId === projectId || m.destinationId.includes(projectId);
        if (!matchProj) return;
      }

      if (warehouseId !== 'all' && itemHomeWarehouseId && itemHomeWarehouseId !== warehouseId) {
        return;
      }

      m.items.forEach(it => {
        if (it.itemCode === itemCode) {
          const isContractor = m.issueTo === 'Project' && (m.destinationId.toLowerCase().includes('contractor') || m.requestedBy.toLowerCase().includes('contractor'));
          const type = isContractor ? 'Contractor Issue' : 'Consumption';
          allEvents.push({
            date: m.issueDate,
            type: type,
            docNo: m.voucherNumber,
            ref: m.referenceNumber || 'N/A',
            description: `Issued to ${m.issueTo}: ${m.destinationId}`,
            qtyIn: 0,
            qtyOut: it.quantityIssued,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
            warehouseId: itemHomeWarehouseId,
            projectId: m.issueTo === 'Project' ? m.destinationId : ''
          });
        }
      });
    });

    // 3. Transfers
    const transfersList = this.mockDataService.transfers();
    transfersList.forEach(x => {
      if (x.status !== 'Posted' && x.status !== 'Approved') return;

      x.items.forEach(it => {
        if (it.itemCode !== itemCode) return;
        if (projectId !== 'all') return;

        const qty = it.quantity;

        if (warehouseId === 'all') {
          allEvents.push({
            date: x.transferDate,
            type: 'Transfer Out',
            docNo: x.transferNumber,
            ref: 'Internal',
            description: `Transferred from WH-A to WH-B`,
            qtyIn: 0,
            qtyOut: qty,
            warehouseId: x.fromWarehouseId,
            projectId: ''
          });
          allEvents.push({
            date: x.transferDate,
            type: 'Transfer In',
            docNo: x.transferNumber,
            ref: 'Internal',
            description: `Transferred from WH-A to WH-B`,
            qtyIn: qty,
            qtyOut: 0,
            warehouseId: x.toWarehouseId,
            projectId: ''
          });
        } else {
          if (x.fromWarehouseId === warehouseId) {
            allEvents.push({
              date: x.transferDate,
              type: 'Transfer Out',
              docNo: x.transferNumber,
              ref: 'Internal',
              description: `Transferred to ${x.toWarehouseId === 'w2' ? 'Warehouse B' : 'Warehouse A'}`,
              qtyIn: 0,
              qtyOut: qty,
              warehouseId: x.fromWarehouseId,
              projectId: ''
            });
          } else if (x.toWarehouseId === warehouseId) {
            allEvents.push({
              date: x.transferDate,
              type: 'Transfer In',
              docNo: x.transferNumber,
              ref: 'Internal',
              description: `Transferred from ${x.fromWarehouseId === 'w1' ? 'Warehouse A' : 'Warehouse B'}`,
              qtyIn: qty,
              qtyOut: 0,
              warehouseId: x.toWarehouseId,
              projectId: ''
            });
          }
        }
      });
    });

    // 4. Adjustments
    const adjustmentsList = this.mockDataService.adjustments();
    adjustmentsList.forEach(a => {
      if (a.status !== 'Posted' && a.status !== 'Approved') return;
      if (warehouseId !== 'all' && a.warehouseId !== warehouseId) return;
      if (projectId !== 'all') return;

      a.items.forEach(it => {
        if (it.itemCode === itemCode) {
          const qty = Math.abs(it.adjustedQuantity);
          const isIn = it.adjustmentType === 'Addition' || it.adjustedQuantity > 0;
          const isReturn = it.reason.toLowerCase().includes('return');
          const type = isReturn ? 'Returns' : (isIn ? 'Adjustment Addition' : 'Adjustment Deduction');

          allEvents.push({
            date: a.adjustmentDate,
            type: type,
            docNo: a.adjustmentNumber,
            ref: 'Manual',
            description: it.reason,
            qtyIn: isIn ? qty : 0,
            qtyOut: isIn ? 0 : qty,
            unitPrice: it.unitPrice,
            totalPrice: qty * it.unitPrice,
            warehouseId: a.warehouseId,
            projectId: ''
          });
        }
      });
    });

    // Sort chronologically
    allEvents.sort((a, b) => {
      const dDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dDiff !== 0) return dDiff;
      return a.docNo.localeCompare(b.docNo);
    });

    // Calculate opening and running balances
    let runningBal = baseStock;
    const eventsBeforeStart: any[] = [];
    const eventsInPeriod: any[] = [];

    const startDate = startStr ? new Date(startStr) : null;
    const endDate = endStr ? new Date(endStr) : null;

    allEvents.forEach(ev => {
      const evDate = new Date(ev.date);
      const beforeStart = startDate && evDate < startDate;
      const afterEnd = endDate && evDate > endDate;

      if (beforeStart) {
        runningBal += ev.qtyIn - ev.qtyOut;
        eventsBeforeStart.push(ev);
      } else if (!afterEnd) {
        eventsInPeriod.push(ev);
      }
    });

    const openingBalance = runningBal;
    const formattedTransactions: any[] = [];
    eventsInPeriod.forEach(ev => {
      runningBal += ev.qtyIn - ev.qtyOut;
      formattedTransactions.push({
        ...ev,
        runningBalance: runningBal
      });
    });

    const closingBalance = runningBal;

    return {
      openingBalance,
      transactions: formattedTransactions,
      closingBalance,
      uom,
      itemName
    };
  });

  // Helper Metrics Computed Signals
  readonly totalInflows = computed(() => {
    return this.ledgerData().transactions.reduce((sum, tx) => sum + tx.qtyIn, 0);
  });

  readonly totalOutflows = computed(() => {
    return this.ledgerData().transactions.reduce((sum, tx) => sum + tx.qtyOut, 0);
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.inventory', url: '/inventory' },
      { label: 'navigation.item_ledger' }
    ]);
  }

  getWarehouseName(id: string): string {
    if (id === 'all') return this.translateService.instant('inventory.all_warehouses');
    const wh = this.warehouses().find(w => w.id === id);
    return wh ? wh.name : id;
  }

  getProjectName(code: string): string {
    if (code === 'all') return this.translateService.instant('inventory.all_projects');
    const pr = this.projectsList().find(p => p.code === code);
    return pr ? pr.name : code;
  }

  exportToCSV() {
    const data = this.ledgerData();
    if (!this.selectedItemCode()) return;

    const headers = [
      'Date',
      'Transaction Type',
      'Document No',
      'Reference',
      'Description',
      'Quantity In',
      'Quantity Out',
      'Running Balance'
    ];

    const rows = [
      [
        this.dateFrom() || '2026-06-01',
        'Opening Balance',
        '-',
        '-',
        'Opening Stock Statement',
        '-',
        '-',
        data.openingBalance.toString()
      ]
    ];

    data.transactions.forEach(tx => {
      rows.push([
        tx.date,
        tx.type,
        tx.docNo,
        tx.ref,
        tx.description,
        tx.qtyIn > 0 ? tx.qtyIn.toString() : '0',
        tx.qtyOut > 0 ? tx.qtyOut.toString() : '0',
        tx.runningBalance.toString()
      ]);
    });

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';
    rows.forEach(r => {
      csvContent += r.map(field => `"${field.replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Item_Ledger_${this.selectedItemCode()}_${this.dateFrom()}_to_${this.dateTo()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success(
      this.translateService.instant('reports.notification_title'),
      'Item Ledger exported successfully as CSV.'
    );
  }

  printReport() {
    window.print();
  }
}
