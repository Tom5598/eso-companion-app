import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  constructor(private translate: TranslateService) {
    const saved = localStorage.getItem('lang') || 'en';
    translate.addLangs(['en', 'hu']);
    translate.setDefaultLang('en');
    this.useLanguage(saved);
  }

  useLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }
  getCurrentLang(): string {
    return this.translate.currentLang || 'en';
  }
}
