import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { OnboardingTask } from '../../../../shared/interfaces/recruitment.interface';

@Component({
  selector: 'app-hr-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.onboarding.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.onboarding.subtitle' | translate }}</p>
      </div>

      <!-- Stats Banner -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl flex-shrink-0">
            📋
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.onboarding.lbl_checklists' | translate }}</p>
            <p class="text-2xl font-black text-slate-850">{{ uniqueCandidates().length }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl flex-shrink-0">
            👥
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.onboarding.lbl_onboarding' | translate }}</p>
            <p class="text-2xl font-black text-slate-850">{{ uniqueCandidates().length }}</p>
          </div>
        </div>
        <div class="flex-1 max-w-xs space-y-2">
          <div class="flex justify-between text-[10px] font-bold text-slate-500">
            <span>{{ 'hr.onboarding.lbl_overall' | translate }}</span>
            <span>{{ overallProgress() }}%</span>
          </div>
          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-indigo-600 rounded-full transition-all" [style.width.%]="overallProgress()"></div>
          </div>
        </div>
      </div>

      <!-- Per-Candidate Sections -->
      @if (uniqueCandidates().length > 0) {
        @for (candId of uniqueCandidates(); track candId) {
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <!-- Candidate Header -->
            <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p class="font-black text-slate-850 text-sm">{{ getCandName(candId) }}</p>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {{ getCompletedCount(candId) }} / {{ getTotalCount(candId) }} tasks completed
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-bold text-slate-500">{{ 'hr.onboarding.lbl_progress' | translate }} {{ getCandProgress(candId) }}%</span>
                <div class="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full bg-indigo-600 rounded-full transition-all" [style.width.%]="getCandProgress(candId)"></div>
                </div>
              </div>
            </div>

            <!-- Tasks Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead>
                  <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                    <th class="px-4 py-2.5">{{ 'hr.onboarding.col_task' | translate }}</th>
                    <th class="px-4 py-2.5">{{ 'hr.onboarding.col_dept' | translate }}</th>
                    <th class="px-4 py-2.5">{{ 'hr.onboarding.col_assignee' | translate }}</th>
                    <th class="px-4 py-2.5">{{ 'hr.onboarding.col_due' | translate }}</th>
                    <th class="px-4 py-2.5 text-center">{{ 'hr.onboarding.col_status' | translate }}</th>
                    <th class="px-4 py-2.5 text-center w-24">{{ 'hr.onboarding.col_action' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 font-semibold text-slate-700">
                  @for (task of getTasksForCand(candId); track task.id) {
                    <tr class="hover:bg-slate-50/40 transition-colors">
                      <td class="px-4 py-2.5 font-bold text-slate-800">{{ task.taskName }}</td>
                      <td class="px-4 py-2.5 text-slate-500">{{ task.assignedDepartment }}</td>
                      <td class="px-4 py-2.5 text-slate-500">{{ task.assignedTo }}</td>
                      <td class="px-4 py-2.5 text-slate-400 font-mono">{{ task.dueDate }}</td>
                      <td class="px-4 py-2.5 text-center">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase"
                          [class]="getTaskStatusClass(task.status)">
                          {{ task.status }}
                        </span>
                      </td>
                      <td class="px-4 py-2.5 text-center">
                        @if (task.status !== 'Completed') {
                          <button (click)="openCompleteModal(task)"
                            class="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all">
                            {{ 'hr.onboarding.btn_complete' | translate }}
                          </button>
                        } @else {
                          <span class="text-green-600 font-bold">✔</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      } @else {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p class="text-4xl mb-3">📋</p>
          <p class="text-sm font-bold text-slate-500">{{ 'hr.onboarding.lbl_no_onb' | translate }}</p>
        </div>
      }

      <!-- Complete Task Modal -->
      @if (showCompleteModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="text-sm font-black text-slate-800">{{ 'hr.onboarding.modal_title' | translate }}</h3>
              <button (click)="closeCompleteModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <div class="space-y-3 text-xs">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p class="font-bold text-slate-700">{{ selectedTask()?.taskName }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">{{ selectedTask()?.assignedDepartment }} · {{ selectedTask()?.assignedTo }}</p>
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.onboarding.lbl_notes' | translate }}</label>
                <textarea [(ngModel)]="completionNote" rows="3"
                  class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 resize-none text-xs"></textarea>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2 border-t">
              <button (click)="closeCompleteModal()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
              <button (click)="submitComplete()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.onboarding.btn_complete' | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrOnboardingComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hrService = inject(HrMockService);

  showCompleteModal = signal(false);
  selectedTask = signal<OnboardingTask | null>(null);
  completionNote = '';

  readonly uniqueCandidates = computed(() => {
    const ids = this.hrService.onboardingTasks().map(t => t.candidateId);
    return [...new Set(ids)];
  });

  readonly overallProgress = computed(() => {
    const tasks = this.hrService.onboardingTasks();
    if (!tasks.length) return 0;
    const done = tasks.filter(t => t.status === 'Completed').length;
    return Math.round((done / tasks.length) * 100);
  });

  getTasksForCand(candId: string): OnboardingTask[] {
    return this.hrService.onboardingTasks().filter(t => t.candidateId === candId);
  }

  getCandName(candId: string): string {
    return this.hrService.onboardingTasks().find(t => t.candidateId === candId)?.candidateName ?? candId;
  }

  getCompletedCount(candId: string): number {
    return this.getTasksForCand(candId).filter(t => t.status === 'Completed').length;
  }

  getTotalCount(candId: string): number {
    return this.getTasksForCand(candId).length;
  }

  getCandProgress(candId: string): number {
    const tasks = this.getTasksForCand(candId);
    if (!tasks.length) return 0;
    return Math.round((this.getCompletedCount(candId) / tasks.length) * 100);
  }

  openCompleteModal(task: OnboardingTask) {
    this.selectedTask.set(task);
    this.completionNote = '';
    this.showCompleteModal.set(true);
  }

  closeCompleteModal() { this.showCompleteModal.set(false); }

  submitComplete() {
    const task = this.selectedTask();
    if (!task || !this.completionNote.trim()) return;
    this.hrService.updateOnboardingTask(task.id, 'Completed', this.completionNote);
    this.closeCompleteModal();
  }

  getTaskStatusClass(status: OnboardingTask['status']): string {
    switch (status) {
      case 'Not Started': return 'bg-slate-50 text-slate-500 border border-slate-200';
      case 'In Progress': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Completed':   return 'bg-green-50 text-green-700 border border-green-100';
      default:            return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.onboarding.title' }
    ]);
  }
}
