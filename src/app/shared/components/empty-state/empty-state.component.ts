import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-8 text-center bg-bg-card border border-border-color rounded-2xl shadow-sm">
      <div class="w-16 h-16 flex items-center justify-center rounded-full bg-bg-secondary text-text-secondary mb-4">
        <!-- Default Fallback SVG Icon if none specified -->
        <span class="text-2xl">{{ icon || '🔍' }}</span>
      </div>
      <h3 class="text-base font-bold text-text-primary">{{ title }}</h3>
      <p class="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed">{{ description }}</p>
      @if (showAction) {
        <button 
          (click)="actionClick.emit()" 
          class="btn btn-primary mt-4 text-xs font-bold"
        >
          {{ actionText || 'Action' }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() title: string = 'No records found';
  @Input() description: string = 'There are no active records in this section at the moment.';
  @Input() icon: string = '📦';
  @Input() showAction: boolean = false;
  @Input() actionText: string = '';
  @Output() actionClick = new EventEmitter<void>();
}
