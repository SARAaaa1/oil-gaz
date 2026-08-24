import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { InspectionRequest, InspectionRequestItem, NCR } from '../../../shared/interfaces/inspection.interface';
import { ProcurementService } from '../../../core/services/procurement.service';
import { finalize } from 'rxjs/operators';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapApiInspection(raw: any): InspectionRequest {
  return {
    id:             raw._id ?? raw.id,
    requestNumber:  raw.requestNumber ?? raw.documentNumber ?? raw._id ?? raw.id ?? '',
    poId:           raw.poId ?? '',
    poNumber:       raw.poNumber ?? '',
    vendorId:       raw.vendorId ?? '',
    vendorName:     raw.vendorName ?? raw.supplierName ?? '',
    requestDate:    raw.requestDate ?? raw.createdAt ?? '',
    inspectorName:  raw.inspectorName ?? '',
    inspectionDate: raw.inspectionDate ?? '',
    notes:          raw.notes ?? '',
    status:         raw.status ?? 'Pending',
    items:          (raw.items ?? []).map((i: any): InspectionRequestItem => ({
      itemCode:         i.itemCode ?? '',
      itemName:         i.itemName ?? '',
      uom:              i.uom ?? 'PCS',
      quantityOrdered:  i.quantityOrdered ?? 0,
      quantityReceived: i.quantityReceived ?? i.quantityOrdered ?? 0,
      quantityAccepted: i.quantityAccepted ?? i.quantityReceived ?? 0,
      quantityRejected: i.quantityRejected ?? 0,
      status:           i.status ?? 'Pending',
    })),
    ncrId: raw.ncrId,
  };
}

function mapApiNCR(raw: any): NCR {
  return {
    id:                   raw._id ?? raw.id,
    ncrNumber:            raw.ncrNumber ?? '',
    inspectionRequestId:  raw.inspectionRequestId ?? raw.poId ?? '',
    poNumber:             raw.poNumber ?? '',
    vendorName:           raw.vendorName ?? '',
    issueDate:            raw.issueDate ?? raw.createdAt ?? '',
    severity:             raw.severity ?? 'Medium',
    description:          raw.description ?? '',
    rootCause:            raw.rootCause ?? '',
    correctiveAction:     raw.correctiveAction ?? '',
    status:               raw.status ?? 'Open',
    resolvedDate:         raw.resolvedDate,
    resolvedBy:           raw.resolvedBy,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './inspection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InspectionComponent implements OnInit {
  private readonly procurementService  = inject(ProcurementService);
  private readonly breadcrumbService   = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr                 = inject(ChangeDetectorRef);

  // ── State ─────────────────────────────────────────────────────────────────
  readonly inspectionRequests = signal<InspectionRequest[]>([]);
  readonly ncrs               = signal<NCR[]>([]);
  readonly isLoading          = signal<boolean>(false);

  readonly activeTab       = signal<'pending' | 'history' | 'ncrs'>('pending');
  readonly selectedRequest = signal<InspectionRequest | null>(null);

  readonly showInspectionForm = signal<boolean>(false);
  readonly showNcrModal       = signal<boolean>(false);

  // Inspection form state
  inspectorName    = '';
  inspectionNotes  = '';
  inspectionStatus: 'Accepted' | 'Rejected' | 'Conditional' = 'Accepted';
  itemsToInspect: InspectionRequestItem[] = [];

  // NCR form state
  ncrSeverity: 'Low' | 'Medium' | 'High' = 'Medium';
  ncrDescription     = '';
  ncrRootCause       = '';
  ncrCorrectiveAction = '';

  // ── Computed ──────────────────────────────────────────────────────────────

  readonly pendingRequests = computed(() =>
    this.inspectionRequests().filter(r => r.status === 'Pending')
  );

  readonly historyRequests = computed(() =>
    this.inspectionRequests().filter(r => r.status !== 'Pending')
  );

  // ── Init ──────────────────────────────────────────────────────────────────

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.procurement' },
      { label: 'navigation.receiving_inspection' }
    ]);
    this.loadInspections();
    this.loadNCRs();
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  private loadInspections() {
    this.isLoading.set(true);
    this.procurementService.getInspections(1, 100)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          const raw = res?.items ?? (Array.isArray(res) ? res : []);
          this.inspectionRequests.set(raw.map(mapApiInspection));
        },
        error: err => {
          console.error('Failed to load inspections:', err);
          this.notificationService.danger('Error', 'Failed to load inspections.');
        }
      });
  }

  private loadNCRs() {
    this.procurementService.getNCRs(1, 100).subscribe({
      next: res => {
        const raw = res?.items ?? (Array.isArray(res) ? res : []);
        this.ncrs.set(raw.map(mapApiNCR));
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load NCRs:', err)
    });
  }

  // ── Inspection Actions ─────────────────────────────────────────────────────

  startInspection(req: InspectionRequest) {
    this.selectedRequest.set(req);
    this.inspectorName   = '';
    this.inspectionNotes = '';
    this.inspectionStatus = 'Accepted';
    this.itemsToInspect  = req.items.map(item => ({ ...item }));
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
    const hasFailures = this.itemsToInspect.some(i => i.status === 'Failed');
    this.inspectionStatus = hasFailures ? 'Rejected' : 'Accepted';
  }

  onQtyReceivedChange(index: number) {
    const item = this.itemsToInspect[index];
    if (item.quantityReceived > item.quantityOrdered) item.quantityReceived = item.quantityOrdered;
    if (item.quantityReceived < 0)                    item.quantityReceived = 0;
    if (item.status === 'Failed') {
      item.quantityRejected = item.quantityReceived;
      item.quantityAccepted = 0;
    } else {
      item.quantityAccepted = item.quantityReceived;
      item.quantityRejected = 0;
    }
  }

  onQtyAcceptedChange(index: number) {
    const item = this.itemsToInspect[index];
    if (item.quantityAccepted > item.quantityReceived) item.quantityAccepted = item.quantityReceived;
    if (item.quantityAccepted < 0)                     item.quantityAccepted = 0;
    item.quantityRejected = item.quantityReceived - item.quantityAccepted;
    item.status = item.quantityAccepted === item.quantityReceived ? 'Passed' : 'Failed';
  }

  onQtyRejectedChange(index: number) {
    const item = this.itemsToInspect[index];
    if (item.quantityRejected > item.quantityReceived) item.quantityRejected = item.quantityReceived;
    if (item.quantityRejected < 0)                     item.quantityRejected = 0;
    item.quantityAccepted = item.quantityReceived - item.quantityRejected;
    item.status = item.quantityAccepted === item.quantityReceived ? 'Passed' : 'Failed';
  }

  submitInspection() {
    const req = this.selectedRequest();
    if (!req) return;

    const payload = {
      inspectorName:  this.inspectorName,
      inspectionDate: new Date().toISOString().split('T')[0],
      status:         this.inspectionStatus,
      notes:          this.inspectionNotes,
      items:          this.itemsToInspect,
    };

    this.isLoading.set(true);
    this.procurementService.submitInspection(req.poId || req.id, payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: updated => {
          const mappedReq = mapApiInspection(updated ?? { ...req, ...payload });

          this.inspectionRequests.update(list =>
            list.map(r => r.id === req.id ? mappedReq : r)
          );

          if (this.inspectionStatus === 'Rejected') {
            this.showInspectionForm.set(false);
            this.showNcrModal.set(true);
            this.ncrDescription     = `Material defect logged on inspection of PO ${req.poNumber} from ${req.vendorName}.`;
            this.ncrRootCause       = '';
            this.ncrCorrectiveAction = '';
          } else {
            this.showInspectionForm.set(false);
            this.notificationService.success(
              'procurement.inspection.inspected_title',
              'procurement.inspection.inspected_desc'
            );
          }
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to submit inspection.';
          this.notificationService.danger('Error', msg);
        }
      });
  }

  // ── NCR Actions ───────────────────────────────────────────────────────────

  submitNcr() {
    const req = this.selectedRequest();
    if (!req) return;

    const payload = {
      severity:         this.ncrSeverity,
      description:      this.ncrDescription,
      rootCause:        this.ncrRootCause,
      correctiveAction: this.ncrCorrectiveAction,
    };

    this.isLoading.set(true);
    this.procurementService.createNCR(req.poId || req.id, payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: newNcr => {
          const mappedNcr = mapApiNCR(newNcr);
          this.ncrs.update(list => [...list, mappedNcr]);

          // تحديث الـ inspection request محلياً
          this.inspectionRequests.update(list =>
            list.map(r => r.id === req.id ? { ...r, status: 'Rejected', ncrId: mappedNcr.id } : r)
          );

          this.showNcrModal.set(false);
          this.notificationService.warning(
            'procurement.inspection.ncr_raised_title',
            'procurement.inspection.ncr_raised_desc'
          );
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to create NCR.';
          this.notificationService.danger('Error', msg);
        }
      });
  }

  resolveNcr(ncr: NCR) {
    this.procurementService.resolveNCR(ncr.id, { resolvedBy: 'Current User' }).subscribe({
      next: () => {
        this.ncrs.update(list =>
          list.map(n => n.id === ncr.id ? {
            ...n,
            status:      'Closed' as const,
            resolvedDate: new Date().toISOString().split('T')[0],
            resolvedBy:  'Current User'
          } : n)
        );
        this.cdr.markForCheck();
        this.notificationService.success(
          'procurement.inspection.ncr_resolved_title',
          'procurement.inspection.ncr_resolved_desc'
        );
      },
      error: err => {
        const msg = err?.error?.message ?? 'Failed to resolve NCR.';
        this.notificationService.danger('Error', msg);
      }
    });
  }
}
