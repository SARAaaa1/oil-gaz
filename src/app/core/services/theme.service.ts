import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly currentTheme = signal<ThemeMode>('light');

  constructor() {
    const savedTheme = localStorage.getItem('salistech_theme') as ThemeMode;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.currentTheme.set(savedTheme);
    } else {
      // Default to system preference but set directly as light or dark
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme.set(systemPrefersDark ? 'dark' : 'light');
    }
    
    // Apply theme whenever it changes
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  setTheme(mode: ThemeMode) {
    this.currentTheme.set(mode);
    localStorage.setItem('salistech_theme', mode);
  }

  private applyTheme(mode: ThemeMode) {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
}
