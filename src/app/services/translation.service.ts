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
  /**
   * 
   * @param key "The key to be translated"
   * @param params  "Optional parameters to be passed to the translation"
   * @returns "The translated string"
   * @description "This method is used to get the translation of a key. It uses the TranslateService from @ngx-translate/core to get the translation."
   */
  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }
  getCurrentLang(): string {
    return this.translate.currentLang || 'en';
  }
}
