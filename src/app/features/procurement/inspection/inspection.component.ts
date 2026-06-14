import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { InspectionRequest, InspectionRequestItem, NCR } from '../../../shared/interfaces/inspection.interface';
import { PurchaseOrder } from '../../../shared/interfaces/purchase-order.interface';

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './inspection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InspectionComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);

  readonly inspectionRequests = this.mockDataService.inspectionRequests;
  readonly ncrs = this.mockDataService.ncrs;
  readonly purchaseOrders = this.mockDataService.purchaseOrders;

  // UI State
  readonly activeTab = signal<'pending' | 'history' | 'ncrs'>('pending');
  readonly selectedRequest = signal<InspectionRequest | null>(null);

  // Form Modals
  readonly showInspectionForm = signal<boolean>(false);
  readonly showNcrModal = signal<boolean>(false);

  // Inspection Form State
  inspectorName = 'John Doe';
  inspectionNotes = '';
  inspectionStatus: 'Accepted' | 'Rejected' | 'Conditional' = 'Accepted';
  itemsToInspect: InspectionRequestItem[] = [];

  // NCR Form State
  ncrSeverity: 'Low' | 'Medium' | 'High' = 'Medium';
  ncrDescription = '';
  ncrRootCause = '';
  ncrCorrectiveAction = '';

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.procurement' },
      { label: 'navigation.receiving_inspection' }
    ]);
  }

  // Filtered requests
  readonly pendingRequests = computed(() => 
    this.inspectionRequests().filter(r => r.status === 'Pending')
  );

  readonly historyRequests = computed(() => 
    this.inspectionRequests().filter(r => r.status !== 'Pending')
  );

  startInspection(req: InspectionRequest) {
    this.selectedRequest.set(req);
    this.inspectorName = 'John Doe';
    this.inspectionNotes = '';
    this.inspectionStatus = 'Accepted';
    // Clone items
    this.itemsToInspect = req.items.map(item => ({ ...item }));
    this.showInspectionForm.set(true);
  }

  updateItemStatus(index: number, status: 'Passed' | 'Failed') {
    this.itemsToInspect[index].status = status;
    if (status === 'Failed') {
      this.itemsToInspect[index].quantityRejected = this.itemsToInspect[index].quantityReceived;
      this.itemsToInspect[index].quantityAccepted = 0;
    } else {
      this.itemsToInspect[index].quantityAccepted = this.itemsToInspect[index].quantityReceived;
      this.itemsToInspect[index].quantityRejected = 0;
    }

    // Auto calculate overall inspection status based on item failures
    const hasFailures = this.itemsToInspect.some(item => item.status === 'Failed');
    this.inspectionStatus = hasFailures ? 'Rejected' : 'Accepted';
  }

  submitInspection() {
    const req = this.selectedRequest();
    if (!req) return;

    const updatedRequest: InspectionRequest = {
      ...req,
      inspectorName: this.inspectorName,
      inspectionDate: new Date().toISOString().split('T')[0],
      notes: this.inspectionNotes,
      status: this.inspectionStatus,
      items: this.itemsToInspect
    };

    if (this.inspectionStatus === 'Rejected') {
      // Prompt NCR Creation
      this.showInspectionForm.set(false);
      this.showNcrModal.set(true);
      this.ncrDescription = `Material defect logged on inspection of PO ${req.poNumber} from ${req.vendorName}.`;
      this.ncrRootCause = '';
      this.ncrCorrectiveAction = '';
    } else {
      // If Accepted or Conditional, we automatically unlock creating an MRV
      this.createMRVFromInspection(updatedRequest);
      this.mockDataService.inspectionRequests.update(list => 
        list.map(r => r.id === req.id ? updatedRequest : r)
      );
      this.showInspectionForm.set(false);
      this.notificationService.success('procurement.inspection.inspected_title', 'procurement.inspection.inspected_desc');
    }
  }

  submitNcr() {
    const req = this.selectedRequest();
    if (!req) return;

    const ncrNum = `NCR-2026-0${this.ncrs().length + 1}`;
    const newNcr: NCR = {
      id: `ncr-${Date.now()}`,
      ncrNumber: ncrNum,
      inspectionRequestId: req.id,
      poNumber: req.poNumber,
      vendorName: req.vendorName,
      issueDate: new Date().toISOString().split('T')[0],
      severity: this.ncrSeverity,
      description: this.ncrDescription,
      rootCause: this.ncrRootCause,
      correctiveAction: this.ncrCorrectiveAction,
      status: 'Open'
    };

    this.mockDataService.ncrs.update(list => [...list, newNcr]);

    // Save the inspection request as Rejected with NCR link
    const updatedRequest: InspectionRequest = {
      ...req,
      inspectorName: this.inspectorName,
      inspectionDate: new Date().toISOString().split('T')[0],
      notes: this.inspectionNotes,
      status: 'Rejected',
      items: this.itemsToInspect,
      ncrId: newNcr.id
    };

    this.mockDataService.inspectionRequests.update(list => 
      list.map(r => r.id === req.id ? updatedRequest : r)
    );

    this.showNcrModal.set(false);
    this.notificationService.warning('procurement.inspection.ncr_raised_title', 'procurement.inspection.ncr_raised_desc');
  }

  resolveNcr(ncr: NCR) {
    this.mockDataService.ncrs.update(list => 
      list.map(n => n.id === ncr.id ? { 
        ...n, 
        status: 'Closed' as const, 
        resolvedDate: new Date().toISOString().split('T')[0], 
        resolvedBy: 'John Doe' 
      } : n)
    );
    this.notificationService.success('procurement.inspection.ncr_resolved_title', 'procurement.inspection.ncr_resolved_desc');
  }

  private createMRVFromInspection(req: InspectionRequest) {
    // Auto-create MRV inside inventory
    const mrvList = this.mockDataService.mrvs();
    const mrvNum = `MRV-2026-0${mrvList.length + 1}`;
    
    const mrvItems = req.items.map(item => ({
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityAccepted,
      unitPrice: 100, // mock price
      totalPrice: item.quantityAccepted * 100,
      uom: item.uom || 'PCS'
    }));

    const total = mrvItems.reduce((acc, item) => acc + item.totalPrice, 0);

    const newMRV = {
      id: `mrv-${Date.now()}`,
      voucherNumber: mrvNum,
      poId: req.poId,
      poNumber: req.poNumber,
      warehouseId: 'w1',
      receivedDate: new Date().toISOString().split('T')[0],
      receivedBy: req.inspectorName || 'John Doe',
      supplierName: req.vendorName,
      status: 'Approved' as const, // auto approved
      items: mrvItems,
      totalAmount: total
    };

    this.mockDataService.mrvs.update(val => [...val, newMRV]);
  }
}
