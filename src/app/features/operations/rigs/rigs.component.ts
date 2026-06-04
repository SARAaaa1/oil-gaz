import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-rigs',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './rigs.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RigsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);

  readonly rigs = this.mockDataService.rigs;

  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('ALL');

  readonly activeCount = computed(() =>
    this.rigs().filter(r => r.status === 'Active').length
  );

  readonly maintenanceCount = computed(() =>
    this.rigs().filter(r => r.status === 'Maintenance').length
  );

  readonly standbyCount = computed(() =>
    this.rigs().filter(r => r.status === 'Standby').length
  );

  readonly filteredRigs = computed(() => {
    let list = this.rigs();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    if (status !== 'ALL') {
      list = list.filter(r => r.status === status);
    }

    if (query) {
      list = list.filter(r =>
        r.rigName.toLowerCase().includes(query) ||
        r.location.toLowerCase().includes(query) ||
        r.managerName.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.operations'), url: '/operations' },
      { label: this.translate.instant('navigation.rigs') }
    ]);
  }
}
