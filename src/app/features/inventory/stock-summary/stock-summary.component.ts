import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { InventoryApiService, extractApiArray } from '../../../core/services/inventory-api.service';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-stock-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6 animate-fade-in printable-container">
      <!-- Header (Hidden on print) -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">
            {{ 'inventory.stock_summary_title' | translate }}
          </h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">
            {{ 'inventory.stock_summary_subtitle' | translate }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button 
            (click)="exportToCSV()" 
            class="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ 'inventory.export_excel' | translate }}
          </button>
          <button 
            (click)="printReport()" 
            class="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
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
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      <!-- Report Card Content -->
      <div class="space-y-6 printable-report">
        <!-- Print Header -->
        <div class="hidden print-header border-b border-slate-200 pb-4 mb-4">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-xl font-bold text-slate-900">{{ 'inventory.stock_summary_title' | translate }}</h1>
              <p class="text-[10px] text-slate-500 font-semibold">{{ 'inventory.stock_summary_subtitle' | translate }}</p>
            </div>
            <div class="text-right text-[9px] text-slate-400">
              <p>Printed: {{ printDate | date:'medium' }}</p>
              <p>Warehouse: {{ getWarehouseName(selectedWarehouseId()) }}</p>
              <p>Project: {{ getProjectName(selectedProjectId()) }}</p>
              <p>Date Range: {{ dateFrom() || 'Inception' }} to {{ dateTo() || 'Present' }}</p>
            </div>
          </div>
        </div>

        <!-- Matrix Table -->
        <div class="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="p-4 bg-slate-50/20 border-b border-slate-100 flex items-center justify-between no-print">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Material Summary Sheet
            </h3>
            <span class="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
              {{ summaryRows().length }} {{ 'inventory.total_items' | translate }}
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-[10px] sm:text-xs">
              <thead>
                <!-- Section Headers -->
                <tr class="text-slate-400 font-bold border-b border-slate-100 bg-slate-50/10 text-center uppercase tracking-wider text-[9px]">
                  <th colspan="3" class="p-4 py-2 border-r border-slate-100 text-left">Item Info</th>
                  <th colspan="1" class="p-2 border-r border-slate-100 bg-slate-50/20">Balance</th>
                  <th colspan="3" class="p-2 border-r border-slate-100 bg-green-50/20 text-green-700">Inflows (Receipts)</th>
                  <th colspan="3" class="p-2 border-r border-slate-100 bg-red-50/20 text-red-700">Outflows (Issues)</th>
                  <th colspan="2" class="p-2 border-r border-slate-100">Ending Stock</th>
                  <th colspan="3" class="p-2 border-r border-slate-100 bg-indigo-50/20 text-indigo-700">Project-to-Date (PTD)</th>
                  <th class="p-4 py-2 text-left">Status</th>
                </tr>
                <!-- Column Headers -->
                <tr class="text-slate-500 font-bold border-b border-slate-100 bg-slate-50/30">
                  <th class="p-3 text-left">{{ 'inventory.col_item_code' | translate }}</th>
                  <th class="p-3 text-left">Item Name</th>
                  <th class="p-3 text-left border-r border-slate-100">Unit</th>
                  
                  <th class="p-3 text-right border-r border-slate-100 bg-slate-50/10 font-bold">{{ 'inventory.opening_balance' | translate }}</th>
                  
                  <th class="p-3 text-right bg-green-50/10 text-green-700">{{ 'inventory.purchases' | translate }}</th>
                  <th class="p-3 text-right bg-green-50/10 text-green-700">{{ 'inventory.operations_in' | translate }}</th>
                  <th class="p-3 text-right border-r border-slate-100 bg-green-50/10 text-green-700">{{ 'inventory.transfers_in' | translate }}</th>
                  
                  <th class="p-3 text-right bg-red-50/10 text-red-600">{{ 'inventory.consumption' | translate }}</th>
                  <th class="p-3 text-right bg-red-50/10 text-red-600">{{ 'inventory.operations_out' | translate }}</th>
                  <th class="p-3 text-right border-r border-slate-100 bg-red-50/10 text-red-600">{{ 'inventory.contractors' | translate }}</th>
                  
                  <th class="p-3 text-right font-bold text-slate-800">{{ 'inventory.current_balance' | translate }}</th>
                  <th class="p-3 text-right border-r border-slate-100 font-bold text-slate-900 bg-slate-100/50">{{ 'inventory.closing_balance' | translate }}</th>
                  
                  <th class="p-3 text-right bg-indigo-50/10 text-indigo-700">{{ 'inventory.ptd_in' | translate }}</th>
                  <th class="p-3 text-right bg-indigo-50/10 text-indigo-700">{{ 'inventory.ptd_out' | translate }}</th>
                  <th class="p-3 text-right border-r border-slate-100 bg-indigo-50/10 text-indigo-700">{{ 'inventory.ptd_consumption' | translate }}</th>
                  
                  <th class="p-3 text-left">{{ 'inventory.notes' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                @for (row of summaryRows(); track row.itemCode) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="p-3 font-mono font-bold text-slate-900">{{ row.itemCode }}</td>
                    <td class="p-3 font-semibold text-slate-700 max-w-[150px] truncate" [title]="row.itemName">{{ row.itemName }}</td>
                    <td class="p-3 text-slate-400 font-bold border-r border-slate-100">{{ row.uom }}</td>
                    
                    <td class="p-3 text-right font-mono border-r border-slate-100 bg-slate-50/10 text-slate-600 font-bold">{{ row.openingBalance }}</td>
                    
                    <td class="p-3 text-right font-mono text-green-600 bg-green-50/5">{{ row.purchases }}</td>
                    <td class="p-3 text-right font-mono text-green-600 bg-green-50/5">{{ row.opsIn }}</td>
                    <td class="p-3 text-right font-mono text-green-600 bg-green-50/5 border-r border-slate-100">{{ row.transfersIn }}</td>
                    
                    <td class="p-3 text-right font-mono text-red-500 bg-red-50/5">{{ row.consumption }}</td>
                    <td class="p-3 text-right font-mono text-red-500 bg-red-50/5">{{ row.opsOut }}</td>
                    <td class="p-3 text-right font-mono text-red-500 bg-red-50/5 border-r border-slate-100">{{ row.contractors }}</td>
                    
                    <td class="p-3 text-right font-mono font-bold text-slate-700">{{ row.currentBalance }}</td>
                    <td class="p-3 text-right font-mono font-black text-slate-900 border-r border-slate-100 bg-slate-100/20">{{ row.closingBalance }}</td>
                    
                    <td class="p-3 text-right font-mono text-indigo-650 bg-indigo-50/5">{{ row.ptdIn }}</td>
                    <td class="p-3 text-right font-mono text-indigo-650 bg-indigo-50/5">{{ row.ptdOut }}</td>
                    <td class="p-3 text-right font-mono text-indigo-650 bg-indigo-50/5 border-r border-slate-100">{{ row.ptdConsumption }}</td>
                    
                    <td class="p-3 text-left">
                      <span 
                        class="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider"
                        [class.bg-green-50]="row.status === 'In Stock'"
                        [class.text-green-600]="row.status === 'In Stock'"
                        [class.bg-amber-50]="row.status === 'Low Stock'"
                        [class.text-amber-600]="row.status === 'Low Stock'"
                        [class.bg-rose-50]="row.status === 'Out of Stock'"
                        [class.text-rose-600]="row.status === 'Out of Stock'"
                      >
                        {{ row.status }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Print styling -->
    <style>
      @media print {
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
        .bg-slate-50\\/20, .bg-slate-50\\/30, .bg-slate-50\\/10, .bg-green-50\\/5, .bg-red-50\\/5, .bg-indigo-50\\/5, .bg-slate-100\\/20 {
          background-color: transparent !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 8px !important; /* Smaller size to fit printing width */
        }
        th, td {
          border-bottom: 1px solid #e2e8f0 !important;
          border-right: 1px solid #f1f5f9 !important;
          padding: 4px !important;
        }
      }
    </style>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockSummaryComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly inventoryApi = inject(InventoryApiService);

  // Filter Signals
  readonly selectedWarehouseId = signal<string>('all');
  readonly selectedProjectId = signal<string>('all');
  
  // Date signals
  readonly dateFrom = signal<string>('2026-06-01');
  readonly dateTo = signal<string>('2026-06-30');

  // Core Data Stores (Signals from API)
  readonly inventory   = signal<any[]>([]);
  readonly warehouses  = signal<any[]>([]);
  readonly mrvs        = signal<any[]>([]);
  readonly mivs        = signal<any[]>([]);
  readonly transfers   = signal<any[]>([]);
  readonly adjustments = signal<any[]>([]);
  
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

  // Calculate Stock Summary Grid data
  readonly summaryRows = computed(() => {
    const warehouseId = this.selectedWarehouseId();
    const projectId = this.selectedProjectId();
    const startStr = this.dateFrom();
    const endStr = this.dateTo();

    const inventoryRegistry = this.inventory();
    
    return inventoryRegistry.map(item => {
      const itemCode = item.itemCode;
      const itemName = item.itemName;
      const uom = item.uom;
      const itemLocation = item.location;
      
      let itemHomeWarehouseId = '';
      if (itemLocation === 'Warehouse A') itemHomeWarehouseId = 'w1';
      else if (itemLocation === 'Warehouse B') itemHomeWarehouseId = 'w2';

      // Define Inception stock levels (June 1st, 2026)
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
        inceptionStock = item.quantity || 0;
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

      let opening = baseStock;
      let purchases = 0;
      let opsIn = 0;
      let transfersIn = 0;
      let transfersOut = 0;
      let consumption = 0;
      let opsOut = 0;
      let contractors = 0;

      let ptdIn = 0;
      let ptdOut = 0;
      let ptdConsumption = 0;

      const startDate = startStr ? new Date(startStr) : null;
      const endDate = endStr ? new Date(endStr) : null;

      // 1. MRVs (Receipts)
      const mrvsList = this.mrvs();
      mrvsList.forEach(m => {
        if (m.status !== 'Posted' && m.status !== 'Approved') return;
        if (warehouseId !== 'all' && m.warehouseId !== warehouseId) return;
        if (projectId !== 'all' && m.projectId !== projectId && m.projectName !== projectId) return;

        (m.items || []).forEach((it: any) => {
          if (it.itemCode === itemCode) {
            const qty = it.quantityReceived || it.quantity || 0;
            const txDate = new Date(m.receivedDate || m.createdAt);

            if (!endDate || txDate <= endDate) {
              ptdIn += qty;
            }

            if (startDate && txDate < startDate) {
              opening += qty;
            } else if ((!startDate || txDate >= startDate) && (!endDate || txDate <= endDate)) {
              purchases += qty;
            }
          }
        });
      });

      // 2. MIVs (Issues)
      const mivsList = this.mivs();
      mivsList.forEach(m => {
        if (m.status !== 'Posted' && m.status !== 'Approved') return;
        if (projectId !== 'all' && m.destinationId !== projectId && (m.destinationId && !m.destinationId.includes(projectId))) return;
        if (warehouseId !== 'all' && itemHomeWarehouseId && itemHomeWarehouseId !== warehouseId) return;

        (m.items || []).forEach((it: any) => {
          if (it.itemCode === itemCode) {
            const qty = it.quantityIssued || it.quantity || 0;
            const txDate = new Date(m.issueDate || m.createdAt);
            const isContractor = m.issueTo === 'Project' && (m.destinationId?.toLowerCase().includes('contractor') || m.requestedBy?.toLowerCase().includes('contractor'));

            if (!endDate || txDate <= endDate) {
              if (isContractor) {
                ptdOut += qty;
              } else {
                ptdConsumption += qty;
              }
            }

            if (startDate && txDate < startDate) {
              opening -= qty;
            } else if ((!startDate || txDate >= startDate) && (!endDate || txDate <= endDate)) {
              if (isContractor) {
                contractors += qty;
              } else {
                consumption += qty;
              }
            }
          }
        });
      });

      // 3. Transfers (Internal transfers)
      const transfersList = this.transfers();
      transfersList.forEach(x => {
        if (x.status !== 'Posted' && x.status !== 'Approved') return;
        if (projectId !== 'all') return;

        (x.items || []).forEach((it: any) => {
          if (it.itemCode !== itemCode) return;
          
          const qty = it.quantity || 0;
          const txDate = new Date(x.transferDate || x.createdAt);

          if (!endDate || txDate <= endDate) {
            if (warehouseId !== 'all') {
              if (x.fromWarehouseId === warehouseId) ptdOut += qty;
              else if (x.toWarehouseId === warehouseId) ptdIn += qty;
            }
          }

          if (startDate && txDate < startDate) {
            if (warehouseId !== 'all') {
              if (x.fromWarehouseId === warehouseId) opening -= qty;
              else if (x.toWarehouseId === warehouseId) opening += qty;
            }
          } else if ((!startDate || txDate >= startDate) && (!endDate || txDate <= endDate)) {
            if (warehouseId === 'all') {
              transfersIn += qty;
              transfersOut += qty;
            } else {
              if (x.fromWarehouseId === warehouseId) transfersOut += qty;
              else if (x.toWarehouseId === warehouseId) transfersIn += qty;
            }
          }
        });
      });

      // 4. Adjustments
      const adjustmentsList = this.adjustments();
      adjustmentsList.forEach(a => {
        if (a.status !== 'Posted' && a.status !== 'Approved') return;
        if (warehouseId !== 'all' && a.warehouseId !== warehouseId) return;
        if (projectId !== 'all') return;

        (a.items || []).forEach((it: any) => {
          if (it.itemCode === itemCode) {
            const qty = Math.abs(it.adjustedQuantity || it.quantity || 0);
            const isIn = it.adjustmentType === 'Addition' || (it.adjustedQuantity && it.adjustedQuantity > 0);
            const txDate = new Date(a.adjustmentDate || a.createdAt);

            if (!endDate || txDate <= endDate) {
              if (isIn) ptdIn += qty;
              else ptdOut += qty;
            }

            if (startDate && txDate < startDate) {
              opening += isIn ? qty : -qty;
            } else if ((!startDate || txDate >= startDate) && (!endDate || txDate <= endDate)) {
              if (isIn) opsIn += qty;
              else opsOut += qty;
            }
          }
        });
      });

      const closing = opening + purchases + opsIn + transfersIn - consumption - opsOut - transfersOut - contractors;

      return {
        itemCode,
        itemName,
        uom,
        openingBalance: opening,
        purchases,
        opsIn,
        transfersIn,
        transfersOut,
        consumption,
        opsOut,
        contractors,
        currentBalance: item.quantity,
        ptdIn,
        ptdOut,
        ptdConsumption,
        closingBalance: closing,
        status: item.status
      };
    });
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.inventory', url: '/inventory' },
      { label: 'inventory.stock_summary_title' }
    ]);
    this.loadAll();
  }

  loadAll() {
    this.inventoryApi.getItems({ limit: 500 }).subscribe({
      next: (res: any) => this.inventory.set(extractApiArray(res).map((i: any) => ({ ...i, id: i._id ?? i.id }))),
      error: () => this.inventory.set([])
    });
    this.inventoryApi.getWarehouses().subscribe({
      next: (res: any) => this.warehouses.set(extractApiArray(res)),
      error: () => this.warehouses.set([])
    });
    this.inventoryApi.getMRVs({ limit: 500 }).subscribe({
      next: (res: any) => this.mrvs.set(extractApiArray(res)),
      error: () => this.mrvs.set([])
    });
    this.inventoryApi.getMIVs({ limit: 500 }).subscribe({
      next: (res: any) => this.mivs.set(extractApiArray(res)),
      error: () => this.mivs.set([])
    });
    this.inventoryApi.getTransfers({ limit: 500 }).subscribe({
      next: (res: any) => this.transfers.set(extractApiArray(res)),
      error: () => this.transfers.set([])
    });
    this.inventoryApi.getAdjustments({ limit: 500 }).subscribe({
      next: (res: any) => this.adjustments.set(extractApiArray(res)),
      error: () => this.adjustments.set([])
    });
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
    const headers = [
      'Item Code',
      'Item Name',
      'Unit',
      'Opening Balance',
      'Purchases',
      'Operations In',
      'Transfers In',
      'Consumption',
      'Operations Out',
      'Contractors',
      'Current Balance',
      'Closing Balance',
      'PTD In',
      'PTD Out',
      'PTD Consumption'
    ];

    const rows = this.summaryRows().map(row => [
      row.itemCode,
      row.itemName,
      row.uom,
      row.openingBalance.toString(),
      row.purchases.toString(),
      row.opsIn.toString(),
      row.transfersIn.toString(),
      row.consumption.toString(),
      row.opsOut.toString(),
      row.contractors.toString(),
      row.currentBalance.toString(),
      row.closingBalance.toString(),
      row.ptdIn.toString(),
      row.ptdOut.toString(),
      row.ptdConsumption.toString()
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';
    rows.forEach(r => {
      csvContent += r.map(field => `"${field.replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Summary_${this.dateFrom()}_to_${this.dateTo()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success(
      this.translateService.instant('reports.notification_title'),
      'Stock Summary exported successfully as CSV.'
    );
  }

  printReport() {
    window.print();
  }
}
