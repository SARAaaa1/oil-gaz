import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrWorkflowService } from '../../shared/hr-workflow.service';
import { LanguageService } from '../../../../core/services/language.service';
import { HrNotification } from '../../../../shared/interfaces';


@Component({
  selector: 'app-hr-workflow-notifications',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="lang.isArabic() ? 'rtl' : 'ltr'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.wf_nav_notifications' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">Stay updated on system alerts and workflow logs</p>
      </div>
      <button (click)="wf.markAllNotifsAsRead()" class="px-4 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-xl font-bold text-xs">
        ✓ {{ 'hr.reports.wf_notif_mark_all' | translate }}
      </button>
    </div>

    <!-- Filters & List -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      
      <!-- Tabs -->
      <div class="flex border-b border-slate-100">
        <button (click)="filterUnread.set(false)" [class]="!filterUnread() ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-slate-500 hover:text-slate-700'" class="px-5 py-3.5 text-xs font-black transition-colors">
          {{ 'hr.reports.wf_notif_all' | translate }} ({{ wf.notifications().length }})
        </button>
        <button (click)="filterUnread.set(true)" [class]="filterUnread() ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-slate-500 hover:text-slate-700'" class="px-5 py-3.5 text-xs font-black transition-colors">
          {{ 'hr.reports.wf_notif_unread' | translate }} ({{ wf.unreadNotificationsCount() }})
        </button>
      </div>

      <!-- Notifications Feed -->
      <div class="divide-y divide-slate-50">
        @for (item of filteredNotifications(); track item.id) {
          <div class="p-4 hover:bg-slate-50/50 transition-colors flex items-start gap-4" [class.bg-slate-50]="!item.read">
            <!-- Icon indicator -->
            <span class="text-2xl p-2 bg-slate-100 rounded-xl flex-shrink-0">{{ notifIcon(item.type) }}</span>

            <!-- Content -->
            <div class="flex-1 space-y-1 min-w-0">
              <div class="flex items-center justify-between gap-4">
                <h4 class="font-black text-slate-800 text-xs truncate">{{ item.title }}</h4>
                <span class="text-[9px] font-semibold text-slate-400 whitespace-nowrap">{{ item.createdAt }}</span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium leading-relaxed">{{ item.message }}</p>
              
              @if (!item.read) {
                <button (click)="wf.markNotifAsRead(item.id)" class="text-[10px] font-black text-primary hover:underline pt-1">
                  {{ 'hr.reports.wf_notif_mark_read' | translate }}
                </button>
              }
            </div>
          </div>
        } @empty {
          <div class="p-12 text-center text-slate-400">
            <span class="text-3xl block mb-2">🔔</span>
            No notifications to display.
          </div>
        }
      </div>

    </div>

  </div>
  `
})
export class HrWorkflowNotificationsComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly wf = inject(HrWorkflowService);
  readonly lang = inject(LanguageService);

  filterUnread = signal(false);

  filteredNotifications = computed(() => {
    let list = this.wf.notifications();
    if (this.filterUnread()) {
      list = list.filter(n => !n.read);
    }
    return list;
  });

  notifIcon(type: string): string {
    const m: Record<string, string> = {
      'Approval': '📥',
      'Info': 'ℹ️',
      'Warning': '⚠️',
      'Task': '📋'
    };
    return m[type] || '🔔';
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.reports.wf_title' },
      { label: 'hr.reports.wf_nav_notifications' }
    ]);
  }
}
