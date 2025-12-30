import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'redirect-to-two-factor',
    redirectTo: '/auth/sign-in/two-factor', // Your 2FA Verification page path
    pathMatch: 'full',
  },
  {
    path: 'redirect-to-enable-two-factor',
    redirectTo: '/auth/sign-in/two-factor-enable', // Your Enable 2FA page path
    pathMatch: 'full',
  },
  {
    path: 'redirect-to-reset-password',
    redirectTo: '/auth/reset-password', // Your Reset Password (New Password Form) page path
    pathMatch: 'full',
  },
  {
    path: 'redirect-to-sign-in',
    redirectTo: '/auth/sign-in', // Your Sign In page path
    pathMatch: 'full',
  },
  {
    path: 'redirect-to-home',
    redirectTo: '/home', // Your Home page path
    pathMatch: 'full',
  },
];
