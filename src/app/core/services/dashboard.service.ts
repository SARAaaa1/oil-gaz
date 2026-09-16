import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DashboardData, DashboardStatisticsResponse } from '../../shared/interfaces/dashboard.interface';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  // Reactive state
  readonly dashboardData = signal<DashboardData | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);

  private get baseUrl(): string {
    return `${environment.apiUrl}/dashboard/statistics`;
  }

  getStatistics(): Observable<DashboardData> {
    this.isLoading.set(true);
    this.hasError.set(false);

    return this.http.get<DashboardStatisticsResponse>(this.baseUrl).pipe(
      map(res => {
        if (res && res.data) {
          return res.data;
        }
        return (res as any) as DashboardData;
      }),
      tap(data => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        this.hasError.set(true);
        throw err;
      })
    );
  }
}
