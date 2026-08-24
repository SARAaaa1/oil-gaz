import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PurchaseRequest, PurchaseRequestItem, ChargeType, ItemType } from '../../../shared/interfaces/purchase-request.interface';
import { AuditService } from '../../../core/services/audit.service';
import { ApprovalHistoryComponent } from '../../../shared/components/approval-history/approval-history.component';
import { ProcurementChainComponent } from '../../../shared/components/procurement-chain/procurement-chain.component';
import { ProcurementService } from '../../../core/services/procurement.service';
import { InventoryApiService } from '../../../core/services/inventory-api.service';
import { finalize } from 'rxjs/operators';

// ─── Mapper: API → Frontend interface ────────────────────────────────────────

function mapApiPR(raw: any): PurchaseRequest {
  return {
    id:                    raw._id ?? raw.id,
    requestNumber:         raw.requestNumber ?? raw.prNumber ?? raw.documentNumber ?? '',
    documentNumber:        raw.documentNumber ?? raw.requestNumber ?? '',
    procurementChain:      raw.procurementChain ?? '',
    rootProcurementNumber: raw.rootProcurementNumber ?? '',
    chainId:               raw.chainId ?? raw._id ?? raw.id,
    parentDocumentId:      raw.parentDocumentId,
    parentDocumentNumber:  raw.parentDocumentNumber,
    department:            raw.department ?? '',
    costCenter:            raw.costCenter ?? '',
    chargeType:            mapChargeType(raw.chargeType),
    projectId:             raw.projectId,
    projectName:           raw.projectName,
    assetId:               raw.assetId,
    assetName:             raw.assetName,
    requestDate:           raw.requestDate ?? raw.createdAt ?? '',
    requiredDate:          raw.requiredDate ?? '',
    status:                raw.status ?? 'Draft',
    description:           raw.description ?? '',
    requestedBy:           raw.requestedBy ?? '',
    items:                 (raw.items ?? []).map(mapApiPRItem),
    reservationCreated:    raw.reservationCreated,
  };
}

function mapApiPRItem(raw: any): PurchaseRequestItem {
  return {
    id:                 raw._id ?? raw.id ?? `pri-${Date.now()}`,
    itemType:           mapItemType(raw.itemType),
    itemCode:           raw.itemCode ?? '',
    itemName:           raw.itemName ?? raw.serviceDescription ?? raw.itemDescription ?? '',
    quantity:           raw.quantity ?? 1,
    uom:                raw.uom ?? 'PCS',
    notes:              raw.notes,
    itemDescription:    raw.itemDescription,
    category:           raw.category,
    estimatedUnitCost:  raw.estimatedUnitCost,
    serviceDescription: raw.serviceDescription,
    scopeOfWork:        raw.scopeOfWork,
    estimatedCost:      raw.estimatedCost,
    currentStock:       raw.currentStock,
    reservedQty:        raw.reservedQty,
    availableQty:       raw.availableQty,
    shortageQty:        raw.shortageQty,
    allowPartialIssue:  raw.allowPartialIssue ?? true,
    fulfillFromStock:   raw.fulfillFromStock ?? 0,
    fulfillByPurchase:  raw.fulfillByPurchase ?? 0,
  };
}

/** تحويل chargeType من API إلى نوع الـ frontend */
function mapChargeType(ct: string): ChargeType {
  if (ct === 'PROJECT' || ct === 'Project Cost') return 'Project Cost';
  if (ct === 'CAPEX' || ct === 'Asset Cost')     return 'Asset Cost';
  return 'General Overhead';
}

/** تحويل chargeType من الـ frontend إلى قيمة الـ API */
function mapChargeTypeToApi(ct: ChargeType): string {
  if (ct === 'Project Cost') return 'PROJECT';
  if (ct === 'Asset Cost')   return 'CAPEX';
  return 'OPEX';
}

/** تحويل itemType من API إلى نوع الـ frontend */
function mapItemType(it: string): ItemType {
  if (it === 'material' || it === 'Inventory Item') return 'Inventory Item';
  if (it === 'service'  || it === 'Service')         return 'Service';
  return 'New Item';
}

/** تحويل itemType من الـ frontend إلى قيمة الـ API */
function mapItemTypeToApi(it: ItemType): string {
  if (it === 'Inventory Item') return 'material';
  if (it === 'Service')        return 'service';
  return 'material';
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-purchase-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ApprovalHistoryComponent, ProcurementChainComponent],
  templateUrl: './purchase-requests.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseRequestsComponent implements OnInit {
  private readonly procurementService = inject(ProcurementService);
  private readonly inventoryApiService = inject(InventoryApiService);
  private readonly breadcrumbService  = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── State ────────────────────────────────────────────────────────────────
  readonly purchaseRequests = signal<PurchaseRequest[]>([]);
  readonly inventory        = signal<any[]>([]);
  readonly isLoading        = signal<boolean>(false);

  // Projects and Assets
  readonly projects = signal([
    { id: 'PRJ-001', name: 'Permian Overland Drilling' },
    { id: 'PRJ-002', name: 'Midland Basin Support' },
    { id: 'PRJ-003', name: 'Eagle Ford Shale Development' }
  ]);
  readonly assets = signal<{ id: string; name: string }[]>([]);

  // View States
  readonly isFormView  = signal<boolean>(false);
  readonly selectedPR  = signal<PurchaseRequest | null>(null);

  // Search & Filter
  readonly searchQuery  = signal<string>('');
  readonly statusFilter = signal<string>('ALL');

  // Form State
  formPR = this.getEmptyForm();

  // Computed filtered list
  readonly filteredPRs = computed(() => {
    let list = this.purchaseRequests();
    const query  = this.searchQuery().trim().toLowerCase();
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
        (pr.projectId   && pr.projectId.toLowerCase().includes(query)) ||
        (pr.projectName && pr.projectName.toLowerCase().includes(query)) ||
        (pr.assetName   && pr.assetName.toLowerCase().includes(query))
      );
    }

    return [...list].sort((a, b) => b.requestNumber.localeCompare(a.requestNumber));
  });

  // Procurement chain — بيانات مجمّعة من الـ API
  readonly procurementChain = signal<any>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.procurement', url: '/procurement' },
      { label: 'procurement.purchase_requests.breadcrumb' }
    ]);

    this.loadPRs();
    this.loadInventoryItems();

    this.route.queryParams.subscribe(params => {
      if (params['openForm'] === 'true') {
        this.isFormView.set(true);
      }
      if (params['prId']) {
        const pr = this.purchaseRequests().find(p => p.id === params['prId']);
        if (pr) {
          this.selectedPR.set(pr);
          this.loadProcurementChain(pr);
        }
      }
    });
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  private loadPRs() {
    this.isLoading.set(true);
    this.procurementService.getPRs({ limit: 200, sortOrder: 'DESC' })
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          const raw = res?.items ?? res ?? [];
          const mapped = (Array.isArray(raw) ? raw : []).map(mapApiPR);
          this.purchaseRequests.set(mapped);
        },
        error: err => {
          console.error('Failed to load Purchase Requests:', err);
          this.notificationService.danger('Error', 'Failed to load Purchase Requests.');
        }
      });
  }

  private loadInventoryItems() {
    this.inventoryApiService.getItems({ limit: 200 })
      .subscribe({
        next: res => {
          const raw = res?.items ?? res ?? [];
          this.inventory.set(Array.isArray(raw) ? raw : []);
          this.cdr.markForCheck();
        },
        error: err => console.error('Failed to load inventory items:', err)
      });
  }

  private loadProcurementChain(pr: PurchaseRequest) {
    // يبحث في القائمة المحملة حالياً عن بيانات الـ chain — تُحمَّل عند فتح التفاصيل
    this.procurementChain.set({ pr, rfq: null, quotations: [], po: null, mrv: null, invoice: null, payment: null });
  }

  // ── Form Helpers ──────────────────────────────────────────────────────────

  getEmptyForm() {
    return {
      department: 'Drilling Operations',
      costCenter: 'CC-DRL-001',
      chargeType: 'General Overhead' as ChargeType,
      projectId: '',
      projectName: '',
      assetId: '',
      assetName: '',
      requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
    this.formPR.projectId  = '';
    this.formPR.projectName = '';
    this.formPR.assetId    = '';
    this.formPR.assetName  = '';
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
    this.resetAvailability(item);
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
    if (row.itemType === 'Inventory Item' && row.itemCode) {
      // ابحث في الـ inventory المحملة
      const match = this.inventory().find((i: any) => i.itemCode === row.itemCode);
      if (match) {
        row.itemName = match.itemName;
        row.uom = match.uom;
      }
      this.updateAvailabilityInfo(index);
    }
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
      // استخدام الـ API للتحقق من التوافر
      this.inventoryApiService.getItemAvailability(row.itemCode).subscribe({
        next: (avail: any) => {
          row.currentStock  = avail.currentStock  ?? 0;
          row.reservedQty   = avail.reservedQty   ?? 0;
          row.availableQty  = avail.availableQty  ?? 0;
          row.shortageQty   = Math.max(0, row.quantity - row.availableQty);

          if (row.allowPartialIssue) {
            row.fulfillFromStock  = Math.min(row.quantity, row.availableQty);
            row.fulfillByPurchase = row.shortageQty;
          } else {
            if (row.availableQty >= row.quantity) {
              row.fulfillFromStock  = row.quantity;
              row.fulfillByPurchase = 0;
            } else {
              row.fulfillFromStock  = 0;
              row.fulfillByPurchase = row.quantity;
            }
          }
          this.cdr.markForCheck();
        },
        error: () => {
          // Fallback من الـ inventory المحملة
          const match = this.inventory().find((i: any) => i.itemCode === row.itemCode);
          if (match) {
            const available = match.quantity ?? 0;
            row.currentStock  = available;
            row.reservedQty   = 0;
            row.availableQty  = available;
            row.shortageQty   = Math.max(0, row.quantity - available);
            row.fulfillFromStock  = Math.min(row.quantity, available);
            row.fulfillByPurchase = row.shortageQty;
          }
          this.cdr.markForCheck();
        }
      });
    } else {
      this.resetAvailability(row);
    }
  }

  private resetAvailability(row: any) {
    row.currentStock  = 0;
    row.reservedQty   = 0;
    row.availableQty  = 0;
    row.shortageQty   = 0;
    row.fulfillFromStock  = 0;
    row.fulfillByPurchase = 0;
  }

  // ── Submit PR ─────────────────────────────────────────────────────────────

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

    // بناء الـ payload للـ API
    const apiItems = this.formPR.items.map(item => ({
      itemType:          mapItemTypeToApi(item.itemType),
      itemCode:          item.itemCode      || undefined,
      itemName:          item.itemType !== 'Service' ? item.itemName : undefined,
      quantity:          item.itemType === 'Service' ? 1 : item.quantity,
      uom:               item.itemType === 'Service' ? 'SRV' : item.uom,
      itemDescription:   item.itemDescription || undefined,
      category:          item.category       || undefined,
      estimatedUnitCost: item.estimatedUnitCost || undefined,
      serviceDescription: item.serviceDescription || undefined,
      scopeOfWork:       item.scopeOfWork    || undefined,
      estimatedCost:     item.estimatedCost  || undefined,
      allowPartialIssue: item.allowPartialIssue,
      currentStock:      item.currentStock   ?? 0,
      availableQty:      item.availableQty   ?? 0,
      shortageQty:       item.shortageQty    ?? 0,
      fulfillFromStock:  item.fulfillFromStock  ?? 0,
      fulfillByPurchase: item.fulfillByPurchase ?? 0,
    }));

    const payload = {
      department:   this.formPR.department,
      costCenter:   this.formPR.costCenter,
      chargeType:   mapChargeTypeToApi(this.formPR.chargeType),
      projectId:    this.formPR.projectId    || undefined,
      projectName:  this.formPR.projectName  || undefined,
      assetId:      this.formPR.assetId      || undefined,
      assetName:    this.formPR.assetName    || undefined,
      requiredDate: this.formPR.requiredDate,
      description:  this.formPR.description,
      requestedBy:  'Current User',
      items:        apiItems,
    };

    this.isLoading.set(true);
    this.procurementService.createPR(payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: (created: any) => {
          const newPR = mapApiPR(created);

          // أضف الـ PR الجديد للقائمة مباشرة
          this.purchaseRequests.update(list => [newPR, ...list]);

          this.auditService.log(
            'Create', 'Procurement', 'PurchaseRequest',
            newPR.id, 'N/A', `PR Number: ${newPR.requestNumber}`,
            this.translate.instant('procurement.purchase_requests.audit_created', {
              dept: newPR.department,
              date: newPR.requiredDate,
              desc: newPR.description
            })
          );

          this.notificationService.success(
            this.translate.instant('procurement.purchase_requests.notif_created_title'),
            this.translate.instant('procurement.purchase_requests.notif_created_desc', { pr: newPR.requestNumber })
          );

          this.isFormView.set(false);
          this.formPR = this.getEmptyForm();

          // إذا كان هناك صرف من المخزون (MIV) — الـ Backend يُنشئه تلقائياً
          const hasMIV = apiItems.some(i => (i.fulfillFromStock ?? 0) > 0);
          if (hasMIV) {
            this.router.navigate(['/inventory'], { queryParams: { tab: 'miv' } });
          }
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to create Purchase Request.';
          this.notificationService.danger('Error', msg);
        }
      });
  }

  // ── View / Details ────────────────────────────────────────────────────────

  viewDetails(pr: PurchaseRequest) {
    this.selectedPR.set(pr);
    this.loadProcurementChain(pr);
  }

  closeDetails() {
    this.selectedPR.set(null);
    this.procurementChain.set(null);
  }

  // ── Approve / Status ──────────────────────────────────────────────────────

  approveRequisition(id: string) {
    this.procurementService.updatePRStatus(id, {
      status:     'Approved',
      approvedBy: 'Current User',
      comments:   'Approved via ERP'
    }).subscribe({
      next: (updated: any) => {
        this.purchaseRequests.update(list =>
          list.map(pr => pr.id === id ? { ...pr, status: 'Approved' } : pr)
        );
        const pr = this.purchaseRequests().find(p => p.id === id);
        this.auditService.log(
          'Approve', 'Procurement', 'PurchaseRequest',
          id, 'Status: Pending Approval', 'Status: Approved',
          this.translate.instant('procurement.purchase_requests.audit_approved', { pr: pr?.requestNumber })
        );
        this.notificationService.success(
          this.translate.instant('procurement.purchase_requests.notif_approved_title'),
          this.translate.instant('procurement.purchase_requests.notif_approved_desc_detailed', { pr: pr?.requestNumber })
        );
        this.cdr.markForCheck();
      },
      error: err => {
        const msg = err?.error?.message ?? 'Failed to approve PR.';
        this.notificationService.danger('Error', msg);
      }
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  createRFQForPR(pr: PurchaseRequest) {
    this.closeDetails();
    this.router.navigate(['/procurement/rfqs'], {
      queryParams: { createForPR: pr.id }
    });
  }

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
