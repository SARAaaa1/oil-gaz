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

  readonly warehouses = this.mockDataService.warehouses;
  readonly purchaseOrders = this.mockDataService.purchaseOrders;
  readonly mrvs = this.mockDataService.mrvs;

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
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  filteredMRVs = computed(() => {
    let list = this.mrvs();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;

    if (status === 'Draft') {
      list = list.filter(m => m.status === 'Draft');
    } else if (status === 'Approved') {
      list = list.filter(m => m.status === 'Approved' || m.status === 'Posted');
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

    this.mrvForm.items = po.items.map(item => {
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
    this.mockDataService.updateMRVStatus(mrv.id, 'Posted');

    try {
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
        details: 'Approved & Posted MRV ' + mrv.voucherNumber + '. GL journal posted. PO: ' + (mrv.poNumber || 'Direct')
      });

      if (mrv.poId) {
        const po = this.purchaseOrders().find(p => p.id === mrv.poId);
        if (po) {
          const linkedMRVs = this.mrvs().filter(m => m.poId === po.id && (m.status === 'Posted' || m.status === 'Approved'));
          const totalOrdered = po.items.reduce((sum, i) => sum + i.quantity, 0);
          const totalReceived = po.items.reduce((sum, poItem) => {
            return sum + linkedMRVs.reduce((s, m) => {
              const mi = m.items.find(mi => mi.itemCode === poItem.itemCode);
              return s + (mi ? mi.quantityReceived : 0);
            }, 0);
          }, 0);

          if (totalReceived >= totalOrdered) {
            this.notificationService.info('PO Completed', 'PO ' + po.poNumber + ' is now fully received and marked Completed.');
            this.auditService.log({
              action: 'Status Change',
              module: 'Procurement',
              entityName: 'PurchaseOrder',
              entityId: po.poNumber,
              details: 'PO ' + po.poNumber + ' fully received and set to Completed.'
            });
          }
        }
      }

      this.notificationService.success(
        'Approved & Posted',
        'MRV ' + mrv.voucherNumber + ' approved, inventory updated, and GL journal posted.'
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
