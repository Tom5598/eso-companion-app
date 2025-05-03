import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router'; 
import { NavbarComponent } from "./components/navbar/navbar.component";
import { TranslateService } from '@ngx-translate/core';
import translationEN from '../../public/i18n/en.json';
import translationHU from '../../public/i18n/hu.json';
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {    
    title = 'eso-companion-app'; 
    constructor(private translate: TranslateService,private analytics: AngularFireAnalytics, private router:Router) {        
        this.translate.setTranslation('en', translationEN);
        this.translate.setTranslation('hu', translationHU);
        this.translate.setDefaultLang('en');
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
              this.analytics.logEvent('page_view', { page_path: event.urlAfterRedirects });
            }
          });
    }
}