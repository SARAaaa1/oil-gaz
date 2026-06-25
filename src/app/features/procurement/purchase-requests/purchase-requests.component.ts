import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PurchaseRequest, PurchaseRequestItem, ChargeType, ItemType } from '../../../shared/interfaces/purchase-request.interface';
import { AuditService } from '../../../core/services/audit.service';
import { ApprovalHistoryComponent } from '../../../shared/components/approval-history/approval-history.component';
import { ProcurementChainComponent } from '../../../shared/components/procurement-chain/procurement-chain.component';

@Component({
  selector: 'app-purchase-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ApprovalHistoryComponent, ProcurementChainComponent],
  templateUrl: './purchase-requests.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseRequestsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  // Lists and Stores (Signals)
  readonly inventory = this.mockDataService.inventoryItems;
  readonly purchaseRequests = this.mockDataService.purchaseRequests;

  // Projects and Assets signals
  readonly projects = signal([
    { id: 'PRJ-001', name: 'Permian Overland Drilling' },
    { id: 'PRJ-002', name: 'Midland Basin Support' },
    { id: 'PRJ-003', name: 'Eagle Ford Shale Development' }
  ]);

  readonly assets = computed(() => {
    return this.mockDataService.equipment().map(e => ({
      id: e.id,
      name: e.equipmentName
    }));
  });

  // View States
  readonly isFormView = signal<boolean>(false);
  readonly selectedPR = signal<PurchaseRequest | null>(null);

  // Search & Filter
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('ALL');

  // Form State
  formPR = this.getEmptyForm();

  // Computed filtered list
  readonly filteredPRs = computed(() => {
    let list = this.purchaseRequests();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.statusFilter();

    if (filter !== 'ALL') {
      list = list.filter(pr => pr.status === filter);
    }

    if (query) {
      list = list.filter(pr => 
        pr.requestNumber.toLowerCase().includes(query) ||
        pr.department.toLowerCase().includes(query) ||
        pr.description.toLowerCase().includes(query) ||
        pr.costCenter.toLowerCase().includes(query) ||
        (pr.projectId && pr.projectId.toLowerCase().includes(query)) ||
        (pr.projectName && pr.projectName.toLowerCase().includes(query)) ||
        (pr.assetName && pr.assetName.toLowerCase().includes(query))
      );
    }

    // Sort descending by number
    return [...list].sort((a, b) => b.requestNumber.localeCompare(a.requestNumber));
  });

  // Dynamic Procurement Journey Stepper
  readonly procurementChain = computed(() => {
    const pr = this.selectedPR();
    if (!pr) return null;

    const chainId = pr.chainId;
    const rfq = this.mockDataService.rfqs().find(r => r.purchaseRequestId === pr.id || r.chainId === chainId);
    const quotations = rfq?.quotations || [];
    const po = this.mockDataService.purchaseOrders().find(p => p.chainId === chainId || (rfq && p.rfqId === rfq.id));
    const mrv = po ? this.mockDataService.mrvs().find(m => m.poId === po.id || m.poNumber === po.poNumber) : null;
    const invoice = po ? this.mockDataService.supplierInvoices().find(si => si.poId === po.id || si.poNumber === po.poNumber) : null;
    const payment = invoice ? this.mockDataService.paymentVouchers().find(pv => pv.invoicesPaid.some(ip => ip.invoiceId === invoice.id)) : null;

    return {
      pr,
      rfq,
      quotations,
      po,
      mrv,
      invoice,
      payment
    };
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.procurement', url: '/procurement' },
      { label: 'procurement.purchase_requests.breadcrumb' }
    ]);

    // Check query parameters to open form or select a PR directly
    this.route.queryParams.subscribe(params => {
      if (params['openForm'] === 'true') {
        this.isFormView.set(true);
      }
      if (params['prId']) {
        const pr = this.purchaseRequests().find(p => p.id === params['prId']);
        if (pr) {
          this.selectedPR.set(pr);
        }
      }
    });
  }

  getEmptyForm() {
    return {
      department: 'Drilling Operations',
      costCenter: 'CC-DRL-001',
      chargeType: 'General Overhead' as ChargeType,
      projectId: '',
      projectName: '',
      assetId: '',
      assetName: '',
      requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days out
      description: '',
      items: [
        { 
          itemType: 'Inventory Item' as ItemType,
          itemCode: '',
          itemName: '',
          quantity: 1,
          uom: 'EA',
          notes: '',
          itemDescription: '',
          category: 'General Spares',
          estimatedUnitCost: undefined,
          serviceDescription: '',
          scopeOfWork: '',
          estimatedCost: undefined,
          allowPartialIssue: true,
          currentStock: 0,
          reservedQty: 0,
          availableQty: 0,
          shortageQty: 0,
          fulfillFromStock: 0,
          fulfillByPurchase: 0
        }
      ] as any[]
    };
  }

  toggleViewMode() {
    this.isFormView.update(val => !val);
    if (!this.isFormView()) {
      this.formPR = this.getEmptyForm();
    }
  }

  onChargeTypeChange() {
    this.formPR.projectId = '';
    this.formPR.projectName = '';
    this.formPR.assetId = '';
    this.formPR.assetName = '';
  }

  onProjectSelect() {
    const proj = this.projects().find(p => p.id === this.formPR.projectId);
    this.formPR.projectName = proj ? proj.name : '';
  }

  onAssetSelect() {
    const asset = this.assets().find(a => a.id === this.formPR.assetId);
    this.formPR.assetName = asset ? asset.name : '';
  }

  onItemTypeChange(index: number) {
    const item = this.formPR.items[index];
    item.itemCode = '';
    item.itemName = '';
    item.quantity = 1;
    item.uom = 'EA';
    item.notes = '';
    item.itemDescription = '';
    item.estimatedUnitCost = undefined;
    item.serviceDescription = '';
    item.scopeOfWork = '';
    item.estimatedCost = undefined;
    item.allowPartialIssue = true;
    this.updateAvailabilityInfo(index);
  }

  addItemRow() {
    this.formPR.items.push({
      itemType: 'Inventory Item' as ItemType,
      itemCode: '',
      itemName: '',
      quantity: 1,
      uom: 'EA',
      notes: '',
      itemDescription: '',
      category: 'General Spares',
      estimatedUnitCost: undefined,
      serviceDescription: '',
      scopeOfWork: '',
      estimatedCost: undefined,
      allowPartialIssue: true,
      currentStock: 0,
      reservedQty: 0,
      availableQty: 0,
      shortageQty: 0,
      fulfillFromStock: 0,
      fulfillByPurchase: 0
    });
  }

  removeItemRow(index: number) {
    if (this.formPR.items.length > 1) {
      this.formPR.items.splice(index, 1);
    }
  }

  onItemSelect(index: number) {
    const row = this.formPR.items[index];
    if (row.itemType === 'Inventory Item') {
      const match = this.inventory().find(i => i.itemCode === row.itemCode);
      if (match) {
        row.itemName = match.itemName;
        row.uom = match.uom;
      }
    }
    this.updateAvailabilityInfo(index);
  }

  onQuantityChange(index: number) {
    this.updateAvailabilityInfo(index);
  }

  onAllowPartialChange(index: number) {
    this.updateAvailabilityInfo(index);
  }

  updateAvailabilityInfo(index: number) {
    const row = this.formPR.items[index];
    if (row.itemType === 'Inventory Item' && row.itemCode) {
      const avail = this.mockDataService.getInventoryAvailability(row.itemCode);
      row.currentStock = avail.currentStock;
      row.reservedQty = avail.reservedQty;
      row.availableQty = avail.availableQty;
      row.shortageQty = Math.max(0, row.quantity - avail.availableQty);
      
      if (row.allowPartialIssue) {
        row.fulfillFromStock = Math.min(row.quantity, avail.availableQty);
        row.fulfillByPurchase = row.shortageQty;
      } else {
        if (avail.availableQty >= row.quantity) {
          row.fulfillFromStock = row.quantity;
          row.fulfillByPurchase = 0;
        } else {
          row.fulfillFromStock = 0;
          row.fulfillByPurchase = row.quantity;
        }
      }
    } else {
      row.currentStock = 0;
      row.reservedQty = 0;
      row.availableQty = 0;
      row.shortageQty = 0;
      row.fulfillFromStock = 0;
      row.fulfillByPurchase = 0;
    }
  }

  submitPR(event: Event) {
    event.preventDefault();

    // Validation
    const invalidItems = this.formPR.items.some(item => {
      if (item.itemType === 'Inventory Item') {
        return !item.itemCode || item.quantity <= 0;
      } else if (item.itemType === 'New Item') {
        return !item.itemDescription || item.quantity <= 0;
      } else if (item.itemType === 'Service') {
        return !item.serviceDescription || !item.estimatedCost || item.estimatedCost <= 0;
      }
      return true;
    });

    if (invalidItems) {
      this.notificationService.danger(
        this.translate.instant('procurement.purchase_requests.err_validation_title'),
        this.translate.instant('procurement.purchase_requests.err_validation_items')
      );
      return;
    }

    if (!this.formPR.description.trim()) {
      this.notificationService.danger(
        this.translate.instant('procurement.purchase_requests.err_validation_title'),
        this.translate.instant('procurement.purchase_requests.err_validation_desc')
      );
      return;
    }

    // Format items
    const formattedItems: PurchaseRequestItem[] = this.formPR.items.map((item, idx) => {
      const formatted: PurchaseRequestItem = {
        id: `pri-${Date.now()}-${idx}`,
        itemType: item.itemType,
        itemCode: item.itemCode,
        itemName: item.itemType === 'Inventory Item' ? item.itemName : (item.itemType === 'New Item' ? item.itemDescription : item.serviceDescription),
        quantity: item.itemType === 'Service' ? 1 : item.quantity,
        uom: item.itemType === 'Service' ? 'SRV' : item.uom,
        notes: item.notes,
        itemDescription: item.itemDescription,
        category: item.category,
        estimatedUnitCost: item.itemType === 'New Item' ? item.estimatedUnitCost : undefined,
        serviceDescription: item.serviceDescription,
        scopeOfWork: item.scopeOfWork,
        estimatedCost: item.itemType === 'Service' ? item.estimatedCost : undefined,
        allowPartialIssue: item.allowPartialIssue,
        currentStock: item.currentStock,
        reservedQty: item.reservedQty,
        availableQty: item.availableQty,
        shortageQty: item.shortageQty,
        fulfillFromStock: item.fulfillFromStock,
        fulfillByPurchase: item.fulfillByPurchase
      };
      return formatted;
    });

    // Check if any items are issued from stock
    const mivItems = formattedItems
      .filter(item => item.itemType === 'Inventory Item' && (item.fulfillFromStock ?? 0) > 0)
      .map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantityRequested: item.quantity,
        quantityIssued: item.fulfillFromStock!,
        unitPrice: this.inventory().find(inv => inv.itemCode === item.itemCode)?.unitPrice ?? 0,
        totalPrice: (this.inventory().find(inv => inv.itemCode === item.itemCode)?.unitPrice ?? 0) * item.fulfillFromStock!,
        uom: item.uom,
        inventoryCreditAcc: '1201-01',
        consumptionDebitAcc: '5102-04'
      }));

    let createdMIVId: string | null = null;
    if (mivItems.length > 0) {
      const list = this.mockDataService.mivs();
      const num = `MIV-2026-0${list.length + 1}`;
      const mivId = `miv-${Date.now()}`;
      const totalMIVAmount = mivItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      const newMIV = {
        id: mivId,
        voucherNumber: num,
        issueTo: this.formPR.chargeType === 'Project Cost' ? 'Project' as const : 'Cost Center' as const,
        destinationId: this.formPR.projectId || this.formPR.projectName || this.formPR.costCenter,
        referenceNumber: `PR-DIRECT-${Date.now()}`,
        requestedBy: this.auditService.logs().length > 0 ? this.auditService.logs()[0].user : 'Admin User',
        approvedBy: 'Auto System',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'Posted' as const,
        items: mivItems,
        totalAmount: totalMIVAmount
      };

      // Save MIV
      this.mockDataService.mivs.update(val => [...val, newMIV]);
      createdMIVId = mivId;

      // Deduct warehouse stock immediately
      mivItems.forEach(vitem => {
        const matched = this.inventory().find(inv => inv.itemCode === vitem.itemCode);
        if (matched) {
          const newQty = Math.max(0, matched.quantity - vitem.quantityIssued);
          this.mockDataService.updateInventoryItem(matched.id, {
            quantity: newQty,
            status: newQty === 0 ? 'Out of Stock' : newQty <= matched.minQuantity ? 'Low Stock' : 'In Stock'
          });
        }
      });

      this.notificationService.success(
        'Store Issue Created',
        `Material Issue Voucher ${num} generated immediately for in-stock items.`
      );
    }

    // Filter items that actually need to be purchased
    const purchaseItems = formattedItems.filter(item => {
      if (item.itemType === 'Inventory Item') {
        return (item.fulfillByPurchase ?? 0) > 0;
      }
      return true; // New items & services always require purchase
    });

    if (purchaseItems.length > 0) {
      const adjustedPRItems = purchaseItems.map(item => {
        if (item.itemType === 'Inventory Item') {
          return {
            ...item,
            quantity: item.fulfillByPurchase!,
            fulfillFromStock: 0,
            fulfillByPurchase: item.fulfillByPurchase!,
            availableQty: 0,
            shortageQty: item.fulfillByPurchase!
          };
        }
        return item;
      });

      // Save PR
      const newPr = this.mockDataService.addPurchaseRequest({
        department: this.formPR.department,
        costCenter: this.formPR.costCenter,
        chargeType: this.formPR.chargeType,
        projectId: this.formPR.projectId,
        projectName: this.formPR.projectName,
        assetId: this.formPR.assetId,
        assetName: this.formPR.assetName,
        requiredDate: this.formPR.requiredDate,
        description: this.formPR.description,
        requestedBy: this.auditService.logs().length > 0 ? this.auditService.logs()[0].user : 'Admin User',
        items: adjustedPRItems
      });

      // Audit Log Dispatch
      this.auditService.log(
        'Create',
        'Procurement',
        'PurchaseRequest',
        newPr.id,
        'N/A',
        `PR Number: ${newPr.requestNumber}`,
        this.translate.instant('procurement.purchase_requests.audit_created', {
          dept: newPr.department,
          date: newPr.requiredDate,
          desc: newPr.description
        })
      );

      this.notificationService.success(
        this.translate.instant('procurement.purchase_requests.notif_created_title'),
        this.translate.instant('procurement.purchase_requests.notif_created_desc', { pr: newPr.requestNumber })
      );
    }

    // Reset and toggle view
    this.isFormView.set(false);
    this.formPR = this.getEmptyForm();

    if (createdMIVId) {
      this.router.navigate(['/inventory'], { queryParams: { tab: 'miv', mivId: createdMIVId } });
    }
  }

  viewDetails(pr: PurchaseRequest) {
    this.selectedPR.set(pr);
  }

  closeDetails() {
    this.selectedPR.set(null);
  }

  approveRequisition(id: string) {
    this.mockDataService.updatePRStatus(id, 'Approved');
    const pr = this.purchaseRequests().find(p => p.id === id);
    
    if (pr) {
      this.auditService.log(
        'Approve',
        'Procurement',
        'PurchaseRequest',
        pr.id,
        'Status: PR Logged',
        'Status: Approved',
        this.translate.instant('procurement.purchase_requests.audit_approved', { pr: pr.requestNumber })
      );
    }

    this.notificationService.success(
      this.translate.instant('procurement.purchase_requests.notif_approved_title'),
      this.translate.instant('procurement.purchase_requests.notif_approved_desc_detailed', { pr: pr?.requestNumber })
    );
  }

  createRFQForPR(pr: PurchaseRequest) {
    this.closeDetails();
    // Redirect to RFQs page with query param to trigger creation automatically
    this.router.navigate(['/procurement/rfqs'], { 
      queryParams: { createForPR: pr.id } 
    });
  }

  // Dynamic Stepper Navigation
  navigateToDocument(type: string, id: string) {
    this.closeDetails();
    if (type === 'PR') {
      const pr = this.purchaseRequests().find(p => p.id === id);
      if (pr) this.selectedPR.set(pr);
    } else if (type === 'RFQ') {
      this.router.navigate(['/procurement/rfqs'], { queryParams: { rfqId: id } });
    } else if (type === 'PO') {
      this.router.navigate(['/procurement/purchase-orders'], { queryParams: { poId: id } });
    } else if (type === 'MRV') {
      this.router.navigate(['/inventory/mrvs'], { queryParams: { mrvId: id } });
    } else if (type === 'Invoice') {
      this.router.navigate(['/finance/supplier-invoices'], { queryParams: { invoiceId: id } });
    } else if (type === 'Payment') {
      this.router.navigate(['/finance/payment-vouchers'], { queryParams: { voucherId: id } });
    }
  }
}
