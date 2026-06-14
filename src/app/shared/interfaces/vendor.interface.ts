export interface BankAccount {
  bankName: string;
  accountNumber: string;
  iban: string;
  currency: string;
}

export interface ContactPerson {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  arabicName: string;
  taxNumber: string;
  vatNumber: string;
  commercialRegistration: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  paymentTerms: string;
  currency: string;
  rating: number; // Rating out of 5
  status: 'Active' | 'Inactive';
  bankAccounts?: BankAccount[];
  contactPersons?: ContactPerson[];
}

