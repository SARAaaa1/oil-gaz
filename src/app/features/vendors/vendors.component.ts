import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { Vendor, BankAccount, ContactPerson } from '../../shared/interfaces/vendor.interface';

@Component({
  selector: 'app-vendors',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vendors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);

  readonly vendors = this.mockDataService.vendors;

  // UI State
  readonly activeTab = signal<'list' | 'profile' | 'categories' | 'evaluation' | 'performance'>('list');
  readonly selectedVendor = signal<Vendor | null>(null);
  readonly searchQuery = signal<string>('');
  readonly isEditing = signal<boolean>(false);

  // Form Fields
  vendorCode = '';
  vendorName = '';
  arabicName = '';
  taxNumber = '';
  vatNumber = '';
  commercialRegistration = '';
  address = '';
  contactPerson = '';
  contactEmail = '';
  contactPhone = '';
  paymentTerms = 'Net 30';
  currency = 'USD';
  rating = 5;
  status: Vendor['status'] = 'Active';
  bankAccounts: BankAccount[] = [];
  contactPersons: ContactPerson[] = [];
  tempBankName = ''; tempAccountNum = ''; tempIban = ''; tempBankCurr = 'USD';
  tempContactName = ''; tempContactRole = ''; tempContactEmail = ''; tempContactPhone = '';

  // Evaluation Form State
  evaluationDeliveryScore = 90;
  evaluationQualityScore = 85;
  evaluationPriceScore = 80;
  evaluationCommunicationScore = 75;
  selectedEvalVendorId = '';

  readonly vendorCategories = [
    { code: 'DRL', name: 'Drilling Services', count: 0 },
    { code: 'CHM', name: 'Chemicals & Fluids', count: 0 },
    { code: 'TUB', name: 'Tubulars & Casing', count: 0 },
    { code: 'HSE', name: 'HSE Equipment & PPE', count: 0 },
    { code: 'LOG', name: 'Logistics & Transport', count: 0 },
    { code: 'ELE', name: 'Electrical & Instrumentation', count: 0 },
    { code: 'GEN', name: 'General Supplies', count: 0 },
    { code: 'ENG', name: 'Engineering Services', count: 0 }
  ];

  readonly vendorKPIs = computed(() => ({
    total: this.vendors().length,
    active: this.vendors().filter(v => v.status === 'Active').length,
    approved: this.vendors().filter(v => v.status === 'Active').length,
    blacklisted: this.vendors().filter(v => v.status === 'Inactive').length
  }));

  readonly filteredVendors = computed(() => {
    let list = this.vendors();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(v =>
        v.vendorName.toLowerCase().includes(query) ||
        v.vendorCode.toLowerCase().includes(query) ||
        v.arabicName.includes(query) ||
        v.taxNumber.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly selectedVendorPerformance = computed(() => {
    const v = this.selectedVendor();
    if (!v) return { totalOrders: 0, deliveryRate: 0, rejectedRate: 0, leadTime: 0 };
    return this.getVendorKPIs(v.id);
  });

  readonly compositeEvalScore = computed(() =>
    Math.round((this.evaluationDeliveryScore + this.evaluationQualityScore + this.evaluationPriceScore + this.evaluationCommunicationScore) / 4)
  );

  readonly rankedVendors = computed(() =>
    [...this.vendors()].sort((a, b) => b.rating - a.rating)
  );

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{ label: 'navigation.vendors' }]);
    if (this.vendors().length > 0) {
      this.selectedVendor.set(this.vendors()[0]);
    }
  }

  selectVendor(vendor: Vendor) {
    this.selectedVendor.set(vendor);
    this.activeTab.set('profile');
    this.isEditing.set(false);
  }

  startAddVendor() {
    this.vendorCode = `VND-NEW-${this.vendors().length + 1}`;
    this.vendorName = ''; this.arabicName = ''; this.taxNumber = ''; this.vatNumber = '';
    this.commercialRegistration = ''; this.address = ''; this.contactPerson = '';
    this.contactEmail = ''; this.contactPhone = ''; this.paymentTerms = 'Net 30';
    this.currency = 'USD'; this.rating = 5; this.status = 'Active';
    this.bankAccounts = []; this.contactPersons = [];
    this.isEditing.set(true);
    this.selectedVendor.set(null);
    this.activeTab.set('profile');
  }

  startEditVendor() {
    const v = this.selectedVendor();
    if (!v) return;
    this.vendorCode = v.vendorCode; this.vendorName = v.vendorName; this.arabicName = v.arabicName;
    this.taxNumber = v.taxNumber; this.vatNumber = v.vatNumber; this.commercialRegistration = v.commercialRegistration;
    this.address = v.address; this.contactPerson = v.contactPerson; this.contactEmail = v.contactEmail;
    this.contactPhone = v.contactPhone; this.paymentTerms = v.paymentTerms; this.currency = v.currency;
    this.rating = v.rating; this.status = v.status;
    this.bankAccounts = [...(v.bankAccounts || [])];
    this.contactPersons = [...(v.contactPersons || [])];
    this.isEditing.set(true);
  }

  saveVendor() {
    if (!this.vendorName || !this.vendorCode) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }
    const updatedVendor: Vendor = {
      id: this.selectedVendor()?.id || `v-${Date.now()}`,
      vendorCode: this.vendorCode, vendorName: this.vendorName, arabicName: this.arabicName,
      taxNumber: this.taxNumber, vatNumber: this.vatNumber, commercialRegistration: this.commercialRegistration,
      address: this.address, contactPerson: this.contactPerson, contactEmail: this.contactEmail,
      contactPhone: this.contactPhone, paymentTerms: this.paymentTerms, currency: this.currency,
      rating: this.rating, status: this.status, bankAccounts: this.bankAccounts, contactPersons: this.contactPersons
    };
    if (this.selectedVendor()) {
      this.mockDataService.vendors.update(list => list.map(v => v.id === updatedVendor.id ? updatedVendor : v));
      this.notificationService.success('vendors.updated_title', 'vendors.updated_desc');
    } else {
      this.mockDataService.vendors.update(list => [...list, updatedVendor]);
      this.notificationService.success('vendors.created_title', 'vendors.created_desc');
    }
    this.selectedVendor.set(updatedVendor);
    this.isEditing.set(false);
  }

  cancelEdit() {
    this.isEditing.set(false);
    if (!this.selectedVendor() && this.vendors().length > 0) {
      this.selectedVendor.set(this.vendors()[0]);
    }
  }

  approveVendor(v: Vendor) {
    this.mockDataService.vendors.update(list => list.map(vendor =>
      vendor.id === v.id ? { ...vendor, status: 'Active' as const } : vendor
    ));
    this.notificationService.success('vendors.approved_title', 'vendors.approved_desc');
  }

  blacklistVendor(v: Vendor) {
    this.mockDataService.vendors.update(list => list.map(vendor =>
      vendor.id === v.id ? { ...vendor, status: 'Inactive' as const } : vendor
    ));
    this.notificationService.warning('vendors.blacklisted_title', 'vendors.blacklisted_desc');
  }

  submitEvaluation() {
    const vendorId = this.selectedEvalVendorId || this.selectedVendor()?.id;
    if (!vendorId) {
      this.notificationService.danger('common.validation_error', 'vendors.select_vendor_first');
      return;
    }
    const score = this.compositeEvalScore();
    this.mockDataService.vendors.update(list => list.map(v =>
      v.id === vendorId ? { ...v, rating: Math.round((score / 20) * 10) / 10 } : v
    ));
    this.notificationService.success('vendors.evaluation_saved_title', 'vendors.evaluation_saved_desc');
  }

  addBankAccount() {
    if (!this.tempBankName || !this.tempAccountNum) return;
    this.bankAccounts.push({ bankName: this.tempBankName, accountNumber: this.tempAccountNum, iban: this.tempIban, currency: this.tempBankCurr });
    this.tempBankName = ''; this.tempAccountNum = ''; this.tempIban = '';
  }

  removeBankAccount(index: number) { this.bankAccounts.splice(index, 1); }

  addContactPerson() {
    if (!this.tempContactName || !this.tempContactEmail) return;
    this.contactPersons.push({ name: this.tempContactName, role: this.tempContactRole, email: this.tempContactEmail, phone: this.tempContactPhone });
    this.tempContactName = ''; this.tempContactRole = ''; this.tempContactEmail = ''; this.tempContactPhone = '';
  }

  removeContactPerson(index: number) { this.contactPersons.splice(index, 1); }

  getVendorKPIs(vendorId: string) {
    if (vendorId === 'v1') return { totalOrders: 14, deliveryRate: 98, rejectedRate: 0.5, leadTime: 12 };
    if (vendorId === 'v2') return { totalOrders: 8, deliveryRate: 92, rejectedRate: 2.1, leadTime: 18 };
    if (vendorId === 'v3') return { totalOrders: 22, deliveryRate: 95, rejectedRate: 1.2, leadTime: 14 };
    return { totalOrders: 3, deliveryRate: 100, rejectedRate: 0.0, leadTime: 7 };
  }
}
