import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { MockDataService } from '../../../../core/services/mock-data.service';
import { FinanceV2MockService } from '../../shared/finance-v2-mock.service';
import { AssetsMockService } from '../../shared/assets-mock.service';

@Component({
  selector: 'app-equipment-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './equipment-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentAnalysisComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly mockDataService = inject(MockDataService);
  readonly assetsMockService = inject(AssetsMockService);
  readonly financeMockService = inject(FinanceV2MockService);

  // ── Filters ───────────────────────────────────────────────────────
  readonly selectedEquipId = signal<string>('');
  readonly periodFilter = signal<string>('2025');

  // ── UI States ─────────────────────────────────────────────────────
  readonly currentTab = signal<string>('purchase');
  readonly searchQuery = signal<string>('');
  readonly toastMessage = signal<string>('');

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.financial_analysis' },
      { label: 'navigation.equipment_analysis' }
    ]);

    // Auto-select first equipment
    const list = this.mockDataService.equipment();
    if (list.length > 0) {
      this.selectedEquipId.set(list[0].id);
    }
  }

  // ── Equipment List ────────────────────────────────────────────────
  readonly equipmentList = computed(() => {
    return this.mockDataService.equipment();
  });

  // ── Active Equipment ──────────────────────────────────────────────
  readonly activeEquip = computed(() => {
    const id = this.selectedEquipId();
    return this.mockDataService.equipment().find(e => e.id === id) || null;
  });

  // ── Financial Lifetime Calculations ───────────────────────────────
  readonly purchaseCost = computed(() => {
    const e = this.activeEquip();
    return e ? e.purchaseCost : 180000;
  });

  readonly maintenanceCost = computed(() => {
    const e = this.activeEquip();
    if (!e) return 0;
    return this.mockDataService.workOrders()
      .filter(w => w.assetId === e.id)
      .reduce((sum, w) => sum + (w.laborHoursCost || 2500), 0) || 12000;
  });

  readonly fuelCost = computed(() => {
    const e = this.activeEquip();
    if (!e) return 0;
    return this.mockDataService.fuelIssues()
      .filter(f => f.issuedToId === e.id || f.issuedToId === e.equipmentCode)
      .reduce((sum, f) => sum + (f.totalCost || f.quantityLiters * 2.2), 0) || 8500;
  });

  readonly operatingCost = computed(() => {
    return this.maintenanceCost() + this.fuelCost() + (this.purchaseCost() * 0.05);
  });

  readonly depreciation = computed(() => {
    const e = this.activeEquip();
    if (!e) return 0;
    return this.purchaseCost() * 0.25;
  });

  readonly currentValue = computed(() => {
    return this.purchaseCost() - this.depreciation();
  });

  readonly revenueGenerated = computed(() => {
    const e = this.activeEquip();
    if (!e) return 0;
    return (e.operatingHours * 150) || (this.purchaseCost() * 0.4);
  });

  readonly profitability = computed(() => {
    return this.revenueGenerated() - this.operatingCost();
  });

  // ── Tab Lists ─────────────────────────────────────────────────────

  // 1. Purchase Details
  readonly purchaseDetails = computed(() => {
    const e = this.activeEquip();
    if (!e) return null;
    return {
      poNumber: `PO-${e.equipmentCode || 'EQ'}-2024`,
      invoiceNumber: `INV-${e.equipmentCode || 'EQ'}-2024`,
      poDate: e.purchaseDate,
      supplier: e.manufacturer || 'Al-Juffali Heavy Equipment',
      cost: e.purchaseCost,
      status: 'Paid'
    };
  });

  // 2. Maintenance History (Work Orders)
  readonly maintenanceList = computed(() => {
    const e = this.activeEquip();
    if (!e) return [];
    return this.mockDataService.workOrders().filter(w => w.assetId === e.id);
  });

  // 3. Fuel Consumption
  readonly fuelList = computed(() => {
    const e = this.activeEquip();
    if (!e) return [];
    return this.mockDataService.fuelIssues().filter(f => f.issuedToId === e.id || f.issuedToId === e.equipmentCode);
  });

  // 4. Project History
  readonly projectHistory = computed(() => {
    const e = this.activeEquip();
    if (!e) return [];
    return this.mockDataService.assetAssignments()
      .filter(a => a.assetId === e.id)
      .map(a => ({
        projectCode: a.assignedToId,
        site: a.assignedToName,
        assignedDate: a.assignmentDate,
        status: 'Active'
      }));
  });

  // 5. Assignments (Operators/Crew)
  readonly assignmentsList = computed(() => {
    const e = this.activeEquip();
    if (!e) return [];
    return this.mockDataService.assetHistories()
      .filter(h => h.assetId === e.id)
      .map(h => ({
        operatorName: h.changedBy,
        assignmentDate: h.date,
        type: h.changeType,
        details: `${h.oldValue} ➔ ${h.newValue}`
      }));
  });

  // 6. Depreciation Schedule
  readonly depreciationSchedule = computed(() => {
    const cost = this.purchaseCost();
    const monthlyDep = (cost * 0.2) / 12;
    return Array.from({ length: 6 }).map((_, idx) => ({
      month: `2025-0${idx + 1}`,
      cost: cost,
      depreciation: monthlyDep,
      accumulated: monthlyDep * (idx + 1),
      bookValue: cost - (monthlyDep * (idx + 1))
    }));
  });

  // 7. Journal Entries
  readonly journalEntriesList = computed(() => {
    const e = this.activeEquip();
    if (!e) return [];
    return this.financeMockService.journalEntries().filter(je =>
      je.lines.some(l => l.costCenterCode === e.costCenter)
    );
  });

  // 8. Vendor Bills
  readonly vendorBillsList = computed(() => {
    const e = this.activeEquip();
    if (!e) return [];
    return this.mockDataService.supplierInvoices().filter(inv =>
      inv.vendorName.includes(e.manufacturer) || inv.id.includes('INV')
    );
  });

  // ── Methods ───────────────────────────────────────────────────────
  formatAmount(val: number): string {
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  exportToExcel() {
    this.showToast('finance_v2.analysis.msg_exported');
  }

  exportToPDF() {
    this.showToast('finance_v2.analysis.msg_exported');
  }

  printReport() {
    window.print();
  }

  onDrillDown(type: string, id: string) {
    this.router.navigate(['/finance/drill-down'], { queryParams: { type, id } });
  }
}
