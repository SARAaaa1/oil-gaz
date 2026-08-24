import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PurchaseOrder, POApprovalStep } from '../../../shared/interfaces/purchase-order.interface';
import { AuditService } from '../../../core/services/audit.service';
import { ProcurementChainComponent } from '../../../shared/components/procurement-chain/procurement-chain.component';
import { ProcurementService } from '../../../core/services/procurement.service';
import { finalize } from 'rxjs/operators';

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapApiPO(raw: any): PurchaseOrder {
  return {
    id:                    raw._id ?? raw.id,
    poNumber:              raw.poNumber ?? raw.documentNumber ?? '',
    documentNumber:        raw.documentNumber ?? raw.poNumber ?? '',
    procurementChain:      raw.procurementChain ?? '',
    rootProcurementNumber: raw.rootProcurementNumber ?? '',
    quotationNumber:       raw.quotationNumber,
    chainId:               raw.chainId ?? raw._id ?? raw.id,
    parentDocumentId:      raw.parentDocumentId,
    parentDocumentNumber:  raw.parentDocumentNumber,
    rfqId:                 raw.rfqId,
    rfqNumber:             raw.rfqNumber,
    vendorId:              raw.vendorId ?? '',
    vendorName:            raw.vendorName ?? '',
    vendorTaxNumber:       raw.vendorTaxNumber ?? '',
    vendorAddress:         raw.vendorAddress ?? '',
    vendorContact:         raw.vendorContact,
    date:                  raw.date ?? raw.createdAt ?? '',
    deliveryDate:          raw.deliveryDate ?? '',
    deliveryAddress:       raw.deliveryAddress,
    costCenter:            raw.costCenter ?? '',
    paymentTerms:          raw.paymentTerms ?? '',
    status:                raw.status ?? 'Draft',
    items:                 (raw.items ?? []).map((i: any) => ({
      id:         i._id ?? i.id ?? '',
      itemName:   i.itemName ?? '',
      itemCode:   i.itemCode ?? '',
      quantity:   i.quantity ?? 0,
      unitPrice:  i.unitPrice ?? 0,
      uom:        i.uom ?? 'PCS',
      totalPrice: i.totalPrice ?? (i.quantity * i.unitPrice) ?? 0,
    })),
    subtotal:              raw.subtotal ?? 0,
    taxPercent:            raw.taxPercent ?? 15,
    taxAmount:             raw.taxAmount ?? 0,
    withholdingTaxPercent: raw.withholdingTaxPercent ?? 0,
    withholdingTaxAmount:  raw.withholdingTaxAmount ?? 0,
    totalAmount:           raw.totalAmount ?? 0,
    approvalWorkflow:      (raw.approvalWorkflow ?? []).map((step: any): POApprovalStep => ({
      role:         step.role ?? '',
      approverName: step.approverName ?? '',
      status:       step.status ?? 'Pending',
      actionDate:   step.actionDate,
      comments:     step.comments,
    })),
    contractNumber:        raw.contractNumber,
    contractTitle:         raw.contractTitle,
    contractDate:          raw.contractDate,
    contractExpiryDate:    raw.contractExpiryDate,
    contractFileUrl:       raw.contractFileUrl,
    contractFileName:      raw.contractFileName,
    contractFileSizeKb:    raw.contractFileSizeKb,
    chargeType:            raw.chargeType,
    projectId:             raw.projectId,
    projectName:           raw.projectName,
    assetId:               raw.assetId,
    assetName:             raw.assetName,
    companyRepresentative: raw.companyRepresentative,
    supplierRepresentative: raw.supplierRepresentative,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ProcurementChainComponent],
  templateUrl: './purchase-orders.component.html',
  styleUrls: ['./purchase-orders.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrdersComponent implements OnInit {
  private readonly procurementService  = inject(ProcurementService);
  private readonly breadcrumbService   = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService        = inject(AuditService);
  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);
  private readonly translate           = inject(TranslateService);
  private readonly cdr                 = inject(ChangeDetectorRef);

  // ── State ─────────────────────────────────────────────────────────────────
  readonly purchaseOrders = signal<PurchaseOrder[]>([]);
  readonly isLoading      = signal<boolean>(false);

  readonly selectedPOId = signal<string | null>(null);
  readonly searchQuery  = signal<string>('');

  // RFQ data (cached for the selected PO)
  readonly rfqVendors = signal<any[]>([]);

  // Approval form
  approvalForm = {
    role: '',
    approverName: '',
    comments: ''
  };

  // ── Computed ──────────────────────────────────────────────────────────────

  readonly filteredPOs = computed(() => {
    let list  = this.purchaseOrders();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(po =>
        po.poNumber.toLowerCase().includes(query) ||
        po.vendorName.toLowerCase().includes(query) ||
        po.costCenter.toLowerCase().includes(query)
      );
    }
    return [...list].sort((a, b) => b.poNumber.localeCompare(a.poNumber));
  });

  readonly approvedPOCount = computed(() =>
    this.filteredPOs().filter(po => po.status === 'Approved' || po.status === 'Issued').length
  );

  readonly activePO = computed(() => {
    const id = this.selectedPOId();
    if (!id) return null;
    return this.purchaseOrders().find(p => p.id === id) || null;
  });

  readonly isNextApprover = computed(() => {
    const po = this.activePO();
    if (!po) return false;
    return po.approvalWorkflow.some(step => step.status === 'Pending');
  });

  // ── Init ──────────────────────────────────────────────────────────────────

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.procurement', url: '/procurement' },
      { label: 'procurement.purchase_orders.breadcrumb' }
    ]);

    this.loadPOs();

    this.route.queryParams.subscribe(params => {
      const poId = params['poId'];
      if (poId) {
        const po = this.purchaseOrders().find(p => p.id === poId);
        if (po) {
          this.selectPO(po);
        } else {
          // انتظر تحميل البيانات ثم افتح الـ PO
          setTimeout(() => {
            const found = this.purchaseOrders().find(p => p.id === poId);
            if (found) { this.selectPO(found); this.cdr.markForCheck(); }
          }, 1000);
        }
      }
    });
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  private loadPOs() {
    this.isLoading.set(true);
    this.procurementService.getPOs(1, 200)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          const raw = res?.items ?? (Array.isArray(res) ? res : []);
          this.purchaseOrders.set(raw.map(mapApiPO));
        },
        error: err => {
          console.error('Failed to load Purchase Orders:', err);
          this.notificationService.danger('Error', 'Failed to load Purchase Orders.');
        }
      });
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  selectPO(po: PurchaseOrder) {
    this.selectedPOId.set(po.id);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { poId: po.id },
      queryParamsHandling: 'merge'
    });

    // Auto-fill next pending approval step
    const nextPending = po.approvalWorkflow.find(step => step.status === 'Pending');
    if (nextPending) {
      this.approvalForm = {
        role:         nextPending.role,
        approverName: nextPending.approverName || '',
        comments:     ''
      };
    }

    // جلب تفاصيل كاملة للـ PO من الـ API
    this.procurementService.getPOById(po.id).subscribe({
      next: detail => {
        const mapped = mapApiPO(detail);
        this.purchaseOrders.update(list => list.map(p => p.id === po.id ? mapped : p));
        const nextStep = mapped.approvalWorkflow.find(s => s.status === 'Pending');
        if (nextStep) {
          this.approvalForm = { role: nextStep.role, approverName: nextStep.approverName || '', comments: '' };
        }
        this.cdr.markForCheck();
      },
      error: () => { /* استخدام البيانات الموجودة */ }
    });
  }

  // ── Approval ──────────────────────────────────────────────────────────────

  submitApproval() {
    const po = this.activePO();
    if (!po || !this.approvalForm.role || !this.approvalForm.approverName.trim()) return;

    this.isLoading.set(true);
    this.procurementService.approvePO(po.id, {
      role:         this.approvalForm.role,
      approverName: this.approvalForm.approverName,
      comments:     this.approvalForm.comments
    }).pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: updated => {
          const mappedPO = mapApiPO(updated);
          this.purchaseOrders.update(list => list.map(p => p.id === po.id ? mappedPO : p));

          this.auditService.log(
            'Approve', 'Procurement', 'PurchaseOrder', po.id,
            `Status: ${po.status}`,
            `Signed by ${this.approvalForm.role}`,
            this.translate.instant('procurement.purchase_orders.audit_sign', {
              role:      this.approvalForm.role,
              approver:  this.approvalForm.approverName,
              comments:  this.approvalForm.comments || 'None'
            })
          );

          this.notificationService.success(
            this.translate.instant('procurement.purchase_orders.sig_submitted_title'),
            this.translate.instant('procurement.purchase_orders.sig_submitted_desc', {
              po: po.poNumber, role: this.approvalForm.role
            })
          );

          // هل هناك خطوة تالية؟
          const nextPending = mappedPO.approvalWorkflow.find(s => s.status === 'Pending');
          if (nextPending) {
            this.approvalForm = { role: nextPending.role, approverName: nextPending.approverName || '', comments: '' };
          } else {
            // جميع الخطوات اعتُمدت
            this.auditService.log(
              'Status Change', 'Procurement', 'PurchaseOrder', po.id,
              'Status: Pending Final Approval', 'Status: Approved & Dispatched',
              this.translate.instant('procurement.purchase_orders.audit_dispatch', { po: po.poNumber })
            );
            this.notificationService.success(
              this.translate.instant('procurement.purchase_orders.po_finalized_title'),
              this.translate.instant('procurement.purchase_orders.po_finalized_desc', { po: po.poNumber })
            );
          }
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to submit approval.';
          this.notificationService.danger('Error', msg);
        }
      });
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  getStepBulletClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success text-white border-green-500';
      case 'Pending':  return 'bg-amber-100 border-amber-500 animate-pulse';
      default:         return 'bg-slate-100 border-slate-300';
    }
  }

  downloadContract() {
    const po = this.activePO();
    if (!po) return;

    if (po.contractFileUrl) {
      // الـ API يوفر redirect للملف
      this.procurementService.downloadPOContract(po.id).subscribe({
        next: response => {
          const blob = (response as any).body;
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = po.contractFileName || `Contract_${po.poNumber}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          } else {
            window.open(po.contractFileUrl!, '_blank');
          }
        },
        error: () => {
          // Fallback: open URL directly
          if (po.contractFileUrl) window.open(po.contractFileUrl, '_blank');
          else this.generateContractText(po);
        }
      });
    } else {
      this.generateContractText(po);
    }

    this.notificationService.success('Contract Download', `Downloading: ${po.contractFileName || po.poNumber}`);
  }

  private generateContractText(po: PurchaseOrder) {
    const divider    = '─'.repeat(90);
    const itemHeader = this.padRow(['#', 'Item Code', 'Description', 'Qty', 'UOM', 'Unit Price', 'Total']);
    const itemRows   = po.items.map((item, i) =>
      this.padRow([
        String(i + 1), item.itemCode, item.itemName,
        String(item.quantity), item.uom,
        `$${item.unitPrice.toLocaleString()}`,
        `$${item.totalPrice.toLocaleString()}`
      ])
    );

    const content = [
      `╔═══════════════════════════════════════════════════════════════════════════════════════╗`,
      `║                              CONTRACT AGREEMENT                                       ║`,
      `║                           PETROFLOW SERVICES LTD                                      ║`,
      `╚═══════════════════════════════════════════════════════════════════════════════════════╝`,
      ``, `CONTRACT DETAILS`, divider,
      `Contract Number  : ${po.contractNumber || 'CNT-' + po.poNumber}`,
      `PO Reference     : ${po.poNumber}`,
      `RFQ Reference    : ${po.rfqNumber || 'N/A'}`,
      ``, `VENDOR INFORMATION`, divider,
      `Vendor Name      : ${po.vendorName}`,
      `Vendor Address   : ${po.vendorAddress}`,
      `Payment Terms    : ${po.paymentTerms}`,
      ``, `ITEMS & MATERIALS`, `${'═'.repeat(90)}`,
      itemHeader, `${'─'.repeat(90)}`, ...itemRows, `${'═'.repeat(90)}`,
      ``, `FINANCIAL SUMMARY`, divider,
      `  Subtotal    : $${po.subtotal.toLocaleString()}`,
      `  VAT (${po.taxPercent}%)  : $${po.taxAmount.toLocaleString()}`,
      divider,
      `  GRAND TOTAL : $${po.totalAmount.toLocaleString()}`,
      divider,
      ``, `Generated from PetroFlow ERP — ${new Date().toISOString().split('T')[0]}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Contract_${po.poNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private padRow(cols: string[]): string {
    const widths = [4, 12, 28, 6, 6, 14, 14];
    return cols.map((col, i) => col.padEnd(widths[i] || 14)).join(' | ');
  }

  formatFileSizeKb(kb: number | undefined): string {
    if (!kb) return '';
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  }

  getRelatedRFQ(po: PurchaseOrder | null): any {
    if (!po?.rfqId) return null;
    // يُعاد كـ object بسيط يحمل الـ vendors من الـ rfqVendors signal
    return { id: po.rfqId, vendors: this.rfqVendors() };
  }

  /** يُستخدم في الـ template لإيجاد عرض السعر الفائز لكل vendor */
  getRFQQuotationForVendor(rfq: any, vendorId: string): any {
    if (!rfq?.quotations) return null;
    return rfq.quotations.find((q: any) => q.vendorId === vendorId) ?? null;
  }

  printPO() {
    const po = this.activePO();
    if (!po) return;
    this.auditService.log(
      'Status Change', 'Procurement', 'PurchaseOrder',
      po.id, po.status, po.status,
      'User printed/downloaded PO document ' + po.poNumber
    );
    window.print();
  }
}
