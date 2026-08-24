import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BillingApiService, Wcc, GenerateWccBody } from '../../../core/services/billing-api.service';
import { WorkflowApiService } from '../../../core/services/workflow-api.service';
import { ActivityTimelineComponent } from '../../../shared/components/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-wccs',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './wccs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WccsComponent implements OnInit {
  private readonly billingApi  = inject(BillingApiService);
  private readonly workflowApi = inject(WorkflowApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate   = inject(TranslateService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly wccs      = signal<Wcc[]>([]);
  readonly contracts = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly selectedWcc = signal<Wcc | null>(null);

  searchQuery  = '';
  statusFilter = 'ALL';

  isModalOpen         = signal(false);
  isGenerating        = signal(false);
  selectedContractId  = '';
  formPeriodFrom      = '';
  formPeriodTo        = '';

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly activeContracts = computed(() => this.contracts().filter(c => c.status === 'Active'));

  readonly filteredWccs = computed(() => {
    let list = this.wccs();
    const query  = this.searchQuery.trim().toLowerCase();
    const status = this.statusFilter;

    if (status !== 'ALL') list = list.filter(w => w.status === status);
    if (query) {
      list = list.filter(w =>
        w.wccNumber?.toLowerCase().includes(query) ||
        w.clientName?.toLowerCase().includes(query) ||
        w.contractNumber?.toLowerCase().includes(query)
      );
    }
    return list;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.workflow'), url: '/workflow' },
      { label: this.translate.instant('workflow.wccs.breadcrumb') }
    ]);
    this.loadWccs();
    this.loadContracts();
  }

  loadWccs() {
    this.isLoading.set(true);
    this.billingApi.getWccs({ limit: 100 }).subscribe({
      next: (res: any) => {
        const raw = res.items ?? res;
        this.wccs.set((Array.isArray(raw) ? raw : []).map((w: any) => ({ ...w, id: w._id ?? w.id })));
        const list = this.filteredWccs();
        if (list.length > 0 && !this.selectedWcc()) this.selectedWcc.set(list[0]);
        this.isLoading.set(false);
      },
      error: () => { this.notificationService.danger('Error', 'Failed to load WCCs'); this.isLoading.set(false); }
    });
  }

  loadContracts() {
    this.workflowApi.getContracts({ status: 'Active', limit: 100 }).subscribe({
      next: (res: any) => this.contracts.set(res.items ?? res),
      error: () => {}
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  selectWcc(wcc: Wcc) { this.selectedWcc.set(wcc); }

  // ── Permissions ───────────────────────────────────────────────────────────
  canCreate() {
    const r = this.authService.currentUser()?.role;
    return r === 'Super Admin' || r === 'General Manager' || r === 'Finance Manager' || r === 'Operations Manager';
  }
  readonly availableDars = signal<any[]>([]);
  readonly selectedDarIds   = signal<string[]>([]);
  readonly previewLineItems = computed<any[]>(() => []);
  readonly computedSubtotal = computed<number>(() => 0);
  readonly computedPeriodFrom = computed<string>(() => this.formPeriodFrom);
  readonly computedPeriodTo   = computed<string>(() => this.formPeriodTo);
  readonly computedOpHours    = computed<number>(() => 0);
  readonly computedStandbyHours = computed<number>(() => 0);

  canApprove() {
    const r = this.authService.currentUser()?.role;
    return r === 'Super Admin' || r === 'General Manager' || r === 'Finance Manager';
  }
  canApproveStep(...args: any[]) { return this.canApprove(); }
  approveWccStep(...args: any[]) {
    const target = this.selectedWcc();
    if (target) this.approveWcc(target);
  }
  rejectWccStep(...args: any[]) {
    this.notificationService.warning('WCC Rejected', 'WCC step rejected');
  }
  onContractChange(...args: any[]) {}
  toggleDarSelection(id: string) {
    this.selectedDarIds.update(list =>
      list.includes(id) ? list.filter(item => item !== id) : [...list, id]
    );
  }
  saveWCC() { this.generateWcc(); }

  // ── Actions ───────────────────────────────────────────────────────────────
  approveWcc(wcc: Wcc) {
    this.billingApi.approveWcc(wcc._id ?? (wcc as any).id).subscribe({
      next: (updated: any) => {
        const normalized = { ...updated, id: updated._id ?? updated.id };
        this.notificationService.success('WCC Approved', `${normalized.wccNumber} approved — ready for invoicing`);
        this.wccs.update(list => list.map(w => w._id === updated._id ? normalized : w));
        this.selectedWcc.set(normalized);
      },
      error: (err: any) => this.notificationService.danger('Error', err?.error?.message || 'Approval failed')
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openCreateModal() {
    this.selectedContractId = '';
    this.formPeriodFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    this.formPeriodTo   = new Date().toISOString().split('T')[0];
    this.isModalOpen.set(true);
  }

  closeModal() { this.isModalOpen.set(false); }

  // ── Generate WCC ⚡ ───────────────────────────────────────────────────────
  generateWcc() {
    if (!this.selectedContractId || !this.formPeriodFrom || !this.formPeriodTo) {
      this.notificationService.danger('Validation', 'Please select a contract and period');
      return;
    }

    const body: GenerateWccBody = {
      contractId:  this.selectedContractId,
      periodFrom:  this.formPeriodFrom,
      periodTo:    this.formPeriodTo
    };

    this.isGenerating.set(true);
    this.billingApi.generateWcc(body).subscribe({
      next: (created) => {
        this.notificationService.success('WCC Generated', `${created.wccNumber} created from approved DARs`);
        this.wccs.update(list => [created, ...list]);
        this.selectedWcc.set(created);
        this.isModalOpen.set(false);
        this.isGenerating.set(false);
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to generate WCC');
        this.isGenerating.set(false);
      }
    });
  }
}
