import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { EmployeeDocument } from '../../../../shared/interfaces/employee.interface';

@Component({
  selector: 'app-hr-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.documents.title' | translate }}</h1>
          <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.documents.subtitle' | translate }}</p>
        </div>
        <button (click)="openUploadModal()"
          class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-sm self-start md:self-auto">
          ➕ {{ 'hr.documents.btn_upload' | translate }}
        </button>
      </div>

      <!-- Expiration Alert Banner -->
      @if (expiredDocs().length > 0 || expiringDocs().length > 0) {
        <div class="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          <p class="text-red-700 text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{{ 'hr.documents.lbl_alert' | translate }}</span>
          </p>
          <ul class="list-disc ps-5 space-y-1 text-xs">
            @for (doc of expiredDocs(); track doc.id) {
              <li>
                <strong class="text-red-700">{{ 'hr.documents.lbl_expired' | translate }}</strong>
                <span class="text-slate-700"> {{ doc.name }} ({{ doc.category }}) — {{ doc.expirationDate }}</span>
              </li>
            }
            @for (doc of expiringDocs(); track doc.id) {
              <li>
                <strong class="text-amber-700">{{ 'hr.documents.lbl_expiring' | translate }}</strong>
                <span class="text-slate-700"> {{ doc.name }} ({{ doc.category }}) — {{ doc.expirationDate }}</span>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Employee Picker + Categories + Files Grid -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-center gap-3">
        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          {{ 'hr.documents.lbl_selected_emp' | translate }}
        </label>
        <select [(ngModel)]="selectedEmpId"
          class="w-full sm:max-w-sm px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
          @for (emp of hrService.employees(); track emp.id) {
            <option [value]="emp.id">{{ emp.fullName }} ({{ emp.employeeCode }})</option>
          }
        </select>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Category Folders Sidebar -->
        <div class="md:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 self-start">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.documents.lbl_categories' | translate }}</p>
          <div class="space-y-1">
            @for (cat of categories; track cat) {
              <button (click)="selectedCategory.set(cat)"
                class="w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between"
                [class.bg-indigo-50]="selectedCategory() === cat"
                [class.text-indigo-700]="selectedCategory() === cat"
                [class.text-slate-600]="selectedCategory() !== cat"
                [class.hover:bg-slate-50]="selectedCategory() !== cat">
                <span>📁 {{ cat }}</span>
                <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold">
                  {{ getDocCountForCategory(cat) }}
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Files List -->
        <div class="md:col-span-2 space-y-4">
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between">
            <p class="text-xs font-bold text-slate-700">
              {{ 'hr.documents.lbl_files' | translate }} <strong>{{ selectedCategory() }}</strong>
            </p>
            <span class="text-[10px] text-slate-400 font-bold">{{ filteredDocs().length }} file(s)</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (doc of filteredDocs(); track doc.id) {
              <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between gap-4">
                <div class="space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <p class="font-bold text-slate-800 text-xs leading-snug">📄 {{ doc.name }}</p>
                    <span class="text-[9px] font-bold font-mono text-slate-400 flex-shrink-0">{{ doc.fileSize }}</span>
                  </div>
                  <div class="text-[10px] text-slate-500 font-bold space-y-0.5">
                    <p>{{ 'hr.documents.lbl_uploaded' | translate }} <span class="font-mono text-slate-700">{{ doc.uploadDate }}</span></p>
                    @if (doc.expirationDate) {
                      <p>{{ 'hr.documents.lbl_expires' | translate }}
                        <span class="font-mono"
                          [class.text-red-600]="doc.status === 'Expired'"
                          [class.text-amber-600]="doc.status === 'Expiring'"
                          [class.text-slate-700]="doc.status === 'Active'">
                          {{ doc.expirationDate }}
                        </span>
                      </p>
                    }
                  </div>
                  @if (doc.status === 'Expired' || doc.status === 'Expiring') {
                    <span class="inline-block px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase"
                      [class.bg-red-50]="doc.status === 'Expired'"
                      [class.text-red-700]="doc.status === 'Expired'"
                      [class.border-red-100]="doc.status === 'Expired'"
                      [class.bg-amber-50]="doc.status === 'Expiring'"
                      [class.text-amber-700]="doc.status === 'Expiring'"
                      [class.border-amber-100]="doc.status === 'Expiring'"
                      class="border">
                      {{ doc.status }}
                    </span>
                  }
                </div>
                <div class="flex items-center gap-2 pt-3 border-t border-slate-50">
                  <button (click)="previewDoc(doc)"
                    class="flex-1 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold transition-all">
                    {{ 'hr.documents.btn_preview' | translate }}
                  </button>
                  <button (click)="downloadDoc(doc)"
                    class="flex-1 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all">
                    {{ 'hr.documents.btn_download' | translate }}
                  </button>
                </div>
              </div>
            } @empty {
              <div class="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                <p class="text-3xl mb-2">📂</p>
                <p class="text-sm font-bold text-slate-400">{{ 'hr.documents.lbl_no_docs' | translate }}</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      @if (showUploadModal()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="text-sm font-black text-slate-800">{{ 'hr.documents.modal_title' | translate }}</h3>
              <button (click)="closeUploadModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.documents.lbl_doc_name' | translate }}</label>
                <input [(ngModel)]="uploadForm.name" type="text"
                  placeholder="e.g. Passport Copy"
                  class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.documents.lbl_category' | translate }}</label>
                <select [(ngModel)]="uploadForm.category"
                  class="w-full mt-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="font-bold text-slate-500">{{ 'hr.documents.lbl_expiration' | translate }}</label>
                <input [(ngModel)]="uploadForm.expirationDate" type="date"
                  class="w-full mt-1 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500">
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2 border-t">
              <button (click)="closeUploadModal()" class="px-4 py-2 border border-slate-200 rounded-xl text-text-primary hover:bg-bg-secondary text-xs font-bold transition-all">{{ 'hr.common.cancel' | translate }}</button>
              <button (click)="submitUpload()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.documents.btn_upload_action' | translate }}</button>
            </div>
          </div>
        </div>
      }

      <!-- Preview Modal -->
      @if (showPreviewModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="text-sm font-black text-slate-800">
                {{ 'hr.documents.lbl_preview_title' | translate }} {{ previewedDoc()?.name }}
              </h3>
              <button (click)="closePreviewModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <div class="h-72 rounded-xl border border-slate-200 bg-slate-50 relative overflow-hidden">
              <div class="absolute inset-0 bg-white/95 p-5 flex flex-col justify-between">
                <div class="space-y-3">
                  <p class="font-black text-slate-800 text-sm border-b pb-2">PETROFLOW DOCUMENT REPOSITORY</p>
                  <div class="grid grid-cols-2 gap-3 text-xs mt-2">
                    <div>
                      <p class="text-slate-400 font-bold">Category</p>
                      <p class="text-slate-800 font-bold mt-0.5">{{ previewedDoc()?.category }}</p>
                    </div>
                    <div>
                      <p class="text-slate-400 font-bold">File Size</p>
                      <p class="text-slate-800 font-bold mt-0.5">{{ previewedDoc()?.fileSize }}</p>
                    </div>
                    <div>
                      <p class="text-slate-400 font-bold">Uploaded</p>
                      <p class="text-slate-800 font-bold mt-0.5 font-mono">{{ previewedDoc()?.uploadDate }}</p>
                    </div>
                    @if (previewedDoc()?.expirationDate) {
                      <div>
                        <p class="text-slate-400 font-bold">Expires</p>
                        <p class="font-bold mt-0.5 font-mono"
                          [class.text-red-600]="previewedDoc()?.status === 'Expired'"
                          [class.text-amber-600]="previewedDoc()?.status === 'Expiring'"
                          [class.text-slate-800]="previewedDoc()?.status === 'Active'">
                          {{ previewedDoc()?.expirationDate }}
                        </p>
                      </div>
                    }
                  </div>
                  <div class="space-y-2 mt-3">
                    <div class="h-2 w-full bg-slate-100 rounded"></div>
                    <div class="h-2 w-3/4 bg-slate-100 rounded"></div>
                    <div class="h-2 w-1/2 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <p class="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {{ 'hr.documents.pdf_reader' | translate }}
                </p>
              </div>
            </div>
            <div class="flex justify-end pt-2 border-t">
              <button (click)="closePreviewModal()" class="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm">{{ 'hr.common.close' | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrDocumentsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hrService = inject(HrMockService);

  selectedEmpId = signal<string>('');
  selectedCategory = signal<EmployeeDocument['category']>('National ID');
  showUploadModal = signal(false);
  showPreviewModal = signal(false);
  previewedDoc = signal<EmployeeDocument | null>(null);

  uploadForm = { name: '', category: 'National ID' as EmployeeDocument['category'], expirationDate: '' };

  readonly categories: EmployeeDocument['category'][] = [
    'National ID', 'Passport', 'Employment Contract', 'CV', 'Certificates',
    'Military Certificate', 'Police Clearance', 'Medical Report', 'Insurance Documents', 'Other Documents'
  ];

  readonly currentEmp = computed(() => {
    const id = this.selectedEmpId();
    return this.hrService.employees().find(e => e.id === id) ?? null;
  });

  readonly expiringDocs = computed(() => {
    const result: EmployeeDocument[] = [];
    this.hrService.employees().forEach(e =>
      (e.documents ?? []).forEach(d => {
        if (d.expirationDate) {
          const diff = Math.ceil((new Date(d.expirationDate).getTime() - Date.now()) / 86400000);
          if (diff > 0 && diff <= 30) result.push(d);
        }
      })
    );
    return result;
  });

  readonly expiredDocs = computed(() => {
    const result: EmployeeDocument[] = [];
    this.hrService.employees().forEach(e =>
      (e.documents ?? []).forEach(d => {
        if (d.expirationDate) {
          const diff = Math.ceil((new Date(d.expirationDate).getTime() - Date.now()) / 86400000);
          if (diff <= 0) result.push(d);
        }
      })
    );
    return result;
  });

  readonly filteredDocs = computed(() => {
    const emp = this.currentEmp();
    if (!emp) return [];
    return (emp.documents ?? []).filter(d => d.category === this.selectedCategory());
  });

  getDocCountForCategory(cat: EmployeeDocument['category']): number {
    return (this.currentEmp()?.documents ?? []).filter(d => d.category === cat).length;
  }

  openUploadModal() {
    this.uploadForm = { name: '', category: this.selectedCategory(), expirationDate: '' };
    this.showUploadModal.set(true);
  }
  closeUploadModal() { this.showUploadModal.set(false); }

  submitUpload() {
    const emp = this.currentEmp();
    if (!emp || !this.uploadForm.name.trim()) return;
    let docStatus: EmployeeDocument['status'] = 'Active';
    if (this.uploadForm.expirationDate) {
      const diff = Math.ceil((new Date(this.uploadForm.expirationDate).getTime() - Date.now()) / 86400000);
      if (diff <= 0) docStatus = 'Expired';
      else if (diff <= 30) docStatus = 'Expiring';
    }
    this.hrService.uploadDocument(emp.id, {
      name: this.uploadForm.name,
      category: this.uploadForm.category,
      expirationDate: this.uploadForm.expirationDate || undefined,
      status: docStatus
    });
    this.closeUploadModal();
  }

  previewDoc(doc: EmployeeDocument) {
    this.previewedDoc.set(doc);
    this.showPreviewModal.set(true);
  }
  closePreviewModal() { this.showPreviewModal.set(false); }

  downloadDoc(doc: EmployeeDocument) {
    const a = document.createElement('a');
    a.href = '#';
    a.setAttribute('download', doc.name);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.documents.title' }
    ]);
    const first = this.hrService.employees()[0];
    if (first) this.selectedEmpId.set(first.id);
  }
}
