import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly currentLang = signal<string>('en');
  readonly isRtl = signal<boolean>(false);

  constructor() {
    const savedLang = localStorage.getItem('petroflow_lang') || 'en';
    this.setLanguage(savedLang);
  }

  setLanguage(lang: string) {
    const isRtlLang = lang === 'ar';
    this.currentLang.set(lang);
    this.isRtl.set(isRtlLang);
    this.translate.use(lang);
    localStorage.setItem('petroflow_lang', lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = isRtlLang ? 'rtl' : 'ltr';

    if (isRtlLang) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }
}
