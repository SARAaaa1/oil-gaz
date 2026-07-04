import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-integration-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.int_nav_assets' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">Track company assets assigned to employees</p>
      </div>
      <button (click)="openAssignModal()" class="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm">
        + Assign Asset
      </button>
    </div>

    <!-- Assets List -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Asset Tag</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Asset Name</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.int_asset_type' | translate }}</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Assigned To</th>
              <th class="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Assign Date</th>
              <th class="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.reports.int_asset_value' | translate }}</th>
              <th class="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            @for (a of assets(); track a.tag) {
              <tr class="hover:bg-slate-50/50">
                <td class="px-4 py-3 font-bold text-primary">{{ a.tag }}</td>
                <td class="px-4 py-3 font-semibold text-slate-800">{{ a.name }}</td>
                <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-650 border border-slate-200 font-bold text-[9px]">{{ a.type }}</span></td>
                <td class="px-4 py-3 font-semibold text-slate-700">{{ a.assignedTo }}</td>
                <td class="px-4 py-3 font-semibold text-slate-500">{{ a.assignDate }}</td>
                <td class="px-4 py-3 text-right font-bold text-slate-800">SAR {{ a.value | number }}</td>
                <td class="px-4 py-3">
                  <div class="flex gap-1.5 justify-center">
                    <button (click)="returnAsset(a)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-[10px] font-bold">Return</button>
                    <button (click)="transferAsset(a)" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold">Transfer</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Assign Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4" (click)="showModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md my-16" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <h3 class="font-black text-slate-800 text-sm">Assign New Asset</h3>
            <button (click)="showModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-4 text-xs">
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">Employee</label>
              <select [(ngModel)]="form.assignedTo" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white text-xs">
                @for (e of hr.employees(); track e.id) {
                  <option [value]="e.fullName">{{ e.fullName }}</option>
                }
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">Asset Type</label>
              <select [(ngModel)]="form.type" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white text-xs">
                <option value="Laptop">Laptop</option>
                <option value="Mobile Phone">Mobile Phone</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Office Space">Office Space</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">Asset Name/Model</label>
              <input [(ngModel)]="form.name" type="text" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" placeholder="e.g. MacBook Pro M3">
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">Asset Tag</label>
              <input [(ngModel)]="form.tag" type="text" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" placeholder="e.g. LP-9023">
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-2xl">
            <button (click)="showModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">Cancel</button>
            <button (click)="submitAssign()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">Assign</button>
          </div>
        </div>
      </div>
    }

  </div>
  `
})
export class HrIntegrationAssetsComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  showModal = signal(false);
  form: any = {};

  readonly assets = signal([
    { tag: 'LP-1029', name: 'Dell Latitude 5440', type: 'Laptop', assignedTo: 'Ahmad Al-Dosari', assignDate: '2026-01-15', value: 4500 },
    { tag: 'MB-2098', name: 'iPhone 15 Pro Max', type: 'Mobile Phone', assignedTo: 'Sarah Al-Qahtani', assignDate: '2026-03-01', value: 5200 },
    { tag: 'VH-0092', name: 'Toyota Hilux 2024', type: 'Vehicle', assignedTo: 'Khalid Al-Shehri', assignDate: '2025-11-10', value: 110000 },
    { tag: 'OF-302A', name: 'Head Office Room 302', type: 'Office Space', assignedTo: 'Omar Al-Ghamdi', assignDate: '2026-05-15', value: 0 }
  ]);

  openAssignModal() {
    this.form = { assignedTo: this.hr.employees()[0]?.fullName || '', type: 'Laptop', name: '', tag: `AS-${Date.now().toString().slice(-4)}`, assignDate: new Date().toISOString().split('T')[0], value: 1000 };
    this.showModal.set(true);
  }

  submitAssign() {
    this.assets.update(list => [...list, { ...this.form }]);
    this.hr.notify.success('hr.common.success', 'Asset successfully assigned to employee.');
    this.showModal.set(false);
  }

  returnAsset(asset: any) {
    this.assets.update(list => list.filter(a => a.tag !== asset.tag));
    this.hr.notify.warning('hr.common.success', 'Asset successfully returned to inventory.');
  }

  transferAsset(asset: any) {
    this.hr.notify.success('hr.common.success', 'Asset transfer request initiated.');
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.int_title' },
      { label: 'hr.reports.int_nav_assets' }
    ]);
  }
}
