import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-left select-none">
      <button 
        (click)="toggleDropdown(); $event.stopPropagation()"
        class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors focus:outline-none text-xs font-bold"
      >
        <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>{{ currentLangName() }}</span>
        <svg 
          [class.rotate-180]="isOpen()"
          class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown menu -->
      @if (isOpen()) {
        <div class="absolute right-0 rtl:left-0 rtl:right-auto mt-1.5 w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-fade-in font-medium text-xs">
          <button 
            (click)="selectLang('en')"
            [class.bg-slate-50]="langService.currentLang() === 'en'"
            [class.text-accent]="langService.currentLang() === 'en'"
            class="w-full px-4 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between text-left rtl:text-right"
          >
            <span>English</span>
            @if (langService.currentLang() === 'en') {
              <span class="text-accent">✓</span>
            }
          </button>
          <button 
            (click)="selectLang('ar')"
            [class.bg-slate-50]="langService.currentLang() === 'ar'"
            [class.text-accent]="langService.currentLang() === 'ar'"
            class="w-full px-4 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between text-left rtl:text-right"
          >
            <span>العربية</span>
            @if (langService.currentLang() === 'ar') {
              <span class="text-accent">✓</span>
            }
          </button>
        </div>
      }
    </div>
  `
})
export class LanguageSwitcherComponent {
  readonly langService = inject(LanguageService);
  readonly isOpen = signal(false);

  toggleDropdown() {
    this.isOpen.update(v => !v);
  }

  selectLang(lang: string) {
    this.langService.setLanguage(lang);
    this.isOpen.set(false);
  }

  currentLangName(): string {
    return this.langService.currentLang() === 'ar' ? 'العربية' : 'English';
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isOpen.set(false);
  }
}
