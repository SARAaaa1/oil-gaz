import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { Collection, CollectionPayment } from '../../../shared/interfaces/workflow.interface';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionsComponent implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly collections = this.workflowService.collections;
  readonly selectedCollection = signal<Collection | null>(null);

  // Filters
  searchQuery = '';
  statusFilter = 'ALL';

  // Form states
  isModalOpen = signal(false);
  formModel: any = {
    date: '',
    amount: 0,
    method: 'Bank Transfer',
    reference: '',
    remarks: ''
  };

  // computed totals
  readonly totalAR = computed(() =>
    this.collections().reduce((sum, c) => sum + c.outstandingBalance, 0)
  );

  readonly totalCollected = computed(() =>
    this.collections().reduce((sum, c) => sum + c.totalCollected, 0)
  );

  readonly filteredCollections = computed(() => {
    let list = this.collections();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;

    if (status !== 'ALL') {
      list = list.filter(c => c.status === status);
    }

    if (query) {
      list = list.filter(c =>
        c.collectionNumber.toLowerCase().includes(query) ||
        c.invoiceNumber.toLowerCase().includes(query) ||
        c.clientName.toLowerCase().includes(query) ||
        c.contractNumber.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.collections.breadcrumb') }
    ]);

    const list = this.filteredCollections();
    if (list.length > 0) {
      this.selectedCollection.set(list[0]);
    }
  }

  selectCollection(col: Collection) {
    this.selectedCollection.set(col);
  }

  // --- Role Check Permissions ---
  canRegister() {
    const role = this.authService.currentUser()?.role;
    // Finance Manager or Super Admin can register collected cash payments
    return role === 'Super Admin' || role === 'Finance Manager' || role === 'General Manager';
  }

  // --- Payment Modal actions ---
  openPaymentModal() {
    const col = this.selectedCollection();
    if (!col) return;

    this.formModel = {
      date: new Date().toISOString().split('T')[0],
      amount: col.outstandingBalance,
      method: 'Bank Transfer',
      reference: '',
      remarks: ''
    };
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  savePayment() {
    const col = this.selectedCollection();
    if (!col) return;

    const amt = Number(this.formModel.amount) || 0;
    if (amt <= 0) {
      alert(this.translate.instant('workflow.collections.alert_invalid_amount'));
      return;
    }
    if (amt > col.outstandingBalance) {
      alert(`Payment amount ($${amt}) exceeds outstanding balance ($${col.outstandingBalance}).`);
      return;
    }
    if (!this.formModel.reference) {
      alert(this.translate.instant('workflow.collections.alert_reference'));
      return;
    }

    this.workflowService.addCollectionPayment(col.id, this.formModel);
    this.isModalOpen.set(false);

    // Refresh selected collection details
    const updated = this.collections().find(c => c.id === col.id);
    if (updated) {
      this.selectedCollection.set(updated);
    }
  }
}
