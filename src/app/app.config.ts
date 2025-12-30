import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer
} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {ThemeService} from './common/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideEnvironmentInitializer(() => inject(ThemeService)),
    provideRouter(routes)
  ]
};
