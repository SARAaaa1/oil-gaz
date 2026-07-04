import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-training',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.ent_training_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">Manage corporate training courses, schedules, and certifications</p>
      </div>
      <button (click)="openCreateModal()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">
        + Create Course
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-slate-700">{{ courses().length }}</p>
        <p class="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Courses</p>
      </div>
      <div class="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-blue-600">{{ activeSessions() }}</p>
        <p class="text-[10px] font-bold text-blue-700 uppercase mt-1">Active Sessions</p>
      </div>
      <div class="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-green-600">8</p>
        <p class="text-[10px] font-bold text-green-700 uppercase mt-1">Certificates Issued</p>
      </div>
      <div class="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-black text-indigo-600">SAR 150K</p>
        <p class="text-[10px] font-bold text-indigo-700 uppercase mt-1">YTD Budget Used</p>
      </div>
    </div>

    <!-- Active Courses & Sessions Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Left: Courses List -->
      <div class="lg:col-span-2 space-y-4">
        <h3 class="font-black text-slate-800 text-xs tracking-wide uppercase">📚 Available Courses</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (c of courses(); track c.id) {
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-650 border border-slate-200 font-bold text-[9px]">{{ c.category }}</span>
                  <span class="text-[10px] font-black text-primary">{{ c.duration }}</span>
                </div>
                <h4 class="font-black text-slate-850 text-sm leading-snug">{{ c.title }}</h4>
                <p class="text-[11px] text-slate-400 font-semibold leading-relaxed">{{ c.description }}</p>
              </div>

              <div class="pt-2 border-t border-slate-50 flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400">Budget: SAR {{ c.cost | number }}</span>
                <button (click)="enrollEmployee(c)" class="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg text-[10px] font-bold">Enroll</button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Right: Active Sessions Timeline -->
      <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 h-fit">
        <h3 class="font-black text-slate-800 text-xs tracking-wide uppercase">⏱️ Active Sessions</h3>
        <div class="space-y-4">
          @for (s of sessions(); track s.id) {
            <div class="relative pl-5 border-l-2 border-primary/20 space-y-1">
              <!-- Bullet dot -->
              <span class="absolute left-0 top-1.5 -translate-x-[5px] w-2 h-2 rounded-full bg-primary ring-4 ring-primary/10"></span>
              <h4 class="font-black text-slate-800 text-xs leading-snug">{{ s.courseTitle }}</h4>
              <p class="text-[10px] text-slate-400 font-semibold">Instructor: {{ s.instructor }}</p>
              <div class="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-1">
                <span>Date: {{ s.date }}</span>
                <span class="text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-150">{{ s.enrolled }} Enrolled</span>
              </div>
            </div>
          }
        </div>
      </div>

    </div>

    <!-- Create Course Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4" (click)="showModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md my-16" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <h3 class="font-black text-slate-800 text-sm">Create Training Course</h3>
            <button (click)="showModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-4 text-xs">
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">Course Title</label>
              <input [(ngModel)]="form.title" type="text" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" placeholder="e.g. Advanced Drilling Hydraulics">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">Description</label>
              <input [(ngModel)]="form.description" type="text" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" placeholder="Course outline summary...">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Duration</label>
                <input [(ngModel)]="form.duration" type="text" class="w-full mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" placeholder="e.g. 3 Days">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Cost (SAR)</label>
                <input [(ngModel)]="form.cost" type="number" class="w-full mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" placeholder="e.g. 5000">
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-2xl">
            <button (click)="showModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">Cancel</button>
            <button (click)="submitCourse()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">Create</button>
          </div>
        </div>
      </div>
    }

  </div>
  `
})
export class HrTrainingComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  showModal = signal(false);
  form: any = {};

  readonly courses = signal([
    { id: 'c-1', title: 'HSE Rig Safety Operations', category: 'Safety', duration: '5 Days', cost: 12000, description: 'Mandatory offshore rig safety procedures and compliance training.' },
    { id: 'c-2', title: 'Advanced Drilling Engineering', category: 'Technical', duration: '2 Weeks', cost: 25000, description: 'Techniques for horizontal and multilateral drilling.' },
    { id: 'c-3', title: 'General Management Core', category: 'Leadership', duration: '3 Days', cost: 8000, description: 'People management and budget forecasting for supervisors.' }
  ]);

  readonly sessions = signal([
    { id: 's-1', courseTitle: 'HSE Rig Safety Operations', instructor: 'Omar Al-Ghamdi', date: '2026-07-10', enrolled: 12 },
    { id: 's-2', courseTitle: 'Advanced Drilling Engineering', instructor: 'Dr. Ahmad Smith', date: '2026-07-15', enrolled: 6 }
  ]);

  readonly activeSessions = computed(() => this.sessions().length);

  openCreateModal() {
    this.form = { title: '', description: '', duration: '', cost: 1000, category: 'Technical' };
    this.showModal.set(true);
  }

  submitCourse() {
    this.courses.update(list => [...list, { id: `c-${Date.now()}`, ...this.form }]);
    this.hr.notify.success('hr.common.success', 'Training course created successfully.');
    this.showModal.set(false);
  }

  enrollEmployee(course: any) {
    this.hr.notify.success('hr.common.success', `Employee Ahmad Al-Dosari successfully enrolled in "${course.title}".`);
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'navigation.hr_training' }
    ]);
  }
}
