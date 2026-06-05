import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DASCO ERP — Custom SVG Logo Component
 *
 * Usage:
 *   <app-dasco-logo [compact]="false" />  — full  (icon + wordmark)
 *   <app-dasco-logo [compact]="true"  />  — compact (icon only, collapsed sidebar)
 *
 * The icon fuses three petroleum-industry concepts into one minimal mark:
 *   • Oil drop  — teardrop outer silhouette
 *   • Gear arc  — 6-tooth partial ring suggesting industrial machinery
 *   • Flow node — central diamond representing pipeline / workflow routing
 */
@Component({
  selector: 'app-dasco-logo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ─────────────────────────────────────────────────
         COMPACT — icon only (collapsed sidebar)
         ───────────────────────────────────────────────── -->
    @if (compact) {
      <div
        class="flex items-center justify-center shrink-0"
        [style.width.px]="size"
        [style.height.px]="size"
        role="img"
        aria-label="DASCO ERP"
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          [attr.width]="size"
          [attr.height]="size"
        >
          <!-- ── Drop / gear ring background ── -->
          <defs>
            <linearGradient id="bg-grad-c" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#F59E0B" stop-opacity="1"/>
              <stop offset="100%" stop-color="#D97706" stop-opacity="1"/>
            </linearGradient>
            <linearGradient id="icon-grad-c" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#0F172A"/>
              <stop offset="100%" stop-color="#1E293B"/>
            </linearGradient>
          </defs>

          <!-- Outer oil-drop shape (teardrop) — amber fill -->
          <path
            d="M20 3 C20 3 8 14 8 22 C8 28.627 13.373 35 20 35 C26.627 35 32 28.627 32 22 C32 14 20 3 20 3 Z"
            fill="url(#bg-grad-c)"
          />

          <!-- Gear teeth arc (top arc — 6 teeth) rendered as a series of small rects rotated around center -->
          <g transform="translate(20,20)" fill="#0F172A" opacity="0.55">
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(60)"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(120)"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(180)"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(240)"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(300)"/>
          </g>

          <!-- Inner circle — dark -->
          <circle cx="20" cy="22" r="8.5" fill="url(#icon-grad-c)"/>

          <!-- Central diamond — workflow node — amber -->
          <rect x="20" y="15.5" width="9" height="9" rx="1.5"
                transform="rotate(45 20 20)" fill="#F59E0B" opacity="0.92"/>

          <!-- Pipeline lines through diamond -->
          <line x1="20" y1="18" x2="20" y2="26" stroke="#0F172A" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="16" y1="22" x2="24" y2="22" stroke="#0F172A" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    }

    <!-- ─────────────────────────────────────────────────
         FULL — icon + wordmark (expanded sidebar)
         ───────────────────────────────────────────────── -->
    @if (!compact) {
      <div
        class="flex items-center gap-3 overflow-hidden"
        role="img"
        aria-label="DASCO ERP — Petroleum Services"
      >
        <!-- Icon mark -->
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          class="shrink-0"
        >
          <defs>
            <linearGradient id="bg-grad-f" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#FBBF24"/>
              <stop offset="100%" stop-color="#D97706"/>
            </linearGradient>
            <linearGradient id="icon-grad-f" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#0F172A"/>
              <stop offset="100%" stop-color="#1E293B"/>
            </linearGradient>
            <!-- Glow filter for premium feel -->
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Outer oil-drop silhouette — amber gradient -->
          <path
            d="M20 3 C20 3 8 14 8 22 C8 28.627 13.373 35 20 35 C26.627 35 32 28.627 32 22 C32 14 20 3 20 3 Z"
            fill="url(#bg-grad-f)"
            filter="url(#glow)"
          />

          <!-- Gear teeth (subtle overlay on drop) -->
          <g transform="translate(20,20)" fill="#0F172A" opacity="0.4">
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(60)"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(120)"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(180)"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(240)"/>
            <rect x="-1.2" y="-17.5" width="2.4" height="4" rx="0.8" transform="rotate(300)"/>
          </g>

          <!-- Inner dark circle -->
          <circle cx="20" cy="22" r="8.5" fill="url(#icon-grad-f)"/>

          <!-- Workflow diamond node — amber -->
          <rect x="20" y="15.5" width="9" height="9" rx="1.5"
                transform="rotate(45 20 20)" fill="#FBBF24"/>

          <!-- Cross / pipeline flow lines -->
          <line x1="20" y1="17.5" x2="20" y2="26.5" stroke="#0F172A" stroke-width="1.6" stroke-linecap="round"/>
          <line x1="15.5" y1="22" x2="24.5" y2="22" stroke="#0F172A" stroke-width="1.6" stroke-linecap="round"/>

          <!-- Top specular highlight on drop -->
          <ellipse cx="16" cy="14" rx="2.5" ry="1.4" fill="white" opacity="0.18" transform="rotate(-30 16 14)"/>
        </svg>

        <!-- Wordmark -->
        <div class="flex flex-col leading-none whitespace-nowrap overflow-hidden">
          <!-- Primary name -->
          <svg
            viewBox="0 0 120 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="120"
            height="18"
            aria-hidden="true"
          >
            <!-- DASCO -->
            <text
              x="0" y="14"
              font-family="Inter, system-ui, sans-serif"
              font-size="15"
              font-weight="800"
              letter-spacing="2.5"
              fill="white"
            >DASCO</text>
            <!-- ERP — amber accent -->
            <text
              x="75" y="14"
              font-family="Inter, system-ui, sans-serif"
              font-size="15"
              font-weight="300"
              letter-spacing="2"
              fill="#F59E0B"
            >ERP</text>
          </svg>

          <!-- Subtitle -->
          <svg
            viewBox="0 0 120 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="120"
            height="10"
            aria-hidden="true"
            class="mt-0.5"
          >
            <text
              x="0" y="8"
              font-family="Inter, system-ui, sans-serif"
              font-size="7.5"
              font-weight="600"
              letter-spacing="2.8"
              fill="#F59E0B"
              opacity="0.75"
            >PETROLEUM SERVICES</text>
          </svg>
        </div>
      </div>
    }
  `
})
export class DascoLogoComponent {
  /** When true renders the compact icon-only version for the collapsed sidebar. */
  @Input() compact = false;

  /** Icon size in px (compact mode only). */
  @Input() size = 40;
}
