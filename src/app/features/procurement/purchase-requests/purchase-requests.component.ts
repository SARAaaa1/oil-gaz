import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PurchaseRequest, PurchaseRequestItem } from '../../../shared/interfaces/purchase-request.interface';
import { AuditService } from '../../../core/services/audit.service';

@Component({
  selector: 'app-purchase-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
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
        pr.costCenter.toLowerCase().includes(query)
      );
    }

    // Sort descending by number
    return [...list].sort((a, b) => b.requestNumber.localeCompare(a.requestNumber));
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.procurement', url: '/procurement' },
      { label: 'procurement.purchase_requests.breadcrumb' }
    ]);

    // Check query parameters to open form directly (e.g. from quick button)
    this.route.queryParams.subscribe(params => {
      if (params['openForm'] === 'true') {
        this.isFormView.set(true);
      }
    });
  }

  getEmptyForm() {
    return {
      department: 'Drilling Operations',
      costCenter: 'CC-DRL-001',
      requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days out
      description: '',
      items: [
        { itemCode: '', itemName: '', quantity: 1, uom: 'EA', notes: '' }
      ] as Omit<PurchaseRequestItem, 'id'>[]
    };
  }

  toggleViewMode() {
    this.isFormView.update(val => !val);
    if (!this.isFormView()) {
      this.formPR = this.getEmptyForm();
    }
  }

  addItemRow() {
    this.formPR.items.push({
      itemCode: '',
      itemName: '',
      quantity: 1,
      uom: 'EA',
      notes: ''
    });
  }

  removeItemRow(index: number) {
    if (this.formPR.items.length > 1) {
      this.formPR.items.splice(index, 1);
    }
  }

  onItemSelect(index: number) {
    const row = this.formPR.items[index];
    const match = this.inventory().find(i => i.itemCode === row.itemCode);
    if (match) {
      row.itemName = match.itemName;
      row.uom = match.uom;
    }
  }

  submitPR(event: Event) {
    event.preventDefault();

    // Basic Validation
    const invalidItems = this.formPR.items.some(item => !item.itemCode || item.quantity <= 0);
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

    // Add ID to items
    const formattedItems: PurchaseRequestItem[] = this.formPR.items.map((item, idx) => ({
      ...item,
      id: `pri-${Date.now()}-${idx}`
    }));

    // Save
    const newPr = this.mockDataService.addPurchaseRequest({
      department: this.formPR.department,
      costCenter: this.formPR.costCenter,
      requiredDate: this.formPR.requiredDate,
      description: this.formPR.description,
      requestedBy: this.auditService.logs().length > 0 ? this.auditService.logs()[0].user : 'Admin User',
      items: formattedItems
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

    // Reset and return
    this.toggleViewMode();
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
}
