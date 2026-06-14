import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { WarehouseStructure, WarehouseZone, WarehouseRack, WarehouseShelf, WarehouseBin } from '../../../shared/interfaces/warehouse-structure.interface';
import { Warehouse } from '../../../shared/interfaces/inventory.interface';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './warehouses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehousesComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);

  readonly warehouses = this.mockDataService.warehouses;
  readonly warehouseStructures = this.mockDataService.warehouseStructures;

  // Selected hierarchy
  readonly selectedWarehouse = signal<Warehouse | null>(null);
  readonly selectedZone = signal<WarehouseZone | null>(null);
  readonly selectedRack = signal<WarehouseRack | null>(null);
  readonly selectedShelf = signal<WarehouseShelf | null>(null);

  // Form modals UI state
  readonly showZoneModal = signal<boolean>(false);
  readonly showRackModal = signal<boolean>(false);
  readonly showShelfModal = signal<boolean>(false);
  readonly showBinModal = signal<boolean>(false);

  // Form inputs
  zoneCode = '';
  zoneName = '';
  zoneDesc = '';

  rackCode = '';
  rackName = '';

  shelfCode = '';
  shelfName = '';

  binCode = '';
  binName = '';
  binWeight = 1000;
  binVolume = 5;

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.masters' },
      { label: 'navigation.warehouse_structure' }
    ]);
    if (this.warehouses().length > 0) {
      this.selectedWarehouse.set(this.warehouses()[0]);
    }
  }

  // Get current structure of the selected warehouse
  readonly currentStructure = computed(() => {
    const wh = this.selectedWarehouse();
    if (!wh) return null;
    const struct = this.warehouseStructures().find(s => s.warehouseId === wh.id);
    if (struct) return struct;

    // Return empty fallback if none exists
    return {
      warehouseId: wh.id,
      zones: [],
      racks: [],
      shelves: [],
      bins: []
    } as WarehouseStructure;
  });

  // Filtered lists based on parent selection
  readonly currentRacks = computed(() => {
    const struct = this.currentStructure();
    const zone = this.selectedZone();
    if (!struct || !zone) return [];
    return struct.racks.filter(r => r.zoneCode === zone.code);
  });

  readonly currentShelves = computed(() => {
    const struct = this.currentStructure();
    const rack = this.selectedRack();
    if (!struct || !rack) return [];
    return struct.shelves.filter(s => s.rackCode === rack.code);
  });

  readonly currentBins = computed(() => {
    const struct = this.currentStructure();
    const shelf = this.selectedShelf();
    if (!struct || !shelf) return [];
    return struct.bins.filter(b => b.shelfCode === shelf.code);
  });

  // Hierarchy actions
  selectWarehouse(wh: Warehouse) {
    this.selectedWarehouse.set(wh);
    this.selectedZone.set(null);
    this.selectedRack.set(null);
    this.selectedShelf.set(null);
  }

  selectZone(zone: WarehouseZone) {
    this.selectedZone.set(zone);
    this.selectedRack.set(null);
    this.selectedShelf.set(null);
  }

  selectRack(rack: WarehouseRack) {
    this.selectedRack.set(rack);
    this.selectedShelf.set(null);
  }

  selectShelf(shelf: WarehouseShelf) {
    this.selectedShelf.set(shelf);
  }

  // Modals Save Handlers
  saveZone() {
    if (!this.zoneCode || !this.zoneName) return;
    const wh = this.selectedWarehouse();
    if (!wh) return;

    const newZone: WarehouseZone = { code: this.zoneCode, name: this.zoneName, description: this.zoneDesc };

    this.mockDataService.warehouseStructures.update(list => {
      const idx = list.findIndex(s => s.warehouseId === wh.id);
      if (idx !== -1) {
        const updated = { ...list[idx], zones: [...list[idx].zones, newZone] };
        return list.map((s, i) => i === idx ? updated : s);
      } else {
        return [...list, { warehouseId: wh.id, zones: [newZone], racks: [], shelves: [], bins: [] }];
      }
    });

    this.selectedZone.set(newZone);
    this.showZoneModal.set(false);
    this.notificationService.success('masters.warehouses.zone_added_title', 'masters.warehouses.zone_added_desc');
  }

  saveRack() {
    if (!this.rackCode || !this.rackName) return;
    const wh = this.selectedWarehouse();
    const zone = this.selectedZone();
    if (!wh || !zone) return;

    const newRack: WarehouseRack = { code: this.rackCode, zoneCode: zone.code, name: this.rackName };

    this.mockDataService.warehouseStructures.update(list => {
      const idx = list.findIndex(s => s.warehouseId === wh.id);
      const updated = { ...list[idx], racks: [...list[idx].racks, newRack] };
      return list.map((s, i) => i === idx ? updated : s);
    });

    this.selectedRack.set(newRack);
    this.showRackModal.set(false);
    this.notificationService.success('masters.warehouses.rack_added_title', 'masters.warehouses.rack_added_desc');
  }

  saveShelf() {
    if (!this.shelfCode || !this.shelfName) return;
    const wh = this.selectedWarehouse();
    const rack = this.selectedRack();
    if (!wh || !rack) return;

    const newShelf: WarehouseShelf = { code: this.shelfCode, rackCode: rack.code, name: this.shelfName };

    this.mockDataService.warehouseStructures.update(list => {
      const idx = list.findIndex(s => s.warehouseId === wh.id);
      const updated = { ...list[idx], shelves: [...list[idx].shelves, newShelf] };
      return list.map((s, i) => i === idx ? updated : s);
    });

    this.selectedShelf.set(newShelf);
    this.showShelfModal.set(false);
    this.notificationService.success('masters.warehouses.shelf_added_title', 'masters.warehouses.shelf_added_desc');
  }

  saveBin() {
    if (!this.binCode || !this.binName) return;
    const wh = this.selectedWarehouse();
    const shelf = this.selectedShelf();
    if (!wh || !shelf) return;

    const newBin: WarehouseBin = { code: this.binCode, shelfCode: shelf.code, name: this.binName, maxWeightCapacity: this.binWeight, maxVolumeCapacity: this.binVolume };

    this.mockDataService.warehouseStructures.update(list => {
      const idx = list.findIndex(s => s.warehouseId === wh.id);
      const updated = { ...list[idx], bins: [...list[idx].bins, newBin] };
      return list.map((s, i) => i === idx ? updated : s);
    });

    this.showBinModal.set(false);
    this.notificationService.success('masters.warehouses.bin_added_title', 'masters.warehouses.bin_added_desc');
  }
}
