import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  OperationsApiService,
  FuelTank,
  FuelReceiptBody,
  FuelIssueBody
} from '../../../core/services/operations-api.service';

@Component({
  selector: 'app-fuel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './fuel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FuelComponent implements OnInit {
  private readonly opsApi      = inject(OperationsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly fuelTanks    = signal<FuelTank[]>([]);
  readonly fuelReceipts = signal<any[]>([]);
  readonly fuelIssues   = signal<any[]>([]);
  readonly vehicles     = signal<any[]>([]);
  readonly rigs         = signal<any[]>([]);
  readonly isLoading    = signal(false);
  readonly isSaving     = signal(false);

  readonly activeTab        = signal<'dashboard' | 'tanks' | 'receipts' | 'issues' | 'consumption'>('dashboard');
  readonly showReceiptModal = signal(false);
  readonly showIssueModal   = signal(false);

  receiptForm: FuelReceiptBody = this.emptyReceipt();
  issueForm: FuelIssueBody & { issuedToName: string } = this.emptyIssue();

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly kpis = computed(() => {
    const tanks    = this.fuelTanks();
    const receipts = this.fuelReceipts();
    const issues   = this.fuelIssues();
    const today    = new Date().toISOString().slice(0, 7); // YYYY-MM
    return {
      totalFuelStockLiters:   tanks.reduce((s, t) => s + t.currentLevelLiters, 0),
      totalReceiptsThisMonth: receipts.filter(r => r.deliveryDate?.startsWith(today))
                                      .reduce((s, r) => s + (r.totalCost ?? 0), 0),
      totalIssuesThisMonth:   issues.filter(i => i.issueDate?.startsWith(today))
                                    .reduce((s, i) => s + (i.quantityLiters ?? 0), 0),
      totalFuelCost:          issues.reduce((s, i) => s + (i.totalCost ?? 0), 0)
    };
  });

  readonly issuesToList = computed(() => {
    switch (this.issueForm.issuedTo) {
      case 'Vehicle':   return this.vehicles().map(v => ({ id: v._id, name: `${v.make} ${v.modelName} (${v.plateNumber})` }));
      case 'Generator': return this.rigs().filter(e => e.category === 'Generator').map(e => ({ id: e._id, name: e.equipmentName }));
      case 'Rig':       return this.rigs().filter(e => e.category === 'Rig').map(e => ({ id: e._id, name: e.equipmentName }));
      case 'Camp':      return []; // loaded separately if needed
      default:          return [];
    }
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.fuel' }
    ]);
    this.loadTanks();
    this.loadReceipts();
    this.loadIssues();
    this.loadVehicles();
    this.loadRigs();
  }

  loadTanks() {
    this.isLoading.set(true);
    this.opsApi.getTanks().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data.items ?? []);
        this.fuelTanks.set(list.map((t: any) => ({ ...t, id: t._id ?? t.id, tankName: t.tankName ?? t.name ?? t.tankCode })));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadReceipts()  { this.opsApi.getFuelReceipts().subscribe({ next: (d: any) => this.fuelReceipts.set(Array.isArray(d) ? d : d.items ?? []), error: () => {} }); }
  loadIssues()    { this.opsApi.getFuelIssues().subscribe({   next: (d: any) => this.fuelIssues.set(Array.isArray(d)   ? d : d.items ?? []), error: () => {} }); }
  loadVehicles()  { this.opsApi.getVehicles().subscribe({     next: (d: any) => this.vehicles.set(Array.isArray(d)     ? d : d.items ?? []), error: () => {} }); }
  loadRigs()      {
    this.opsApi.getRigs().subscribe({
      next: (d: any) => this.rigs.set((Array.isArray(d) ? d : d.items ?? []).map((r: any) => ({ ...r, id: r._id ?? r.id, tankName: r.tankName ?? r.name }))),
      error: () => {}
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getTankFillPercent(tank: FuelTank): number {
    if (!tank || tank.capacityLiters === 0) return 0;
    return Math.round((tank.currentLevelLiters / tank.capacityLiters) * 100);
  }

  getTotalIssuedByType(type: string): number {
    return this.fuelIssues().filter(i => i.issuedTo === type).reduce((s, i) => s + (i.quantityLiters ?? 0), 0);
  }

  // ── Receipt ────────────────────────────────────────────────────────────────
  openAddReceipt() {
    this.receiptForm = this.emptyReceipt();
    if (this.fuelTanks().length > 0) this.receiptForm.tankId = this.fuelTanks()[0]._id;
    this.showReceiptModal.set(true);
  }

  saveReceipt() {
    if (!this.receiptForm.tankId || !this.receiptForm.quantityLiters || !this.receiptForm.supplierName) {
      this.notificationService.danger('Validation', 'Please fill all required fields');
      return;
    }
    this.isSaving.set(true);
    this.opsApi.addFuelReceipt(this.receiptForm).subscribe({
      next: (created) => {
        this.fuelReceipts.update(list => [created, ...list]);
        // Update tank level locally
        this.fuelTanks.update(list => list.map(t =>
          t._id === this.receiptForm.tankId
            ? { ...t, currentLevelLiters: t.currentLevelLiters + (this.receiptForm.quantityLiters ?? 0) }
            : t
        ));
        this.showReceiptModal.set(false);
        this.notificationService.success('Receipt Created', `${this.receiptForm.quantityLiters}L received from ${this.receiptForm.supplierName}`);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to add receipt');
        this.isSaving.set(false);
      }
    });
  }

  // ── Issue ──────────────────────────────────────────────────────────────────
  openAddIssue() {
    this.issueForm = this.emptyIssue();
    if (this.fuelTanks().length > 0) this.issueForm.tankId = this.fuelTanks()[0]._id;
    this.showIssueModal.set(true);
  }

  onIssueToChange() { this.issueForm.issuedToId = ''; this.issueForm.issuedToName = ''; }

  onIssueToIdChange() {
    const sel = this.issuesToList().find(i => i.id === this.issueForm.issuedToId);
    this.issueForm.issuedToName = sel?.name ?? '';
  }

  saveIssue() {
    if (!this.issueForm.tankId || !this.issueForm.quantityLiters || !this.issueForm.issuedToId) {
      this.notificationService.danger('Validation', 'Please fill all required fields');
      return;
    }
    const tank = this.fuelTanks().find(t => t._id === this.issueForm.tankId);
    if (tank && tank.currentLevelLiters < (this.issueForm.quantityLiters ?? 0)) {
      this.notificationService.danger('Insufficient Fuel', `Available: ${tank.currentLevelLiters}L — Requested: ${this.issueForm.quantityLiters}L`);
      return;
    }

    this.isSaving.set(true);
    const body: FuelIssueBody = {
      tankId:          this.issueForm.tankId,
      quantityLiters:  this.issueForm.quantityLiters,
      issuedTo:        this.issueForm.issuedTo,
      issuedToId:      this.issueForm.issuedToId,
      issuedToName:    this.issueForm.issuedToName,
      costCenterCode:  this.issueForm.costCenterCode,
      issueDate:       this.issueForm.issueDate,
      issuedBy:        this.issueForm.issuedBy,
      runningHours:    this.issueForm.runningHours
    };

    this.opsApi.addFuelIssue(body).subscribe({
      next: (created) => {
        this.fuelIssues.update(list => [created, ...list]);
        this.fuelTanks.update(list => list.map(t =>
          t._id === body.tankId
            ? { ...t, currentLevelLiters: t.currentLevelLiters - (body.quantityLiters ?? 0) }
            : t
        ));
        this.showIssueModal.set(false);
        this.notificationService.success('Fuel Issued', `${body.quantityLiters}L issued to ${body.issuedToName}`);
        this.isSaving.set(false);
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to issue fuel');
        this.isSaving.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private emptyReceipt(): FuelReceiptBody {
    return {
      tankId: '', quantityLiters: 0, unitCost: 0.85,
      supplierName: '', deliveryDate: new Date().toISOString().split('T')[0],
      receivedBy: '', invoiceNumber: ''
    };
  }

  private emptyIssue(): FuelIssueBody & { issuedToName: string } {
    return {
      tankId: '', quantityLiters: 0,
      issuedTo: 'Vehicle', issuedToId: '', issuedToName: '',
      costCenterCode: '', issueDate: new Date().toISOString().split('T')[0],
      issuedBy: '', runningHours: 0
    };
  }
}
