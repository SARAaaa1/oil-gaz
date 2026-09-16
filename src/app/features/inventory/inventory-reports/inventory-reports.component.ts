import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { 
  InventoryApiService, 
  extractApiArray 
} from '../../../core/services/inventory-api.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ValuationReportResponse,
  ReorderAlertsReportResponse,
  StockAgingReportResponse,
  ConsumptionByProjectReportResponse,
  StockCountVarianceReportResponse
} from '../../../shared/interfaces/inventory.interface';

@Component({
  selector: 'app-inventory-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './inventory-reports.component.html',
  styleUrls: ['./inventory-reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryReportsComponent implements OnInit {
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  // Active Report Tab: 'valuation' | 'alerts' | 'aging' | 'consumption' | 'variance'
  readonly activeTab = signal<'valuation' | 'alerts' | 'aging' | 'consumption' | 'variance'>('valuation');

  // Shared Filters
  readonly warehouses = signal<any[]>([]);
  readonly selectedWarehouseId = signal<string>('all');
  readonly selectedValuationMethod = signal<'WAVG' | 'FIFO'>('WAVG');
  readonly selectedUrgency = signal<'all' | 'critical' | 'warning'>('all');
  readonly dateFrom = signal<string>('');
  readonly dateTo = signal<string>('');
  readonly asOfDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Loading & State Signals
  readonly isLoading = signal<boolean>(false);
  readonly valuationData = signal<ValuationReportResponse | null>(null);
  readonly alertsData = signal<ReorderAlertsReportResponse | null>(null);
  readonly agingData = signal<StockAgingReportResponse | null>(null);
  readonly consumptionData = signal<ConsumptionByProjectReportResponse | null>(null);
  readonly varianceData = signal<StockCountVarianceReportResponse | null>(null);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.inventory', url: '/inventory' },
      { label: 'navigation.inventory_reports' }
    ]);
    this.loadWarehouses();
    this.loadCurrentReport();
  }

  loadWarehouses() {
    this.inventoryApi.getWarehouses().subscribe({
      next: (res) => this.warehouses.set(extractApiArray(res)),
      error: () => this.warehouses.set([])
    });
  }

  setTab(tab: 'valuation' | 'alerts' | 'aging' | 'consumption' | 'variance') {
    this.activeTab.set(tab);
    this.loadCurrentReport();
  }

  loadCurrentReport() {
    this.isLoading.set(true);
    const tab = this.activeTab();

    if (tab === 'valuation') {
      this.inventoryApi.getReportValuation({
        warehouseId: this.selectedWarehouseId(),
        asOfDate: this.asOfDate(),
        valuationMethod: this.selectedValuationMethod()
      }).subscribe({
        next: (data) => {
          this.valuationData.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.notificationService.danger('Error', 'Failed to load valuation report.');
        }
      });
    } else if (tab === 'alerts') {
      const urgency = this.selectedUrgency() === 'all' ? undefined : this.selectedUrgency();
      this.inventoryApi.getReportReorderAlerts({
        warehouseId: this.selectedWarehouseId(),
        urgency: urgency as any
      }).subscribe({
        next: (data) => {
          this.alertsData.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.notificationService.danger('Error', 'Failed to load reorder alerts.');
        }
      });
    } else if (tab === 'aging') {
      this.inventoryApi.getReportAging({
        warehouseId: this.selectedWarehouseId(),
        asOfDate: this.asOfDate()
      }).subscribe({
        next: (data) => {
          this.agingData.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.notificationService.danger('Error', 'Failed to load stock aging report.');
        }
      });
    } else if (tab === 'consumption') {
      this.inventoryApi.getReportConsumptionByProject({
        startDate: this.dateFrom() || undefined,
        endDate: this.dateTo() || undefined
      }).subscribe({
        next: (data) => {
          this.consumptionData.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.notificationService.danger('Error', 'Failed to load project consumption report.');
        }
      });
    } else if (tab === 'variance') {
      this.inventoryApi.getReportStockCountVariance({
        warehouseId: this.selectedWarehouseId(),
        startDate: this.dateFrom() || undefined,
        endDate: this.dateTo() || undefined
      }).subscribe({
        next: (data) => {
          this.varianceData.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.notificationService.danger('Error', 'Failed to load count variance report.');
        }
      });
    }
  }

  exportCurrentReportCSV() {
    const tab = this.activeTab();
    let endpoint = '';
    let params: Record<string, any> = {};
    const dateStr = new Date().toISOString().split('T')[0];

    if (tab === 'valuation') {
      endpoint = 'valuation';
      params = {
        warehouseId: this.selectedWarehouseId(),
        asOfDate: this.asOfDate(),
        valuationMethod: this.selectedValuationMethod()
      };
    } else if (tab === 'alerts') {
      endpoint = 'reorder-alerts';
      params = {
        warehouseId: this.selectedWarehouseId(),
        urgency: this.selectedUrgency() === 'all' ? undefined : this.selectedUrgency()
      };
    } else if (tab === 'aging') {
      endpoint = 'aging';
      params = {
        warehouseId: this.selectedWarehouseId(),
        asOfDate: this.asOfDate()
      };
    } else if (tab === 'consumption') {
      endpoint = 'consumption-by-project';
      params = {
        startDate: this.dateFrom() || undefined,
        endDate: this.dateTo() || undefined
      };
    } else if (tab === 'variance') {
      endpoint = 'stock-count-variance';
      params = {
        warehouseId: this.selectedWarehouseId(),
        startDate: this.dateFrom() || undefined,
        endDate: this.dateTo() || undefined
      };
    }

    this.inventoryApi.downloadReportCsv(endpoint, params, `${endpoint}_report_${dateStr}`).subscribe({
      next: () => {
        this.notificationService.success('Export Success', 'Report exported as CSV successfully.');
      },
      error: () => {
        this.notificationService.danger('Export Failed', 'Unable to download report CSV.');
      }
    });
  }

  printReport() {
    window.print();
  }
}
