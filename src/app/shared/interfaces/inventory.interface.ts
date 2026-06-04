export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  minQuantity: number;
  category: string;
  uom: string;
  location: string;
  unitPrice: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}
