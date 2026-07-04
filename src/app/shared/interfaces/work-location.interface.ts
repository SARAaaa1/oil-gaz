export type LocationType = 'Company' | 'Branch' | 'Office' | 'Project Site' | 'Camp' | 'Warehouse';
export type LocationStatus = 'Active' | 'Inactive';

export interface WorkLocation {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  type: LocationType;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  managerId?: string;
  managerName?: string;
  status: LocationStatus;
}
