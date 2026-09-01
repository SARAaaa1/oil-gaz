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
          const normalized: BackendCostCenter[] = rawItems.map(item => ({
            ...item,
            id: item._id || item.id,
            code: item.code,
            name: item.name || item.nameEn || item.code,
            nameEn: item.nameEn || item.name || item.code,
            nameAr: item.nameAr || item.name || item.code,
            parentCode: item.parentCode ?? null,
            level: item.level ?? (item.parentCode ? 2 : 1),
            branch: item.branch || (item.code.startsWith('FZ-') || (item.parentCode && item.parentCode.startsWith('FZ-')) ? 'FreeZone' : 'HeadOffice')
          }));
          this.costCenters.set(normalized);
          this.financeV2Mock.costCenters.set(normalized as any);
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

  /** Departments / Cost Centers under Head Office or Free Zone root */
  getDepartmentsByRoot(rootCode: string): BackendCostCenter[] {
    if (!rootCode) return [];
    const isFreeZone = rootCode === 'FreeZone' || rootCode === 'FZ-CC-100' || rootCode === 'FZ';
    return this.costCenters().filter(cc => {
      if (isFreeZone) {
        return cc.branch === 'FreeZone' || cc.code.startsWith('FZ-') || cc.parentCode === 'FreeZone';
      } else {
        return cc.branch === 'HeadOffice' || (!cc.code.startsWith('FZ-') && cc.branch !== 'FreeZone');
      }
    });
  }

  /** Sub-departments/projects/rigs under a specific parent cost center code */
  getChildren(parentCode: string): BackendCostCenter[] {
    if (!parentCode) return [];
    return this.costCenters().filter(cc => cc.parentCode === parentCode);
  }
}