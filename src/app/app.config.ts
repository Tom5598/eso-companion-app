import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app.routes';
import { environment } from './env/environment';
import { AngularFireModule } from '@angular/fire/compat';
import {
  AngularFireAuth,
  AngularFireAuthModule,
  USE_EMULATOR as authEmulator,
} from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreModule,
  USE_EMULATOR as firestoreEmulator,
} from '@angular/fire/compat/firestore';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  AngularFireStorage,
  AngularFireStorageModule,
  USE_EMULATOR as storageEmulator,
} from '@angular/fire/compat/storage';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { connectFirebaseEmulators } from './util/emulator-setup';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { MissingTranslationHandler, TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './i18n/', '.json');
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory, deps: [HttpClient],
      },
      missingTranslationHandler:{
        provide: MissingTranslationHandler,
        useValue: {
          handle: (params:any) => {
            console.warn(`Missing translation for key: ${params.key}`);
            return params.key; // Return the key as a fallback
          },
        },
      }
    }),
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireAuthModule,
      AngularFirestoreModule,
      BrowserAnimationsModule,
      AngularFireStorageModule,
      AngularFireFunctionsModule
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: connectFirebaseEmulators,
      deps: [
        AngularFireAuth,
        AngularFirestore,
        AngularFireStorage,
        AngularFireFunctions,
      ],
      multi: true,
    },
  ],
};
