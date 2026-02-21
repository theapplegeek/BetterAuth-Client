import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

type AdminTab = {
  id: 'users' | 'roles' | 'permissions';
  route: string;
  label: string;
  description: string;
};

@Component({
  selector: 'app-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  public readonly tabs: AdminTab[] = [
    {
      id: 'users',
      route: 'users',
      label: 'Users',
      description:
        'Manage account lifecycle, app roles, and admin access',
    },
    {
      id: 'roles',
      route: 'roles',
      label: 'Roles',
      description: 'Define roles and assign permissions',
    },
    {
      id: 'permissions',
      route: 'permissions',
      label: 'Permissions',
      description: 'Control fine-grained access actions',
    },
  ];
}
