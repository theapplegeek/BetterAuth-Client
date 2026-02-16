import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { AccountSettingsComponent } from './components/account-settings/account-settings.component';
import { SecuritySettingsComponent } from './components/security-settings/security-settings.component';

export const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      {
        path: '',
        redirectTo: 'account',
        pathMatch: 'full',
      },
      {
        path: 'account',
        component: AccountSettingsComponent,
      },
      {
        path: 'security',
        component: SecuritySettingsComponent,
      },
    ],
  },
];
