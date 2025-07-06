import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { data } from '../environment/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideAnalytics, getAnalytics } from "@angular/fire/analytics";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withFetch } from '@angular/common/http';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(),
    provideHttpClient(
      withFetch()
    ), 
    provideFirebaseApp(() => initializeApp(data.firebaseConfig)),
    provideAnalytics(() => getAnalytics()),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideClientHydration(
      withHttpTransferCacheOptions({
        includePostRequests: true,
      }),
      withEventReplay()
    )
  ]
};
