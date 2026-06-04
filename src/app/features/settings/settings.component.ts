import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivityTimelineComponent } from '../../shared/components/activity-timeline/activity-timeline.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityTimelineComponent, TranslateModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'settings.title' | translate }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1">{{ 'settings.subtitle' | translate }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Side: User Profile & Account Settings -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-xs font-semibold text-slate-600">
          <h3 class="text-sm font-bold text-slate-800 pb-2 border-b border-slate-50 mb-4 flex items-center space-x-2">
            <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{{ 'settings.profile_info' | translate }}</span>
          </h3>

          <form (submit)="saveSettings($event)" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block mb-1.5">{{ 'settings.full_name' | translate }}</label>
                <input 
                  type="text" 
                  name="fullName"
                  [(ngModel)]="profileForm.fullName"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-amber-500/50"
                  required
                >
              </div>
              <div>
                <label class="block mb-1.5">{{ 'settings.email_readonly' | translate }}</label>
                <input 
                  type="email" 
                  [value]="authService.currentUser()?.email" 
                  class="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-500 cursor-not-allowed outline-none"
                  disabled
                >
              </div>
              <div>
                <label class="block mb-1.5">{{ 'settings.company_entity' | translate }}</label>
                <input 
                  type="text" 
                  name="companyName"
                  [(ngModel)]="profileForm.companyName"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-amber-500/50"
                >
              </div>
              <div>
                <label class="block mb-1.5">{{ 'settings.assigned_role' | translate }}</label>
                <div class="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 select-none">
                  {{ 'roles.' + authService.currentUser()?.role | translate }}
                </div>
              </div>
              <div>
                <label class="block mb-1.5">{{ 'settings.timezone_offset' | translate }}</label>
                <select 
                  name="timezone"
                  [(ngModel)]="profileForm.timezone"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="UTC-8">{{ 'settings.timezones.utc8' | translate }}</option>
                  <option value="UTC-6">{{ 'settings.timezones.utc6' | translate }}</option>
                  <option value="UTC-5">{{ 'settings.timezones.utc5' | translate }}</option>
                  <option value="UTC+0">{{ 'settings.timezones.utc0' | translate }}</option>
                  <option value="UTC+3">{{ 'settings.timezones.utc3' | translate }}</option>
                </select>
              </div>
              <div>
                <label class="block mb-1.5">{{ 'settings.preferred_lang' | translate }}</label>
                <select 
                  name="preferredLanguage"
                  [(ngModel)]="profileForm.preferredLanguage"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="en">{{ 'settings.languages.en' | translate }}</option>
                  <option value="es">{{ 'settings.languages.es' | translate }}</option>
                  <option value="ar">{{ 'settings.languages.ar' | translate }}</option>
                </select>
              </div>
            </div>

            <!-- Email Notification preferences -->
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start space-x-3 mt-4">
              <input 
                type="checkbox" 
                id="emailNotif"
                name="emailNotifications"
                [(ngModel)]="profileForm.emailNotifications"
                class="rounded border-slate-350 text-amber-500 focus:ring-amber-500/20 bg-white w-4 h-4 cursor-pointer mt-0.5"
              >
              <div class="rtl:mr-3 rtl:ml-0">
                <label for="emailNotif" class="font-bold text-slate-800 cursor-pointer block select-none">{{ 'settings.sub_alerts' | translate }}</label>
                <span class="text-[10px] text-slate-400 font-medium">{{ 'settings.sub_alerts_desc' | translate }}</span>
              </div>
            </div>

            <!-- Submit -->
            <div class="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors shadow-sm"
              >
                {{ 'settings.save_btn' | translate }}
              </button>
            </div>
          </form>
        </div>

        <!-- Right Side: Finance Parameters & Delegations (Read-only System Info) -->
        <div class="space-y-6">
          
          <!-- Finance Parameters -->
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-xs font-semibold text-slate-600">
            <h3 class="text-sm font-bold text-slate-800 pb-2 border-b border-slate-50 mb-3 flex items-center space-x-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ 'settings.finance_params' | translate }}</span>
            </h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block mb-1 text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'settings.vat' | translate }}</label>
                <div class="p-2.5 bg-slate-50 border border-slate-150 rounded text-slate-800 text-sm font-black">
                  15%
                </div>
              </div>
              <div>
                <label class="block mb-1 text-slate-400 font-bold uppercase tracking-wider text-[10px]">{{ 'settings.withholding_tax' | translate }}</label>
                <div class="p-2.5 bg-slate-50 border border-slate-150 rounded text-slate-800 text-sm font-black">
                  2%
                </div>
              </div>
            </div>
          </div>

          <!-- Threshold Limits -->
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-xs font-semibold text-slate-600 font-sans">
            <h3 class="text-sm font-bold text-slate-800 pb-2 border-b border-slate-50 mb-3 flex items-center space-x-2">
              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>{{ 'settings.approval_thresholds' | translate }}</span>
            </h3>

            <div class="space-y-3">
              <div class="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded">
                <div>
                  <p class="font-bold text-slate-800">{{ 'settings.specialist_signoff' | translate }}</p>
                  <span class="text-[9px] text-slate-400 font-medium">{{ 'settings.specialist_limit' | translate }}</span>
                </div>
                <span class="font-bold text-slate-700 font-mono">$10K</span>
              </div>
              <div class="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded">
                <div>
                  <p class="font-bold text-slate-800">{{ 'settings.manager_release' | translate }}</p>
                  <span class="text-[9px] text-slate-400 font-medium">{{ 'settings.manager_limit' | translate }}</span>
                </div>
                <span class="font-bold text-slate-700 font-mono">$50K</span>
              </div>
              <div class="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded">
                <div>
                  <p class="font-bold text-slate-800">{{ 'settings.vp_level' | translate }}</p>
                  <span class="text-[9px] text-slate-400 font-medium">{{ 'settings.vp_limit' | translate }}</span>
                </div>
                <span class="font-bold text-slate-700 font-mono">&gt; $50K</span>
              </div>
            </div>
          </div>

          <!-- User Activity Timeline Card -->
          <div class="bg-white rounded-xl border border-slate-100 shadow-sm p-6 text-xs font-semibold text-slate-600">
            <h3 class="text-sm font-bold text-slate-800 pb-2 border-b border-slate-50 mb-4 flex items-center space-x-2">
              <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ 'settings.activity_timeline' | translate }}</span>
            </h3>
            <app-activity-timeline 
              [limit]="4"
              [userFilter]="authService.currentUser()?.username || undefined"
            ></app-activity-timeline>
          </div>

        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  readonly authService = inject(AuthService);

  profileForm = {
    fullName: '',
    companyName: '',
    timezone: '',
    preferredLanguage: '',
    emailNotifications: false
  };

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.settings' }
    ]);

    const user = this.authService.currentUser();
    if (user) {
      this.profileForm = {
        fullName: user.fullName || '',
        companyName: user.companyName || '',
        timezone: user.timezone || 'UTC-5',
        preferredLanguage: user.preferredLanguage || 'en',
        emailNotifications: user.emailNotifications || false
      };
    }
  }

  saveSettings(event: Event) {
    event.preventDefault();
    this.authService.updateProfile(this.profileForm);
    this.notificationService.success(
      this.translateService.instant('settings.toast_title'),
      this.translateService.instant('settings.toast_desc')
    );
  }
}

