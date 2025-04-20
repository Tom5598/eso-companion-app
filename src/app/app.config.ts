import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app.routes';
import { environment } from './env/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuth, AngularFireAuthModule, USE_EMULATOR as authEmulator } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreModule, USE_EMULATOR as firestoreEmulator } from '@angular/fire/compat/firestore';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFireStorage, AngularFireStorageModule, USE_EMULATOR as storageEmulator } from '@angular/fire/compat/storage';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { connectFirebaseEmulators } from './util/emulator-setup';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
     provideRouter(routes), 
     importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireAuthModule,
      AngularFirestoreModule,
      BrowserAnimationsModule,
      AngularFireStorageModule,
      AngularFireFunctionsModule,  
      ),
      {
        provide: APP_INITIALIZER,
        useFactory: connectFirebaseEmulators,
        deps: [
          AngularFireAuth, AngularFirestore,
         AngularFireStorage, AngularFireFunctions
        ],
        multi: true,
      }      
  ]
};
