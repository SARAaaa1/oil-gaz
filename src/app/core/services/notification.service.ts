import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly translate = inject(TranslateService);
  readonly toasts = signal<ToastMessage[]>([]);

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
