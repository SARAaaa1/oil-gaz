import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { Candidate } from '../../../../shared/interfaces/candidate.interface';

@Component({
  selector: 'app-hr-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">

      <!-- Sidebar: Candidate List -->
      <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4 self-start">
        <div>
          <h2 class="text-sm font-black text-slate-800">{{ 'hr.candidates.title' | translate }}</h2>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ 'hr.candidates.subtitle' | translate }}</p>
        </div>

        <input [(ngModel)]="searchQuery" type="text"
          [placeholder]="'hr.common.search_placeholder' | translate"
          class="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none">

        <div class="space-y-2 overflow-y-auto max-h-[60vh] pr-1">
          @for (cand of filteredCandidates(); track cand.id) {
            <button (click)="selectCandidate(cand)"
              class="w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1"
              [class.border-indigo-300]="selectedCand()?.id === cand.id"
              [class.bg-indigo-50]="selectedCand()?.id === cand.id"
              [class.border-slate-100]="selectedCand()?.id !== cand.id"
              [class.hover:bg-slate-50]="selectedCand()?.id !== cand.id">
              <span class="font-bold text-slate-800 text-xs truncate">{{ cand.fullName }}</span>
              <span class="text-[10px] text-slate-500 truncate">{{ cand.position }}</span>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="inline-block px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase"
                  [class]="getStatusClass(cand.status)">{{ cand.status }}</span>
              </div>
            </button>
          } @empty {
            <p class="text-xs text-slate-400 text-center py-4">{{ 'hr.common.no_records' | translate }}</p>
          }
        </div>
      </div>

      <!-- Main Area: Candidate Dossier -->
      <div class="lg:col-span-3 space-y-4">
        @if (selectedCand()) {
          <!-- Profile Banner -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h2 class="text-lg font-black text-slate-850">{{ selectedCand()?.fullName }}</h2>
                  <p class="text-xs text-slate-500 font-semibold mt-0.5">
                    {{ selectedCand()?.position }} · {{ selectedCand()?.department }}
                  </p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase"
                      [class]="getStatusClass(selectedCand()?.status)">{{ selectedCand()?.status }}</span>
                    <span class="text-[10px] text-slate-400 font-bold">Applied: {{ selectedCand()?.appliedDate }}</span>
                  </div>
                </div>
              </div>
              <button (click)="overrideHiring()"
                class="self-start sm:self-auto px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                {{ 'hr.candidates.btn_override' | translate }}
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1">
            @for (tab of tabs; track tab.id) {
              <button (click)="activeTab.set(tab.id)"
                class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
                [class.bg-white]="activeTab() === tab.id"
                [class.shadow-sm]="activeTab() === tab.id"
                [class.text-slate-850]="activeTab() === tab.id"
                [class.text-slate-500]="activeTab() !== tab.id">
                {{ tab.label | translate }}
              </button>
            }
          </div>

          <!-- Tab Content -->
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-xs text-slate-700">

            <!-- Personal Info -->
            @if (activeTab() === 'personal') {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.candidates.lbl_email' | translate }}</p>
                  <p class="font-bold text-slate-800 mt-1">{{ selectedCand()?.email }}</p>
                </div>
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.candidates.lbl_phone' | translate }}</p>
                  <p class="font-bold text-slate-800 mt-1">{{ selectedCand()?.phone }}</p>
                </div>
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.candidates.lbl_exp' | translate }}</p>
                  <p class="font-bold text-slate-800 mt-1">{{ selectedCand()?.experienceYears }} Years</p>
                </div>
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.candidates.lbl_sal' | translate }}</p>
                  <p class="font-bold text-slate-800 mt-1">{{ selectedCand()?.expectedSalary | number }} SAR</p>
                </div>
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.candidates.lbl_avail' | translate }}</p>
                  <p class="font-bold text-slate-800 mt-1">{{ selectedCand()?.availability }}</p>
                </div>
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.candidates.lbl_date' | translate }}</p>
                  <p class="font-bold text-slate-800 mt-1 font-mono">{{ selectedCand()?.appliedDate }}</p>
                </div>
                @if (selectedCand()?.bio) {
                  <div class="col-span-2">
                    <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.candidates.lbl_bio' | translate }}</p>
                    <p class="text-slate-655 mt-1 leading-relaxed">{{ selectedCand()?.bio }}</p>
                  </div>
                }
              </div>
            }

            <!-- Education -->
            @if (activeTab() === 'education') {
              <div class="space-y-2">
                <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.candidates.lbl_degree' | translate }}</p>
                <p class="font-bold text-slate-800 text-sm mt-1">{{ selectedCand()?.education || '—' }}</p>
              </div>
            }

            <!-- Experience -->
            @if (activeTab() === 'experience') {
              <div class="space-y-2">
                <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Prior Experience</p>
                <p class="text-slate-700 mt-1 leading-relaxed">{{ selectedCand()?.experienceYears }} Years of experience in {{ selectedCand()?.position }}</p>
              </div>
            }

            <!-- Skills -->
            @if (activeTab() === 'skills') {
              <div class="flex flex-wrap gap-2 mt-2">
                @for (skill of selectedCand()?.skills; track skill) {
                  <span class="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-750 text-[10px] font-bold rounded-full">{{ skill }}</span>
                }
              </div>
            }

            <!-- Languages -->
            @if (activeTab() === 'languages') {
              <div class="space-y-3">
                @for (lang of selectedCand()?.languages; track lang.language) {
                  <div class="flex items-center justify-between py-2 border-b border-slate-50">
                    <span class="font-bold text-slate-800">{{ lang.language }}</span>
                    <span class="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-teal-50 text-teal-700 border border-teal-100">
                      {{ lang.proficiency }}
                    </span>
                  </div>
                }
              </div>
            }

            <!-- Certificates -->
            @if (activeTab() === 'certificates') {
              @if (selectedCand()?.certificates?.length) {
                <div class="space-y-3">
                  @for (cert of selectedCand()?.certificates; track cert.name) {
                    <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span class="text-lg">🏅</span>
                      <div>
                        <p class="font-bold text-slate-800 text-xs">{{ cert.name }}</p>
                        <p class="text-[10px] text-slate-500 font-bold mt-0.5">{{ cert.issuer }} · {{ cert.date }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-slate-400 text-xs">{{ 'hr.candidates.no_cert' | translate }}</p>
              }
            }

            <!-- CV -->
            @if (activeTab() === 'cv') {
              <div class="space-y-3">
                <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{{ 'hr.candidates.lbl_cv' | translate }}</p>
                <!-- PDF Simulator -->
                <div class="h-64 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                  <div class="absolute inset-0 bg-white/95 p-5 flex flex-col justify-between">
                    <div>
                      <p class="font-black text-slate-800 text-sm border-b pb-2">{{ selectedCand()?.fullName }} — Curriculum Vitae</p>
                      <div class="mt-3 space-y-2">
                        <p class="text-xs text-slate-500"><strong class="text-slate-700">Position:</strong> {{ selectedCand()?.position }}</p>
                        <p class="text-xs text-slate-500"><strong class="text-slate-700">Experience:</strong> {{ selectedCand()?.experienceYears }} Years</p>
                        <p class="text-xs text-slate-500"><strong class="text-slate-700">Education:</strong> {{ selectedCand()?.education }}</p>
                        <div class="h-2 w-full bg-slate-100 rounded mt-3"></div>
                        <div class="h-2 w-3/4 bg-slate-100 rounded"></div>
                        <div class="h-2 w-1/2 bg-slate-100 rounded"></div>
                      </div>
                    </div>
                    <p class="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ 'hr.candidates.pdf_sim' | translate }}</p>
                  </div>
                </div>
                @if (selectedCand()?.cvUrl) {
                  <button class="px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                    {{ 'hr.candidates.btn_down_resume' | translate }}
                  </button>
                }
              </div>
            }

            <!-- Portfolio & Links -->
            @if (activeTab() === 'portfolio') {
              <div class="space-y-3">
                @if (selectedCand()?.linkedInUrl) {
                  <div>
                    <p class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">{{ 'hr.candidates.lbl_linkedin' | translate }}</p>
                    <a [href]="selectedCand()?.linkedInUrl" target="_blank" class="text-indigo-650 hover:underline text-xs font-bold mt-1 block">{{ selectedCand()?.linkedInUrl }}</a>
                  </div>
                }
                @if (selectedCand()?.portfolioUrl) {
                  <div>
                    <p class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">{{ 'hr.candidates.lbl_portfolio' | translate }}</p>
                    <a [href]="selectedCand()?.portfolioUrl" target="_blank" class="text-indigo-650 hover:underline text-xs font-bold mt-1 block">{{ selectedCand()?.portfolioUrl }}</a>
                  </div>
                }
              </div>
            }

            <!-- Notes -->
            @if (activeTab() === 'notes') {
              <div class="space-y-4">
                <p class="font-bold text-slate-400 text-[10px] uppercase tracking-wider">{{ 'hr.candidates.lbl_notes' | translate }}</p>
                <div class="space-y-2">
                  @for (note of selectedCand()?.notes; track note) {
                    <div class="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-slate-700">{{ note }}</div>
                  }
                </div>
                <div class="flex gap-2">
                  <input [(ngModel)]="newNote" type="text" [placeholder]="'hr.candidates.lbl_notes' | translate"
                    class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none">
                  <button (click)="addNote()" class="px-4 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all">
                    {{ 'hr.candidates.btn_add_note' | translate }}
                  </button>
                </div>
              </div>
            }

            <!-- Timeline -->
            @if (activeTab() === 'timeline') {
              <div>
                <p class="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-4">{{ 'hr.candidates.lbl_timeline' | translate }}</p>
                <div class="relative pl-5 border-l border-slate-100 space-y-4">
                  @for (evt of selectedCand()?.timeline; track evt.date) {
                    <div class="relative">
                      <span class="absolute -left-[24px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"></span>
                      <p class="font-bold text-slate-800 text-xs">{{ evt.action }}</p>
                      <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ evt.date }} · {{ evt.user }}</p>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Attachments -->
            @if (activeTab() === 'attachments') {
              @if (selectedCand()?.attachments?.length) {
                <div class="space-y-2">
                  @for (att of selectedCand()?.attachments; track att.name) {
                    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">📎</span>
                        <div>
                          <p class="font-bold text-slate-800 text-xs">{{ att.name }}</p>
                          <p class="text-[10px] text-slate-400">{{ att.size }} · {{ att.type }}</p>
                        </div>
                      </div>
                      <button class="text-indigo-650 text-xs font-bold hover:underline">{{ 'hr.common.download' | translate }}</button>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-slate-400 text-xs">{{ 'hr.candidates.no_attach' | translate }}</p>
              }
            }

          </div>
        } @else {
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <p class="text-3xl mb-3">👤</p>
            <p class="text-sm font-bold text-slate-500">Select a candidate from the list to view their dossier</p>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrCandidatesComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly hrService = inject(HrMockService);

  searchQuery = '';
  newNote = '';
  activeTab = signal<string>('personal');
  selectedCand = signal<Candidate | null>(null);

  readonly tabs = [
    { id: 'personal',     label: 'hr.candidates.tab_personal' },
    { id: 'education',    label: 'hr.candidates.tab_education' },
    { id: 'experience',   label: 'hr.candidates.tab_experience' },
    { id: 'skills',       label: 'hr.candidates.tab_skills' },
    { id: 'languages',    label: 'hr.candidates.tab_languages' },
    { id: 'certificates', label: 'hr.candidates.tab_certificates' },
    { id: 'cv',           label: 'hr.candidates.tab_cv' },
    { id: 'portfolio',    label: 'hr.candidates.tab_portfolio' },
    { id: 'notes',        label: 'hr.candidates.tab_notes' },
    { id: 'timeline',     label: 'hr.candidates.tab_timeline' },
    { id: 'attachments',  label: 'hr.candidates.tab_attachments' },
  ] as const;

  readonly filteredCandidates = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    return q
      ? this.hrService.candidates().filter(c =>
          c.fullName.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        )
      : this.hrService.candidates();
  });

  selectCandidate(cand: Candidate) {
    this.selectedCand.set(cand);
    this.activeTab.set('personal');
  }

  overrideHiring() {
    const cand = this.selectedCand();
    if (!cand) return;
    this.hrService.overrideHiring(cand.id);
  }

  addNote() {
    // Notes are view-only in this pass (no signal mutation needed)
    this.newNote = '';
  }

  getStatusClass(status?: Candidate['status']): string {
    switch (status) {
      case 'New':          return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Under Review': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Shortlisted':  return 'bg-teal-50 text-teal-700 border border-teal-100';
      case 'Interviewing': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'Offered':      return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Hired':        return 'bg-green-50 text-green-700 border border-green-100';
      case 'Rejected':     return 'bg-red-50 text-red-700 border border-red-100';
      default:             return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.candidates.title' }
    ]);
    const first = this.hrService.candidates()[0];
    if (first) this.selectedCand.set(first);
  }
}
