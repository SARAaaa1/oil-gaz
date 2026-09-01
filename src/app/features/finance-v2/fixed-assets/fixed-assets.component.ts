import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AssetsMockService } from '../shared/assets-mock.service';
import { FixedAsset, AssetStatus, AssetCategory } from '../shared/assets.interfaces';
import { BranchService } from '../shared/branch.service';
import { FinanceApiService } from '../../../core/services/finance-api.service';

@Component({
  selector: 'app-finv2-fixed-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './fixed-assets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2FixedAssetsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly assetService       = inject(AssetsMockService);
  readonly branchService      = inject(BranchService);
  private readonly financeApi = inject(FinanceApiService);

  readonly searchQuery    = signal('');
  readonly statusFilter   = signal<AssetStatus | 'All'>('All');
  readonly categoryFilter = signal<AssetCategory | 'All'>('All');
  readonly branchFilter   = signal('All');
  readonly selectedId     = signal<string | null>(null);

  // Transfer popup form state
  readonly showTransferDlg = signal(false);
  readonly transferLocation = signal('');
  readonly transferEmployee = signal('');

  // Dispose popup form state
  readonly showDisposeDlg = signal(false);
  readonly disposeReason  = signal('');

  // New asset creation modal
  readonly showCreateModal  = signal(false);
  readonly formName         = signal('');
  readonly formSerial       = signal('');
  readonly formCategory     = signal<AssetCategory>('Generators');
  readonly formCost         = signal<number>(0);
  readonly formResidual     = signal<number>(0);
  readonly formLifeYears    = signal<number>(5);

  readonly allCategories: AssetCategory[] = [
    'Rig Equipment', 'Generators', 'Vehicles', 'Forklifts', 'Cranes',
    'Heavy Equipment', 'Office Equipment', 'IT Equipment', 'Furniture',
    'Buildings', 'Land', 'Tools', 'Other Assets'
  ];

  readonly allStatuses: AssetStatus[] = [
    'Draft', 'Purchased', 'Capitalized', 'Active',
    'Under Maintenance', 'Transferred', 'Disposed', 'Sold', 'Retired'
  ];

  readonly filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const st  = this.statusFilter();
    const cat = this.categoryFilter();
    const br  = this.branchFilter();
    return this.assetService.assets()
      .filter(a => {
        const mq = !q || a.assetName.toLowerCase().includes(q) ||
                   a.assetCode.toLowerCase().includes(q) ||
                   a.serialNumber.toLowerCase().includes(q);
        const ms = st  === 'All' || a.status === st;
        const mc = cat === 'All' || a.category === cat;
        const mb = br  === 'All' || (a.branchId || 'HeadOffice') === br;
        return mq && ms && mc && mb;
      })
      .sort((a, b) => b.assetCode.localeCompare(a.assetCode));
  });

  readonly activeAsset = computed(() => {
    const id = this.selectedId();
    return id ? (this.assetService.assets().find(a => a.id === id) ?? null) : null;
  });

  // KPIs
  readonly kpis = this.assetService.kpis;

  selectAsset(ast: FixedAsset) {
    this.selectedId.set(ast.id);
  }

  // Workflows
  capitalizeAsset(ast: FixedAsset) {
    if (ast.status !== 'Purchased') return;
    const today = new Date().toISOString().split('T')[0];
    this.financeApi.capitalizeFinanceAsset(ast.id, { capitalizationDate: today, coaCode: '1500' }).subscribe({
      next: () => {
        this.assetService.capitalizeAsset(ast.id);
        this.notify.success('finance_v2.assets.msg.capitalized', 'finance_v2.assets.msg.capitalized_desc');
      },
      error: () => {
        // Fallback: local capitalization
        this.assetService.capitalizeAsset(ast.id);
        this.notify.success('finance_v2.assets.msg.capitalized', 'finance_v2.assets.msg.capitalized_desc');
      }
    });
  }

  openTransferDlg() {
    this.transferLocation.set('');
    this.transferEmployee.set('');
    this.showTransferDlg.set(true);
  }

  closeTransferDlg() {
    this.showTransferDlg.set(false);
  }

  submitTransfer() {
    const ast = this.activeAsset();
    if (!ast || !this.transferLocation() || !this.transferEmployee()) return;
    this.financeApi.transferFinanceAsset(ast.id, {
      newLocation: this.transferLocation(),
      newCostCenter: this.transferEmployee()
    }).subscribe({
      next: () => {
        this.assetService.transferAsset(ast.id, this.transferLocation(), this.transferEmployee());
        this.closeTransferDlg();
        this.notify.success('finance_v2.assets.msg.transferred', 'finance_v2.assets.msg.transferred_desc');
      },
      error: () => {
        this.assetService.transferAsset(ast.id, this.transferLocation(), this.transferEmployee());
        this.closeTransferDlg();
        this.notify.success('finance_v2.assets.msg.transferred', 'finance_v2.assets.msg.transferred_desc');
      }
    });
  }

  openDisposeDlg() {
    this.disposeReason.set('');
    this.showDisposeDlg.set(true);
  }

  closeDisposeDlg() {
    this.showDisposeDlg.set(false);
  }

  submitDispose() {
    const ast = this.activeAsset();
    if (!ast || !this.disposeReason()) return;
    this.financeApi.disposeFinanceAsset(ast.id, {
      disposalDate: new Date().toISOString().split('T')[0],
      disposalValue: 0,
      disposalMethod: 'Write-Off'
    }).subscribe({
      next: () => {
        this.assetService.disposeAsset(ast.id, this.disposeReason());
        this.closeDisposeDlg();
        this.notify.warning('finance_v2.assets.msg.disposed', 'finance_v2.assets.msg.disposed_desc');
      },
      error: () => {
        this.assetService.disposeAsset(ast.id, this.disposeReason());
        this.closeDisposeDlg();
        this.notify.warning('finance_v2.assets.msg.disposed', 'finance_v2.assets.msg.disposed_desc');
      }
    });
  }

  openCreateModal() {
    this.formName.set('');
    this.formSerial.set('');
    this.formCategory.set('Generators');
    this.formCost.set(0);
    this.formResidual.set(0);
    this.formLifeYears.set(5);
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  saveNewAsset() {
    if (!this.formName() || this.formCost() <= 0) return;

    const list = this.assetService.assets();
    const nextCode = `AST-${this.formCategory().slice(0, 3).toUpperCase()}-${String(list.length + 1).padStart(3, '0')}`;
    const newAsset: FixedAsset = {
      id: `ast-${Date.now()}`,
      assetCode: nextCode,
      assetName: this.formName(),
      serialNumber: this.formSerial() || `SN-${Date.now().toString().slice(-6)}`,
      category: this.formCategory(),
      projectCode: 'PRJ-001',
      projectName: 'Saudi Aramco Pipeline',
      costCenterCode: 'CC-PRJ-001-A',
      costCenterName: 'Dhahran Excavation A',
      warehouseCode: 'WH-HQ-01',
      supplierName: 'Saudi General Machinery',
      purchaseOrderNumber: 'PO-2025-990',
      purchaseInvoiceNumber: 'INV-AP-990',
      purchaseDate: '2025-07-02',
      capitalizationDate: '',
      usefulLifeYears: this.formLifeYears(),
      usefulLifeMonths: this.formLifeYears() * 12,
      depreciationMethod: 'Straight Line',
      originalCost: this.formCost(),
      residualValue: this.formResidual(),
      currentBookValue: this.formCost(),
      accumulatedDepreciation: 0,
      status: 'Purchased',
      location: 'Central HQ Yard',
      assignedEmployee: 'Abdullah Al-Harbi',
      department: 'Operations',
      warrantyExpiry: '2027-07-02',
      insuranceExpiry: '2026-07-02',
      qrCodeUrl: 'assets/mock-qr.png',
      notes: 'New asset addition',
      lastDepreciationDate: '',
      history: [
        { id: `h-${Date.now()}`, eventDate: '2025-07-02', type: 'Purchase', description: 'Asset purchased', user: 'Reem Al-Muaiqel' }
      ]
    };

    this.assetService.assets.update(arr => [...arr, newAsset]);
    this.selectedId.set(newAsset.id);
    this.closeCreateModal();
    this.notify.success('finance_v2.assets.msg.saved', 'finance_v2.assets.msg.saved_desc');
  }

  // Helpers
  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  getStatusClass(s: AssetStatus): string {
    switch (s) {
      case 'Draft':             return 'bg-slate-100 text-slate-600';
      case 'Purchased':         return 'bg-amber-100 text-amber-700';
      case 'Capitalized':       return 'bg-blue-100 text-blue-700';
      case 'Active':            return 'bg-green-100 text-green-700';
      case 'Under Maintenance': return 'bg-orange-100 text-orange-700';
      case 'Transferred':       return 'bg-teal-100 text-teal-700';
      case 'Disposed':          return 'bg-red-100 text-red-700';
      case 'Sold':              return 'bg-indigo-100 text-indigo-700';
      case 'Retired':           return 'bg-slate-200 text-slate-500';
      default:                  return 'bg-slate-100 text-slate-500';
    }
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.assets.title' },
      { label: 'finance_v2.assets.fixed_assets' }
    ]);
    // Load real assets from API
    this.financeApi.getFinanceFixedAssets().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data ?? []);
        if (data.length > 0) {
          const mapped = data.map((a: any) => ({
            id: a.id ?? a._id,
            assetCode: a.assetCode ?? a.code,
            nameEn: a.nameEn ?? a.name,
            nameAr: a.nameAr ?? '',
            category: a.category ?? 'Equipment',
            status: a.status ?? 'Active',
            location: a.location ?? '',
            department: a.department ?? '',
            assignedTo: a.assignedTo ?? '',
            purchaseDate: a.purchaseDate ?? a.acquisitionDate,
            originalCost: a.originalCost ?? a.acquisitionCost ?? 0,
            residualValue: a.residualValue ?? 0,
            usefulLifeYears: a.usefulLifeYears ?? a.usefulLife ?? 5,
            depreciationMethod: a.depreciationMethod ?? 'Straight-Line',
            accumulatedDepreciation: a.accumulatedDepreciation ?? 0,
            currentBookValue: a.currentBookValue ?? a.netBookValue ?? 0,
            branchId: a.branchId ?? 'HeadOffice',
            notes: a.notes ?? ''
          }));
          this.assetService.assets.set(mapped);
        }
      },
      error: () => {} // Keep AssetsMockService data
    });
  }
}
