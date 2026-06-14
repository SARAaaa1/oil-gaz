export interface WarehouseZone {
  code: string;
  name: string;
  description?: string;
}

export interface WarehouseRack {
  code: string;
  zoneCode: string;
  name: string;
}

export interface WarehouseShelf {
  code: string;
  rackCode: string;
  name: string;
}

export interface WarehouseBin {
  code: string;
  shelfCode: string;
  name: string;
  maxWeightCapacity?: number;
  maxVolumeCapacity?: number;
}

export interface WarehouseStructure {
  warehouseId: string;
  zones: WarehouseZone[];
  racks: WarehouseRack[];
  shelves: WarehouseShelf[];
  bins: WarehouseBin[];
}
