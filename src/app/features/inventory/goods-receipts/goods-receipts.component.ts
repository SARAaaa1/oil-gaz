import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuditService } from '../../../core/services/audit.service';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MRV } from '../../../shared/interfaces/inventory.interface';
import { POItem } from '../../../shared/interfaces/purchase-order.interface';
import { InventoryApiService, extractApiArray } from '../../../core/services/inventory-api.service';
import { ProcurementService } from '../../../core/services/procurement.service';

@Component({
  selector: 'app-goods-receipts',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './goods-receipts.component.html',
  styleUrls: ['./goods-receipts.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodsReceiptsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly auditService = inject(AuditService);
  private readonly financeService = inject(FinanceCoreService);
  private readonly notificationService = inject(NotificationService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly procurementService = inject(ProcurementService);

  readonly warehouses = signal<any[]>([]);
  readonly purchaseOrders = signal<any[]>([]);
  readonly mrvs = signal<MRV[]>([]);

  readonly selectedMRV = signal<MRV | null>(null);
  readonly isMRVModalOpen = signal(false);

  searchQuery = '';
  statusFilter = 'ALL';

  mrvForm: {
    poId: string;
    poNumber: string;
    warehouseId: string;
    receivedDate: string;
    supplierName: string;
    projectId: string;
    projectName: string;
    transportMethod: string;
    referenceType: string;
    referenceNumber: string;
    items: Array<{
      itemCode: string;
      itemName: string;
      quantityOrdered: number;
      quantityReceived: number;
      unitPrice: number;
      totalPrice: number;
      uom: string;
    }>;
  } = this.getEmptyForm();

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.inventory', url: '/inventory' },
      { label: 'navigation.goods_receipts' }
    ]);
    this.loadAll();
  }

  loadAll() {
    this.procurementService.getPOs(1, 100).subscribe({
      next: (res: any) => this.purchaseOrders.set(extractApiArray(res)),
      error: () => this.purchaseOrders.set([])
    });

    this.inventoryApi.getWarehouses(1).subscribe({
      next: (res: any) => this.warehouses.set(extractApiArray(res)),
      error: () => this.warehouses.set([])
    });

    this.inventoryApi.getMRVs({}).subscribe({
      next: (res: any) => this.mrvs.set(extractApiArray(res)),
      error: () => this.mrvs.set([])
    });
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  filteredMRVs = computed(() => {
    let list = this.mrvs();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;

    if (status === 'Pending Approval') {
      list = list.filter(m => m.status === 'Pending Approval');
    } else if (status === 'Approved') {
      list = list.filter(m => m.status === 'Approved');
    } else if (status === 'Posted') {
      list = list.filter(m => m.status === 'Posted');
    } else if (status === 'Draft') {
      list = list.filter(m => m.status === 'Draft');
    }

    if (query) {
      list = list.filter(m =>
        m.voucherNumber.toLowerCase().includes(query) ||
        m.supplierName.toLowerCase().includes(query) ||
        (m.poNumber && m.poNumber.toLowerCase().includes(query))
      );
    }

    return list;
  });

  mrvGrandTotal = computed(() =>
    this.mrvForm.items.reduce((sum, i) => sum + i.totalPrice, 0)
  );

  // ─── Form Helpers ─────────────────────────────────────────────────────────

  private getEmptyForm() {
    return {
      poId: '',
      poNumber: '',
      warehouseId: 'w1',
      receivedDate: new Date().toISOString().split('T')[0],
      supplierName: '',
      projectId: '',
      projectName: '',
      transportMethod: 'Road',
      referenceType: 'Purchase Order',
      referenceNumber: '',
      items: [] as Array<{
        itemCode: string;
        itemName: string;
        quantityOrdered: number;
        quantityReceived: number;
        unitPrice: number;
        totalPrice: number;
        uom: string;
      }>
    };
  }

  openAddMRV() {
    const defaultWh = this.warehouses()[0]?.id || 'w1';
    this.mrvForm = { ...this.getEmptyForm(), warehouseId: defaultWh };
    this.isMRVModalOpen.set(true);
  }

  onMRVPOSelect() {
    const po = this.purchaseOrders().find(p => p.id === this.mrvForm.poId);
    if (!po) return;

    this.mrvForm.supplierName = po.vendorName;
    this.mrvForm.poNumber = po.poNumber;
    this.mrvForm.projectId = po.projectId || po.projectName || 'PRJ-001';
    this.mrvForm.projectName = po.projectName || 'Permian Drilling';
    this.mrvForm.referenceNumber = po.poNumber;

    this.mrvForm.items = po.items.map((item: POItem) => {
      const prev = this.getPreviouslyReceivedQty(po.id, item.itemCode);
      const remaining = Math.max(0, item.quantity - prev);
      return {
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantityOrdered: item.quantity,
        quantityReceived: remaining,
        unitPrice: item.unitPrice,
        totalPrice: remaining * item.unitPrice,
        uom: item.uom
      };
    });
  }

  recalcItem(item: typeof this.mrvForm.items[0]) {
    const prev = this.getPreviouslyReceivedQty(this.mrvForm.poId, item.itemCode);
    const remaining = Math.max(0, item.quantityOrdered - prev);
    if (item.quantityReceived > remaining) {
      item.quantityReceived = remaining;
      this.notificationService.warning(
        'Limit Exceeded',
        'Cannot receive more than remaining PO qty of ' + remaining + ' for ' + item.itemCode
      );
    }
    if (item.quantityReceived < 0) item.quantityReceived = 0;
    item.totalPrice = (item.quantityReceived || 0) * item.unitPrice;
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  getPreviouslyReceivedQty(poId: string, itemCode: string): number {
    if (!poId) return 0;
    return this.mrvs()
      .filter(m => m.poId === poId && (m.status === 'Posted' || m.status === 'Approved'))
      .reduce((sum, mrv) => {
        const mi = mrv.items.find(i => i.itemCode === itemCode);
        return sum + (mi ? mi.quantityReceived : 0);
      }, 0);
  }

  getRemainingQty(poId: string, itemCode: string, orderedQty: number): number {
    return Math.max(0, orderedQty - this.getPreviouslyReceivedQty(poId, itemCode));
  }

  getItemCurrentStock(itemCode: string): number {
    const matched = this.mockDataService.inventoryItems().find(inv => inv.itemCode === itemCode);
    return matched ? matched.quantity : 0;
  }

  getWarehouseName(whId: string): string {
    const wh = this.warehouses().find(w => w.id === whId);
    return wh ? wh.name : whId;
  }

  getProjectName(projId?: string): string {
    if (!projId) return 'N/A';
    const list = [
      { code: 'PRJ-001', name: 'Permian Overland Drilling' },
      { code: 'PRJ-002', name: 'Midland Basin Support' },
      { code: 'PRJ-003', name: 'Eagle Ford Shale Development' }
    ];
    const match = list.find(p => p.code === projId);
    return match ? match.name : projId;
  }

  calculateTotalQty(mrv: MRV): number {
    return mrv.items.reduce((sum, item) => sum + item.quantityReceived, 0);
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  saveMRV() {
    if (this.mrvForm.items.length === 0) {
      this.notificationService.danger('Error', 'Please select a PO and ensure items are loaded.');
      return;
    }
    const hasInvalid = this.mrvForm.items.some(item => {
      const remaining = this.getRemainingQty(this.mrvForm.poId, item.itemCode, item.quantityOrdered);
      return item.quantityReceived < 0 || item.quantityReceived > remaining;
    });
    if (hasInvalid) {
      this.notificationService.danger('Validation Error', 'Some item quantities exceed the remaining PO balance.');
      return;
    }

    const total = this.mrvForm.items.reduce((sum, i) => sum + i.totalPrice, 0);
    const mrv = this.mockDataService.addMRV({
      poId: this.mrvForm.poId || undefined,
      poNumber: this.mrvForm.poNumber || undefined,
      warehouseId: this.mrvForm.warehouseId,
      receivedDate: this.mrvForm.receivedDate,
      receivedBy: 'Jim Halpert',
      supplierName: this.mrvForm.supplierName,
      projectId: this.mrvForm.projectId || undefined,
      projectName: this.mrvForm.projectName || undefined,
      chargeType: this.mrvForm.transportMethod,
      items: this.mrvForm.items,
      totalAmount: total
    });

    const isPartial = this.mrvForm.items.some(i =>
      i.quantityReceived < this.getRemainingQty(this.mrvForm.poId, i.itemCode, i.quantityOrdered)
    );

    this.auditService.log({
      action: 'Create',
      module: 'Inventory',
      entityName: 'MRV',
      entityId: mrv.voucherNumber,
      details: 'Created Goods Receipt ' + mrv.voucherNumber + ' (' + (isPartial ? 'Partial' : 'Full') + ') for PO: ' + (mrv.poNumber || 'Direct')
    });

    this.isMRVModalOpen.set(false);
    this.notificationService.success('Draft Saved', 'Voucher ' + mrv.voucherNumber + ' created successfully.');
  }

  approveMRV(mrv: MRV) {
    // Warehouse Manager Approval: transitions Pending Approval -> Approved
    this.mockDataService.updateMRVStatus(mrv.id, 'Approved');

    this.auditService.log({
      action: 'Approve',
      module: 'Inventory',
      entityName: 'MRV',
      entityId: mrv.voucherNumber,
      details: 'Warehouse Manager approved Goods Receipt ' + mrv.voucherNumber + '. Awaiting Financial Manager approval.'
    });

    this.notificationService.success(
      'Receipt Approved',
      'MRV ' + mrv.voucherNumber + ' approved by Warehouse. Pending final financial approval.'
    );
  }

  approveFinanceMRV(mrv: MRV) {
    // Financial Manager Approval: transitions Approved -> Posted
    this.mockDataService.updateMRVStatus(mrv.id, 'Posted');

    try {
      // 1. Post Ledger entries
      this.financeService.postJournalEntry({
        date: mrv.receivedDate,
        reference: mrv.voucherNumber,
        description: 'Goods Receipt ' + mrv.voucherNumber + ' from ' + mrv.supplierName,
        lines: [
          { id: crypto.randomUUID(), accountCode: '131000', accountName: 'Material Warehouse Stock', debit: mrv.totalAmount, credit: 0 },
          { id: crypto.randomUUID(), accountCode: '211000', accountName: 'Accounts Payable (A/P)', debit: 0, credit: mrv.totalAmount }
        ]
      });

      this.auditService.log({
        action: 'Approve',
        module: 'Inventory',
        entityName: 'MRV',
        entityId: mrv.voucherNumber,
        details: 'Financial Manager approved and posted MRV ' + mrv.voucherNumber + '. GL journal posted. PO: ' + (mrv.poNumber || 'Direct')
      });

      // 2. Generate Unpaid Supplier Invoice
      const po = this.purchaseOrders().find(p => p.id === mrv.poId || p.poNumber === mrv.poNumber);
      const invList = this.mockDataService.supplierInvoices();
      const invNum = `INV-${po ? po.poNumber.replace('PO-', '') : 'GEN'}-${invList.length + 1}`;

      const taxPercent = po ? po.taxPercent : 15;
      const subtotal = +(mrv.totalAmount / (1 + taxPercent / 100)).toFixed(2);
      const taxAmount = +(mrv.totalAmount - subtotal).toFixed(2);

      const newInvoice = {
        id: `ap-${mrv.poId || 'gen'}-${Date.now()}`,
        invoiceNumber: invNum,
        poId: mrv.poId,
        poNumber: mrv.poNumber,
        vendorId: po ? po.vendorId : 'v-gen',
        vendorName: mrv.supplierName,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subTotal: subtotal,
        taxAmount: taxAmount,
        totalAmount: mrv.totalAmount,
        status: 'Unpaid' as const, // Flows to A/P to be paid later
        paymentTerms: po ? po.paymentTerms : 'Net 30',
        chargeType: po ? po.chargeType : 'General Overhead',
        projectId: po ? po.projectId : undefined,
        projectName: po ? po.projectName : undefined,
        assetId: po ? po.assetId : undefined,
        assetName: po ? po.assetName : undefined,
        costCenter: po ? po.costCenter : 'CC-GEN'
      };

      this.mockDataService.supplierInvoices.update(val => [...val, newInvoice]);

      // 3. Update PO and complete it
      if (po) {
        this.mockDataService.purchaseOrders.update(pos =>
          pos.map(p => {
            if (p.id === po.id) {
              return {
                ...p,
                status: 'Completed' as const,
                items: p.items.map(pitem => {
                  const receivedItem = mrv.items.find(ii => ii.itemCode === pitem.itemCode);
                  if (receivedItem) {
                    return {
                      ...pitem,
                      quantity: receivedItem.quantityReceived,
                      totalPrice: receivedItem.quantityReceived * pitem.unitPrice
                    };
                  }
                  return pitem;
                }),
                subtotal,
                taxAmount,
                totalAmount: mrv.totalAmount
              };
            }
            return p;
          })
        );

        // 4. Log Vendor Timeline Events
        const timelineEvents = [
          {
            id: `ev-inv-${Date.now()}`,
            vendorId: po.vendorId,
            date: newInvoice.invoiceDate,
            eventType: 'Invoice Submitted' as const,
            title: 'Supplier Invoice Generated',
            description: `Supplier invoice ${newInvoice.invoiceNumber} generated automatically from approved Goods Receipt ${mrv.voucherNumber}. (Awaiting payment)`,
            referenceNumber: newInvoice.invoiceNumber,
            amount: newInvoice.totalAmount,
            performedBy: 'System Auto-Billing'
          }
        ];

        timelineEvents.forEach(ev => {
          this.mockDataService.vendorTimeline.update(list => [...list, ev]);
        });
      }

      this.notificationService.success(
        'Financial Approval Completed',
        'MRV ' + mrv.voucherNumber + ' posted. Supplier invoice ' + invNum + ' created.'
      );
    } catch (e: any) {
      this.notificationService.danger('GL Posting Error', e.message);
    }
  }

  viewMRV(mrv: MRV) {
    this.selectedMRV.set(mrv);
  }

  printMRV() {
    const mrv = this.selectedMRV();
    if (mrv) {
      this.auditService.log({
        action: 'Status Change',
        module: 'Inventory',
        entityName: 'MRV',
        entityId: mrv.voucherNumber,
        details: 'User printed/downloaded MRV document ' + mrv.voucherNumber
      });
    }
    window.print();
  }
}
