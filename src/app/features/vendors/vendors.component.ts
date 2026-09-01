import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { 
  Vendor, BankAccount, ContactPerson, 
  VendorTimelineEvent, VendorLedgerEntry, VendorDocument, 
  VendorCategory, VendorApprovalStatus 
} from '../../shared/interfaces/vendor.interface';

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
  private readonly http = inject(HttpClient);
  private readonly vendorsApiUrl = `${environment.apiUrl}/vendors`;

  readonly isConnectedToApi = signal(false);
  readonly isApiLoading = signal(false);

  readonly vendors = signal<Vendor[]>(this.mockDataService.vendors());

  // Top-Level UI Tabs
  readonly activeTab = signal<'list' | 'categories' | 'evaluation'>('list');
  
  // Detail Drawer Tabs
  readonly activeDetailTab = signal<'overview' | 'timeline' | 'ledger' | 'performance' | 'documents'>('overview');
  
  readonly selectedVendor = signal<Vendor | null>(null);
  readonly searchQuery = signal<string>('');
  readonly isEditing = signal<boolean>(false);

  // ── Registration Drawer ─────────────────────────────────────────────────────
  readonly showRegDrawer = signal<boolean>(false);
  readonly regStep = signal<1 | 2 | 3 | 4>(1);
  readonly regLoading = signal<boolean>(false);
  readonly regError = signal<string | null>(null);
  readonly regCredentials = signal<{ username: string; password: string } | null>(null);
  readonly regUploadedDocs = signal<{ name: string; type: string; size: string }[]>([]);

  // Step 1 fields
  regCompanyName = ''; regArabicName = ''; regCategory: VendorCategory = 'General';
  regTaxNumber = ''; regVatNumber = ''; regCR = '';
  regCountry = 'Saudi Arabia'; regAddress = ''; regAnnualRevenue = '';

  // Step 2 fields
  regContactName = ''; regContactTitle = ''; regContactEmail = ''; regContactPhone = '';
  regBankName = ''; regAccountNumber = ''; regIban = ''; regBankCurrency = 'USD';
  regPaymentTerms = 'Net 30'; regCurrency = 'USD';

  // Step 3
  regAgreementAccepted = false;

  readonly regDocTypes = [
    { key: 'cr',   label: 'Commercial Registration',     desc: 'Valid CR certificate',              required: true  },
    { key: 'tax',  label: 'Tax Certificate',              desc: 'Current tax registration',           required: true  },
    { key: 'vat',  label: 'VAT Certificate',              desc: 'Value added tax registration',        required: false },
    { key: 'bank', label: 'Bank Confirmation Letter',     desc: 'Official bank letter',                required: true  },
    { key: 'iso',  label: 'ISO / Quality Certifications', desc: 'Quality management certifications',   required: false },
    { key: 'hse',  label: 'HSE Policy Document',          desc: 'Health, Safety & Environment policy', required: false },
  ];

  readonly regCategoryOptions: { value: VendorCategory; label: string }[] = [
    { value: 'Drilling Services', label: '⛏ Drilling Services' },
    { value: 'Chemicals',         label: '🧪 Chemicals & Fluids' },
    { value: 'Tubulars',          label: '🔩 Tubulars & Casing' },
    { value: 'HSE',               label: '🦺 HSE Equipment & PPE' },
    { value: 'Logistics',         label: '🚛 Logistics & Transport' },
    { value: 'General',           label: '📦 General Supplies' },
  ];

  readonly regCountries = [
    'Saudi Arabia','United Arab Emirates','Kuwait','Qatar','Bahrain','Oman',
    'Egypt','Jordan','United States','United Kingdom','Germany','China','India','Turkey','Other'
  ];

  get regStep1Valid(): boolean { return !!(this.regCompanyName && this.regTaxNumber && this.regCountry && this.regAddress); }
  get regStep2Valid(): boolean { return !!(this.regContactName && this.regContactEmail && this.regContactPhone); }
  get regStep3Valid(): boolean { return this.regAgreementAccepted; }

  // Form Fields (Add/Edit)
  vendorCode = '';
  vendorName = '';
  arabicName = '';
  taxNumber = '';
  vatNumber = '';
  commercialRegistration = '';
  address = '';
  country = '';
  category: VendorCategory = 'General';
  approvalStatus: VendorApprovalStatus = 'Pending';
  contactPerson = '';
  contactEmail = '';
  contactPhone = '';
  paymentTerms = 'Net 30';
  currency = 'USD';
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
    { code: 'DRL', name: 'Drilling Services' },
    { code: 'CHM', name: 'Chemicals & Fluids' },
    { code: 'TUB', name: 'Tubulars & Casing' },
    { code: 'HSE', name: 'HSE Equipment & PPE' },
    { code: 'LOG', name: 'Logistics & Transport' },
    { code: 'ELE', name: 'Electrical & Instrumentation' },
    { code: 'GEN', name: 'General Supplies' },
    { code: 'ENG', name: 'Engineering Services' }
  ];

  // Dynamic signals from MockDataService
  readonly vendorTimeline = computed(() => {
    const v = this.selectedVendor();
    if (!v) return [];
    return this.mockDataService.vendorTimeline().filter(t => t.vendorId === v.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly vendorLedger = computed(() => {
    const v = this.selectedVendor();
    if (!v) return [];
    const entries = [...this.mockDataService.vendorLedger().filter(l => l.vendorId === v.id)]
      .sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    return entries.map(entry => {
      balance = balance + entry.debit - entry.credit;
      return { ...entry, balance };
    });
  });

  readonly vendorDocuments = computed(() => {
    const v = this.selectedVendor();
    if (!v) return [];
    return this.mockDataService.vendorDocuments().filter(d => d.vendorId === v.id);
  });

  readonly vendorKPIs = computed(() => ({
    total: this.vendors().length,
    active: this.vendors().filter(v => v.status === 'Active').length,
    approved: this.vendors().filter(v => v.approvalStatus === 'Approved').length,
    blacklisted: this.vendors().filter(v => v.approvalStatus === 'Blacklisted').length
  }));

  readonly filteredVendors = computed(() => {
    let list = this.vendors();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(v =>
        v.vendorName.toLowerCase().includes(query) ||
        v.vendorCode.toLowerCase().includes(query) ||
        v.arabicName.includes(query) ||
        v.taxNumber.toLowerCase().includes(query) ||
        (v.category && v.category.toLowerCase().includes(query)) ||
        (v.country && v.country.toLowerCase().includes(query))
      );
    }
    return list;
  });

  // Performance Engine
  readonly selectedVendorPerformance = computed(() => {
    const v = this.selectedVendor();
    if (!v) return { deliveryScore: 0, qualityScore: 0, priceScore: 0, overallRating: 0 };
    
    const deliveryScore = v.totalDeliveries > 0 ? Math.round((v.onTimeDeliveries / v.totalDeliveries) * 100) : 0;
    const qualityScore = v.totalDeliveredQty > 0 ? Math.round((v.acceptedQty / v.totalDeliveredQty) * 100) : 0;
    const priceScore = v.participatedRFQs > 0 ? Math.round((v.awardedRFQs / v.participatedRFQs) * 100) : 0;
    
    const overallRating = Math.round(((qualityScore * 0.4 + deliveryScore * 0.4 + priceScore * 0.2) / 20) * 10) / 10;
    
    return {
      deliveryScore,
      qualityScore,
      priceScore,
      overallRating
    };
  });

  readonly compositeEvalScore = computed(() =>
    Math.round((this.evaluationDeliveryScore + this.evaluationQualityScore + this.evaluationPriceScore + this.evaluationCommunicationScore) / 4)
  );

  readonly rankedVendors = computed(() =>
    [...this.vendors()].sort((a, b) => b.rating - a.rating)
  );

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{ label: 'navigation.vendors' }]);
    this.loadFromApi();
  }

  loadFromApi() {
    this.isApiLoading.set(true);
    this.http.get<any>(this.vendorsApiUrl + '?limit=200').subscribe({
      next: (res) => {
        const list = res.data ?? res.items ?? (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          // Map API response to match the existing vendor interface
          this.vendors.set(list.map((v: any) => ({
            ...v,
            id: v._id ?? v.id,
            vendorName: v.vendorName,
            vendorCode: v.vendorCode,
            status: v.status ?? 'Active',
            category: v.category ?? 'General',
            contactPerson: v.contactPerson ?? '',
            contactEmail: v.contactEmail ?? '',
            contactPhone: v.contactPhone ?? '',
            rating: v.performanceScore ?? v.rating ?? 0,
          })));
          this.isConnectedToApi.set(true);
        }
        this.isApiLoading.set(false);
      },
      error: () => {
        // Backend not ready yet - keep mock data silently
        this.isApiLoading.set(false);
      }
    });
  }

  selectVendor(vendor: Vendor) {
    this.selectedVendor.set(vendor);
    this.activeDetailTab.set('overview');
    this.isEditing.set(false);
  }

  closeDetails() {
    this.selectedVendor.set(null);
    this.isEditing.set(false);
  }

  // ── Registration Drawer Methods ──────────────────────────────────────────
  openRegistration(): void {
    this.regCompanyName = ''; this.regArabicName = ''; this.regCategory = 'General';
    this.regTaxNumber = ''; this.regVatNumber = ''; this.regCR = '';
    this.regCountry = 'Saudi Arabia'; this.regAddress = ''; this.regAnnualRevenue = '';
    this.regContactName = ''; this.regContactTitle = ''; this.regContactEmail = ''; this.regContactPhone = '';
    this.regBankName = ''; this.regAccountNumber = ''; this.regIban = ''; this.regBankCurrency = 'USD';
    this.regPaymentTerms = 'Net 30'; this.regCurrency = 'USD';
    this.regUploadedDocs.set([]);
    this.regAgreementAccepted = false;
    this.regStep.set(1);
    this.regError.set(null);
    this.regCredentials.set(null);
    this.showRegDrawer.set(true);
  }

  closeRegistration(): void {
    this.showRegDrawer.set(false);
  }

  nextRegStep(): void {
    const step = this.regStep();
    if (step === 1 && !this.regStep1Valid) { this.regError.set('Please fill required fields: Company Name, Tax Number, Country, Address.'); return; }
    if (step === 2 && !this.regStep2Valid) { this.regError.set('Please fill required contact fields: Full Name, Email, Phone.'); return; }
    if (step === 3 && !this.regStep3Valid) { this.regError.set('You must accept the terms and conditions to proceed.'); return; }
    this.regError.set(null);
    if (step < 3) { this.regStep.set((step + 1) as 1|2|3|4); } else { this.submitRegistration(); }
  }

  prevRegStep(): void {
    const step = this.regStep();
    if (step > 1) { this.regStep.set((step - 1) as 1|2|3|4); this.regError.set(null); }
  }

  regSimulateUpload(docType: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const size = file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const newDoc = { name: file.name, type: docType, size };
    const idx = this.regUploadedDocs().findIndex(d => d.type === docType);
    if (idx >= 0) { this.regUploadedDocs.update(docs => docs.map((d, i) => i === idx ? newDoc : d)); }
    else { this.regUploadedDocs.update(docs => [...docs, newDoc]); }
    input.value = '';
  }

  regRemoveDoc(docType: string): void { this.regUploadedDocs.update(docs => docs.filter(d => d.type !== docType)); }
  isRegDocUploaded(docType: string): boolean { return this.regUploadedDocs().some(d => d.type === docType); }
  getRegUploadedDoc(docType: string) { return this.regUploadedDocs().find(d => d.type === docType); }

  submitRegistration(): void {
    this.regLoading.set(true);
    this.regError.set(null);
    const body = {
      vendorName: this.regCompanyName,
      arabicName: this.regArabicName || undefined,
      category: this.regCategory,
      taxNumber: this.regTaxNumber,
      vatNumber: this.regVatNumber || undefined,
      commercialRegistration: this.regCR || undefined,
      country: this.regCountry,
      address: this.regAddress,
      contactPerson: this.regContactName,
      contactEmail: this.regContactEmail,
      contactPhone: this.regContactPhone,
      paymentTerms: this.regPaymentTerms,
      currency: this.regCurrency,
      bankAccounts: this.regBankName ? [{
        bankName: this.regBankName,
        accountNumber: this.regAccountNumber,
        iban: this.regIban,
        currency: this.regBankCurrency
      }] : [],
      contactPersons: this.regContactName ? [{
        name: this.regContactName,
        role: this.regContactTitle || 'Contact',
        email: this.regContactEmail,
        phone: this.regContactPhone
      }] : []
    };
    this.http.post<any>(this.vendorsApiUrl, body).subscribe({
      next: (created) => {
        const normalized: any = {
          ...created,
          id: created._id ?? created.id,
          vendorCode: created.vendorCode ?? `VND-${Date.now()}`,
          arabicName: created.arabicName ?? this.regArabicName,
          approvalStatus: created.approvalStatus ?? 'Pending',
          status: created.status ?? 'Pending',
          rating: 0,
          totalOrders: 0, totalSpend: 0, totalRFQs: 0, awardedRFQs: 0,
          participatedRFQs: 0, totalDeliveries: 0, onTimeDeliveries: 0,
          totalDeliveredQty: 0, acceptedQty: 0, lateDeliveries: 0,
          rejectedDeliveries: 0, openInvoices: 0, paidInvoices: 0, evaluationScore: 0,
          bankAccounts: body.bankAccounts,
          contactPersons: body.contactPersons
        };
        this.vendors.update(list => [normalized, ...list]);
        this.regCredentials.set({ username: created.vendorCode ?? normalized.vendorCode, password: 'Welcome@123' });
        this.regStep.set(4);
        this.regLoading.set(false);
      },
      error: (err) => {
        this.regError.set(err?.error?.message || 'Registration failed. Please try again.');
        this.regLoading.set(false);
      }
    });
  }

  startEditVendor() {
    const v = this.selectedVendor();
    if (!v) return;
    this.vendorCode = v.vendorCode; this.vendorName = v.vendorName; this.arabicName = v.arabicName;
    this.taxNumber = v.taxNumber; this.vatNumber = v.vatNumber; this.commercialRegistration = v.commercialRegistration;
    this.address = v.address; this.country = v.country || ''; this.category = v.category || 'General';
    this.approvalStatus = v.approvalStatus || 'Pending';
    this.contactPerson = v.contactPerson; this.contactEmail = v.contactEmail; this.contactPhone = v.contactPhone;
    this.paymentTerms = v.paymentTerms; this.currency = v.currency;
    this.status = v.status;
    this.bankAccounts = [...(v.bankAccounts || [])];
    this.contactPersons = [...(v.contactPersons || [])];
    this.isEditing.set(true);
  }

  saveVendor(): void {
    const vendor = this.selectedVendor();
    if (!vendor) return;
    const id = (vendor as any)._id ?? vendor.id;
    const body = {
      vendorName: this.vendorName,
      arabicName: this.arabicName,
      taxNumber: this.taxNumber,
      vatNumber: this.vatNumber,
      commercialRegistration: this.commercialRegistration,
      address: this.address,
      country: this.country,
      category: this.category,
      contactPerson: this.contactPerson,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      paymentTerms: this.paymentTerms,
      currency: this.currency,
      status: this.status,
      bankAccounts: this.bankAccounts,
      contactPersons: this.contactPersons
    };
    this.http.put<any>(`${this.vendorsApiUrl}/${id}`, body).subscribe({
      next: (updated) => {
        const normalized = { ...vendor, ...updated, id: vendor.id };
        this.vendors.update(list => list.map(v => v.id === vendor.id ? normalized : v));
        this.selectedVendor.set(normalized);
        this.isEditing.set(false);
        this.notificationService.success('Saved', `${normalized.vendorName} updated successfully`);
      },
      error: (err) => {
        // Fallback: update locally
        const updated = { ...vendor, vendorName: this.vendorName, arabicName: this.arabicName,
          contactPerson: this.contactPerson, contactEmail: this.contactEmail,
          contactPhone: this.contactPhone, status: this.status, bankAccounts: this.bankAccounts,
          contactPersons: this.contactPersons };
        this.vendors.update(list => list.map(v => v.id === vendor.id ? updated : v));
        this.selectedVendor.set(updated);
        this.isEditing.set(false);
        this.notificationService.success('Saved', `${updated.vendorName} updated (offline)`);
      }
    });
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  approveVendor(vendor: Vendor): void {
    const id = (vendor as any)._id ?? vendor.id;
    this.http.patch<any>(`${this.vendorsApiUrl}/${id}/status`, { status: 'Active' }).subscribe({
      next: () => {
        this.vendors.update(list => list.map(v =>
          v.id === vendor.id ? { ...v, status: 'Active' as any, approvalStatus: 'Approved' as any } : v
        ));
        if (this.selectedVendor()?.id === vendor.id) {
          this.selectedVendor.update(v => v ? { ...v, status: 'Active' as any, approvalStatus: 'Approved' as any } : v);
        }
        this.notificationService.success('Approved', `${vendor.vendorName} approved successfully`);
      },
      error: (err) => this.notificationService.danger('Error', err?.error?.message || 'Approval failed')
    });
  }

  blacklistVendor(vendor: Vendor): void {
    const id = (vendor as any)._id ?? vendor.id;
    const reason = prompt('Reason for blacklisting:') || 'Policy violation';
    this.http.patch<any>(`${this.vendorsApiUrl}/${id}/status`, { status: 'Blacklisted', reason }).subscribe({
      next: () => {
        this.vendors.update(list => list.map(v =>
          v.id === vendor.id ? { ...v, status: 'Inactive' as any, approvalStatus: 'Blacklisted' as any } : v
        ));
        if (this.selectedVendor()?.id === vendor.id) {
          this.selectedVendor.update(v => v ? { ...v, status: 'Inactive' as any, approvalStatus: 'Blacklisted' as any } : v);
        }
        this.notificationService.success('Blacklisted', `${vendor.vendorName} blacklisted`);
      },
      error: (err) => this.notificationService.danger('Error', err?.error?.message || 'Blacklist failed')
    });
  }

  submitEvaluation() {
    const vendorId = this.selectedEvalVendorId || this.selectedVendor()?.id;
    if (!vendorId) {
      this.notificationService.danger('common.validation_error', 'vendors.select_vendor_first');
      return;
    }
    const score = this.compositeEvalScore();
    this.mockDataService.vendors.update(list => list.map(v =>
      v.id === vendorId ? { ...v, rating: Math.round((score / 20) * 10) / 10, evaluationScore: score } as any : v
    ));
    
    const updated = this.vendors().find(v => v.id === vendorId);
    if (updated && this.selectedVendor()?.id === vendorId) {
      this.selectedVendor.set(updated);
    }
    
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
}
