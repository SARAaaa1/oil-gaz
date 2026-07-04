import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

interface PreviewRecord {
  row: number;
  empNumber: string;
  date: string;
  time: string;
  status: 'Valid' | 'Invalid' | 'Duplicate' | 'Unknown Employee';
  error?: string;
}

@Component({
  selector: 'app-hr-attendance-import',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.att.import.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.att.import.subtitle' | translate }}</p>
      </div>
      @if (importStep() !== 'idle') {
        <button (click)="resetImport()" class="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold">🔄 {{ 'hr.att.import.btn_reset' | translate }}</button>
      }
    </div>

    <!-- Upload Zone -->
    @if (importStep() === 'idle') {
      <div class="bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/40 transition-colors p-12 text-center cursor-pointer group" (click)="fileInput.click()">
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-100 flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform">
          <span class="text-4xl">📤</span>
        </div>
        <h3 class="font-black text-slate-700 text-base mb-2">{{ 'hr.att.import.zone_title' | translate }}</h3>
        <p class="text-xs text-slate-400 font-semibold mb-4">{{ 'hr.att.import.zone_desc' | translate }}</p>
        <div class="flex justify-center gap-2 mb-6">
          <span class="text-[10px] font-black bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">XLS</span>
          <span class="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">XLSX</span>
        </div>
        <button class="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm transition-all">
          📁 {{ 'hr.att.import.btn_browse' | translate }}
        </button>
        <input #fileInput type="file" accept=".xls,.xlsx" class="hidden" (change)="onFileSelected($event)">
      </div>
    }

    <!-- Preview -->
    @if (importStep() === 'preview') {
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-black text-slate-800 text-sm">{{ 'hr.att.import.preview_title' | translate }}</h3>
            <p class="text-[10px] font-semibold text-slate-400 mt-0.5">📄 {{ fileName() }}</p>
          </div>
          <button (click)="simulateImport()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">
            ✓ {{ 'hr.att.import.btn_validate' | translate }}
          </button>
        </div>

        <!-- Summary Bar -->
        <div class="grid grid-cols-5 divide-x divide-slate-100 border-b border-slate-100">
          <div class="p-4 text-center"><p class="text-2xl font-black text-slate-700">{{ previewRecords().length }}</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{{ 'hr.att.import.stat_total' | translate }}</p></div>
          <div class="p-4 text-center"><p class="text-2xl font-black text-green-600">{{ validCount() }}</p><p class="text-[10px] font-bold text-green-700 uppercase mt-0.5">{{ 'hr.att.import.stat_valid' | translate }}</p></div>
          <div class="p-4 text-center"><p class="text-2xl font-black text-red-600">{{ invalidCount() }}</p><p class="text-[10px] font-bold text-red-700 uppercase mt-0.5">{{ 'hr.att.import.stat_invalid' | translate }}</p></div>
          <div class="p-4 text-center"><p class="text-2xl font-black text-amber-600">{{ dupCount() }}</p><p class="text-[10px] font-bold text-amber-700 uppercase mt-0.5">{{ 'hr.att.import.stat_duplicate' | translate }}</p></div>
          <div class="p-4 text-center"><p class="text-2xl font-black text-slate-500">{{ unknownCount() }}</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{{ 'hr.att.import.stat_unknown' | translate }}</p></div>
        </div>

        <!-- Color Progress Bar -->
        <div class="h-2 flex overflow-hidden mx-5 my-3 rounded-full">
          <div class="bg-green-400 transition-all" [style.width]="(validCount()/previewRecords().length*100)+'%'"></div>
          <div class="bg-red-400 transition-all" [style.width]="(invalidCount()/previewRecords().length*100)+'%'"></div>
          <div class="bg-amber-400 transition-all" [style.width]="(dupCount()/previewRecords().length*100)+'%'"></div>
          <div class="bg-slate-300 transition-all" [style.width]="(unknownCount()/previewRecords().length*100)+'%'"></div>
        </div>

        <!-- Preview Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.col_row' | translate }}</th>
                <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.col_emp' | translate }}</th>
                <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.col_date' | translate }}</th>
                <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.col_time' | translate }}</th>
                <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.col_status' | translate }}</th>
                <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.col_error' | translate }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (rec of previewRecords(); track rec.row) {
                <tr [class]="rec.status !== 'Valid' ? 'bg-red-50/30' : 'hover:bg-slate-50/50'" class="transition-colors">
                  <td class="px-4 py-2.5 font-bold text-slate-500 text-[10px]">#{{ rec.row }}</td>
                  <td class="px-4 py-2.5 font-bold text-slate-800">{{ rec.empNumber }}</td>
                  <td class="px-4 py-2.5 text-slate-600">{{ rec.date }}</td>
                  <td class="px-4 py-2.5 font-semibold text-slate-700">{{ rec.time }}</td>
                  <td class="px-4 py-2.5 text-center"><span [class]="previewBadge(rec.status)" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">{{ rec.status }}</span></td>
                  <td class="px-4 py-2.5 text-[10px] text-red-600 font-semibold">{{ rec.error || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Importing Progress -->
    @if (importStep() === 'importing') {
      <div class="bg-white rounded-2xl border border-primary/20 shadow-sm p-10 text-center">
        <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">⚙️</span>
        </div>
        <h3 class="font-black text-slate-800 text-base mb-4">{{ 'hr.att.import.progress_title' | translate }}</h3>
        <div class="max-w-sm mx-auto">
          <div class="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div class="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-300" [style.width]="importProgress() + '%'"></div>
          </div>
          <p class="text-sm font-black text-primary">{{ importProgress() }}%</p>
        </div>
      </div>
    }

    <!-- Import Result -->
    @if (importStep() === 'done') {
      <div class="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
        <div class="p-5 bg-green-50 border-b border-green-100 flex items-center gap-3">
          <span class="text-2xl">✅</span>
          <div><h3 class="font-black text-green-800">{{ 'hr.att.import.result_title' | translate }}</h3><p class="text-[11px] text-green-600 font-semibold">{{ fileName() }}</p></div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
          <div class="p-5 text-center"><p class="text-3xl font-black text-green-600">{{ validCount() }}</p><p class="text-[10px] font-bold text-green-700 uppercase mt-1">{{ 'hr.att.import.result_success' | translate }}</p></div>
          <div class="p-5 text-center"><p class="text-3xl font-black text-red-600">{{ invalidCount() }}</p><p class="text-[10px] font-bold text-red-700 uppercase mt-1">{{ 'hr.att.import.result_failed' | translate }}</p></div>
          <div class="p-5 text-center"><p class="text-3xl font-black text-amber-600">{{ dupCount() }}</p><p class="text-[10px] font-bold text-amber-700 uppercase mt-1">{{ 'hr.att.import.result_duplicate' | translate }}</p></div>
          <div class="p-5 text-center"><p class="text-3xl font-black text-slate-500">{{ unknownCount() }}</p><p class="text-[10px] font-bold text-slate-400 uppercase mt-1">{{ 'hr.att.import.result_unknown' | translate }}</p></div>
        </div>
        <div class="p-5 flex justify-center">
          <button (click)="resetImport()" class="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">{{ 'hr.att.import.btn_new' | translate }}</button>
        </div>
      </div>
    }

    <!-- Import History -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h3 class="font-black text-slate-800 text-sm">{{ 'hr.att.import.history_title' | translate }}</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.col_file' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.col_import_date' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.stat_total' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.stat_valid' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.stat_invalid' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.stat_duplicate' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.att.import.col_success_rate' | translate }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (h of hr.importHistory(); track h.fileName) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 font-bold text-slate-700 flex items-center gap-2">
                  <span class="text-base">📊</span>{{ h.fileName }}
                </td>
                <td class="px-4 py-3 text-slate-500">{{ h.importDate }}</td>
                <td class="px-4 py-3 text-center font-black text-slate-700">{{ h.totalRecords }}</td>
                <td class="px-4 py-3 text-center font-black text-green-600">{{ h.successRecords }}</td>
                <td class="px-4 py-3 text-center font-black text-red-600">{{ h.failedRecords }}</td>
                <td class="px-4 py-3 text-center font-black text-amber-600">{{ h.duplicateRecords }}</td>
                <td class="px-4 py-3 text-center">
                  <span [class]="rateColor(h.successRecords / h.totalRecords * 100)" class="font-black text-sm">{{ (h.successRecords / h.totalRecords * 100) | number:'1.0-0' }}%</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `
})
export class HrAttendanceImportComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  importStep = signal<'idle' | 'preview' | 'importing' | 'done'>('idle');
  fileName = signal('');
  importProgress = signal(0);
  previewRecords = signal<PreviewRecord[]>([]);

  readonly validCount = computed(() => this.previewRecords().filter(r => r.status === 'Valid').length);
  readonly invalidCount = computed(() => this.previewRecords().filter(r => r.status === 'Invalid').length);
  readonly dupCount = computed(() => this.previewRecords().filter(r => r.status === 'Duplicate').length);
  readonly unknownCount = computed(() => this.previewRecords().filter(r => r.status === 'Unknown Employee').length);

  readonly employees = ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008', 'EMP-099'];
  readonly fakeDates = ['2026-07-03', '2026-07-02', '2026-07-01'];
  readonly fakeTimes = ['08:00', '08:05', '17:00', '17:02', '06:00', '18:01', '20:00', '08:00'];

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fileName.set(file.name);

    // Simulate generating preview records
    const records: PreviewRecord[] = Array.from({ length: 12 }, (_, i) => {
      const statuses: PreviewRecord['status'][] = ['Valid', 'Valid', 'Valid', 'Valid', 'Valid', 'Valid', 'Valid', 'Invalid', 'Duplicate', 'Duplicate', 'Unknown Employee', 'Valid'];
      const status = statuses[i] || 'Valid';
      const errors: Record<string, string> = { 'Invalid': 'Invalid time format in column D', 'Duplicate': 'Record already exists for this date', 'Unknown Employee': 'Employee EMP-099 not found in system' };
      return {
        row: i + 1,
        empNumber: i === 10 ? 'EMP-099' : this.employees[i % 8],
        date: this.fakeDates[i % 3],
        time: this.fakeTimes[i % 8],
        status,
        error: errors[status]
      };
    });
    this.previewRecords.set(records);
    this.importStep.set('preview');
  }

  simulateImport() {
    this.importStep.set('importing');
    this.importProgress.set(0);
    const interval = setInterval(() => {
      const current = this.importProgress();
      if (current >= 100) {
        clearInterval(interval);
        this.hr.importHistory.update(list => [{
          fileName: this.fileName(),
          importDate: new Date().toISOString().split('T')[0],
          totalRecords: this.previewRecords().length,
          successRecords: this.validCount(),
          failedRecords: this.invalidCount(),
          duplicateRecords: this.dupCount(),
          unknownEmployees: this.unknownCount(),
          records: []
        }, ...list]);
        this.importStep.set('done');
      } else {
        this.importProgress.set(Math.min(100, current + Math.floor(Math.random() * 15) + 5));
      }
    }, 200);
  }

  resetImport() {
    this.importStep.set('idle');
    this.fileName.set('');
    this.importProgress.set(0);
    this.previewRecords.set([]);
  }

  previewBadge(status: string): string {
    return { 'Valid': 'bg-green-50 text-green-700 border-green-100', 'Invalid': 'bg-red-50 text-red-700 border-red-100', 'Duplicate': 'bg-amber-50 text-amber-700 border-amber-100', 'Unknown Employee': 'bg-slate-100 text-slate-500 border-slate-200' }[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  }

  rateColor(rate: number): string {
    return rate >= 90 ? 'text-green-600' : rate >= 75 ? 'text-amber-600' : 'text-red-600';
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([{ label: 'navigation.hr' }, { label: 'hr.att.import.title' }]);
  }
}
