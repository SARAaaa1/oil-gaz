import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4 w-full">
      @if (type === 'table') {
        <div class="border border-border-color rounded-2xl overflow-hidden bg-bg-card">
          <!-- Table Header Skeleton -->
          <div class="h-10 bg-bg-secondary flex items-center px-4 space-x-4 border-b border-border-color">
            <div class="skeleton-box h-4 w-12"></div>
            <div class="skeleton-box h-4 w-28"></div>
            <div class="skeleton-box h-4 w-20"></div>
            <div class="skeleton-box h-4 w-24"></div>
            <div class="skeleton-box h-4 w-16"></div>
          </div>
          <!-- Table Rows Skeleton -->
          <div class="divide-y divide-border-color">
            @for (row of [].constructor(rows); track $index) {
              <div class="h-12 flex items-center px-4 space-x-4">
                <div class="skeleton-box h-3 w-10"></div>
                <div class="skeleton-box h-3 w-32"></div>
                <div class="skeleton-box h-3 w-16"></div>
                <div class="skeleton-box h-3 w-20"></div>
                <div class="skeleton-box h-3 w-12"></div>
              </div>
            }
          </div>
        </div>
      } @else if (type === 'card') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (card of [].constructor(3); track $index) {
            <div class="bg-bg-card border border-border-color rounded-2xl p-5 space-y-3">
              <div class="flex justify-between items-center">
                <div class="skeleton-box h-3 w-16"></div>
                <div class="skeleton-box h-6 w-6 rounded-full"></div>
              </div>
              <div class="skeleton-box h-6 w-24"></div>
              <div class="skeleton-box h-3 w-28"></div>
            </div>
          }
        </div>
      } @else if (type === 'form') {
        <div class="bg-bg-card border border-border-color rounded-2xl p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (field of [].constructor(6); track $index) {
              <div class="space-y-1.5">
                <div class="skeleton-box h-3 w-20"></div>
                <div class="skeleton-box h-10 w-full rounded-lg"></div>
              </div>
            }
          </div>
          <div class="flex justify-end space-x-3 pt-4 border-t border-border-color">
            <div class="skeleton-box h-10 w-20 rounded-lg"></div>
            <div class="skeleton-box h-10 w-24 rounded-lg"></div>
          </div>
        </div>
      } @else {
        <!-- Dashboard Loader -->
        <div class="space-y-6">
          <div class="skeleton-box h-12 w-48"></div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            @for (kpi of [].constructor(4); track $index) {
              <div class="bg-bg-card border border-border-color rounded-2xl p-4 space-y-2">
                <div class="skeleton-box h-3 w-16"></div>
                <div class="skeleton-box h-6 w-20"></div>
              </div>
            }
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 skeleton-box h-80 rounded-2xl"></div>
            <div class="skeleton-box h-80 rounded-2xl"></div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonLoaderComponent {
  @Input() type: 'table' | 'card' | 'form' | 'dashboard' = 'table';
  @Input() rows: number = 5;
}
