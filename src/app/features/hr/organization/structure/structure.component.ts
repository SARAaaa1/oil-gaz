import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { Department, Employee } from '../../../../shared/interfaces';

interface OrgNode {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  managerName: string;
  employeeCount: number;
  status: string;
  location: string;
  color: string;
  accentColor: string;
  icon: string;
  children: OrgNode[];
  expanded: boolean;
}

const DEPT_THEMES: Record<string, { color: string; accent: string; icon: string }> = {
  'HR':   { color: '#7C3AED', accent: '#EDE9FE', icon: '👥' },
  'ENG':  { color: '#0284C7', accent: '#E0F2FE', icon: '⚙️' },
  'HSE':  { color: '#D97706', accent: '#FEF3C7', icon: '⛑️' },
  'FIN':  { color: '#059669', accent: '#D1FAE5', icon: '💰' },
  'OPS':  { color: '#DC2626', accent: '#FEE2E2', icon: '🏭' },
  'IT':   { color: '#2563EB', accent: '#DBEAFE', icon: '💻' },
  'PROC': { color: '#0891B2', accent: '#CFFAFE', icon: '📦' },
  'LOG':  { color: '#4F46E5', accent: '#E0E7FF', icon: '🚚' },
};

function getTheme(code: string): { color: string; accent: string; icon: string } {
  return DEPT_THEMES[code] || { color: '#009FE3', accent: '#EFF6FF', icon: '🏢' };
}

@Component({
  selector: 'app-hr-structure',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './structure.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HrStructureComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);

  search = '';
  zoom = signal(100);

  readonly selectedDept = signal<OrgNode | null>(null);
  readonly hoveredDept  = signal<string | null>(null);

  // ── Stats ─────────────────────────────────────────────────────────────────
  readonly totalEmployees = computed(() => this.hr.employees().length);
  readonly totalDepts     = computed(() => this.hr.departments().length);
  readonly activeDepts    = computed(() => this.hr.departments().filter(d => d.status === 'Active').length);
  readonly managersCount  = computed(() => this.hr.departments().filter(d => !!d.managerName).length);
  readonly vacantPositions = computed(() => this.hr.jobTitles().reduce((s, j) => s + (j.vacantCount ?? 0), 0));
  readonly activeLocationsCount = computed(() => this.hr.workLocations().filter(l => l.status === 'Active').length);

  // ── Org Tree ───────────────────────────────────────────────────────────────
  readonly orgNodes = computed((): OrgNode[] => {
    const depts = this.hr.departments();
    const topLevel = depts.filter(d => !d.parentDepartmentId);
    return topLevel.map(d => {
      const theme = getTheme(d.code);
      return {
        id: d.id, code: d.code, name: d.name, arabicName: d.arabicName || '',
        managerName: d.managerName || '', employeeCount: d.employeeCount ?? 0,
        status: d.status, location: d.location || '',
        color: theme.color, accentColor: theme.accent, icon: theme.icon,
        expanded: true,
        children: depts.filter(c => c.parentDepartmentId === d.id).map(c => {
          const ct = getTheme(c.code);
          return {
            id: c.id, code: c.code, name: c.name, arabicName: c.arabicName || '',
            managerName: c.managerName || '', employeeCount: c.employeeCount ?? 0,
            status: c.status, location: c.location || '',
            color: ct.color, accentColor: ct.accent, icon: ct.icon,
            expanded: false, children: []
          };
        })
      };
    });
  });

  // ── Filtered nodes ────────────────────────────────────────────────────────
  readonly filteredNodes = computed(() => {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.orgNodes();
    return this.orgNodes().filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.arabicName.toLowerCase().includes(q) ||
      n.managerName.toLowerCase().includes(q) ||
      n.children.some(c => c.name.toLowerCase().includes(q) || c.arabicName.toLowerCase().includes(q))
    );
  });

  // ── Dept employees for panel ───────────────────────────────────────────────
  readonly selectedDeptEmployees = computed(() => {
    const d = this.selectedDept();
    if (!d) return [];
    return this.hr.employees().filter(e => e.departmentId === d.id);
  });

  getEmpCount(deptId: string): number {
    return this.hr.employees().filter(e => e.departmentId === deptId).length;
  }

  getJobCount(deptId: string): number {
    return this.hr.jobTitles().filter(j => j.departmentId === deptId).length;
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  selectDept(node: OrgNode) {
    this.selectedDept.set(this.selectedDept()?.id === node.id ? null : node);
  }

  toggleNode(node: OrgNode) {
    node.expanded = !node.expanded;
  }

  expandAll()   { this.orgNodes().forEach(n => { n.expanded = true; }); }
  collapseAll() { this.orgNodes().forEach(n => { n.expanded = false; }); }

  zoomIn()    { if (this.zoom() < 150) this.zoom.update(z => z + 10); }
  zoomOut()   { if (this.zoom() >  50) this.zoom.update(z => z - 10); }
  resetZoom() { this.zoom.set(100); }
  printChart(){ window.print(); }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'الهيكل التنظيمي' }
    ]);
  }
}
