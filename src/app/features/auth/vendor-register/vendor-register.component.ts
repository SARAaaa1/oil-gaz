import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { VendorApiService } from '../../../core/services/vendor-api.service';
import { DascoLogoComponent } from '../../../shared/components/dasco-logo/dasco-logo.component';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { VendorCategory } from '../../../shared/interfaces/vendor.interface';

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
  private readonly notificationService = inject(NotificationService);
  private readonly vendorApi = inject(VendorApiService);
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

  // ── Navigation ────────────────────────────────────────────────────
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

  // ── Document Upload (simulated) ───────────────────────────────────
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

  // ── Submit Registration ───────────────────────────────────────────
  submitRegistration(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      companyName: this.companyName,
      arabicName: this.arabicName || undefined,
      category: this.vendorCategory,
      taxNumber: this.taxNumber,
      vatNumber: this.vatNumber || undefined,
      commercialRegistration: this.commercialReg || undefined,
      country: this.country,
      address: this.address,
      contactPerson: this.contactName,
      contactTitle: this.contactTitle || 'Primary Contact',
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      paymentTerms: this.paymentTerms,
      currency: this.currency,
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
      }]
    };

    this.vendorApi.registerPublicVendor(payload).subscribe({
      next: (res) => {
        const data = res?.data ?? {};
        const creds = data.credentials || {
          username: `${this.contactEmail.split('@')[0]}_vendor`,
          password: 'Welcome@2026'
        };
        this.generatedCredentials.set(creds);
        this.isLoading.set(false);
        this.currentStep.set(4);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Registration failed. Please check your data and try again.');
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
