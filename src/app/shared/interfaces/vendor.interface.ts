export interface Vendor {
  id: string;
  vendorName: string;
  taxNumber: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  paymentTerms: string;
  status: 'Active' | 'Inactive';
}
