import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FuelTank, FuelReceipt, FuelIssue } from '../../../shared/interfaces/fuel.interface';

@Component({
  selector: 'app-fuel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './fuel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FuelComponent implements OnInit {
  readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);

  readonly fuelTanks = this.mockDataService.fuelTanks;
  readonly fuelReceipts = this.mockDataService.fuelReceipts;
  readonly fuelIssues = this.mockDataService.fuelIssues;
  readonly vehicles = this.mockDataService.vehicles;
  readonly equipment = this.mockDataService.equipment;
  readonly rigs = this.mockDataService.rigs;
  readonly camps = this.mockDataService.camps;

  readonly activeTab = signal<'dashboard' | 'tanks' | 'receipts' | 'issues' | 'consumption'>('dashboard');
  readonly showReceiptModal = signal(false);
  readonly showIssueModal = signal(false);

  receiptForm = {
    tankId: '', quantityLiters: 0, unitCost: 0.85,
    supplierName: '', deliveryDate: new Date().toISOString().split('T')[0],
    receivedBy: 'Jim Halpert', invoiceNumber: ''
  };

  issueForm = {
    tankId: '', quantityLiters: 0,
    issuedTo: 'Vehicle' as 'Vehicle' | 'Generator' | 'Rig' | 'Camp',
    issuedToId: '', issuedToName: '',
    costCenterCode: 'CC-OPS-001',
    issueDate: new Date().toISOString().split('T')[0],
    issuedBy: 'Jim Halpert', odometerReading: 0, runningHours: 0
  };

  readonly kpis = computed(() => {
    const tanks = this.fuelTanks();
    const receipts = this.fuelReceipts();
    const issues = this.fuelIssues();
    const totalFuelStockLiters = tanks.reduce((s, t) => s + t.currentLevelLiters, 0);
    const totalReceiptsThisMonth = receipts.filter(r => r.deliveryDate >= '2026-06-01').reduce((s, r) => s + r.totalCost, 0);
    const totalIssuesThisMonth = issues.filter(i => i.issueDate >= '2026-06-01').reduce((s, i) => s + i.quantityLiters, 0);
    const totalFuelCost = issues.filter(i => i.status === 'Posted').reduce((s, i) => s + i.totalCost, 0);
    return { totalFuelStockLiters, totalReceiptsThisMonth, totalIssuesThisMonth, totalFuelCost };
  });

  readonly issuesToList = computed(() => {
    switch (this.issueForm.issuedTo) {
      case 'Vehicle': return this.vehicles().map(v => ({ id: v.id, name: `${v.make} ${v.model} (${v.plateNumber})` }));
      case 'Generator': return this.equipment().filter((e: any) => (e.category || '').toLowerCase().includes('gen')).map((e: any) => ({ id: e.id, name: e.equipmentName }));
      case 'Rig': return this.rigs().map(r => ({ id: r.id, name: r.rigName }));
      case 'Camp': return this.camps().map(c => ({ id: c.id, name: c.campName }));
      default: return [];
    }
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.fuel' }
    ]);
  }

  getTankFillPercent(tank: FuelTank): number {
    if (!tank || tank.capacityLiters === 0) return 0;
    return Math.round((tank.currentLevelLiters / tank.capacityLiters) * 100);
  }

  getTotalIssuedByType(type: string): number {
    return this.fuelIssues().filter(i => i.issuedTo === type && i.status === 'Posted').reduce((s, i) => s + i.quantityLiters, 0);
  }

  openAddReceipt() {
    const tanks = this.fuelTanks();
    this.receiptForm = {
      tankId: tanks[0]?.id || '', quantityLiters: 0, unitCost: 0.85,
      supplierName: '', deliveryDate: new Date().toISOString().split('T')[0],
      receivedBy: 'Jim Halpert', invoiceNumber: ''
    };
    this.showReceiptModal.set(true);
  }

  saveReceipt() {
    if (!this.receiptForm.tankId || this.receiptForm.quantityLiters <= 0 || !this.receiptForm.supplierName) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }
    const tank = this.fuelTanks().find(t => t.id === this.receiptForm.tankId);
    if (!tank) return;
    const totalCost = this.receiptForm.quantityLiters * this.receiptForm.unitCost;
    const created = this.mockDataService.addFuelReceipt({
      tankId: this.receiptForm.tankId, tankName: tank.tankName, fuelType: tank.fuelType,
      quantityLiters: this.receiptForm.quantityLiters, unitCost: this.receiptForm.unitCost,
      totalCost, supplierName: this.receiptForm.supplierName,
      deliveryDate: this.receiptForm.deliveryDate, receivedBy: this.receiptForm.receivedBy,
      invoiceNumber: this.receiptForm.invoiceNumber || undefined
    });
    this.mockDataService.postFuelReceipt(created.id);
    this.showReceiptModal.set(false);
    this.notificationService.success('fuel.receipt_created_title', 'fuel.receipt_created_desc');
  }

  openAddIssue() {
    const tanks = this.fuelTanks();
    this.issueForm = {
      tankId: tanks[0]?.id || '', quantityLiters: 0,
      issuedTo: 'Vehicle', issuedToId: this.vehicles()[0]?.id || '', issuedToName: '',
      costCenterCode: 'CC-OPS-001',
      issueDate: new Date().toISOString().split('T')[0],
      issuedBy: 'Jim Halpert', odometerReading: 0, runningHours: 0
    };
    this.showIssueModal.set(true);
  }

  onIssueToChange() { this.issueForm.issuedToId = ''; this.issueForm.issuedToName = ''; }

  onIssueToIdChange() {
    const sel = this.issuesToList().find(i => i.id === this.issueForm.issuedToId);
    this.issueForm.issuedToName = sel?.name || '';
  }

  saveIssue() {
    if (!this.issueForm.tankId || this.issueForm.quantityLiters <= 0 || !this.issueForm.issuedToId) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }
    const tank = this.fuelTanks().find(t => t.id === this.issueForm.tankId);
    if (!tank) return;
    if (tank.currentLevelLiters < this.issueForm.quantityLiters) {
      this.notificationService.danger('fuel.insufficient_fuel_title', 'fuel.insufficient_fuel_desc');
      return;
    }
    const unitCost = this.fuelReceipts().filter(r => r.tankId === this.issueForm.tankId && r.status === 'Posted').slice(-1)[0]?.unitCost ?? 0.85;
    const totalCost = this.issueForm.quantityLiters * unitCost;
    const created = this.mockDataService.addFuelIssue({
      tankId: this.issueForm.tankId, tankName: tank.tankName, fuelType: tank.fuelType,
      quantityLiters: this.issueForm.quantityLiters, unitCost, totalCost,
      issuedTo: this.issueForm.issuedTo, issuedToId: this.issueForm.issuedToId,
      issuedToName: this.issueForm.issuedToName, costCenterCode: this.issueForm.costCenterCode,
      issueDate: this.issueForm.issueDate, issuedBy: this.issueForm.issuedBy,
      odometerReading: this.issueForm.odometerReading || undefined,
      runningHours: this.issueForm.runningHours || undefined
    });
    this.mockDataService.postFuelIssue(created.id);
    this.showIssueModal.set(false);
    this.notificationService.success('fuel.issue_created_title', 'fuel.issue_created_desc');
  }
}
