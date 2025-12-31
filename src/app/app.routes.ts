import {Router, Routes} from '@angular/router';
import {LayoutsComponent} from './layouts/layouts.component';
import {inject} from '@angular/core';

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
    redirectTo: (route) => {
      const router = inject(Router);
      return router.createUrlTree(
        ['/auth/reset-password'],
        { queryParams: route.queryParams }
      );
    }, // Your Reset Password (New Password Form) page path
    pathMatch: 'full',
  },
  {
    path: 'redirect-to-sign-in',
    redirectTo: '/auth/sign-in', // Your Sign In page path
    pathMatch: 'full',
  },
  {
    path: 'redirect-to-sign-out',
    redirectTo: '/auth/sign-out', // Your Sign Out page path
    pathMatch: 'full',
  },
  {
    path: 'redirect-to-home',
    redirectTo: '/home', // Your Home page path
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: '',
    component: LayoutsComponent,
    data: {
      layout: 'empty'
    },
    children: [
      {
        path: 'auth',
        loadChildren: () => import('./pages/auth/auth.routes').then(m => m.routes),
      }
    ],
  },
  {
    path: '',
    component: LayoutsComponent,
    data: {
      layout: 'sidebar'
    },
    children: [
      {
        path: 'home',
        loadChildren: () => import('./pages/home/home.routes').then(m => m.routes),
      },
      {
        path: 'customer',
        loadChildren: () => import('./pages/customers/customers.routes').then(m => m.routes),
      },
      {
        path: 'wiki',
        loadChildren: () => import('./pages/wiki/wiki-routes').then(m => m.routes),
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  }
];
