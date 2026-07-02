import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { NotificationService, NotificationItem } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { RoleDirective } from '../../../shared/directives/role.directive';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';
import { CommandPaletteComponent } from '../../../shared/components/command-palette/command-palette.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, RoleDirective, TranslateModule, LanguageSwitcherComponent, CommandPaletteComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  readonly currentUser = this.authService.currentUser;
  
  // Collapse navigation menus state
  readonly isSidebarCollapsed = signal<boolean>(false);
  readonly isProcurementOpen = signal<boolean>(false);
  readonly isOperationsOpen = signal<boolean>(false);
  readonly isInventoryOpen = signal<boolean>(false);
  readonly isAssetsOpen = signal<boolean>(false);
  readonly isFinanceOpen = signal<boolean>(false);
  readonly isMastersOpen = signal<boolean>(false);
  readonly isAdminOpen = signal<boolean>(false);
  readonly isMobileOpen = signal<boolean>(false);
  readonly isNotificationsOpen = signal<boolean>(false);
  readonly isUserMenuOpen = signal<boolean>(false);

  // Finance V2 — new module sub-menu signals
  readonly isFinanceV2Open = signal<boolean>(false);
  readonly isFinanceV2ApOpen = signal<boolean>(false);
  readonly isFinanceV2ArOpen = signal<boolean>(false);
  readonly isFinanceV2TreasuryOpen = signal<boolean>(false);
  readonly isFinanceV2AssetsOpen = signal<boolean>(false);
  readonly isFinanceV2BudgetOpen = signal<boolean>(false);
  readonly isFinanceV2TaxesOpen = signal<boolean>(false);
  readonly isFinanceV2ReportsOpen = signal<boolean>(false);
  readonly isFinanceV2AdminOpen = signal<boolean>(false);


  // Link to shared notifications store
  readonly notifications = this.notificationService.notifications;

  // Computed signals
  readonly breadcrumbs = this.breadcrumbService.breadcrumbs;
  readonly toasts = this.notificationService.toasts;
  readonly activeNotificationCount = computed(() => this.notifications().filter(n => !n.isRead).length);


  ngOnInit() {
    this.checkActiveRoute(this.router.url);
    this.router.events.subscribe(() => {
      this.checkActiveRoute(this.router.url);
    });
  }

  private checkActiveRoute(url: string) {
    if (url.includes('/inventory') || url.includes('/masters/')) {
      this.isInventoryOpen.set(true);
    }
    if (url.includes('/procurement') || url.includes('/vendors')) {
      this.isProcurementOpen.set(true);
    }
    if (url.includes('/operations') || url.includes('/workflow')) {
      this.isOperationsOpen.set(true);
    }
    if (url.includes('/assets')) {
      this.isAssetsOpen.set(true);
    }
    if (url.includes('/finance') && !url.includes('/finance-v2')) {
      this.isFinanceOpen.set(true);
    }
    if (url.includes('/finance-v2')) {
      this.isFinanceV2Open.set(true);
      if (url.includes('/finance-v2/ap')) this.isFinanceV2ApOpen.set(true);
      if (url.includes('/finance-v2/ar')) this.isFinanceV2ArOpen.set(true);
      if (url.includes('/finance-v2/treasury')) this.isFinanceV2TreasuryOpen.set(true);
      if (url.includes('/finance-v2/assets')) this.isFinanceV2AssetsOpen.set(true);
      if (url.includes('/finance-v2/budget')) this.isFinanceV2BudgetOpen.set(true);
      if (url.includes('/finance-v2/taxes')) this.isFinanceV2TaxesOpen.set(true);
      if (url.includes('/finance-v2/reports')) this.isFinanceV2ReportsOpen.set(true);
      if (url.includes('/finance-v2/admin')) this.isFinanceV2AdminOpen.set(true);
    }
  }

  // --- ACTIONS ---
  toggleSidebar() {
    this.isSidebarCollapsed.update(val => !val);
  }

  toggleProcurementMenu() {
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
    }
    this.isProcurementOpen.update(val => !val);
  }

  toggleOperationsMenu() {
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
    }
    this.isOperationsOpen.update(val => !val);
  }

  toggleInventoryMenu() {
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
    }
    this.isInventoryOpen.update(val => !val);
  }

  toggleAssetsMenu() {
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
    }
    this.isAssetsOpen.update(val => !val);
  }

  toggleFinanceMenu() {
    if (this.isSidebarCollapsed()) { this.isSidebarCollapsed.set(false); }
    this.isFinanceOpen.update(val => !val);
  }

  // Finance V2 toggle methods
  toggleFinanceV2Menu() {
    if (this.isSidebarCollapsed()) { this.isSidebarCollapsed.set(false); }
    this.isFinanceV2Open.update(val => !val);
  }
  toggleFinanceV2Ap()       { this.isFinanceV2ApOpen.update(v => !v); }
  toggleFinanceV2Ar()       { this.isFinanceV2ArOpen.update(v => !v); }
  toggleFinanceV2Treasury() { this.isFinanceV2TreasuryOpen.update(v => !v); }
  toggleFinanceV2Assets()   { this.isFinanceV2AssetsOpen.update(v => !v); }
  toggleFinanceV2Budget()   { this.isFinanceV2BudgetOpen.update(v => !v); }
  toggleFinanceV2Taxes()    { this.isFinanceV2TaxesOpen.update(v => !v); }
  toggleFinanceV2Reports()  { this.isFinanceV2ReportsOpen.update(v => !v); }
  toggleFinanceV2Admin()    { this.isFinanceV2AdminOpen.update(v => !v); }

  toggleMastersMenu() {
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
    }
    this.isMastersOpen.update(val => !val);
  }

  toggleAdminMenu() {
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
    }
    this.isAdminOpen.update(val => !val);
  }


  toggleMobileSidebar() {
    this.isMobileOpen.update(val => !val);
  }

  toggleNotifications() {
    this.isNotificationsOpen.update(val => !val);
    if (this.isNotificationsOpen()) {
      this.isUserMenuOpen.set(false);
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen.update(val => !val);
    if (this.isUserMenuOpen()) {
      this.isNotificationsOpen.set(false);
    }
  }

  clearNotifications() {
    this.notifications.set([]);
    this.notificationService.success('notifications.cleared_title', 'notifications.cleared_desc');
  }

  dismissToast(id: string) {
    this.notificationService.remove(id);
  }

  getNotifBadgeClass(type: NotificationItem['type']): string {
    switch (type) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-accent';
      case 'danger': return 'bg-danger';
      default: return 'bg-blue-600';
    }
  }

  logout() {
    this.isUserMenuOpen.set(false);
    this.notificationService.info('notifications.logout_title', 'notifications.logout_desc');
    this.authService.logout();
  }
}
