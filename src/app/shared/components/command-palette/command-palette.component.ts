import { Component, OnInit, OnDestroy, signal, computed, inject, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface PaletteItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Settings';
  label: string;
  arabicLabel?: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    @if (isOpen()) {
      <div (click)="closePalette()" class="palette-overlay animate-fade-in text-xs">
        <!-- Palette container -->
        <div 
          (click)="$event.stopPropagation()" 
          class="bg-bg-card border border-border-color rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[70vh] text-left rtl:text-right"
        >
          <!-- Search input header -->
          <div class="flex items-center px-4 py-3 border-b border-border-color bg-bg-secondary/20">
            <span class="text-text-secondary text-sm">🔍</span>
            <input 
              type="text" 
              [placeholder]="'Search commands, pages, and actions...' | translate" 
              [(ngModel)]="searchQuery"
              class="flex-1 bg-transparent border-none outline-none pl-3 pr-3 py-1 text-text-primary text-xs focus:ring-0 placeholder:text-text-secondary"
              #searchInput
              (keydown.escape)="closePalette()"
              (keydown.arrowdown)="moveSelection(1)"
              (keydown.arrowup)="moveSelection(-1)"
              (keydown.enter)="executeSelected()"
            />
            <span class="text-[10px] text-text-secondary border border-border-color px-1.5 py-0.5 rounded bg-bg-secondary font-mono">ESC</span>
          </div>

          <!-- Items list -->
          <div class="flex-1 overflow-y-auto p-2 divide-y divide-border-color/40">
            @for (cat of categories(); track cat) {
              <div class="py-2">
                <div class="text-[9px] font-bold text-text-secondary uppercase tracking-wider px-3 pb-1.5 select-none">
                  {{ cat | translate }}
                </div>
                <div class="space-y-0.5">
                  @for (item of filteredItemsByCategory(cat); track item.id; let idx = $index) {
                    <button 
                      (click)="executeItem(item)"
                      [class.bg-bg-secondary]="isSelected(item)"
                      [class.text-primary]="isSelected(item)"
                      class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left rtl:text-right text-text-primary hover:bg-bg-secondary hover:text-primary transition-all text-xs font-semibold"
                    >
                      <div class="flex items-center space-x-3">
                        <span class="text-sm shrink-0">{{ item.icon }}</span>
                        <span class="ml-2 rtl:mr-2 rtl:ml-0">{{ langService.isRtl() && item.arabicLabel ? item.arabicLabel : (item.label | translate) }}</span>
                      </div>
                      @if (item.shortcut) {
                        <span class="text-[9px] text-text-secondary font-mono bg-bg-secondary/80 border border-border-color px-1.5 py-0.5 rounded">
                          {{ item.shortcut }}
                        </span>
                      }
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <div class="py-8 text-center text-text-secondary">
                No matching commands found.
              </div>
            }
          </div>

          <!-- Footer status -->
          <div class="px-4 py-2 border-t border-border-color bg-bg-secondary/40 text-[10px] text-text-secondary flex justify-between items-center select-none font-medium">
            <div class="flex space-x-3">
              <span>↑↓ Navigation</span>
              <span>↵ Select</span>
            </div>
            <span>Salis-Tech Command Palette</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  readonly langService = inject(LanguageService);

  readonly isOpen = signal<boolean>(false);
  searchQuery = '';
  selectedIndex = 0;

  // Global command items list
  private readonly items: PaletteItem[] = [
    // Navigation
    { id: 'nav_dash', category: 'Navigation', label: 'navigation.dashboard', arabicLabel: 'لوحة التحكم العامة', icon: '📊', action: () => this.router.navigate(['/dashboard']) },
    { id: 'nav_pr', category: 'Navigation', label: 'navigation.purchase_requests', arabicLabel: 'طلبات الشراء', icon: '📝', action: () => this.router.navigate(['/procurement/purchase-requests']) },
    { id: 'nav_rfq', category: 'Navigation', label: 'navigation.rfqs', arabicLabel: 'طلبات تسعير RFQ', icon: '📨', action: () => this.router.navigate(['/procurement/rfqs']) },
    { id: 'nav_comp', category: 'Navigation', label: 'navigation.quotation_comparison', arabicLabel: 'مقارنة عروض الأسعار', icon: '⚖️', action: () => this.router.navigate(['/procurement/quotation-comparison']) },
    { id: 'nav_po', category: 'Navigation', label: 'navigation.purchase_orders', arabicLabel: 'أوامر الشراء PO', icon: '📦', action: () => this.router.navigate(['/procurement/purchase-orders']) },
    { id: 'nav_insp', category: 'Navigation', label: 'navigation.receiving_inspection', arabicLabel: 'الفحص والاستلام', icon: '🛡️', action: () => this.router.navigate(['/procurement/inspection']) },
    { id: 'nav_inv', category: 'Navigation', label: 'navigation.inventory', arabicLabel: 'إدارة المخازن والأصناف', icon: '📥', action: () => this.router.navigate(['/inventory']) },
    { id: 'nav_contr', category: 'Navigation', label: 'navigation.contracts', arabicLabel: 'إدارة العقود والمشاريع', icon: '💼', action: () => this.router.navigate(['/workflow/contracts']) },
    { id: 'nav_hse', category: 'Navigation', label: 'navigation.hse', arabicLabel: 'إدارة السلامة والصحة المهنية HSE', icon: '🦺', action: () => this.router.navigate(['/hse']) },
    { id: 'nav_finance', category: 'Navigation', label: 'navigation.finance', arabicLabel: 'الحسابات العامة واليومية', icon: '💵', action: () => this.router.navigate(['/finance-v2/general-ledger']) },
    
    // Quick Actions
    { id: 'act_pr', category: 'Actions', label: 'Create Purchase Request', arabicLabel: 'إنشاء طلب شراء جديد', icon: '➕ 📝', shortcut: 'Alt + R', action: () => this.router.navigate(['/procurement/purchase-requests'], { queryParams: { openForm: 'true' } }) },
    { id: 'act_res', category: 'Actions', label: 'Reserve Inventory', arabicLabel: 'حجز كمية سلع للمشروع', icon: '➕ 🔒', action: () => this.router.navigate(['/inventory'], { queryParams: { filter: 'reservations', openForm: 'true' } }) },
    { id: 'act_ptw', category: 'Actions', label: 'Apply Permit to Work (PTW)', arabicLabel: 'تقديم طلب تصريح عمل جديد', icon: '➕ 🦺', action: () => this.router.navigate(['/hse'], { queryParams: { openPtwForm: 'true' } }) },
    
    // Settings & Configuration
    { id: 'set_light', category: 'Settings', label: 'Switch to Light Theme', arabicLabel: 'تحويل إلى المظهر المضيء', icon: '☀️', shortcut: 'L', action: () => this.themeService.setTheme('light') },
    { id: 'set_dark', category: 'Settings', label: 'Switch to Dark Theme', arabicLabel: 'تحويل إلى المظهر المظلم', icon: '🌙', shortcut: 'D', action: () => this.themeService.setTheme('dark') },
    { id: 'set_lang_en', category: 'Settings', label: 'Switch Language to English', arabicLabel: 'تحويل اللغة إلى الإنجليزية', icon: '🇬🇧', action: () => this.langService.setLanguage('en') },
    { id: 'set_lang_ar', category: 'Settings', label: 'Switch Language to Arabic', arabicLabel: 'تحويل اللغة إلى العربية', icon: '🇸🇦', action: () => this.langService.setLanguage('ar') }
  ];

  // Listen for global Ctrl + K keyboard shortcut
  @HostListener('window:keydown.control.k', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    event.preventDefault();
    this.togglePalette();
  }

  ngOnInit() {}

  ngOnDestroy() {}

  togglePalette() {
    this.isOpen.update(val => !val);
    this.searchQuery = '';
    this.selectedIndex = 0;
  }

  closePalette() {
    this.isOpen.set(false);
  }

  readonly filteredItems = computed(() => {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.items;
    return this.items.filter(item => 
      item.label.toLowerCase().includes(query) || 
      item.category.toLowerCase().includes(query) ||
      (item.arabicLabel && item.arabicLabel.includes(query))
    );
  });

  readonly categories = computed(() => {
    const cats = new Set(this.filteredItems().map(i => i.category));
    return Array.from(cats);
  });

  filteredItemsByCategory(category: string) {
    return this.filteredItems().filter(i => i.category === category);
  }

  isSelected(item: PaletteItem): boolean {
    const list = this.filteredItems();
    return list.indexOf(item) === this.selectedIndex;
  }

  moveSelection(direction: number) {
    const max = this.filteredItems().length;
    if (max === 0) return;
    this.selectedIndex = (this.selectedIndex + direction + max) % max;
  }

  executeSelected() {
    const list = this.filteredItems();
    if (list.length > 0 && this.selectedIndex < list.length) {
      this.executeItem(list[this.selectedIndex]);
    }
  }

  executeItem(item: PaletteItem) {
    item.action();
    this.closePalette();
  }
}
