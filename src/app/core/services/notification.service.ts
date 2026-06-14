import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  isRead?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly translate = inject(TranslateService);
  readonly toasts = signal<ToastMessage[]>([]);

  readonly notifications = signal<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Quotations Received',
      message: '3 bids submitted for RFQ-2026-001 (Hydraulic Pump).',
      time: '10 mins ago',
      type: 'success',
      isRead: false
    },
    {
      id: 'n2',
      title: 'PR Pending Review',
      message: 'PR-2026-003 safety gear requires department head sign-off.',
      time: '1 hour ago',
      type: 'warning',
      isRead: false
    },
    {
      id: 'n3',
      title: 'Rig Beta Down Time',
      message: 'BOP Recertification scheduled starting tomorrow.',
      time: '3 hours ago',
      type: 'info',
      isRead: false
    },
    {
      id: 'n4',
      title: 'Out of Stock Alert',
      message: 'HSE-DET-GAS (Multi-Gas Detector) is out of stock in Warehouse A.',
      time: '1 day ago',
      type: 'danger',
      isRead: false
    }
  ]);


  show(type: ToastMessage['type'], title: string, message: string, duration = 4000, params?: any) {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Auto-translate using TranslateService.instant
    const translatedTitle = this.translate.instant(title, params);
    const translatedMessage = this.translate.instant(message, params);

    const toast: ToastMessage = { id, type, title: translatedTitle, message: translatedMessage, duration };
    this.toasts.update(val => [...val, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: string) {
    this.toasts.update(val => val.filter(t => t.id !== id));
  }

  success(title: string, message: string, params?: any) {
    this.show('success', title, message, 4000, params);
  }

  danger(title: string, message: string, params?: any) {
    this.show('danger', title, message, 4000, params);
  }

  warning(title: string, message: string, params?: any) {
    this.show('warning', title, message, 4000, params);
  }

  info(title: string, message: string, params?: any) {
    this.show('info', title, message, 4000, params);
  }
}
