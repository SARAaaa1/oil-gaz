import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
      <div class="space-y-2">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ title | translate }}</span>
        <div class="flex items-baseline space-x-2">
          <span class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{{ value }}</span>
          @if (trendText) {
            <span 
              [class]="getTrendClass()" 
              class="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center"
            >
              @if (trendType === 'up') {
                <svg class="w-2.5 h-2.5 mr-0.5 rtl:ml-0.5 rtl:mr-0 animate-direction" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              } @else if (trendType === 'down') {
                <svg class="w-2.5 h-2.5 mr-0.5 rtl:ml-0.5 rtl:mr-0 animate-direction" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              }
              {{ trendText | translate }}
            </span>
          }
        </div>
      </div>

      <!-- Icon Container -->
      <div 
        [class]="getIconBgClass() + ' p-3.5 rounded-xl transition-all duration-300 group-hover:scale-110'"
      >
        <!-- Select SVG based on icon name -->
        @switch (icon) {
          @case ('pr') {
            <svg class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          @case ('rfq') {
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          @case ('po') {
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          @case ('vendor') {
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          @case ('equipment') {
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          @case ('hours') {
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          @case ('rig') {
            <svg class="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
          @default {
            <svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        }
      </div>

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input() trendText?: string;
  @Input() trendType?: 'up' | 'down' | 'neutral' = 'neutral';
  @Input() icon?: string;

  getTrendClass(): string {
    switch (this.trendType) {
      case 'up':
        return 'bg-green-50 text-success';
      case 'down':
        return 'bg-red-50 text-danger';
      default:
        return 'bg-slate-50 text-slate-500';
    }
  }

  getIconBgClass(): string {
    switch (this.icon) {
      case 'pr': return 'bg-slate-100';
      case 'rfq': return 'bg-amber-50';
      case 'po': return 'bg-green-50';
      case 'vendor': return 'bg-blue-50';
      case 'equipment': return 'bg-purple-50';
      case 'hours': return 'bg-emerald-50';
      case 'rig': return 'bg-rose-50';
      default: return 'bg-slate-50';
    }
  }
}
