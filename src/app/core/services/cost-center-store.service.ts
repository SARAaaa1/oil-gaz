import { Injectable, inject, signal, computed } from '@angular/core';
import { FinanceApiService } from './finance-api.service';
import { FinanceV2MockService } from '../../features/finance-v2/shared/finance-v2-mock.service';

export interface BackendCostCenter {
  _id?: string;
  id?: string;
  code: string;
  name: string;
  nameEn?: string;
  nameAr?: string;
  type?: string;
  parentCode?: string | null;
  parentId?: string | null;
  level?: number;
  branch?: string;
  isActive?: boolean;
  children?: BackendCostCenter[];
  childrenCount?: number;
}

export interface MainRootCostCenter {
  code: string;
  nameEn: string;
  nameAr: string;
  branch: 'HeadOffice' | 'FreeZone';
}

@Injectable({
  providedIn: 'root'
})
export class CostCenterStoreService {
  private readonly financeApi = inject(FinanceApiService);
  private readonly financeV2Mock = inject(FinanceV2MockService);

  readonly costCenters = signal<BackendCostCenter[]>([]);
  readonly isLoading   = signal<boolean>(false);

  /** The 2 Fixed Main Root Cost Centers (المركز الرئيسي والمنطقة الحرة) */
  readonly mainRoots = signal<MainRootCostCenter[]>([
    {
      code: 'HeadOffice',
      nameEn: 'Head Office — المركز الرئيسي',
      nameAr: 'المركز الرئيسي (Head Office)',
      branch: 'HeadOffice'
    },
    {
      code: 'FreeZone',
      nameEn: 'Free Zone — المنطقة الحرة',
      nameAr: 'المنطقة الحرة (Free Zone)',
      branch: 'FreeZone'
    }
  ]);

  constructor() {
    this.refreshCostCenters();
  }

  refreshCostCenters() {
    this.isLoading.set(true);
    this.financeApi.getCostCenters({ slim: true, limit: 500 }).subscribe({
      next: (res: any) => {
        const rawItems: any[] = res.data ?? (Array.isArray(res) ? res : []);
        if (rawItems && rawItems.length > 0) {
          // ── Flatten all levels: top-level items + their children[] recursively ──
          const flatten = (items: any[], depth: number = 0): BackendCostCenter[] => {
            const result: BackendCostCenter[] = [];
            for (const item of items) {
              const branch = item.branch ||
                (item.code?.startsWith('FZ-') || item.parentCode?.startsWith('FZ-')
                  ? 'FreeZone' : 'HeadOffice');
              // Extract children before spreading to avoid nesting in the flat list
              const { children: _children, ...itemWithoutChildren } = item;
              result.push({
                ...itemWithoutChildren,
                id:         item._id || item.id,
                code:       item.code,
                name:       item.name || item.nameEn || item.code,
                nameEn:     item.nameEn || item.name || item.code,
                nameAr:     item.nameAr || item.name || item.code,
                parentCode: item.parentCode ?? null,
                level:      item.level ?? (item.parentCode ? (depth + 1) : 1),
                branch
              });
              // Recurse into children if the API returned them inline
              if (Array.isArray(item.children) && item.children.length > 0) {
                result.push(...flatten(item.children, depth + 1));
              }
            }
            return result;
          };

          const normalized = flatten(rawItems);
          // Deduplicate by code (in case API returned the same CC at multiple depths)
          const seen = new Set<string>();
          const deduped = normalized.filter(cc => {
            if (seen.has(cc.code)) return false;
            seen.add(cc.code);
            return true;
          });

          this.costCenters.set(deduped);

          // ── Map backend fields → mock fields so financeV2 components don't crash ──
          // Backend uses: budgetAmount, spentAmount, availableAmount, committedAmount, utilizationPct
          // Mock expects:  budget,       spent,       available,       committed,       utilizationPct
          const mockedItems = deduped.map((cc: any) => ({
            id:             cc.id || cc._id || cc.code,
            code:           cc.code,
            nameEn:         cc.nameEn || cc.name || cc.code,
            nameAr:         cc.nameAr || cc.name || cc.code,
            type:           cc.type || 'Department',
            parentCode:     cc.parentCode ?? null,
            level:          cc.level ?? 1,
            branch:         cc.branch ?? 'HeadOffice',
            status:         cc.status || (cc.isActive ? 'Active' : 'Inactive'),
            manager:        cc.manager || '',
            budget:         cc.budgetAmount    ?? cc.budget    ?? 0,
            spent:          cc.spentAmount     ?? cc.spent     ?? 0,
            available:      cc.availableAmount ?? cc.available ?? 0,
            committed:      cc.committedAmount ?? cc.committed ?? 0,
            utilizationPct: cc.utilizationPct  ?? 0,
            alertLevel:     cc.alertLevel ?? 'none',
            description:    cc.description ?? null,
            childrenCount:  cc.childrenCount ?? 0,
            createdAt:      cc.createdAt ?? ''
          }));
          this.financeV2Mock.costCenters.set(mockedItems as any);
        } else {
          this.loadMockFallback();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('CostCenterStoreService: API call failed, using fallback data', err);
        this.loadMockFallback();
        this.isLoading.set(false);
      }
    });
  }

  private loadMockFallback() {
    const mocks = this.financeV2Mock.costCenters();
    this.costCenters.set(mocks.map(cc => ({
      id: cc.id,
      code: cc.code,
      name: cc.nameEn,
      nameEn: cc.nameEn,
      nameAr: cc.nameAr,
      type: cc.type,
      parentCode: cc.parentCode ?? null,
      level: cc.level,
      branch: cc.branch ?? (cc.code.startsWith('FZ-') ? 'FreeZone' : 'HeadOffice'),
      isActive: cc.status === 'Active'
    })));
  }

  /**
   * Level-1 Departments directly under a Root (HeadOffice / FreeZone).
   * Returns only items whose parentCode is null (i.e. top-level departments).
   */
  getDepartmentsByRoot(rootCode: string): BackendCostCenter[] {
    if (!rootCode) return [];
    const isFreeZone = rootCode === 'FreeZone' || rootCode === 'FZ-CC-100' || rootCode === 'FZ';
    return this.costCenters().filter(cc => {
      // Must be a top-level department (no parent = sits directly under the root)
      if (cc.parentCode !== null && cc.parentCode !== undefined) return false;
      if (isFreeZone) {
        return cc.branch === 'FreeZone' || cc.code.startsWith('FZ-');
      } else {
        return cc.branch === 'HeadOffice' || (!cc.code.startsWith('FZ-') && cc.branch !== 'FreeZone');
      }
    });
  }

  /** Level-2+ items: direct children of a given parent cost center code */
  getChildren(parentCode: string): BackendCostCenter[] {
    if (!parentCode) return [];
    return this.costCenters().filter(cc => cc.parentCode === parentCode);
  }
}