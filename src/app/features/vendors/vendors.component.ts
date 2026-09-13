import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule } from '@ngx-translate/core';
import { VendorApiService } from '../../core/services/vendor-api.service';
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
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly vendorApi = inject(VendorApiService);

  readonly isConnectedToApi = signal(false);
  readonly isApiLoading = signal(false);

  // Pure Backend State - No Mock Data
  readonly vendors = signal<Vendor[]>([]);

  // Top-Level UI Tabs
  readonly activeTab = signal<'list' | 'categories' | 'evaluation'>('list');
  
  // Detail Drawer Tabs
  readonly activeDetailTab = signal<'overview' | 'timeline' | 'ledger' | 'performance' | 'documents'>('overview');
  
  readonly selectedVendor = signal<Vendor | null>(null);
  readonly searchQuery = signal<string>('');
  readonly isEditing = signal<boolean>(false);

  // Backend Detail Signals
  readonly apiTimeline = signal<VendorTimelineEvent[]>([]);
  readonly apiLedger = signal<VendorLedgerEntry[]>([]);
  readonly apiDocuments = signal<VendorDocument[]>([]);
  readonly apiPerformance = signal<any | null>(null);
  readonly apiKpis = signal<{ total: number; active: number; approved: number; blacklisted: number } | null>(null);
  readonly leaderboardVendors = signal<any[]>([]);

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

  // Dynamic signals strictly from Backend state
  readonly vendorTimeline = computed(() => {
    return this.apiTimeline();
  });

  readonly vendorLedger = computed(() => {
    return this.apiLedger();
  });

  readonly vendorDocuments = computed(() => {
    return this.apiDocuments();
  });

  readonly vendorKPIs = computed(() => {
    const api = this.apiKpis();
    if (api) return api;
    return {
      total: this.vendors().length,
      active: this.vendors().filter(v => v.status === 'Active').length,
      approved: this.vendors().filter(v => v.approvalStatus === 'Approved').length,
      blacklisted: this.vendors().filter(v => v.approvalStatus === 'Blacklisted').length
    };
  });

  readonly filteredVendors = computed(() => {
    let list = this.vendors();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(v =>
        v.vendorName?.toLowerCase().includes(query) ||
        v.vendorCode?.toLowerCase().includes(query) ||
        v.arabicName?.includes(query) ||
        v.taxNumber?.toLowerCase().includes(query) ||
        (v.category && v.category.toLowerCase().includes(query)) ||
        (v.country && v.country.toLowerCase().includes(query))
      );
    }
    return list;
  });

  // Performance Engine from Backend
  readonly selectedVendorPerformance = computed(() => {
    const perf = this.apiPerformance();
    if (perf) {
      return {
        deliveryScore: parseFloat(perf.onTimeDeliveryRate) || 0,
        qualityScore: parseFloat(perf.qualityAcceptanceRate) || 0,
        priceScore: parseFloat(perf.winRate) || 0,
        overallRating: perf.rating || 0
      };
    }
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

  readonly rankedVendors = computed(() => {
    if (this.leaderboardVendors().length > 0) {
      return this.leaderboardVendors();
    }
    return [...this.vendors()].sort((a, b) => b.rating - a.rating);
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([{ label: 'navigation.vendors' }]);
    this.loadFromApi();
    this.loadKpis();
    this.loadLeaderboard();
  }

  loadKpis() {
    this.vendorApi.getVendorKpis().subscribe({
      next: (res) => {
        if (res?.data) {
          this.apiKpis.set({
            total: res.data.total ?? 0,
            active: res.data.active ?? 0,
            approved: res.data.approved ?? 0,
            blacklisted: res.data.blacklisted ?? 0
          });
        }
      },
      error: () => {}
    });
  }

  loadLeaderboard() {
    this.vendorApi.getLeaderboard(10).subscribe({
      next: (res) => {
        const items = res?.data ?? [];
        if (items.length > 0) {
          this.leaderboardVendors.set(items.map((v: any) => ({
            ...v,
            id: v._id ?? v.id,
            rating: v.rating ?? 0
          })));
        } else {
          this.leaderboardVendors.set([]);
        }
      },
      error: () => {
        this.leaderboardVendors.set([]);
      }
    });
  }

  loadFromApi() {
    this.isApiLoading.set(true);
    this.vendorApi.getVendors({ limit: 100 }).subscribe({
      next: (res) => {
        const list = res.data ?? res.items ?? (Array.isArray(res) ? res : []);
        // Strictly set whatever backend returned, even if empty []
        this.vendors.set(list.map((v: any) => ({
          ...v,
          id: v._id ?? v.id,
          vendorName: v.vendorName || '',
          vendorCode: v.vendorCode || '',
          arabicName: v.arabicName || '',
          status: v.status ?? 'Active',
          approvalStatus: v.approvalStatus ?? 'Pending',
          category: v.category ?? 'General',
          country: v.country || '',
          taxNumber: v.taxNumber || '',
          totalOrders: v.totalOrders ?? 0,
          totalSpend: v.totalSpend ?? 0,
          contactPerson: v.contactPerson ?? '',
          contactEmail: v.contactEmail ?? '',
          contactPhone: v.contactPhone ?? '',
          rating: v.performanceScore ?? v.rating ?? 0,
          bankAccounts: v.bankAccounts || [],
          contactPersons: v.contactPersons || []
        })));
        this.isConnectedToApi.set(true);
        this.isApiLoading.set(false);
      },
      error: () => {
        this.vendors.set([]);
        this.isApiLoading.set(false);
      }
    });
  }

  selectVendor(vendor: Vendor) {
    this.selectedVendor.set(vendor);
    this.activeDetailTab.set('overview');
    this.isEditing.set(false);
    this.loadVendorDetails(vendor);
  }

  loadVendorDetails(vendor: Vendor) {
    const id = (vendor as any)._id ?? vendor.id;
    if (!id) return;

    // 1. Timeline strictly from API
    this.vendorApi.getVendorTimeline(id).subscribe({
      next: (res) => {
        const events = res?.data ?? [];
        this.apiTimeline.set(events.map((e: any) => ({
          ...e,
          id: e._id ?? e.id,
          vendorId: id,
          date: e.date ? String(e.date).split('T')[0] : ''
        })));
      },
      error: () => this.apiTimeline.set([])
    });

    // 2. Ledger strictly from API
    this.vendorApi.getVendorLedger(id).subscribe({
      next: (res) => {
        const ledgerData = res?.data;
        const entries = ledgerData?.entries ?? (Array.isArray(ledgerData) ? ledgerData : []);
        this.apiLedger.set(entries.map((e: any) => ({
          ...e,
          id: e._id ?? e.id,
          vendorId: id,
          date: e.date ? String(e.date).split('T')[0] : ''
        })));
      },
      error: () => this.apiLedger.set([])
    });

    // 3. Documents strictly from API
    this.vendorApi.getVendorDocuments(id).subscribe({
      next: (res) => {
        const docs = res?.data ?? [];
        this.apiDocuments.set(docs.map((d: any) => ({
          ...d,
          id: d._id ?? d.id,
          vendorId: id
        })));
      },
      error: () => this.apiDocuments.set([])
    });

    // 4. Performance strictly from API
    this.vendorApi.getVendorPerformance(id).subscribe({
      next: (res) => {
        if (res?.data) this.apiPerformance.set(res.data);
        else this.apiPerformance.set(null);
      },
      error: () => this.apiPerformance.set(null)
    });
  }

  closeDetails() {
    this.selectedVendor.set(null);
    this.isEditing.set(false);
    this.apiTimeline.set([]);
    this.apiLedger.set([]);
    this.apiDocuments.set([]);
    this.apiPerformance.set(null);
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
      companyName: this.regCompanyName,
      vendorName: this.regCompanyName,
      arabicName: this.regArabicName || undefined,
      category: this.regCategory,
      taxNumber: this.regTaxNumber,
      vatNumber: this.regVatNumber || undefined,
      commercialRegistration: this.regCR || undefined,
      country: this.regCountry,
      address: this.regAddress,
      contactPerson: this.regContactName,
      contactTitle: this.regContactTitle || 'Primary Contact',
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

    this.vendorApi.registerPublicVendor(body).subscribe({
      next: (res) => {
        const data = res?.data ?? {};
        this.regCredentials.set(data.credentials || { username: `${this.regContactEmail.split('@')[0]}_vendor`, password: 'Welcome@2026' });
        this.regStep.set(4);
        this.regLoading.set(false);
        this.loadFromApi();
        this.loadKpis();
      },
      error: () => {
        // Fallback: create via internal API
        this.vendorApi.createVendor(body).subscribe({
          next: (created) => {
            const data = created?.data ?? created;
            this.regCredentials.set({ username: data.vendorCode ?? 'vendor_user', password: 'Welcome@123' });
            this.regStep.set(4);
            this.regLoading.set(false);
            this.loadFromApi();
            this.loadKpis();
          },
          error: (err) => {
            this.regError.set(err?.error?.message || 'Registration failed. Please try again.');
            this.regLoading.set(false);
          }
        });
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
    this.vendorApi.updateVendor(id, body).subscribe({
      next: (res) => {
        const updated = res?.data ?? res;
        const normalized = { ...vendor, ...updated, id: vendor.id };
        this.vendors.update(list => list.map(v => v.id === vendor.id ? normalized : v));
        this.selectedVendor.set(normalized);
        this.isEditing.set(false);
        this.notificationService.success('Saved', `${normalized.vendorName} updated successfully`);
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to update vendor');
      }
    });
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  approveVendor(vendor: Vendor): void {
    const id = (vendor as any)._id ?? vendor.id;
    this.vendorApi.updateVendorStatus(id, { status: 'Active', approvalStatus: 'Approved' }).subscribe({
      next: () => {
        this.vendors.update(list => list.map(v =>
          v.id === vendor.id ? { ...v, status: 'Active' as any, approvalStatus: 'Approved' as any } : v
        ));
        if (this.selectedVendor()?.id === vendor.id) {
          this.selectedVendor.update(v => v ? { ...v, status: 'Active' as any, approvalStatus: 'Approved' as any } : v);
        }
        this.notificationService.success('Approved', `${vendor.vendorName} approved successfully`);
        this.loadKpis();
      },
      error: (err) => this.notificationService.danger('Error', err?.error?.message || 'Approval failed')
    });
  }

  blacklistVendor(vendor: Vendor): void {
    const id = (vendor as any)._id ?? vendor.id;
    const reason = prompt('Reason for blacklisting (Required):') || 'Policy and compliance violation';
    this.vendorApi.updateVendorStatus(id, { status: 'Inactive', approvalStatus: 'Blacklisted', reason }).subscribe({
      next: () => {
        this.vendors.update(list => list.map(v =>
          v.id === vendor.id ? { ...v, status: 'Inactive' as any, approvalStatus: 'Blacklisted' as any } : v
        ));
        if (this.selectedVendor()?.id === vendor.id) {
          this.selectedVendor.update(v => v ? { ...v, status: 'Inactive' as any, approvalStatus: 'Blacklisted' as any } : v);
        }
        this.notificationService.success('Blacklisted', `${vendor.vendorName} blacklisted`);
        this.loadKpis();
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

    const payload = {
      deliveryScore: this.evaluationDeliveryScore,
      qualityScore: this.evaluationQualityScore,
      priceScore: this.evaluationPriceScore,
      communicationScore: this.evaluationCommunicationScore,
      period: '2026-Q3',
      comments: 'Evaluation submitted via Admin Console'
    };

    this.vendorApi.submitEvaluation(vendorId, payload).subscribe({
      next: () => {
        const score = this.compositeEvalScore();
        const rating = Math.round((score / 20) * 10) / 10;
        this.vendors.update(list => list.map(v =>
          v.id === vendorId ? { ...v, rating, evaluationScore: score } as any : v
        ));
        if (this.selectedVendor()?.id === vendorId) {
          this.selectedVendor.update(v => v ? { ...v, rating, evaluationScore: score } as any : v);
        }
        this.notificationService.success('vendors.evaluation_saved_title', 'vendors.evaluation_saved_desc');
        this.loadLeaderboard();
      },
      error: (err) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to submit evaluation');
      }
    });
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
