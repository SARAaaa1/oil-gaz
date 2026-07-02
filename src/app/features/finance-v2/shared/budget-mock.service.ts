import { Injectable, signal, computed } from '@angular/core';
import { ProjectBudget, BudgetLine, BudgetStatus, BudgetCategory, BudgetLineStatus } from './budget.interfaces';

@Injectable({ providedIn: 'root' })
export class BudgetMockService {

  // ── Project Budgets Signal ─────────────────────────────────────────
  readonly budgets = signal<ProjectBudget[]>([
    {
      id: 'b01',
      budgetNumber: 'BGT-2025-001',
      projectCode: 'PRJ-001',
      projectName: 'Saudi Aramco Pipeline - Dhahran Site',
      projectManager: 'Khalid Al-Ghamdi',
      client: 'Saudi Aramco',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      fiscalYear: '2025',
      status: 'Active',
      currency: 'SAR',
      approvedBy: 'Sara Al-Rasheed',
      approvalDate: '2025-01-05',
      createdBy: 'Reem Al-Muaiqel',
      createdDate: '2025-01-01',
      lastUpdated: '2025-07-01',
      lines: [
        this.createLine('bl01_1', 'Materials', 'CC-PRJ-001-A', 'Dhahran Excavation A', 5_000_000, 3_800_000, 800_000, 'Pipeline steel joints & valves'),
        this.createLine('bl01_2', 'Labor', 'CC-PRJ-001-A', 'Dhahran Excavation A', 2_500_000, 2_100_000, 300_000, 'Specialized welding team labor'),
        this.createLine('bl01_3', 'Equipment', 'CC-PRJ-001-B', 'Dhahran Drilling B', 4_000_000, 3_900_000, 400_000, 'Heavy rotary drilling drill rigs lease'),
        this.createLine('bl01_4', 'Subcontractors', 'CC-PRJ-001-B', 'Dhahran Drilling B', 3_000_000, 1_500_000, 500_000, 'Site safety supervision team'),
        this.createLine('bl01_5', 'Fuel', 'CC-PRJ-001-A', 'Dhahran Excavation A', 500_000, 350_000, 50_000, 'Diesel supply for heavy machinery'),
        this.createLine('bl01_6', 'Transportation', 'CC-PRJ-001-C', 'Dhahran Logistics C', 800_000, 950_000, 100_000, 'Pipe logistics & haulage (Over budget!)')
      ]
    },
    {
      id: 'b02',
      budgetNumber: 'BGT-2025-002',
      projectCode: 'PRJ-004',
      projectName: 'SWCC Desalination Support - Riyadh',
      projectManager: 'Tariq Al-Mutairi',
      client: 'SWCC Water',
      startDate: '2025-02-15',
      endDate: '2025-11-30',
      fiscalYear: '2025',
      status: 'Active',
      currency: 'SAR',
      approvedBy: 'Sara Al-Rasheed',
      approvalDate: '2025-02-20',
      createdBy: 'Reem Al-Muaiqel',
      createdDate: '2025-02-15',
      lastUpdated: '2025-06-28',
      lines: [
        this.createLine('bl02_1', 'Materials', 'CC-PRJ-004-A', 'SWCC Intake Site', 8_000_000, 6_200_000, 1_500_000, 'Pumping station electrical gear'),
        this.createLine('bl02_2', 'Labor', 'CC-PRJ-004-A', 'SWCC Intake Site', 3_500_000, 2_400_000, 200_000, 'Civil engineering support'),
        this.createLine('bl02_3', 'Maintenance', 'CC-PRJ-004-B', 'SWCC Pump House', 600_000, 500_000, 150_000, 'Routine pump inspections (Over budget!)'),
        this.createLine('bl02_4', 'Accommodation', 'CC-PRJ-004-C', 'SWCC Site Camp', 1_200_000, 900_000, 100_000, 'Camp rental & cleaning services')
      ]
    },
    {
      id: 'b03',
      budgetNumber: 'BGT-2025-003',
      projectCode: 'PRJ-005',
      projectName: 'NEOM Smart City Tech Hub',
      projectManager: 'Sara Al-Rasheed',
      client: 'Neom Tech Corp',
      startDate: '2025-03-01',
      endDate: '2026-02-28',
      fiscalYear: '2025',
      status: 'Draft',
      currency: 'USD',
      approvedBy: '',
      approvalDate: '',
      createdBy: 'Reem Al-Muaiqel',
      createdDate: '2025-03-01',
      lastUpdated: '2025-03-01',
      lines: [
        this.createLine('bl03_1', 'Materials', 'CC-PRJ-005-A', 'NEOM Fiber Ring', 1_500_000, 0, 0, 'Optical cables & routers'),
        this.createLine('bl03_2', 'Labor', 'CC-PRJ-005-A', 'NEOM Fiber Ring', 800_000, 0, 0, 'Tech specialists contract'),
        this.createLine('bl03_3', 'Administration', 'CC-PRJ-005-B', 'NEOM PMO Office', 200_000, 0, 0, 'HQ support costs')
      ]
    },
    {
      id: 'b04',
      budgetNumber: 'BGT-2024-001',
      projectCode: 'PRJ-003',
      projectName: 'Ma\'aden Mining Camp Support',
      projectManager: 'Omar Al-Zahrani',
      client: 'Ma\'aden Mining',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      fiscalYear: '2024',
      status: 'Closed',
      currency: 'SAR',
      approvedBy: 'Sara Al-Rasheed',
      approvalDate: '2024-01-04',
      createdBy: 'Reem Al-Muaiqel',
      createdDate: '2024-01-01',
      lastUpdated: '2024-12-31',
      lines: [
        this.createLine('bl04_1', 'Materials', 'CC-PRJ-003-A', 'Mining Camp Supplies', 4_000_000, 3_900_000, 0, 'Camp equipment final delivery'),
        this.createLine('bl04_2', 'Labor', 'CC-PRJ-003-A', 'Mining Camp Supplies', 1_500_000, 1_480_000, 0, 'Site support labor')
      ]
    },
    {
      id: 'b05',
      budgetNumber: 'BGT-2025-005',
      projectCode: 'PRJ-006',
      projectName: 'Acwa Power Maintenance Project',
      projectManager: 'Nasser Al-Dosari',
      client: 'Acwa Power',
      startDate: '2025-05-01',
      endDate: '2025-10-31',
      fiscalYear: '2025',
      status: 'Submitted',
      currency: 'SAR',
      approvedBy: '',
      approvalDate: '',
      createdBy: 'Reem Al-Muaiqel',
      createdDate: '2025-04-20',
      lastUpdated: '2025-04-20',
      lines: [
        this.createLine('bl05_1', 'Materials', 'CC-PRJ-006-A', 'Acwa Turbine Site', 3_000_000, 0, 0, 'Replacement rotor parts'),
        this.createLine('bl05_2', 'Labor', 'CC-PRJ-006-B', 'Acwa Boiler Station', 1_200_000, 0, 0, 'Mechanical engineers hourly team')
      ]
    }
  ]);

  // ── Summary KPIs computed from all active budgets ──────────────────
  readonly kpis = computed(() => {
    let totalBudget = 0;
    let actualCost = 0;
    let committedCost = 0;
    let forecastCost = 0;
    let availableBudget = 0;
    let overBudgetItemCount = 0;

    this.budgets().forEach(b => {
      if (b.status === 'Active' || b.status === 'Approved') {
        const factor = b.currency === 'USD' ? 3.75 : 1;
        b.lines.forEach(l => {
          totalBudget += l.budgetAmount * factor;
          actualCost += l.actualCost * factor;
          committedCost += l.committedCost * factor;
          forecastCost += l.forecastCost * factor;
          availableBudget += l.remainingBudget * factor;
          if (l.status === 'Red') {
            overBudgetItemCount++;
          }
        });
      }
    });

    const utilizationPct = totalBudget > 0 ? Math.round((actualCost / totalBudget) * 100) : 0;
    const forecastVariance = totalBudget - forecastCost;

    return {
      totalBudget,
      actualCost,
      committedCost,
      availableBudget,
      utilizationPct,
      forecastCost,
      forecastVariance,
      overBudgetItemCount
    };
  });

  // ── Budget Line factory with auto calculations ────────────────────
  createLine(
    id: string, category: BudgetCategory, costCenterCode: string, costCenterName: string,
    budgetAmount: number, actualCost: number, committedCost: number, notes: string
  ): BudgetLine {
    const remainingBudget = budgetAmount - actualCost - committedCost;
    const forecastCost    = actualCost + committedCost;
    const variance        = budgetAmount - forecastCost;
    const variancePct     = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;

    // Status Rules: Green < 80%, Yellow 80%-100%, Red > 100%
    const utilPct = budgetAmount > 0 ? (forecastCost / budgetAmount) * 100 : 0;
    let status: BudgetLineStatus = 'Green';
    if (utilPct >= 80 && utilPct <= 100) {
      status = 'Yellow';
    } else if (utilPct > 100) {
      status = 'Red';
    }

    return {
      id, category, costCenterCode, costCenterName,
      budgetAmount, actualCost, committedCost, remainingBudget,
      forecastCost, variance, variancePct, status, notes
    };
  }

  // ── Budget Actions ────────────────────────────────────────────────
  updateBudgetStatus(id: string, status: BudgetStatus, extra: Partial<ProjectBudget> = {}) {
    this.budgets.update(list =>
      list.map(b => b.id === id ? { ...b, status, ...extra, lastUpdated: '2025-07-02' } : b)
    );
  }
}
