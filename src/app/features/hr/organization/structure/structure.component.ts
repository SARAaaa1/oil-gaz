import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';

interface OrgNode {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  managerName: string;
  employeeCount: number;
  status: string;
  location: string;
  children: OrgNode[];
  expanded: boolean;
}

@Component({
  selector: 'app-hr-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .org-tree { display: flex; flex-direction: column; align-items: center; }
    .org-children { display: flex; flex-direction: row; justify-content: center; align-items: flex-start; gap: 0; position: relative; padding-top: 20px; }
    .org-children::before { content: ''; position: absolute; top: 0; left: 50%; width: 1px; height: 20px; background: #e2e8f0; }
    .org-child { display: flex; flex-direction: column; align-items: center; padding: 0 12px; position: relative; }
    .org-child::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: #e2e8f0; }
    .org-child:first-child::before { left: 50%; }
    .org-child:last-child::before { right: 50%; }
    .org-child:only-child::before { display: none; }
    .org-child::after { content: ''; position: absolute; top: 0; left: 50%; width: 1px; height: 20px; background: #e2e8f0; }
    .org-node-card { cursor: pointer; transition: all 0.2s; }
    .org-node-card:hover { transform: translateY(-2px); }
    @media print { .no-print { display: none !important; } body { background: white !important; } }
  `],
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.org.structure.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'hr.org.structure.subtitle' | translate }}</p>
      </div>
      <div class="flex gap-2 no-print">
        <button (click)="expandAll()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all">{{ 'hr.org.structure.expand_all' | translate }}</button>
        <button (click)="collapseAll()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all">{{ 'hr.org.structure.collapse_all' | translate }}</button>
        <button (click)="printChart()" class="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs transition-all">🖨️ {{ 'hr.org.structure.print' | translate }}</button>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.structure.stat_depts' | translate }}</p>
        <p class="text-2xl font-black text-slate-800 mt-1">{{ hr.departments().length }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.structure.stat_managers' | translate }}</p>
        <p class="text-2xl font-black text-primary mt-1">{{ managersCount() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.structure.stat_employees' | translate }}</p>
        <p class="text-2xl font-black text-slate-800 mt-1">{{ hr.employees().length }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.structure.stat_vacant' | translate }}</p>
        <p class="text-2xl font-black text-amber-500 mt-1">{{ vacantPositions() }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.structure.stat_levels' | translate }}</p>
        <p class="text-2xl font-black text-purple-600 mt-1">{{ hr.jobGrades().length }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ 'hr.org.structure.stat_locations' | translate }}</p>
        <p class="text-2xl font-black text-teal-600 mt-1">{{ activeLocationsCount() }}</p>
      </div>
    </div>

    <!-- Search + Zoom Controls -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-center no-print">
      <div class="relative flex-1">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input [(ngModel)]="search" type="text" [placeholder]="'hr.org.structure.search_dept' | translate" class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary/50">
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase">{{ 'hr.org.structure.zoom' | translate }}</span>
        <button (click)="zoomOut()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-base transition-all flex items-center justify-center">−</button>
        <span class="text-xs font-black text-slate-700 w-10 text-center">{{ zoom() }}%</span>
        <button (click)="zoomIn()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-base transition-all flex items-center justify-center">+</button>
        <button (click)="resetZoom()" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all">{{ 'hr.org.structure.reset' | translate }}</button>
      </div>
    </div>

    <!-- Org Chart Canvas -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-auto" style="min-height: 400px;">
      <div [style.transform]="'scale(' + zoom()/100 + ')'" style="transform-origin: top center; transition: transform 0.2s;">

        <!-- CEO / Company Root Node -->
        <div class="org-tree">
          <div class="org-node-card bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-lg p-4 w-52 text-center mb-1" style="box-shadow: 0 8px 24px rgba(0,159,227,0.35);">
            <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 text-lg">🏢</div>
            <p class="font-black text-sm">PetroFlow ERP</p>
            <p class="text-[10px] font-semibold opacity-80 mt-0.5">{{ 'hr.org.structure.company' | translate }}</p>
            <div class="mt-2 pt-2 border-t border-white/20 text-[10px] font-semibold opacity-90">
              {{ hr.employees().length }} {{ 'hr.org.structure.employees' | translate }}
            </div>
          </div>

          <!-- Connector line down -->
          <div class="w-px h-6 bg-slate-200 mx-auto"></div>

          <!-- Departments Row -->
          <div class="flex flex-row flex-wrap justify-center gap-6 relative pt-0">
            <!-- Horizontal connector line across top of departments -->
            <div class="absolute top-0 left-[10%] right-[10%] h-px bg-slate-200"></div>

            @for (node of orgNodes(); track node.id) {
              @if (!search || node.name.toLowerCase().includes(search.toLowerCase()) || node.arabicName.toLowerCase().includes(search.toLowerCase())) {
                <div class="flex flex-col items-center">
                  <!-- Vertical line from top connector to node -->
                  <div class="w-px h-6 bg-slate-200"></div>

                  <!-- Department Node -->
                  <div class="org-node-card w-44 rounded-2xl border-2 shadow-md overflow-hidden"
                       [class]="node.status === 'Active' ? 'border-primary/20' : 'border-slate-200 opacity-70'"
                       (click)="toggleNode(node)">
                    <div class="p-3 text-center" [class]="node.status === 'Active' ? 'bg-primary/5' : 'bg-slate-50'">
                      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1.5 text-base">🏬</div>
                      <p class="font-black text-slate-800 text-xs leading-tight">{{ node.name }}</p>
                      <p class="text-[10px] text-slate-500 font-semibold mt-0.5">{{ node.arabicName }}</p>
                    </div>
                    <div class="px-3 py-2 bg-white border-t border-slate-100 space-y-1">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-400 font-semibold">{{ 'hr.org.structure.manager' | translate }}</span>
                        <span class="font-bold text-slate-700 truncate max-w-[80px]">{{ node.managerName || '—' }}</span>
                      </div>
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-400 font-semibold">{{ 'hr.org.structure.employees' | translate }}</span>
                        <span class="font-black text-primary">{{ getEmpCount(node.id) }}</span>
                      </div>
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-slate-400 font-semibold">{{ 'hr.org.structure.jobs' | translate }}</span>
                        <span class="font-bold text-slate-700">{{ getJobCount(node.id) }}</span>
                      </div>
                    </div>
                    <div class="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span class="text-[10px] font-bold text-slate-400">{{ node.code }}</span>
                      <span [class]="node.status === 'Active' ? 'text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full' : 'text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full'">{{ node.status }}</span>
                    </div>
                    @if (node.children.length > 0) {
                      <div class="bg-primary/5 border-t border-primary/10 px-3 py-1.5 text-center">
                        <span class="text-[10px] font-black text-primary">{{ node.expanded ? '▲' : '▼' }} {{ node.children.length }} {{ 'hr.org.structure.sub_depts' | translate }}</span>
                      </div>
                    }
                  </div>

                  <!-- Children -->
                  @if (node.expanded && node.children.length > 0) {
                    <div class="w-px h-4 bg-slate-200"></div>
                    <div class="flex flex-row gap-4">
                      @for (child of node.children; track child.id) {
                        <div class="flex flex-col items-center">
                          <div class="w-px h-4 bg-slate-200"></div>
                          <div class="org-node-card w-36 rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                            <div class="p-2.5 text-center bg-slate-50">
                              <p class="font-black text-slate-800 text-[11px] leading-tight">{{ child.name }}</p>
                              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ child.code }}</p>
                            </div>
                            <div class="px-2.5 py-1.5 text-[10px] space-y-0.5">
                              <div class="flex justify-between"><span class="text-slate-400">Mgr</span><span class="font-bold text-slate-700 truncate max-w-[60px]">{{ child.managerName || '—' }}</span></div>
                              <div class="flex justify-between"><span class="text-slate-400">Emp</span><span class="font-black text-primary">{{ getEmpCount(child.id) }}</span></div>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }

                  <!-- Employee List under dept (if expanded) -->
                  @if (node.expanded) {
                    <div class="mt-3 flex flex-col gap-1 w-44">
                      @for (emp of getDeptEmployees(node.id); track emp.id) {
                        <div class="bg-white rounded-lg border border-slate-100 px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
                          <div class="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black flex-shrink-0">{{ emp.fullName.charAt(0) }}</div>
                          <div class="min-w-0">
                            <p class="text-[10px] font-bold text-slate-800 truncate">{{ emp.fullName }}</p>
                            <p class="text-[9px] text-slate-400 font-semibold truncate">{{ emp.jobTitle }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>

      </div>
    </div>

    <!-- Legend -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 no-print">
      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{{ 'hr.org.structure.legend' | translate }}</p>
      <div class="flex flex-wrap gap-4 text-[10px] font-semibold text-slate-600">
        <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded bg-gradient-to-br from-primary to-primary-dark"></div> {{ 'hr.org.structure.company' | translate }}</div>
        <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border-2 border-primary/20 bg-primary/5"></div> {{ 'hr.org.structure.active_dept' | translate }}</div>
        <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded border border-slate-200 bg-slate-50 opacity-70"></div> {{ 'hr.org.structure.inactive_dept' | translate }}</div>
        <div class="flex items-center gap-1.5"><div class="w-4 h-4 rounded bg-primary/10"></div> {{ 'hr.org.structure.employee' | translate }}</div>
      </div>
    </div>

  </div>
  `
})
export class HrStructureComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly lang = inject(LanguageService);

  search = '';
  zoom = signal(100);

  readonly managersCount = computed(() => this.hr.departments().filter(d => !!d.managerName).length);
  readonly vacantPositions = computed(() => this.hr.jobTitles().reduce((s, j) => s + (j.vacantCount ?? 0), 0));
  readonly activeLocationsCount = computed(() => this.hr.workLocations().filter(l => l.status === 'Active').length);

  readonly orgNodes = computed((): OrgNode[] => {
    const depts = this.hr.departments();
    const topLevel = depts.filter(d => !d.parentDepartmentId);
    return topLevel.map(d => ({
      id: d.id,
      code: d.code,
      name: d.name,
      arabicName: d.arabicName || '',
      managerName: d.managerName || '',
      employeeCount: d.employeeCount ?? 0,
      status: d.status,
      location: d.location || '',
      expanded: false,
      children: depts.filter(c => c.parentDepartmentId === d.id).map(c => ({
        id: c.id, code: c.code, name: c.name, arabicName: c.arabicName || '',
        managerName: c.managerName || '', employeeCount: c.employeeCount ?? 0,
        status: c.status, location: c.location || '', expanded: false, children: []
      }))
    }));
  });

  getEmpCount(deptId: string): number {
    return this.hr.employees().filter(e => e.departmentId === deptId).length;
  }

  getJobCount(deptId: string): number {
    return this.hr.jobTitles().filter(j => j.departmentId === deptId).length;
  }

  getDeptEmployees(deptId: string) {
    return this.hr.employees().filter(e => e.departmentId === deptId).slice(0, 5);
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.org.structure.title' }
    ]);
  }

  toggleNode(node: OrgNode) { node.expanded = !node.expanded; }

  expandAll() { this.orgNodes().forEach(n => { n.expanded = true; n.children.forEach(c => c.expanded = true); }); }
  collapseAll() { this.orgNodes().forEach(n => { n.expanded = false; n.children.forEach(c => c.expanded = false); }); }

  zoomIn() { if (this.zoom() < 150) this.zoom.update(z => z + 10); }
  zoomOut() { if (this.zoom() > 50) this.zoom.update(z => z - 10); }
  resetZoom() { this.zoom.set(100); }
  printChart() { window.print(); }
}
