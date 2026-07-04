import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-hr-org-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.ent_org_title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.reports.ent_org_subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2">
        <button (click)="zoomIn()" class="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold">➕ Zoom In</button>
        <button (click)="zoomOut()" class="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold">➖ Zoom Out</button>
      </div>
    </div>

    <!-- Tree Wrapper -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-auto min-h-[500px] flex justify-center items-start">
      
      <!-- Interactive Chart Viewport -->
      <div class="transform origin-top transition-transform duration-300" [style.transform]="'scale(' + zoom() + ')'">
        
        <!-- Root node (CEO) -->
        <div class="flex flex-col items-center">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl shadow-lg p-4 border border-slate-700 text-center w-52 space-y-1">
            <span class="text-xl">👔</span>
            <h4 class="font-black text-xs">Yousef Al-Harbi</h4>
            <p class="text-[9px] font-black opacity-80 uppercase tracking-widest">Chief Executive Officer</p>
          </div>

          <!-- Vertical Connector line -->
          <div class="w-0.5 h-8 bg-slate-300"></div>

          <!-- Row of Managers -->
          <div class="flex gap-6 relative">
            
            <!-- Horizontal connector bar -->
            <div class="absolute top-0 left-26 right-26 h-0.5 bg-slate-300"></div>

            @for (m of managers(); track m.name) {
              <div class="flex flex-col items-center relative pt-4">
                <!-- Short vertical connector to horizontal bar -->
                <div class="absolute top-0 w-0.5 h-4 bg-slate-300"></div>

                <!-- Manager Card -->
                <div class="bg-white border border-primary/20 rounded-2xl shadow-md p-4 text-center w-48 space-y-1 hover:border-primary transition-colors">
                  <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center mx-auto">{{ m.name[0] }}</div>
                  <h4 class="font-black text-slate-800 text-xs mt-1">{{ m.name }}</h4>
                  <p class="text-[9px] font-bold text-primary uppercase tracking-wide">{{ m.role }}</p>
                  <p class="text-[9px] text-slate-400 font-semibold mt-0.5">{{ m.dept }}</p>
                </div>

                <!-- Sub-employees Connector -->
                <div class="w-0.5 h-6 bg-slate-200"></div>

                <!-- Sub list of supervisors / engineers -->
                <div class="space-y-2">
                  @for (sub of m.subs; track sub.name) {
                    <div class="flex flex-col items-center">
                      <div class="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center w-40 space-y-0.5">
                        <h5 class="font-bold text-slate-700 text-[10px]">{{ sub.name }}</h5>
                        <p class="text-[8px] text-slate-400 font-bold uppercase">{{ sub.role }}</p>
                      </div>
                    </div>
                  }
                </div>

              </div>
            }

          </div>

        </div>

      </div>

    </div>

  </div>
  `
})
export class HrOrgChartComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  zoom = signal(1.0);

  readonly managers = signal([
    {
      name: 'Sarah Al-Qahtani',
      role: 'HR Director',
      dept: 'Human Resources',
      subs: [
        { name: 'Nora Al-Rashidi', role: 'Talent Acquisition' },
        { name: 'Layla Al-Otaibi', role: 'Payroll Specialist' }
      ]
    },
    {
      name: 'Khalid Al-Shehri',
      role: 'Operations Director',
      dept: 'Operations',
      subs: [
        { name: 'Ahmad Al-Dosari', role: 'Sr. Drilling Eng.' },
        { name: 'Turki Al-Anzi', role: 'Supervisor' }
      ]
    },
    {
      name: 'Fatima Al-Otaibi',
      role: 'Finance Controller',
      dept: 'Finance',
      subs: [
        { name: 'Reem Al-Mutairi', role: 'Senior Accountant' }
      ]
    }
  ]);

  zoomIn() {
    this.zoom.update(z => Math.min(1.5, z + 0.1));
  }

  zoomOut() {
    this.zoom.update(z => Math.max(0.7, z - 0.1));
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'navigation.hr_org_chart' }
    ]);
  }
}
