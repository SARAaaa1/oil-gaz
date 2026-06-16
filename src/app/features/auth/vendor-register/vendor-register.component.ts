import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DascoLogoComponent } from '../../../shared/components/dasco-logo/dasco-logo.component';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { VendorCategory } from '../../../shared/interfaces/vendor.interface';
import { Vendor } from '../../../shared/interfaces/vendor.interface';

interface UploadedDoc {
  name: string;
  type: string;
  size: string;
  status: 'ready';
}

@Component({
  selector: 'app-vendor-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DascoLogoComponent, LanguageSwitcherComponent],
  templateUrl: './vendor-register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorRegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly mockDataService = inject(MockDataService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // Steps: 1 = Company Info, 2 = Contact & Banking, 3 = Documents, 4 = Success
  readonly currentStep = signal<1 | 2 | 3 | 4>(1);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly generatedCredentials = signal<{ username: string; password: string } | null>(null);

  // ── Step 1: Company Info ──────────────────────────────────────────────────
  companyName = '';
  arabicName = '';
  vendorCategory: VendorCategory = 'General';
  taxNumber = '';
  vatNumber = '';
  commercialReg = '';
  country = 'Saudi Arabia';
  address = '';
  website = '';
  annualRevenue = '';

  // ── Step 2: Contact & Banking ──────────────────────────────────────────────
  contactName = '';
  contactTitle = '';
  contactEmail = '';
  contactPhone = '';
  bankName = '';
  accountNumber = '';
  iban = '';
  bankCurrency = 'USD';
  paymentTerms = 'Net 30';
  currency = 'USD';

  // ── Step 3: Documents ─────────────────────────────────────────────────────
  uploadedDocs = signal<UploadedDoc[]>([]);
  agreementAccepted = false;

  readonly requiredDocTypes = [
    { key: 'cr', label: 'Commercial Registration', description: 'Valid commercial registration certificate', required: true },
    { key: 'tax', label: 'Tax Certificate', description: 'Current tax registration certificate', required: true },
    { key: 'vat', label: 'VAT Certificate', description: 'Value added tax registration', required: false },
    { key: 'bank', label: 'Bank Letter', description: 'Official bank confirmation letter', required: true },
    { key: 'iso', label: 'ISO / Quality Certifications', description: 'Quality management certifications', required: false },
    { key: 'hse', label: 'HSE Policy Document', description: 'Health, safety & environment policy', required: false },
  ];

  readonly vendorCategories: { value: VendorCategory; label: string; icon: string }[] = [
    { value: 'Drilling Services', label: 'Drilling Services', icon: '⛏️' },
    { value: 'Chemicals', label: 'Chemicals & Fluids', icon: '🧪' },
    { value: 'Tubulars', label: 'Tubulars & Casing', icon: '🔩' },
    { value: 'HSE', label: 'HSE Equipment & PPE', icon: '🦺' },
    { value: 'Logistics', label: 'Logistics & Transport', icon: '🚛' },
    { value: 'General', label: 'General Supplies', icon: '📦' },
  ];

  readonly countries = [
    'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
    'Egypt', 'Jordan', 'United States', 'United Kingdom', 'Germany', 'France',
    'China', 'India', 'Turkey', 'Pakistan', 'Other'
  ];

  // ── Computed validation ───────────────────────────────────────────────────
  get step1Valid(): boolean {
    return !!(this.companyName && this.taxNumber && this.country && this.address);
  }

  get step2Valid(): boolean {
    return !!(this.contactName && this.contactEmail && this.contactPhone);
  }

  get step3Valid(): boolean {
    return this.agreementAccepted;
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goToStep(step: 1 | 2 | 3 | 4): void {
    this.errorMessage.set(null);
    this.currentStep.set(step);
  }

  nextStep(): void {
    const step = this.currentStep();
    if (step === 1 && !this.step1Valid) {
      this.errorMessage.set('Please fill all required fields: Company Name, Tax Number, Country, Address.');
      return;
    }
    if (step === 2 && !this.step2Valid) {
      this.errorMessage.set('Please fill all required contact fields: Name, Email, Phone.');
      return;
    }
    if (step === 3 && !this.step3Valid) {
      this.errorMessage.set('You must accept the terms and conditions to proceed.');
      return;
    }
    this.errorMessage.set(null);
    if (step < 3) {
      this.currentStep.set((step + 1) as 1 | 2 | 3 | 4);
    } else {
      this.submitRegistration();
    }
  }

  prevStep(): void {
    const step = this.currentStep();
    if (step > 1) {
      this.currentStep.set((step - 1) as 1 | 2 | 3 | 4);
      this.errorMessage.set(null);
    }
  }

  // ── Document Upload (simulated) ───────────────────────────────────────────
  simulateFileUpload(docType: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const existingIdx = this.uploadedDocs().findIndex(d => d.type === docType);
    const newDoc: UploadedDoc = {
      name: file.name,
      type: docType,
      size: this.formatFileSize(file.size),
      status: 'ready'
    };

    if (existingIdx >= 0) {
      this.uploadedDocs.update(docs => docs.map((d, i) => i === existingIdx ? newDoc : d));
    } else {
      this.uploadedDocs.update(docs => [...docs, newDoc]);
    }
    // Reset input so same file can be re-selected
    input.value = '';
  }

  removeDoc(docType: string): void {
    this.uploadedDocs.update(docs => docs.filter(d => d.type !== docType));
  }

  isDocUploaded(docType: string): boolean {
    return this.uploadedDocs().some(d => d.type === docType);
  }

  getUploadedDoc(docType: string): UploadedDoc | undefined {
    return this.uploadedDocs().find(d => d.type === docType);
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ── Submit Registration ───────────────────────────────────────────────────
  submitRegistration(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    setTimeout(() => {
      try {
        // Generate vendor code & user credentials
        const vendorCount = this.mockDataService.vendors().length;
        const vendorCode = `VND-${new Date().getFullYear()}-${String(vendorCount + 1).padStart(3, '0')}`;
        const usernameBase = this.contactEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const username = `${usernameBase}_vendor`;
        const password = `${usernameBase}@${new Date().getFullYear()}`;
        const vendorId = `v-reg-${Date.now()}`;

        // Create vendor record
        const newVendor: Vendor = {
          id: vendorId,
          vendorCode,
          vendorName: this.companyName,
          arabicName: this.arabicName,
          taxNumber: this.taxNumber,
          vatNumber: this.vatNumber,
          commercialRegistration: this.commercialReg,
          address: this.address,
          country: this.country,
          category: this.vendorCategory,
          approvalStatus: 'Pending',
          contactPerson: this.contactName,
          contactEmail: this.contactEmail,
          contactPhone: this.contactPhone,
          paymentTerms: this.paymentTerms,
          currency: this.currency,
          rating: 5,
          status: 'Active',
          bankAccounts: this.bankName ? [{
            bankName: this.bankName,
            accountNumber: this.accountNumber,
            iban: this.iban,
            currency: this.bankCurrency
          }] : [],
          contactPersons: [{
            name: this.contactName,
            role: this.contactTitle || 'Primary Contact',
            email: this.contactEmail,
            phone: this.contactPhone
          }],
          totalOrders: 0,
          totalSpend: 0,
          totalRFQs: 0,
          awardedRFQs: 0,
          participatedRFQs: 0,
          totalDeliveries: 0,
          onTimeDeliveries: 0,
          totalDeliveredQty: 0,
          acceptedQty: 0,
          lateDeliveries: 0,
          rejectedDeliveries: 0,
          openInvoices: 0,
          paidInvoices: 0
        };

        // Add vendor documents
        const docs = this.uploadedDocs().map((doc, i) => ({
          id: `vdoc-reg-${i}-${Date.now()}`,
          vendorId,
          documentType: 'Other' as const,
          fileName: doc.name,
          fileSize: doc.size,
          uploadedDate: new Date().toISOString().split('T')[0],
          uploadedBy: this.contactName,
          status: 'Valid' as const,
          notes: doc.type
        }));

        // Register the vendor in mock data
        this.mockDataService.vendors.update(list => [...list, newVendor]);

        // Add vendor documents
        if (docs.length > 0) {
          this.mockDataService.vendorDocuments.update(list => [...list, ...docs]);
        }

        // Register vendor timeline event
        this.mockDataService.vendorTimeline.update(list => [...list, {
          id: `vte-reg-${Date.now()}`,
          vendorId,
          date: new Date().toISOString().split('T')[0],
          eventType: 'Created' as const,
          title: 'Vendor Registered',
          description: `${this.companyName} submitted registration via Vendor Portal. Status: Pending Approval.`,
          performedBy: this.contactName
        }]);

        // Register vendor user credentials via auth service
        this.authService.registerVendorUser(username, password, this.companyName, this.contactName, this.contactEmail, vendorId);

        this.generatedCredentials.set({ username, password });
        this.isLoading.set(false);
        this.currentStep.set(4);
      } catch (e) {
        this.isLoading.set(false);
        this.errorMessage.set('Registration failed. Please try again.');
      }
    }, 1500);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
