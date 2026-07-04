import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { Interview } from '../../../../shared/interfaces/interview.interface';

@Component({
  selector: 'app-hr-interviews',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.interviews.title' | translate }}</h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.interviews.subtitle' | translate }}</p>
        </div>
        <button (click)="openScheduleModal()"
          class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-sm self-start md:self-auto">
          ➕ {{ 'hr.interviews.btn_schedule' | translate }}
        </button>
      </div>

      <!-- Grid: Interviews Table + Stage Tracker -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Interview Cards (2/3) -->
        <div class="lg:col-span-2 space-y-4">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{{ 'hr.interviews.col_slots' | translate }}</h3>

          @for (int of hrService.interviews(); track int.id) {
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border"
                      [class]="getStageClass(int.stage)">
                      {{ 'hr.interviews.lbl_stage' | translate }} {{ int.stage }}
                    </span>
                    <span class="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
                      [class]="getStatusClass(int.status)">
                      {{ int.status }}
                    </span>
                  </div>
                  <p class="font-black text-slate-800 text-sm mt-2">{{ int.candidateName }}</p>
                  <p class="text-xs text-slate-500 font-semibold mt-0.5">{{ int.type }} Interview</p>
                </div>
                @if (int.status === 'Scheduled') {
                  <button (click)="openEvalModal(int)"
                    class="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all">
                    {{ 'hr.interviews.btn_evaluate' | translate }}
                  </button>
                }
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.interviews.lbl_interviewer' | translate }}</p>
                  <p class="font-bold text-slate-700 mt-0.5">{{ int.interviewer }}</p>
                </div>
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.interviews.lbl_date' | translate }}</p>
                  <p class="font-bold text-slate-700 mt-0.5 font-mono">{{ int.scheduledDate }}</p>
                </div>
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.interviews.lbl_time' | translate }}</p>
                  <p class="font-bold text-slate-700 mt-0.5">{{ int.startTime }} – {{ int.endTime }}</p>
                </div>
                <div>
                  <p class="font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.interviews.lbl_loc' | translate }}</p>
                  <p class="font-bold text-slate-700 mt-0.5 truncate">{{ int.location || '—' }}</p>
                </div>
              </div>

              @if (int.status === 'Completed') {
                <div class="flex items-center gap-2 pt-2 border-t border-slate-50">
                  <span class="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
                    [class]="getEvalClass(int.evaluation)">{{ int.evaluation }}</span>
                  @if (int.rating) {
                    <span class="text-[10px] text-slate-500 font-bold">Rating: {{ int.rating }}/5</span>
                  }
                  @if (int.notes) {
                    <span class="text-[10px] text-slate-400 italic truncate max-w-xs">{{ int.notes }}</span>
                  }
                </div>
              }
            </div>
          } @empty {
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <p class="text-3xl mb-3">🗓️</p>
              <p class="text-sm font-bold text-slate-500">{{ 'hr.common.no_records' | translate }}</p>
            </div>
          }
        </div>

        <!-- Stage Tracker Sidebar (1/3) -->
        <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 self-start">
          <div>
            <h3 class="text-xs font-bold text-slate-800">{{ 'hr.interviews.lbl_tracker' | translate }}</h3>
            <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ 'hr.interviews.lbl_tracker_subtitle' | translate }}</p>
          </div>
          <div class="space-y-3">
            @for (stage of stages; track stage.no) {
              <div class="flex items-start gap-3 p-3 rounded-xl"
                [class.bg-indigo-50]="isStageCompleted(stage.no)"
                [class.border-indigo-100]="isStageCompleted(stage.no)"
                [class.border]="isStageCompleted(stage.no)"
                [class.bg-slate-50]="!isStageCompleted(stage.no)">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  [class.bg-indigo-600]="isStageCompleted(stage.no)"
                  [class.text-white]="isStageCompleted(stage.no)"
                  [class.bg-slate-200]="!isStageCompleted(stage.no)"
                  [class.text-slate-500]="!isStageCompleted(stage.no)">
                  {{ isStageCompleted(stage.no) ? '✓' : stage.no }}
                </div>
                <div>
                  <p class="text-[10px] font-black text-slate-800">{{ stage.type }}</p>
                  <p class="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{{ stage.desc | translate }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Schedule Modal -->
      @if (showScheduleModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="text-sm font-black text-slate-800">{{ 'hr.interviews.modal_title' | translate }}</h3>
              <button (click)="closeScheduleModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="sm:col-span-2">
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_candidate' | translate }}</label>
                <select [(ngModel)]="schedForm.candidateId" class="w-full mt-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  @for (c of hrService.candidates(); track c.id) {
                    <option [value]="c.id">{{ c.fullName }} — {{ c.position }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_stage' | translate }}</label>
                <select [(ngModel)]="schedForm.stage" class="w-full mt-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  <option [value]="1">Stage 1 — HR Screening</option>
                  <option [value]="2">Stage 2 — Technical</option>
                  <option [value]="3">Stage 3 — Panel</option>
                  <option [value]="4">Stage 4 — Management</option>
                  <option [value]="5">Stage 5 — Final</option>
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_type' | translate }}</label>
                <select [(ngModel)]="schedForm.type" class="w-full mt-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="HR">HR</option>
                  <option value="Technical">Technical</option>
                  <option value="Panel">Panel</option>
                  <option value="Management">Management</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_interviewer' | translate }}</label>
                <input [(ngModel)]="schedForm.interviewer" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_date' | translate }}</label>
                <input [(ngModel)]="schedForm.date" type="date" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_time' | translate }}</label>
                <div class="flex gap-2 mt-1">
                  <input [(ngModel)]="schedForm.start" type="time" class="flex-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  <input [(ngModel)]="schedForm.end" type="time" class="flex-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                </div>
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_loc' | translate }}</label>
                <input [(ngModel)]="schedForm.location" type="text" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_link' | translate }}</label>
                <input [(ngModel)]="schedForm.link" type="text" placeholder="https://meet.google.com/..." class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t">
              <button (click)="closeScheduleModal()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
              <button (click)="submitSchedule()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.common.submit' | translate }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Evaluate Modal -->
      @if (showEvalModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="text-sm font-black text-slate-800">{{ 'hr.interviews.btn_evaluate' | translate }}: {{ selectedInt()?.candidateName }}</h3>
              <button (click)="closeEvalModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_decision' | translate }}</label>
                <select [(ngModel)]="evalForm.evaluation" class="w-full mt-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Above Expectations">Above Expectations</option>
                  <option value="Below Expectations">Below Expectations</option>
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_score' | translate }}</label>
                <input [(ngModel)]="evalForm.score" type="number" min="1" max="5"
                  class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.interviews.lbl_notes' | translate }}</label>
                <textarea [(ngModel)]="evalForm.note" rows="3"
                  class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 resize-none"></textarea>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t">
              <button (click)="closeEvalModal()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
              <button (click)="submitEval()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.common.submit' | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrInterviewsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hrService = inject(HrMockService);

  showScheduleModal = signal(false);
  showEvalModal = signal(false);
  selectedInt = signal<Interview | null>(null);

  schedForm = this.emptySchedForm();
  evalForm = { evaluation: 'Accepted' as Interview['evaluation'], score: 4, note: '' };

  readonly stages = [
    { no: 1, type: 'HR Screening',     desc: 'hr.interviews.stage_hr'    },
    { no: 2, type: 'Technical Test',   desc: 'hr.interviews.stage_tech'  },
    { no: 3, type: 'Panel Interview',  desc: 'hr.interviews.stage_panel' },
    { no: 4, type: 'Management Round', desc: 'hr.interviews.stage_mgmt'  },
    { no: 5, type: 'Final Review',     desc: 'hr.interviews.stage_final' },
  ];

  isStageCompleted(stageNo: number): boolean {
    return this.hrService.interviews().some(i => i.stage === stageNo && i.status === 'Completed');
  }

  openScheduleModal() {
    this.schedForm = this.emptySchedForm();
    this.showScheduleModal.set(true);
  }
  closeScheduleModal() { this.showScheduleModal.set(false); }

  submitSchedule() {
    const f = this.schedForm;
    if (!f.candidateId || !f.date || !f.start || !f.end) return;
    const ok = this.hrService.scheduleInterview(
      f.candidateId, f.stage, f.type, f.interviewer, f.date, f.start, f.end, f.location, f.link
    );
    if (ok) this.closeScheduleModal();
  }

  openEvalModal(int: Interview) {
    this.selectedInt.set(int);
    this.evalForm = { evaluation: 'Accepted', score: 4, note: '' };
    this.showEvalModal.set(true);
  }
  closeEvalModal() { this.showEvalModal.set(false); }

  submitEval() {
    const int = this.selectedInt();
    if (!int || !this.evalForm.note.trim()) return;
    this.hrService.evaluateInterview(int.id, this.evalForm.evaluation, this.evalForm.score, this.evalForm.note);
    this.closeEvalModal();
  }

  getStatusClass(status: Interview['status']): string {
    switch (status) {
      case 'Scheduled':  return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Completed':  return 'bg-green-50 text-green-700 border border-green-100';
      case 'Cancelled':  return 'bg-red-50 text-red-700 border border-red-100';
      default:           return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  }

  getStageClass(stage: number): string {
    const classes = ['', 'bg-violet-50 text-violet-700 border-violet-100', 'bg-blue-50 text-blue-700 border-blue-100',
      'bg-indigo-50 text-indigo-700 border-indigo-100', 'bg-amber-50 text-amber-700 border-amber-100', 'bg-green-50 text-green-700 border-green-100'];
    return classes[stage] ?? 'bg-slate-50 text-slate-600 border-slate-100';
  }

  getEvalClass(eval_?: string): string {
    switch (eval_) {
      case 'Accepted':           return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Above Expectations': return 'bg-green-50 text-green-700 border border-green-100';
      case 'Rejected':           return 'bg-red-50 text-red-700 border border-red-100';
      case 'Below Expectations': return 'bg-amber-50 text-amber-700 border border-amber-100';
      default:                   return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  }

  emptySchedForm() {
    const first = this.hrService?.candidates()[0];
    return {
      candidateId: first?.id ?? '',
      stage: 1 as 1|2|3|4|5,
      type: 'HR' as Interview['type'],
      interviewer: '',
      date: '',
      start: '09:00',
      end: '10:00',
      location: '',
      link: ''
    };
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.interviews.title' }
    ]);
  }
}
