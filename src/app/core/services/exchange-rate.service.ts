import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ExchangeRateSnapshot {
  rate: number;        // USD → EGP rate
  fetchedAt: string;  // ISO timestamp
  source: string;     // API source label
}

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'https://open.er-api.com/v6/latest/USD';
  private readonly CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

  // Public signals
  readonly snapshot = signal<ExchangeRateSnapshot | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);

  /**
   * Returns the live USD→EGP rate.
   * Uses in-memory cache if fresh (< 1 hr), else re-fetches.
   * Falls back to 49.50 if the API is unreachable.
   */
  async getUSDtoEGP(): Promise<ExchangeRateSnapshot> {
    // Return cached snapshot if still fresh
    const cached = this.snapshot();
    if (cached) {
      const ageMs = Date.now() - new Date(cached.fetchedAt).getTime();
      if (ageMs < this.CACHE_DURATION_MS) {
        return cached;
      }
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      const response = await firstValueFrom(
        this.http.get<{ rates: Record<string, number> }>(this.API_URL)
      );

      const rate = response?.rates?.['EGP'] ?? 49.5;
      const snap: ExchangeRateSnapshot = {
        rate: parseFloat(rate.toFixed(4)),
        fetchedAt: new Date().toISOString(),
        source: 'open.er-api.com'
      };
      this.snapshot.set(snap);
      return snap;
    } catch {
      this.hasError.set(true);
      // Use well-known approximate rate as fallback
      const fallback: ExchangeRateSnapshot = {
        rate: 49.5,
        fetchedAt: new Date().toISOString(),
        source: 'fallback (offline)'
      };
      this.snapshot.set(fallback);
      return fallback;
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Convert a USD amount to EGP using a given rate */
  convertUSDtoEGP(usdAmount: number, rate: number): number {
    return parseFloat((usdAmount * rate).toFixed(2));
  }
}
