import { Injectable, signal } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  setBreadcrumbs(items: BreadcrumbItem[]) {
    this.breadcrumbs.set(items);
  }
}
