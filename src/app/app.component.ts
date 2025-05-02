import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; 
import { NavbarComponent } from "./components/navbar/navbar.component";
import { TranslateService } from '@ngx-translate/core';
import translationEN from '../../public/i18n/en.json';
import translationHU from '../../public/i18n/hu.json';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, NavbarComponent, ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {    
    title = 'eso-companion-app'; 
    constructor(private translate: TranslateService) {        
        this.translate.setTranslation('en', translationEN);
        this.translate.setTranslation('hu', translationHU);
        this.translate.setDefaultLang('en');
    }
}