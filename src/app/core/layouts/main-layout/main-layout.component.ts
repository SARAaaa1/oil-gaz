import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { RoleDirective } from '../../../shared/directives/role.directive';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { LanguageService } from '../../services/language.service';
import { DascoLogoComponent } from '../../../shared/components/dasco-logo/dasco-logo.component';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, RoleDirective, TranslateModule, LanguageSwitcherComponent, DascoLogoComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly authService = inject(AuthService);
  readonly langService = inject(LanguageService);

  // Layout UI State signals
  readonly isSidebarCollapsed = signal<boolean>(false);
  readonly isProcurementOpen = signal<boolean>(false);
  readonly isOperationsOpen = signal<boolean>(true);
  readonly isInventoryOpen = signal<boolean>(false);
  readonly isAssetsOpen = signal<boolean>(false);
  readonly isFinanceOpen = signal<boolean>(false);
  readonly isAdminOpen = signal<boolean>(false);
  readonly isMobileOpen = signal<boolean>(false);
  readonly isNotificationsOpen = signal<boolean>(false);
  readonly isUserMenuOpen = signal<boolean>(false);

  // Mock Notifications for the dropdown
  readonly notifications = signal<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Quotations Received',
      message: '3 bids submitted for RFQ-2026-001 (Hydraulic Pump).',
      time: '10 mins ago',
      type: 'success'
    },
    {
      id: 'n2',
      title: 'PR Pending Review',
      message: 'PR-2026-003 safety gear requires department head sign-off.',
      time: '1 hour ago',
      type: 'warning'
    },
    {
      id: 'n3',
      title: 'Rig Beta Down Time',
      message: 'BOP Recertification scheduled starting tomorrow.',
      time: '3 hours ago',
      type: 'info'
    },
    {
      id: 'n4',
      title: 'Out of Stock Alert',
      message: 'HSE-DET-GAS (Multi-Gas Detector) is out of stock in Warehouse A.',
      time: '1 day ago',
      type: 'danger'
    }
  ]);

  // Computed signals
  readonly breadcrumbs = this.breadcrumbService.breadcrumbs;
  readonly toasts = this.notificationService.toasts;
  readonly activeNotificationCount = computed(() => this.notifications().length);

  ngOnInit() {
    // Initial load effects if needed
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
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
    }
    this.isFinanceOpen.update(val => !val);
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
