export interface ItemCategory {
  code: string;
  nameEn: string;
  nameAr: string;
}

export interface ItemSubCategory {
  code: string;
  parentCategoryCode: string;
  nameEn: string;
  nameAr: string;
}

export interface ItemMaster {
  id: string;
  itemCode: string;
  englishName: string;
  arabicName: string;
  category: string; // matches Category code
  subCategory: string; // matches SubCategory code
  uom: string; // UOM code
  manufacturer: string;
  brand: string;
  reorderLevel: number;
  minStock: number;
  maxStock: number;
  serialTracking: boolean;
  batchTracking: boolean;
  isActive: boolean;
  unitPrice: number;
}
