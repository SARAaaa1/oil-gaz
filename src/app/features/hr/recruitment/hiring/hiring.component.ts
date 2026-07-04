import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { HiringRecord } from '../../../../shared/interfaces/recruitment.interface';

@Component({
  selector: 'app-hr-hiring',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.hiring.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.hiring.subtitle' | translate }}</p>
      </div>

      <!-- Grid: Active Hiring + Drafts Pool -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Active Hiring Cards (2/3) -->
        <div class="lg:col-span-2 space-y-4">
          @for (rec of hrService.hiringRecords(); track rec.id) {
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <!-- Record Header -->
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase"
                      [class]="getStatusClass(rec.status)">{{ rec.status }}</span>
                  </div>
                  <p class="font-black text-slate-850 text-base">{{ rec.candidateName }}</p>
                  <p class="text-xs text-slate-500 font-semibold mt-0.5">{{ rec.position }} · {{ rec.department }}</p>
                </div>
              </div>

              <!-- Checklist -->
              <div class="space-y-2">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.hiring.lbl_checklist' | translate }}</p>
                <div class="grid grid-cols-2 gap-2">
                  <div class="flex items-center gap-2 text-xs font-bold"
                    [class.text-green-700]="rec.checklist.contractSigned"
                    [class.text-slate-400]="!rec.checklist.contractSigned">
                    <span>{{ rec.checklist.contractSigned ? '✅' : '⬜' }}</span>
                    <span>{{ 'hr.hiring.lbl_contract' | translate }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold"
                    [class.text-green-700]="rec.checklist.iqamaSubmitted"
                    [class.text-slate-400]="!rec.checklist.iqamaSubmitted">
                    <span>{{ rec.checklist.iqamaSubmitted ? '✅' : '⬜' }}</span>
                    <span>{{ 'hr.hiring.lbl_iqama' | translate }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold"
                    [class.text-green-700]="rec.checklist.medicalInsuranceCode"
                    [class.text-slate-400]="!rec.checklist.medicalInsuranceCode">
                    <span>{{ rec.checklist.medicalInsuranceCode ? '✅' : '⬜' }}</span>
                    <span>{{ 'hr.hiring.lbl_med' | translate }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs font-bold"
                    [class.text-green-700]="rec.checklist.backgroundChecked"
                    [class.text-slate-400]="!rec.checklist.backgroundChecked">
                    <span>{{ rec.checklist.backgroundChecked ? '✅' : '⬜' }}</span>
                    <span>{{ 'hr.hiring.lbl_bg' | translate }}</span>
                  </div>
                </div>
              </div>

              <!-- Offer details (if sent) -->
              @if (rec.offerSalary) {
                <div class="flex items-center gap-4 text-xs font-bold p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span class="text-slate-400">{{ 'hr.hiring.lbl_sal_proposed' | translate }}</span>
                    <span class="text-slate-800 ms-1">{{ rec.offerSalary | number }} SAR</span>
                  </div>
                  @if (rec.offerDate) {
                    <div>
                      <span class="text-slate-400">{{ 'hr.hiring.lbl_sent_date' | translate }}</span>
                      <span class="text-slate-800 ms-1 font-mono">{{ rec.offerDate }}</span>
                    </div>
                  }
                </div>
              }

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
                <button (click)="cancelHiring(rec.id)"
                  class="px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold transition-all">
                  {{ 'hr.hiring.btn_cancel' | translate }}
                </button>
                @if (rec.status === 'Waiting Documents' || rec.status === 'Offer Sent') {
                  <button (click)="openOfferModal(rec)"
                    class="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all">
                    {{ 'hr.hiring.btn_offer' | translate }}
                  </button>
                }
                @if (rec.status === 'Offer Sent') {
                  <button (click)="acceptOffer(rec.id)"
                    class="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition-all">
                    {{ 'hr.hiring.btn_accept' | translate }}
                  </button>
                }
                @if (rec.status === 'Ready For Onboarding' || rec.status === 'Offer Accepted') {
                  <button (click)="convertToEmployee(rec.candidateId)"
                    class="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-[10px] font-bold transition-all shadow-sm">
                    🚀 {{ 'hr.hiring.btn_convert' | translate }}
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <p class="text-3xl mb-3">🤝</p>
              <p class="text-sm font-bold text-slate-500">{{ 'hr.common.no_records' | translate }}</p>
            </div>
          }
        </div>

        <!-- Drafts / Completed Pool (1/3) -->
        <div class="space-y-4">
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div>
              <h3 class="text-xs font-bold text-slate-800">{{ 'hr.hiring.lbl_drafts' | translate }}</h3>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ 'hr.hiring.lbl_drafts_subtitle' | translate }}</p>
            </div>
            <div class="space-y-2">
              @for (rec of completedRecords(); track rec.id) {
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p class="font-bold text-slate-800 text-xs">{{ rec.candidateName }}</p>
                  <p class="text-[10px] text-slate-500">{{ rec.position }}</p>
                  @if (rec.employeeNumber) {
                    <span class="inline-block text-[9px] font-extrabold font-mono px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100">
                      {{ rec.employeeNumber }}
                    </span>
                  }
                </div>
              } @empty {
                <p class="text-xs text-slate-400 py-2">{{ 'hr.hiring.lbl_no_drafts' | translate }}</p>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Offer Letter Modal -->
      @if (showOfferModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="text-sm font-black text-slate-800">{{ 'hr.hiring.modal_title' | translate }}</h3>
              <button (click)="closeOfferModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.hiring.lbl_salary' | translate }}</label>
                <input [(ngModel)]="offerSalary" type="number" min="1000"
                  class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2 border-t">
              <button (click)="closeOfferModal()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
              <button (click)="generateOffer()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.common.submit' | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrHiringComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hrService = inject(HrMockService);

  showOfferModal = signal(false);
  selectedRec = signal<HiringRecord | null>(null);
  offerSalary = 10000;

  readonly completedRecords = computed(() =>
    this.hrService.hiringRecords().filter(r => r.status === 'Completed')
  );

  openOfferModal(rec: HiringRecord) {
    this.selectedRec.set(rec);
    this.offerSalary = rec.offerSalary ?? 10000;
    this.showOfferModal.set(true);
  }
  closeOfferModal() { this.showOfferModal.set(false); }

  generateOffer() {
    const rec = this.selectedRec();
    if (!rec || this.offerSalary <= 0) return;
    this.hrService.generateOfferLetter(rec.id, this.offerSalary);
    this.closeOfferModal();
  }

  acceptOffer(recId: string) { this.hrService.acceptOffer(recId); }
  cancelHiring(recId: string) { this.hrService.cancelHiring(recId); }
  convertToEmployee(candId: string) { this.hrService.convertToEmployee(candId); }

  getStatusClass(status: HiringRecord['status']): string {
    switch (status) {
      case 'Waiting Documents':    return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Offer Sent':           return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Offer Accepted':       return 'bg-teal-50 text-teal-700 border border-teal-100';
      case 'Ready For Onboarding': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Completed':            return 'bg-green-50 text-green-700 border border-green-100';
      default:                     return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.hiring.title' }
    ]);
  }
}
