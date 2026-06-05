import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PurchaseOrder } from '../../../shared/interfaces/purchase-order.interface';
import { AuditService } from '../../../core/services/audit.service';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './purchase-orders.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseOrdersComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // States
  readonly purchaseOrders = this.mockDataService.purchaseOrders;

  readonly selectedPOId = signal<string | null>(null);
  readonly searchQuery = signal<string>('');

  // Signature Form
  approvalForm = {
    role: '',
    approverName: '',
    comments: ''
  };

  // Computed properties
  readonly filteredPOs = computed(() => {
    let list = this.purchaseOrders();
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

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.procurement', url: '/procurement' },
      { label: 'procurement.purchase_orders.breadcrumb' }
    ]);

    // Check query params
    this.route.queryParams.subscribe(params => {
      const poId = params['poId'];
      if (poId) {
        const po = this.purchaseOrders().find(p => p.id === poId);
        if (po) {
          this.selectPO(po);
        }
      }
    });
  }

  selectPO(po: PurchaseOrder) {
    this.selectedPOId.set(po.id);

    // Sync query parameters without full reload
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { poId: po.id },
      queryParamsHandling: 'merge'
    });

    // Auto fill approval form with next pending step
    const nextPending = po.approvalWorkflow.find(step => step.status === 'Pending');
    if (nextPending) {
      this.approvalForm = {
        role: nextPending.role,
        approverName: nextPending.approverName || 'Frank Jones',
        comments: ''
      };
    }
  }

  submitApproval() {
    const po = this.activePO();
    if (!po || !this.approvalForm.role || !this.approvalForm.approverName.trim()) return;

    this.mockDataService.approvePO(
      po.id,
      this.approvalForm.role,
      this.approvalForm.approverName,
      this.approvalForm.comments
    );

    // Audit Trail Logging
    this.auditService.log(
      'Approve',
      'Procurement',
      'PurchaseOrder',
      po.id,
      `Status: ${po.status}`,
      `Signed by ${this.approvalForm.role}`,
      this.translate.instant('procurement.purchase_orders.audit_sign', {
        role: this.approvalForm.role,
        approver: this.approvalForm.approverName,
        comments: this.approvalForm.comments || 'None'
      })
    );
 
    this.notificationService.success(
      this.translate.instant('procurement.purchase_orders.sig_submitted_title'),
      this.translate.instant('procurement.purchase_orders.sig_submitted_desc', { po: po.poNumber, role: this.approvalForm.role })
    );

    // Refresh signature panel or check if next step is available
    const updatedPO = this.purchaseOrders().find(p => p.id === po.id);
    if (updatedPO) {
      const nextPending = updatedPO.approvalWorkflow.find(step => step.status === 'Pending');
      if (nextPending) {
        this.approvalForm = {
          role: nextPending.role,
          approverName: nextPending.approverName || 'Marcus Aurelius',
          comments: ''
        };
      } else {
        // Log final PO status change to Audit Trail
        this.auditService.log(
          'Status Change',
          'Procurement',
          'PurchaseOrder',
          po.id,
          'Status: Pending Final approval',
          'Status: Approved & Dispatched',
          this.translate.instant('procurement.purchase_orders.audit_dispatch', { po: po.poNumber })
        );

        // All approved, trigger info toast
        this.notificationService.success(
          this.translate.instant('procurement.purchase_orders.po_finalized_title'),
          this.translate.instant('procurement.purchase_orders.po_finalized_desc', { po: po.poNumber })
        );
      }
    }
  }

  getStepBulletClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-success text-white border-green-500';
      case 'Pending':
        return 'bg-amber-100 border-amber-500 animate-pulse';
      default:
        return 'bg-slate-100 border-slate-300';
    }
  }
}
