import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { UsersManagementComponent } from './components/users-management/users-management.component';
import { RolesManagementComponent } from './components/roles-management/roles-management.component';
import { PermissionsManagementComponent } from './components/permissions-management/permissions-management.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'users',
        component: UsersManagementComponent,
      },
      {
        path: 'roles',
        component: RolesManagementComponent,
      },
      {
        path: 'permissions',
        component: PermissionsManagementComponent,
      },
    ],
  },
];
