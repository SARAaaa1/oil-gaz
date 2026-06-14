import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, NotificationItem } from '../../core/services/notification.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  // Bind to global store
  readonly notifications = this.notificationService.notifications;

  // Filter States
  readonly severityFilter = signal<string>('All');
  readonly statusFilter = signal<'All' | 'Unread' | 'Read'>('All');

  // Filtered Notifications List
  readonly filteredNotifications = computed(() => {
    let list = this.notifications();
    const severity = this.severityFilter();
    const status = this.statusFilter();

    if (severity !== 'All') {
      list = list.filter(n => n.type === severity);
    }

    if (status === 'Unread') {
      list = list.filter(n => !n.isRead);
    } else if (status === 'Read') {
      list = list.filter(n => n.isRead);
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.activity_logs' },
      { label: 'navigation.notifications' }
    ]);
  }

  markAsRead(id: string) {
    this.notifications.update(list => 
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }

  markAllAsRead() {
    this.notifications.update(list => 
      list.map(n => ({ ...n, isRead: true }))
    );
    this.notificationService.success('notifications.all_read_title', 'notifications.all_read_desc');
  }

  deleteNotification(id: string) {
    this.notifications.update(list => 
      list.filter(n => n.id !== id)
    );
    this.notificationService.info('notifications.deleted_title', 'notifications.deleted_desc');
  }

  clearAll() {
    this.notifications.set([]);
    this.notificationService.success('notifications.cleared_title', 'notifications.cleared_desc');
  }

  // Trigger Mock System Alerts for interactivity
  triggerMockAlert(alertType: 'danger' | 'warning' | 'info' | 'success') {
    let mockTitle = '';
    let mockMessage = '';
    const id = 'mock-' + Math.floor(1000 + Math.random() * 9000);

    switch (alertType) {
      case 'danger':
        mockTitle = 'HSE Critical Alarm';
        mockMessage = 'Rig 12 gas sensor detected minor H2S leak (0.2 ppm). Exhaust fans active.';
        break;
      case 'warning':
        mockTitle = 'Warehouse Asset Alert';
        mockMessage = 'Drawworks PM schedule is overdue by 5 days on Rig Alpha.';
        break;
      case 'success':
        mockTitle = 'PO Approval Cleared';
        mockMessage = 'PO-2026-003 for Safety gear has been signed by Operations Manager.';
        break;
      case 'info':
        mockTitle = 'Asset Transfer Dispatched';
        mockMessage = 'Generator AST-GEN-002 loaded for transfer to Main Workshop.';
        break;
    }

    const newAlert: NotificationItem = {
      id: id,
      title: mockTitle,
      message: mockMessage,
      time: 'Just now',
      type: alertType,
      isRead: false
    };

    // Prepend to global list
    this.notifications.update(prev => [newAlert, ...prev]);

    // Show toast message as well
    this.notificationService.show(alertType, mockTitle, mockMessage);
  }
}
