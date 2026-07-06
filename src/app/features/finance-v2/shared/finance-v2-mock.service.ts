// Finance V2 — Mock Data Service
// Path: src/app/features/finance-v2/shared/finance-v2-mock.service.ts
// Self-contained mock data — does NOT touch existing MockDataService

import { Injectable, signal } from '@angular/core';
import {
  CoaAccount, AccountBranch, CostCenter, FinanceDashboardKpi,
  RecentJournalEntry, RecentVendorInvoice, RecentCollection,
  MonthlyChartData, AgingBucket,
  JournalEntry, LedgerAccount, LedgerTransaction, TrialBalanceLine
} from './finance-v2.interfaces';


@Injectable({ providedIn: 'root' })
export class FinanceV2MockService {

  // ─── Chart of Accounts (Unified — no branch split) ──────────────────
  readonly accounts = signal<CoaAccount[]>([
    // === ASSETS (1000) ===
    { id:'a1',    code:'1000', nameEn:'Assets',                   nameAr:'الأصول',                         type:'Asset',     parentCode:null,   level:1, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:12_450_000, isExpanded:true },
      { id:'a11',   code:'1100', nameEn:'Current Assets',           nameAr:'الأصول المتداولة',               type:'Asset',     parentCode:'1000', level:2, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:4_320_000,  isExpanded:true },
        { id:'a111',  code:'1110', nameEn:'Cash on Hand',             nameAr:'النقدية في الصندوق',             type:'Asset',     parentCode:'1100', level:3, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:false, isReconciliation:true,  isConfidential:false, balance:280_000 },
        { id:'a112',  code:'1120', nameEn:'Bank Accounts',            nameAr:'الحسابات البنكية',               type:'Asset',     parentCode:'1100', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:true,  isConfidential:false, balance:1_840_000,  isExpanded:true },
          { id:'a1121', code:'1121', nameEn:'SAB Bank — Main',          nameAr:'بنك السعودي الأول — رئيسي',     type:'Asset',     parentCode:'1120', level:4, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:false, isReconciliation:true,  isConfidential:false, balance:1_240_000 },
          { id:'a1122', code:'1122', nameEn:'Riyad Bank — Payroll',     nameAr:'بنك الرياض — الرواتب',          type:'Asset',     parentCode:'1120', level:4, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:false, isReconciliation:true,  isConfidential:false, balance:600_000 },
        { id:'a113',  code:'1130', nameEn:'Accounts Receivable',     nameAr:'حسابات العملاء',                 type:'Asset',     parentCode:'1100', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:true,  isReconciliation:true,  isConfidential:false, balance:1_640_000 },
        { id:'a114',  code:'1140', nameEn:'Inventory',                nameAr:'المخزون',                       type:'Asset',     parentCode:'1100', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:true,  isReconciliation:false, isConfidential:false, balance:560_000 },
        { id:'a115',  code:'1150', nameEn:'Prepaid Expenses',         nameAr:'المصروفات المدفوعة مقدماً',     type:'Asset',     parentCode:'1100', level:3, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:0 },
      { id:'a12',   code:'1200', nameEn:'Fixed Assets',              nameAr:'الأصول الثابتة',                type:'Asset',     parentCode:'1000', level:2, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:8_130_000 },
        { id:'a121',  code:'1210', nameEn:'Equipment & Machinery',    nameAr:'الآلات والمعدات',                type:'Asset',     parentCode:'1200', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:true,  isReconciliation:false, isConfidential:false, balance:6_400_000 },
        { id:'a122',  code:'1220', nameEn:'Vehicles & Fleet',         nameAr:'المركبات والأسطول',              type:'Asset',     parentCode:'1200', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:true,  isReconciliation:false, isConfidential:false, balance:2_100_000 },
        { id:'a123',  code:'1230', nameEn:'Accumulated Depreciation', nameAr:'مجمع الاستهلاك',                type:'Asset',     parentCode:'1200', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:-370_000 },

    // === LIABILITIES (2000) ===
    { id:'l1',    code:'2000', nameEn:'Liabilities',               nameAr:'الالتزامات',                     type:'Liability', parentCode:null,   level:1, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:4_280_000,  isExpanded:true },
      { id:'l11',   code:'2100', nameEn:'Current Liabilities',       nameAr:'الالتزامات المتداولة',           type:'Liability', parentCode:'2000', level:2, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:2_780_000,  isExpanded:true },
        { id:'l111',  code:'2110', nameEn:'Accounts Payable',          nameAr:'الموردون الدائنون',              type:'Liability', parentCode:'2100', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:true,  isConfidential:false, balance:1_820_000 },
        { id:'l112',  code:'2120', nameEn:'VAT Payable',               nameAr:'ضريبة القيمة المضافة المستحقة', type:'Liability', parentCode:'2100', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:true,  isConfidential:false, balance:280_000 },
        { id:'l113',  code:'2130', nameEn:'Accrued Salaries',          nameAr:'الرواتب المستحقة',               type:'Liability', parentCode:'2100', level:3, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:680_000 },
      { id:'l12',   code:'2200', nameEn:'Long-term Liabilities',     nameAr:'الالتزامات طويلة الأجل',        type:'Liability', parentCode:'2000', level:2, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:1_500_000 },
        { id:'l121',  code:'2210', nameEn:'Bank Loans',                nameAr:'القروض البنكية',                 type:'Liability', parentCode:'2200', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:true,  isConfidential:true,  balance:1_500_000 },

    // === EQUITY (3000) ===
    { id:'e1',    code:'3000', nameEn:'Equity',                    nameAr:'حقوق الملكية',                   type:'Equity',    parentCode:null,   level:1, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:8_170_000 },
      { id:'e11',   code:'3100', nameEn:'Paid-in Capital',           nameAr:'رأس المال المدفوع',               type:'Equity',    parentCode:'3000', level:2, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:true,  balance:7_000_000 },
      { id:'e12',   code:'3200', nameEn:'Retained Earnings',         nameAr:'الأرباح المبقاة',                 type:'Equity',    parentCode:'3000', level:2, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:1_170_000 },

    // === REVENUE (4000) ===
    { id:'r1',    code:'4000', nameEn:'Revenue',                   nameAr:'الإيرادات',                      type:'Revenue',   parentCode:null,   level:1, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:9_240_000 },
      { id:'r11',   code:'4100', nameEn:'Service Revenue',           nameAr:'إيرادات الخدمات',                type:'Revenue',   parentCode:'4000', level:2, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:true,  isReconciliation:false, isConfidential:false, balance:7_800_000 },
      { id:'r12',   code:'4200', nameEn:'Project Revenue',           nameAr:'إيرادات المشاريع',               type:'Revenue',   parentCode:'4000', level:2, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:true,  isReconciliation:false, isConfidential:false, balance:1_440_000 },

    // === EXPENSES (5000) ===
    { id:'x1',    code:'5000', nameEn:'Expenses',                  nameAr:'المصروفات',                      type:'Expense',   parentCode:null,   level:1, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:7_680_000 },
      { id:'x11',   code:'5100', nameEn:'Operating Expenses',        nameAr:'المصروفات التشغيلية',            type:'Expense',   parentCode:'5000', level:2, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:true,  isReconciliation:false, isConfidential:false, balance:4_120_000 },
        { id:'x111',  code:'5110', nameEn:'Salaries & Benefits',      nameAr:'الرواتب والمزايا',               type:'Expense',   parentCode:'5100', level:3, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:true,  isReconciliation:false, isConfidential:true,  balance:2_840_000 },
        { id:'x112',  code:'5120', nameEn:'Fuel & Transportation',    nameAr:'الوقود والمواصلات',              type:'Expense',   parentCode:'5100', level:3, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:true,  isReconciliation:false, isConfidential:false, balance:680_000 },
        { id:'x113',  code:'5130', nameEn:'Maintenance & Repairs',    nameAr:'الصيانة والإصلاحات',             type:'Expense',   parentCode:'5100', level:3, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:true,  isReconciliation:false, isConfidential:false, balance:600_000 },
      { id:'x12',   code:'5200', nameEn:'General & Admin Expenses',  nameAr:'المصروفات العمومية والإدارية',   type:'Expense',   parentCode:'5000', level:2, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:2_160_000 },
        { id:'x121',  code:'5210', nameEn:'Office Rent',               nameAr:'إيجار المكاتب',                  type:'Expense',   parentCode:'5200', level:3, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:480_000 },
        { id:'x122',  code:'5220', nameEn:'Utilities',                 nameAr:'المرافق',                        type:'Expense',   parentCode:'5200', level:3, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:120_000 },
        { id:'x123',  code:'5230', nameEn:'Depreciation Expense',      nameAr:'مصروف الاستهلاك',                type:'Expense',   parentCode:'5200', level:3, currency:'SAR', status:'Active', allowManualEntries:false, requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:370_000 },
        { id:'x124',  code:'5240', nameEn:'Professional Fees',         nameAr:'الأتعاب المهنية',                type:'Expense',   parentCode:'5200', level:3, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:160_000 },
      { id:'x13',   code:'5300', nameEn:'Finance Costs',              nameAr:'التكاليف التمويلية',             type:'Expense',   parentCode:'5000', level:2, currency:'SAR', status:'Active', allowManualEntries:true,  requiresCostCenter:false, isReconciliation:false, isConfidential:false, balance:1_400_000 },
  ]);

  // ─── Cost Centers (Branch-Aware) ─────────────────────────────────
  readonly costCenters = signal<CostCenter[]>([
    // ═══════════════ HEAD OFFICE ═══════════════
    { id:'cc1',  code:'CC-100', nameEn:'Company Operations',           nameAr:'العمليات الرئيسية',                 type:'Department',     parentCode:null,     level:1, manager:'Ahmed Al-Rashidi',   status:'Active', budget:25_000_000, spent:18_200_000, childrenCount:4, branch:'HeadOffice', isExpanded:true },
      { id:'cc11', code:'CC-110', nameEn:'Field Operations',             nameAr:'العمليات الميدانية',               type:'Department',     parentCode:'CC-100', level:2, manager:'Khalid Al-Harbi',    status:'Active', budget:12_000_000, spent:9_400_000,  childrenCount:3, branch:'HeadOffice', isExpanded:true },
        { id:'cc111',code:'CC-111', nameEn:'Rig — DR-01 (Al-Sharqiyah)', nameAr:'حفار DR-01 (الشرقية)',             type:'Project',        parentCode:'CC-110', level:3, manager:'Faisal Al-Dosari',   status:'Active', budget:4_500_000,  spent:3_820_000,  childrenCount:0, branch:'HeadOffice' },
        { id:'cc112',code:'CC-112', nameEn:'Rig — DR-02 (Rub Al-Khali)', nameAr:'حفار DR-02 (الربع الخالي)',        type:'Project',        parentCode:'CC-110', level:3, manager:'Mohammed Al-Ghamdi', status:'Active', budget:4_200_000,  spent:3_100_000,  childrenCount:0, branch:'HeadOffice' },
        { id:'cc113',code:'CC-113', nameEn:'Camp — Ras Tanura',           nameAr:'مخيم رأس تنورة',                   type:'Project',        parentCode:'CC-110', level:3, manager:'Nasser Al-Shehri',   status:'Active', budget:3_300_000,  spent:2_480_000,  childrenCount:0, branch:'HeadOffice' },
      { id:'cc12', code:'CC-120', nameEn:'Maintenance Division',         nameAr:'قسم الصيانة',                      type:'Department',     parentCode:'CC-100', level:2, manager:'Ibrahim Al-Zahrani', status:'Active', budget:5_000_000,  spent:3_600_000,  childrenCount:2, branch:'HeadOffice' },
        { id:'cc121',code:'CC-121', nameEn:'Mechanical Maintenance',      nameAr:'الصيانة الميكانيكية',              type:'Department',     parentCode:'CC-120', level:3, manager:'Saad Al-Otaibi',     status:'Active', budget:2_800_000,  spent:2_100_000,  childrenCount:0, branch:'HeadOffice' },
        { id:'cc122',code:'CC-122', nameEn:'Electrical Maintenance',      nameAr:'الصيانة الكهربائية',               type:'Department',     parentCode:'CC-120', level:3, manager:'Turki Al-Anazi',     status:'Active', budget:2_200_000,  spent:1_500_000,  childrenCount:0, branch:'HeadOffice' },
      { id:'cc13', code:'CC-130', nameEn:'Warehouse & Logistics',        nameAr:'المستودعات والخدمات اللوجستية',   type:'Department',     parentCode:'CC-100', level:2, manager:'Rami Al-Juhani',     status:'Active', budget:4_000_000,  spent:2_800_000,  childrenCount:0, branch:'HeadOffice' },
      { id:'cc14', code:'CC-140', nameEn:'Fleet Management',             nameAr:'إدارة الأسطول',                    type:'Department',     parentCode:'CC-100', level:2, manager:'Walid Al-Bishi',     status:'Active', budget:4_000_000,  spent:2_400_000,  childrenCount:0, branch:'HeadOffice' },
    { id:'cc2',  code:'CC-200', nameEn:'Administration',               nameAr:'الإدارة',                           type:'Administrative', parentCode:null,     level:1, manager:'Sara Al-Rasheed',    status:'Active', budget:6_000_000,  spent:3_200_000,  childrenCount:3, branch:'HeadOffice' },
      { id:'cc21', code:'CC-210', nameEn:'Finance & Accounting',         nameAr:'المالية والمحاسبة',                type:'Administrative', parentCode:'CC-200', level:2, manager:'Reem Al-Muaiqel',   status:'Active', budget:1_800_000,  spent:900_000,    childrenCount:0, branch:'HeadOffice' },
      { id:'cc22', code:'CC-220', nameEn:'Human Resources',              nameAr:'الموارد البشرية',                  type:'Administrative', parentCode:'CC-200', level:2, manager:'Hala Al-Dossary',    status:'Active', budget:2_000_000,  spent:1_100_000,  childrenCount:0, branch:'HeadOffice' },
      { id:'cc23', code:'CC-230', nameEn:'IT & Systems',                 nameAr:'تقنية المعلومات',                  type:'Administrative', parentCode:'CC-200', level:2, manager:'Omar Al-Yahya',      status:'Active', budget:2_200_000,  spent:1_200_000,  childrenCount:0, branch:'HeadOffice' },
    { id:'cc3',  code:'CC-300', nameEn:'Projects Division',            nameAr:'قسم المشاريع',                     type:'Overhead',       parentCode:null,     level:1, manager:'Abdulaziz Al-Turki', status:'Active', budget:8_000_000,  spent:5_100_000,  childrenCount:2, branch:'HeadOffice' },
      { id:'cc31', code:'CC-310', nameEn:'ARAMCO Contract — Zone A',     nameAr:'عقد أرامكو — المنطقة أ',           type:'Project',        parentCode:'CC-300', level:2, manager:'Sultan Al-Qahtani',  status:'Active', budget:5_000_000,  spent:3_200_000,  childrenCount:0, branch:'HeadOffice' },
      { id:'cc32', code:'CC-320', nameEn:'SABIC Contract — Jubail',      nameAr:'عقد سابك — الجبيل',                type:'Project',        parentCode:'CC-300', level:2, manager:'Bandar Al-Rubaish',  status:'Active', budget:3_000_000,  spent:1_900_000,  childrenCount:0, branch:'HeadOffice' },
    { id:'cc4',  code:'CC-400', nameEn:'HSE Division',                 nameAr:'قسم السلامة والصحة المهنية',      type:'Overhead',       parentCode:null,     level:1, manager:'Mishal Al-Qahtani',  status:'Active', budget:2_000_000,  spent:800_000,    childrenCount:0, branch:'HeadOffice' },

    // ═══════════════ FREE ZONE ═══════════════
    { id:'fz-cc1',  code:'FZ-CC-100', nameEn:'Free Zone Operations',        nameAr:'عمليات المنطقة الحرة',             type:'Department',     parentCode:null,          level:1, manager:'Tariq Al-Mansouri',  status:'Active', budget:18_000_000, spent:11_400_000, childrenCount:3, branch:'FreeZone', isExpanded:true },
      { id:'fz-cc11', code:'FZ-CC-110', nameEn:'Offshore Operations',         nameAr:'العمليات البحرية',                 type:'Department',     parentCode:'FZ-CC-100',   level:2, manager:'Samir Al-Hamdan',    status:'Active', budget:8_000_000,  spent:5_200_000,  childrenCount:2, branch:'FreeZone', isExpanded:true },
        { id:'fz-cc111',code:'FZ-CC-111', nameEn:'Platform — Alpha',            nameAr:'منصة ألفا البحرية',                type:'Project',        parentCode:'FZ-CC-110',   level:3, manager:'Rashed Al-Bloushi',  status:'Active', budget:4_500_000,  spent:2_900_000,  childrenCount:0, branch:'FreeZone' },
        { id:'fz-cc112',code:'FZ-CC-112', nameEn:'Platform — Beta',             nameAr:'منصة بيتا البحرية',                type:'Project',        parentCode:'FZ-CC-110',   level:3, manager:'Khalifa Al-Maktoum', status:'Active', budget:3_500_000,  spent:2_300_000,  childrenCount:0, branch:'FreeZone' },
      { id:'fz-cc12', code:'FZ-CC-120', nameEn:'Export Processing',           nameAr:'وحدة معالجة التصدير',              type:'Department',     parentCode:'FZ-CC-100',   level:2, manager:'Layla Al-Rashid',    status:'Active', budget:6_000_000,  spent:3_800_000,  childrenCount:0, branch:'FreeZone' },
      { id:'fz-cc13', code:'FZ-CC-130', nameEn:'Customs & Compliance',        nameAr:'الجمارك والامتثال',                type:'Administrative', parentCode:'FZ-CC-100',   level:2, manager:'Nora Al-Zaabi',      status:'Active', budget:4_000_000,  spent:2_400_000,  childrenCount:0, branch:'FreeZone' },
    { id:'fz-cc2',  code:'FZ-CC-200', nameEn:'FZ Administration',           nameAr:'إدارة المنطقة الحرة',              type:'Administrative', parentCode:null,          level:1, manager:'Dana Al-Falasi',     status:'Active', budget:4_500_000,  spent:2_100_000,  childrenCount:2, branch:'FreeZone' },
      { id:'fz-cc21', code:'FZ-CC-210', nameEn:'FZ Finance',                  nameAr:'مالية المنطقة الحرة',              type:'Administrative', parentCode:'FZ-CC-200',   level:2, manager:'Maryam Al-Sayed',    status:'Active', budget:2_000_000,  spent:900_000,    childrenCount:0, branch:'FreeZone' },
      { id:'fz-cc22', code:'FZ-CC-220', nameEn:'FZ Legal & Regulatory',       nameAr:'الشؤون القانونية والتنظيمية',     type:'Administrative', parentCode:'FZ-CC-200',   level:2, manager:'Hind Al-Mazrouei',   status:'Active', budget:2_500_000,  spent:1_200_000,  childrenCount:0, branch:'FreeZone' },
    { id:'fz-cc3',  code:'FZ-CC-300', nameEn:'LNG Export Projects',         nameAr:'مشاريع تصدير الغاز المسال',        type:'Overhead',       parentCode:null,          level:1, manager:'Yousef Al-Owais',    status:'Active', budget:12_000_000, spent:7_600_000,  childrenCount:2, branch:'FreeZone' },
      { id:'fz-cc31', code:'FZ-CC-310', nameEn:'LNG Terminal — Port Rashid',  nameAr:'محطة الغاز المسال — بورت راشد',  type:'Project',        parentCode:'FZ-CC-300',   level:2, manager:'Hamad Al-Nuaimi',    status:'Active', budget:7_000_000,  spent:4_500_000,  childrenCount:0, branch:'FreeZone' },
      { id:'fz-cc32', code:'FZ-CC-320', nameEn:'Pipeline — South Corridor',  nameAr:'خط الأنابيب — الممر الجنوبي',     type:'Project',        parentCode:'FZ-CC-300',   level:2, manager:'Sultan Al-Muhairi',  status:'Active', budget:5_000_000,  spent:3_100_000,  childrenCount:0, branch:'FreeZone' },
  ]);

  // ─── Dashboard KPIs ───────────────────────────────────────────────
  readonly dashboardKpis = signal<FinanceDashboardKpi>({
    totalAssets: 12_450_000,
    totalLiabilities: 4_280_000,
    equity: 8_170_000,
    cash: 280_000,
    bankBalance: 1_840_000,
    accountsReceivable: 1_640_000,
    accountsPayable: 1_820_000,
    monthRevenue: 920_000,
    monthExpenses: 680_000,
    netProfit: 240_000
  });

  // ─── Monthly Chart Data ───────────────────────────────────────────
  readonly monthlyData = signal<MonthlyChartData[]>([
    { month: 'Jan', revenue: 720_000, expenses: 540_000, profit: 180_000, cashInflow: 680_000, cashOutflow: 610_000 },
    { month: 'Feb', revenue: 810_000, expenses: 590_000, profit: 220_000, cashInflow: 790_000, cashOutflow: 620_000 },
    { month: 'Mar', revenue: 760_000, expenses: 620_000, profit: 140_000, cashInflow: 840_000, cashOutflow: 700_000 },
    { month: 'Apr', revenue: 900_000, expenses: 650_000, profit: 250_000, cashInflow: 920_000, cashOutflow: 680_000 },
    { month: 'May', revenue: 850_000, expenses: 610_000, profit: 240_000, cashInflow: 860_000, cashOutflow: 640_000 },
    { month: 'Jun', revenue: 980_000, expenses: 700_000, profit: 280_000, cashInflow: 950_000, cashOutflow: 710_000 },
    { month: 'Jul', revenue: 920_000, expenses: 680_000, profit: 240_000, cashInflow: 900_000, cashOutflow: 660_000 },
  ]);

  // ─── AP Aging ─────────────────────────────────────────────────────
  readonly apAging = signal<AgingBucket[]>([
    { label: 'Current', amount: 680_000, count: 12, color: '#22c55e' },
    { label: '1-30 Days', amount: 420_000, count: 8, color: '#f59e0b' },
    { label: '31-60 Days', amount: 320_000, count: 5, color: '#f97316' },
    { label: '61-90 Days', amount: 240_000, count: 3, color: '#ef4444' },
    { label: '90+ Days', amount: 160_000, count: 2, color: '#7f1d1d' },
  ]);

  // ─── AR Aging ─────────────────────────────────────────────────────
  readonly arAging = signal<AgingBucket[]>([
    { label: 'Current', amount: 820_000, count: 14, color: '#22c55e' },
    { label: '1-30 Days', amount: 380_000, count: 7, color: '#f59e0b' },
    { label: '31-60 Days', amount: 240_000, count: 4, color: '#f97316' },
    { label: '61-90 Days', amount: 140_000, count: 2, color: '#ef4444' },
    { label: '90+ Days', amount: 60_000, count: 1, color: '#7f1d1d' },
  ]);

  // ─── Recent Activity ──────────────────────────────────────────────
  readonly recentJournals = signal<RecentJournalEntry[]>([
    { id:'j1', number:'JE-2025-0047', date:'2025-06-30', description:'June Payroll Posting', amount:680_000, status:'Posted', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'j2', number:'JE-2025-0046', date:'2025-06-28', description:'Fuel Expense Accrual — Rigs', amount:84_000, status:'Posted', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'j3', number:'JE-2025-0045', date:'2025-06-25', description:'ARAMCO Invoice Receipt', amount:920_000, status:'Posted', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'j4', number:'JE-2025-0044', date:'2025-06-20', description:'Depreciation Run — June', amount:30_833, status:'Posted', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'j5', number:'JE-2025-0043', date:'2025-06-18', description:'Office Rent — Q2 Accrual', amount:40_000, status:'Draft', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'j_fz1', number:'JE-FZ-2025-0001', date:'2025-06-30', description:'FZ June Operations Accrual', amount:120_000, status:'Posted', branchId:'FreeZone', branchName:'Free Zone' },
  ]);

  readonly recentVendorInvoices = signal<RecentVendorInvoice[]>([
    { id:'vi1', invoiceNumber:'INV-AL-2024', vendor:'Al-Rashid Steel', date:'2025-06-29', amount:284_000, status:'Approved', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'vi2', invoiceNumber:'INV-SAB-1198', vendor:'SABIC Trading', date:'2025-06-27', amount:142_500, status:'Draft', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'vi3', invoiceNumber:'INV-NAT-0882', vendor:'National Gas Co.', date:'2025-06-25', amount:96_000, status:'Paid', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'vi4', invoiceNumber:'INV-GUL-3310', vendor:'Gulf Equipment', date:'2025-06-22', amount:380_000, status:'Approved', branchId:'HeadOffice', branchName:'Head Office' },
    { id:'vi_fz1', invoiceNumber:'INV-FZ-PET-01', vendor:'PetroChemicals FZ', date:'2025-06-18', amount:220_000, status:'Approved', branchId:'FreeZone', branchName:'Free Zone' },
  ]);

  readonly recentCollections = signal<RecentCollection[]>([
    { id:'c1', receiptNumber:'REC-2025-0122', customer:'Saudi Aramco', date:'2025-06-30', amount:1_200_000, branchId:'HeadOffice', branchName:'Head Office' },
    { id:'c2', receiptNumber:'REC-2025-0121', customer:'SABIC', date:'2025-06-26', amount:450_000, branchId:'HeadOffice', branchName:'Head Office' },
    { id:'c3', receiptNumber:'REC-2025-0120', customer:'Maaden', date:'2025-06-20', amount:320_000, branchId:'HeadOffice', branchName:'Head Office' },
    { id:'c_fz1', receiptNumber:'REC-FZ-001', customer:'SEC FreeZone', date:'2025-06-14', amount:180_000, branchId:'FreeZone', branchName:'Free Zone' },
  ]);

  // ─── Journal Entries (Phase 3) ────────────────────────────────────
  readonly journalEntries = signal<JournalEntry[]>([
    {
      id:'je1', journalNumber:'JE-2025-0047', date:'2025-06-30', reference:'PAY-JUN-2025',
      description:'June 2025 Payroll Posting', currency:'SAR', projectCode:'CC-110',
      costCenterCode:'CC-210', remarks:'Monthly payroll — all departments', status:'Posted',
      createdBy:'Reem Al-Muaiqel', approvedBy:'Sara Al-Rasheed',
      createdDate:'2025-06-29', postedDate:'2025-06-30',
      reversedDate:'', reversedJournalNumber:'',
      totalDebit:680_000, totalCredit:680_000, isBalanced:true,
      branchId:'HeadOffice', branchName:'Head Office',
      lines:[
        { id:'l1', accountCode:'5110', accountNameEn:'Salaries & Benefits', accountNameAr:'الرواتب والمزايا', costCenterCode:'CC-210', projectCode:'', description:'June Salaries', debit:600_000, credit:0, notes:'', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'l2', accountCode:'5110', accountNameEn:'Salaries & Benefits', accountNameAr:'الرواتب والمزايا', costCenterCode:'CC-110', projectCode:'CC-111', description:'Field crew salaries', debit:80_000, credit:0, notes:'', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'l3', accountCode:'1122', accountNameEn:'Riyad Bank — Payroll', accountNameAr:'بنك الرياض — الرواتب', costCenterCode:'', projectCode:'', description:'Payroll transfer', debit:0, credit:680_000, notes:'Batch transfer 2025-06-30', branchId:'HeadOffice', branchName:'Head Office' },
      ]
    },
    {
      id:'je2', journalNumber:'JE-2025-0046', date:'2025-06-28', reference:'FUEL-JUN-2025',
      description:'Fuel Expense Accrual — Rigs', currency:'SAR', projectCode:'CC-110',
      costCenterCode:'CC-111', remarks:'Fuel consumed by DR-01 and DR-02', status:'Posted',
      createdBy:'Reem Al-Muaiqel', approvedBy:'Sara Al-Rasheed',
      createdDate:'2025-06-27', postedDate:'2025-06-28',
      reversedDate:'', reversedJournalNumber:'',
      totalDebit:84_000, totalCredit:84_000, isBalanced:true,
      branchId:'HeadOffice', branchName:'Head Office',
      lines:[
        { id:'l4', accountCode:'5120', accountNameEn:'Fuel & Transportation', accountNameAr:'الوقود والمواصلات', costCenterCode:'CC-111', projectCode:'CC-111', description:'DR-01 Diesel — June', debit:48_000, credit:0, notes:'', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'l5', accountCode:'5120', accountNameEn:'Fuel & Transportation', accountNameAr:'الوقود والمواصلات', costCenterCode:'CC-112', projectCode:'CC-112', description:'DR-02 Diesel — June', debit:36_000, credit:0, notes:'', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'l6', accountCode:'2110', accountNameEn:'Accounts Payable', accountNameAr:'الموردون الدائنون', costCenterCode:'', projectCode:'', description:'Accrued fuel payable', debit:0, credit:84_000, notes:'Supplier: National Gas Co.', branchId:'HeadOffice', branchName:'Head Office' },
      ]
    },
    {
      id:'je3', journalNumber:'JE-2025-0045', date:'2025-06-25', reference:'AR-INV-9920',
      description:'ARAMCO Invoice Receipt', currency:'SAR', projectCode:'CC-310',
      costCenterCode:'CC-310', remarks:'Collection for contract invoice AR-INV-9920', status:'Posted',
      createdBy:'Reem Al-Muaiqel', approvedBy:'Abdulaziz Al-Turki',
      createdDate:'2025-06-24', postedDate:'2025-06-25',
      reversedDate:'', reversedJournalNumber:'',
      totalDebit:920_000, totalCredit:920_000, isBalanced:true,
      branchId:'HeadOffice', branchName:'Head Office',
      lines:[
        { id:'l7', accountCode:'1121', accountNameEn:'SAB Bank — Main', accountNameAr:'بنك السعودي الأول — رئيسي', costCenterCode:'', projectCode:'', description:'Aramco payment received', debit:920_000, credit:0, notes:'', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'l8', accountCode:'1130', accountNameEn:'Accounts Receivable', accountNameAr:'حسابات العملاء', costCenterCode:'CC-310', projectCode:'CC-310', description:'Invoice settlement', debit:0, credit:920_000, notes:'Aramco contract zone A', branchId:'HeadOffice', branchName:'Head Office' },
      ]
    },
    {
      id:'je4', journalNumber:'JE-2025-0044', date:'2025-06-20', reference:'DEP-JUN-2025',
      description:'Monthly Depreciation Run — June 2025', currency:'SAR', projectCode:'',
      costCenterCode:'', remarks:'Straight-line depreciation all assets', status:'Posted',
      createdBy:'Reem Al-Muaiqel', approvedBy:'Sara Al-Rasheed',
      createdDate:'2025-06-20', postedDate:'2025-06-20',
      reversedDate:'', reversedJournalNumber:'',
      totalDebit:30_833, totalCredit:30_833, isBalanced:true,
      branchId:'HeadOffice', branchName:'Head Office',
      lines:[
        { id:'l9', accountCode:'5230', accountNameEn:'Depreciation Expense', accountNameAr:'مصروف الاستهلاك', costCenterCode:'', projectCode:'', description:'June depreciation charge', debit:30_833, credit:0, notes:'', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'l10', accountCode:'1230', accountNameEn:'Accumulated Depreciation', accountNameAr:'مجمع الاستهلاك', costCenterCode:'', projectCode:'', description:'Accumulated charge', debit:0, credit:30_833, notes:'', branchId:'HeadOffice', branchName:'Head Office' },
      ]
    },
    {
      id:'je5', journalNumber:'JE-2025-0043', date:'2025-06-18', reference:'RENT-Q2-2025',
      description:'Office Rent — Q2 2025 Accrual', currency:'SAR', projectCode:'',
      costCenterCode:'CC-220', remarks:'Quarterly rent accrual for Riyadh HQ', status:'Draft',
      createdBy:'Reem Al-Muaiqel', approvedBy:'',
      createdDate:'2025-06-18', postedDate:'', reversedDate:'', reversedJournalNumber:'',
      totalDebit:40_000, totalCredit:40_000, isBalanced:true,
      branchId:'HeadOffice', branchName:'Head Office',
      lines:[
        { id:'l11', accountCode:'5210', accountNameEn:'Office Rent', accountNameAr:'إيجار المكاتب', costCenterCode:'CC-220', projectCode:'', description:'Q2 rent — Riyadh HQ', debit:40_000, credit:0, notes:'', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'l12', accountCode:'2110', accountNameEn:'Accounts Payable', accountNameAr:'الموردون الدائنون', costCenterCode:'', projectCode:'', description:'Rent payable to landlord', debit:0, credit:40_000, notes:'', branchId:'HeadOffice', branchName:'Head Office' },
      ]
    },
    {
      id:'je_fz_1', journalNumber:'JE-FZ-2025-0001', date:'2025-06-30', reference:'FZ-PAY-JUN-2025',
      description:'FZ June 2025 Payroll Posting', currency:'SAR', projectCode:'CC-110',
      costCenterCode:'CC-210', remarks:'Monthly payroll — Free Zone', status:'Posted',
      createdBy:'Reem Al-Muaiqel', approvedBy:'Sara Al-Rasheed',
      createdDate:'2025-06-29', postedDate:'2025-06-30',
      reversedDate:'', reversedJournalNumber:'',
      totalDebit:180_000, totalCredit:180_000, isBalanced:true,
      branchId:'FreeZone', branchName:'Free Zone',
      lines:[
        { id:'l_fz1', accountCode:'FZ.5110', accountNameEn:'Salaries & Benefits', accountNameAr:'الرواتب والمزايا', costCenterCode:'CC-210', projectCode:'', description:'June FZ Salaries', debit:180_000, credit:0, notes:'', branchId:'FreeZone', branchName:'Free Zone' },
        { id:'l_fz2', accountCode:'FZ.1110', accountNameEn:'Cash on Hand', accountNameAr:'النقدية في الصندوق', costCenterCode:'', projectCode:'', description:'Cash paid out', debit:0, credit:180_000, notes:'Cash payment', branchId:'FreeZone', branchName:'Free Zone' },
      ]
    }
  ]);

  // ─── General Ledger Accounts (Phase 3) ───────────────────────────
  readonly ledgerAccounts = signal<LedgerAccount[]>([
    {
      accountCode: '1121', accountNameEn: 'SAB Bank — Main', accountNameAr: 'بنك السعودي الأول — رئيسي',
      openingBalance: 800_000, openingBalanceType: 'Dr',
      transactions: [
        { id:'t1', date:'2025-06-02', journalNumber:'JE-2025-0039', reference:'INV-SABIC-REV', description:'SABIC invoice receipt', debit:0, credit:0, runningBalance:800_000, balanceType:'Dr', sourceModule:'Journal', sourceDocument:'JE-2025-0039', costCenterCode:'CC-310', projectCode:'CC-320', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t2', date:'2025-06-10', journalNumber:'JE-2025-0041', reference:'VAT-MAY-2025', description:'ZATCA VAT payment', debit:0, credit:62_000, runningBalance:738_000, balanceType:'Dr', sourceModule:'Journal', sourceDocument:'JE-2025-0041', costCenterCode:'', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t3', date:'2025-06-25', journalNumber:'JE-2025-0045', reference:'AR-INV-9920', description:'ARAMCO payment received', debit:920_000, credit:0, runningBalance:1_658_000, balanceType:'Dr', sourceModule:'Journal', sourceDocument:'JE-2025-0045', costCenterCode:'', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t4', date:'2025-06-30', journalNumber:'JE-2025-0047', reference:'PAY-JUN-2025', description:'Payroll outflow', debit:0, credit:418_000, runningBalance:1_240_000, balanceType:'Dr', sourceModule:'Payroll', sourceDocument:'PAY-JUN-2025', costCenterCode:'CC-210', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
      ]
    },
    {
      accountCode: '1130', accountNameEn: 'Accounts Receivable', accountNameAr: 'حسابات العملاء',
      openingBalance: 2_110_000, openingBalanceType: 'Dr',
      transactions: [
        { id:'t5', date:'2025-06-02', journalNumber:'JE-2025-0039', reference:'INV-SABIC-REV', description:'SABIC invoice raised', debit:450_000, credit:0, runningBalance:2_560_000, balanceType:'Dr', sourceModule:'AR', sourceDocument:'INV-SABIC-2025-06', costCenterCode:'CC-320', projectCode:'CC-320', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t6', date:'2025-06-14', journalNumber:'JE-2025-0048', reference:'REC-2025-0120', description:'Maaden collection', debit:0, credit:320_000, runningBalance:2_240_000, balanceType:'Dr', sourceModule:'AR', sourceDocument:'REC-2025-0120', costCenterCode:'CC-300', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t7', date:'2025-06-25', journalNumber:'JE-2025-0045', reference:'AR-INV-9920', description:'ARAMCO settled', debit:0, credit:920_000, runningBalance:1_320_000, balanceType:'Dr', sourceModule:'Journal', sourceDocument:'JE-2025-0045', costCenterCode:'CC-310', projectCode:'CC-310', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t8', date:'2025-06-26', journalNumber:'JE-2025-0049', reference:'REC-2025-0121', description:'SABIC collection', debit:0, credit:450_000, runningBalance:870_000, balanceType:'Dr', sourceModule:'AR', sourceDocument:'REC-2025-0121', costCenterCode:'CC-300', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t9', date:'2025-06-30', journalNumber:'JE-2025-0050', reference:'REC-2025-0122', description:'Aramco additional', debit:0, credit:50_000, runningBalance:820_000, balanceType:'Dr', sourceModule:'AR', sourceDocument:'REC-2025-0122', costCenterCode:'CC-310', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
      ]
    },
    {
      accountCode: '5110', accountNameEn: 'Salaries & Benefits', accountNameAr: 'الرواتب والمزايا',
      openingBalance: 2_160_000, openingBalanceType: 'Dr',
      transactions: [
        { id:'t10', date:'2025-06-30', journalNumber:'JE-2025-0047', reference:'PAY-JUN-2025', description:'June salaries — HQ', debit:600_000, credit:0, runningBalance:2_760_000, balanceType:'Dr', sourceModule:'Payroll', sourceDocument:'PAY-JUN-2025', costCenterCode:'CC-210', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t11', date:'2025-06-30', journalNumber:'JE-2025-0047', reference:'PAY-JUN-2025', description:'June salaries — Field', debit:80_000, credit:0, runningBalance:2_840_000, balanceType:'Dr', sourceModule:'Payroll', sourceDocument:'PAY-JUN-2025', costCenterCode:'CC-110', projectCode:'CC-111', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
      ]
    },
    {
      accountCode: '2110', accountNameEn: 'Accounts Payable', accountNameAr: 'الموردون الدائنون',
      openingBalance: 1_574_000, openingBalanceType: 'Cr',
      transactions: [
        { id:'t12', date:'2025-06-15', journalNumber:'JE-2025-0042', reference:'MAINT-RIG01', description:'Gulf Equipment invoice', debit:0, credit:120_000, runningBalance:1_694_000, balanceType:'Cr', sourceModule:'AP', sourceDocument:'INV-GUL-3310', costCenterCode:'CC-121', projectCode:'CC-111', createdBy:'Ibrahim Al-Zahrani', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t13', date:'2025-06-18', journalNumber:'JE-2025-0043', reference:'RENT-Q2-2025', description:'Q2 rent payable', debit:0, credit:40_000, runningBalance:1_734_000, balanceType:'Cr', sourceModule:'AP', sourceDocument:'RENT-HQ-Q2', costCenterCode:'CC-220', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t14', date:'2025-06-28', journalNumber:'JE-2025-0046', reference:'FUEL-JUN-2025', description:'Fuel payable', debit:0, credit:84_000, runningBalance:1_818_000, balanceType:'Cr', sourceModule:'AP', sourceDocument:'INV-NAT-0882', costCenterCode:'CC-111', projectCode:'CC-111', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
        { id:'t15', date:'2025-06-29', journalNumber:'JE-2025-0051', reference:'PAY-STEEL', description:'Al-Rashid Steel payment', debit:284_000, credit:0, runningBalance:1_534_000, balanceType:'Cr', sourceModule:'AP', sourceDocument:'INV-AL-2024', costCenterCode:'', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'HeadOffice', branchName:'Head Office' },
      ]
    },
    {
      accountCode: 'FZ.5110', accountNameEn: 'Salaries & Benefits', accountNameAr: 'الرواتب والمزايا',
      openingBalance: 120_000, openingBalanceType: 'Dr',
      transactions: [
        { id:'t_fz10', date:'2025-06-30', journalNumber:'JE-FZ-2025-0001', reference:'FZ-PAY-JUN-2025', description:'June FZ salaries', debit:180_000, credit:0, runningBalance:300_000, balanceType:'Dr', sourceModule:'Payroll', sourceDocument:'FZ-PAY-JUN-2025', costCenterCode:'CC-210', projectCode:'', createdBy:'Reem Al-Muaiqel', branchId:'FreeZone', branchName:'Free Zone' }
      ]
    }
  ]);

  // ─── Trial Balance Lines (Phase 3) ───────────────────────────────
  readonly trialBalanceLines = signal<TrialBalanceLine[]>([
    // ASSETS
    { id:'tb1',  accountCode:'1000', accountNameEn:'Assets',                  accountNameAr:'الأصول',                          accountType:'Asset',     level:1, openingDebit:11_530_000, openingCredit:0,         periodDebit:920_000,   periodCredit:1_000_000, closingDebit:11_450_000, closingCredit:0 },
    { id:'tb2',  accountCode:'1100', accountNameEn:'Current Assets',           accountNameAr:'الأصول المتداولة',                accountType:'Asset',     level:2, openingDebit:3_400_000,  openingCredit:0,         periodDebit:920_000,   periodCredit:1_000_000, closingDebit:3_320_000,  closingCredit:0 },
    { id:'tb3',  accountCode:'1110', accountNameEn:'Cash on Hand',             accountNameAr:'النقدية في الصندوق',              accountType:'Asset',     level:3, openingDebit:280_000,    openingCredit:0,         periodDebit:0,         periodCredit:0,         closingDebit:280_000,    closingCredit:0 },
    { id:'tb4',  accountCode:'1120', accountNameEn:'Bank Accounts',            accountNameAr:'الحسابات البنكية',                accountType:'Asset',     level:3, openingDebit:1_700_000,  openingCredit:0,         periodDebit:920_000,   periodCredit:780_000,   closingDebit:1_840_000,  closingCredit:0 },
    { id:'tb5',  accountCode:'1130', accountNameEn:'Accounts Receivable',      accountNameAr:'حسابات العملاء',                  accountType:'Asset',     level:3, openingDebit:2_110_000,  openingCredit:0,         periodDebit:450_000,   periodCredit:1_740_000, closingDebit:820_000,    closingCredit:0 },
    { id:'tb6',  accountCode:'1140', accountNameEn:'Inventory',                accountNameAr:'المخزون',                         accountType:'Asset',     level:3, openingDebit:560_000,    openingCredit:0,         periodDebit:0,         periodCredit:0,         closingDebit:560_000,    closingCredit:0 },
    { id:'tb7',  accountCode:'1200', accountNameEn:'Fixed Assets',             accountNameAr:'الأصول الثابتة',                  accountType:'Asset',     level:2, openingDebit:8_130_000,  openingCredit:0,         periodDebit:0,         periodCredit:30_833,    closingDebit:8_099_167,  closingCredit:0 },
    // LIABILITIES
    { id:'tb8',  accountCode:'2000', accountNameEn:'Liabilities',              accountNameAr:'الالتزامات',                      accountType:'Liability', level:1, openingDebit:0,          openingCredit:3_934_000, periodDebit:284_000,   periodCredit:644_000,   closingDebit:0,          closingCredit:4_294_000 },
    { id:'tb9',  accountCode:'2100', accountNameEn:'Current Liabilities',      accountNameAr:'الالتزامات المتداولة',            accountType:'Liability', level:2, openingDebit:0,          openingCredit:2_434_000, periodDebit:284_000,   periodCredit:644_000,   closingDebit:0,          closingCredit:2_794_000 },
    { id:'tb10', accountCode:'2110', accountNameEn:'Accounts Payable',         accountNameAr:'الموردون الدائنون',               accountType:'Liability', level:3, openingDebit:0,          openingCredit:1_574_000, periodDebit:284_000,   periodCredit:530_000,   closingDebit:0,          closingCredit:1_820_000 },
    { id:'tb11', accountCode:'2120', accountNameEn:'VAT Payable',              accountNameAr:'ضريبة القيمة المضافة المستحقة',   accountType:'Liability', level:3, openingDebit:0,          openingCredit:342_000,   periodDebit:62_000,    periodCredit:0,         closingDebit:0,          closingCredit:280_000 },
    { id:'tb12', accountCode:'2130', accountNameEn:'Accrued Salaries',         accountNameAr:'الرواتب المستحقة',                accountType:'Liability', level:3, openingDebit:0,          openingCredit:518_000,   periodDebit:0,         periodCredit:162_000,   closingDebit:0,          closingCredit:680_000 },
    { id:'tb13', accountCode:'2200', accountNameEn:'Long-term Liabilities',    accountNameAr:'الالتزامات طويلة الأجل',          accountType:'Liability', level:2, openingDebit:0,          openingCredit:1_500_000, periodDebit:0,         periodCredit:18_750,    closingDebit:0,          closingCredit:1_518_750 },
    // EQUITY
    { id:'tb14', accountCode:'3000', accountNameEn:'Equity',                   accountNameAr:'حقوق الملكية',                    accountType:'Equity',    level:1, openingDebit:0,          openingCredit:7_930_000, periodDebit:0,         periodCredit:0,         closingDebit:0,          closingCredit:7_930_000 },
    { id:'tb15', accountCode:'3100', accountNameEn:'Paid-in Capital',          accountNameAr:'رأس المال المدفوع',               accountType:'Equity',    level:2, openingDebit:0,          openingCredit:7_000_000, periodDebit:0,         periodCredit:0,         closingDebit:0,          closingCredit:7_000_000 },
    { id:'tb16', accountCode:'3200', accountNameEn:'Retained Earnings',        accountNameAr:'الأرباح المبقاة',                 accountType:'Equity',    level:2, openingDebit:0,          openingCredit:930_000,   periodDebit:0,         periodCredit:0,         closingDebit:0,          closingCredit:930_000 },
    // REVENUE
    { id:'tb17', accountCode:'4000', accountNameEn:'Revenue',                  accountNameAr:'الإيرادات',                       accountType:'Revenue',   level:1, openingDebit:0,          openingCredit:8_340_000, periodDebit:0,         periodCredit:900_000,   closingDebit:0,          closingCredit:9_240_000 },
    { id:'tb18', accountCode:'4100', accountNameEn:'Service Revenue',          accountNameAr:'إيرادات الخدمات',                 accountType:'Revenue',   level:2, openingDebit:0,          openingCredit:6_900_000, periodDebit:0,         periodCredit:900_000,   closingDebit:0,          closingCredit:7_800_000 },
    { id:'tb19', accountCode:'4200', accountNameEn:'Project Revenue',          accountNameAr:'إيرادات المشاريع',                accountType:'Revenue',   level:2, openingDebit:0,          openingCredit:1_440_000, periodDebit:0,         periodCredit:0,         closingDebit:0,          closingCredit:1_440_000 },
    // EXPENSES
    { id:'tb20', accountCode:'5000', accountNameEn:'Expenses',                 accountNameAr:'المصروفات',                       accountType:'Expense',   level:1, openingDebit:6_974_167,  openingCredit:0,         periodDebit:893_583,   periodCredit:0,         closingDebit:7_867_750,  closingCredit:0 },
    { id:'tb21', accountCode:'5100', accountNameEn:'Operating Expenses',       accountNameAr:'المصروفات التشغيلية',             accountType:'Expense',   level:2, openingDebit:3_340_000,  openingCredit:0,         periodDebit:804_000,   periodCredit:0,         closingDebit:4_144_000,  closingCredit:0 },
    { id:'tb22', accountCode:'5110', accountNameEn:'Salaries & Benefits',      accountNameAr:'الرواتب والمزايا',                accountType:'Expense',   level:3, openingDebit:2_160_000,  openingCredit:0,         periodDebit:680_000,   periodCredit:0,         closingDebit:2_840_000,  closingCredit:0 },
    { id:'tb23', accountCode:'5120', accountNameEn:'Fuel & Transportation',    accountNameAr:'الوقود والمواصلات',               accountType:'Expense',   level:3, openingDebit:596_000,    openingCredit:0,         periodDebit:84_000,    periodCredit:0,         closingDebit:680_000,    closingCredit:0 },
    { id:'tb24', accountCode:'5130', accountNameEn:'Maintenance & Repairs',    accountNameAr:'الصيانة والإصلاحات',              accountType:'Expense',   level:3, openingDebit:480_000,    openingCredit:0,         periodDebit:120_000,   periodCredit:0,         closingDebit:600_000,    closingCredit:0 },
    { id:'tb25', accountCode:'5200', accountNameEn:'G&A Expenses',             accountNameAr:'المصروفات العمومية والإدارية',    accountType:'Expense',   level:2, openingDebit:1_634_167,  openingCredit:0,         periodDebit:70_833,    periodCredit:0,         closingDebit:1_705_000,  closingCredit:0 },
    { id:'tb26', accountCode:'5210', accountNameEn:'Office Rent',              accountNameAr:'إيجار المكاتب',                  accountType:'Expense',   level:3, openingDebit:440_000,    openingCredit:0,         periodDebit:40_000,    periodCredit:0,         closingDebit:480_000,    closingCredit:0 },
    { id:'tb27', accountCode:'5230', accountNameEn:'Depreciation Expense',     accountNameAr:'مصروف الاستهلاك',                accountType:'Expense',   level:3, openingDebit:339_167,    openingCredit:0,         periodDebit:30_833,    periodCredit:0,         closingDebit:370_000,    closingCredit:0 },
    { id:'tb28', accountCode:'5300', accountNameEn:'Finance Costs',            accountNameAr:'التكاليف التمويلية',              accountType:'Expense',   level:2, openingDebit:1_000_000,  openingCredit:0,         periodDebit:18_750,    periodCredit:0,         closingDebit:1_018_750,  closingCredit:0 },
  ]);
}
