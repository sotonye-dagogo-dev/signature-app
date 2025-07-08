import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { data } from '../environment/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideHttpClient, withFetch } from '@angular/common/http';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(),
    provideHttpClient(
      withFetch()
    ),
    provideClientHydration(
      withHttpTransferCacheOptions({
        includePostRequests: true,
      }),
      withEventReplay()
    )
  ]
};
