import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

type SettingsNavItem = {
  id: 'account' | 'security';
  route: string;
  label: string;
  description: string;
  icon: string;
};

@Component({
  selector: 'app-settings',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  public readonly navItems: SettingsNavItem[] = [
    {
      id: 'account',
      route: 'account',
      label: 'My Account',
      description: 'Profile, email and account deletion',
      icon: 'icon-[heroicons--user-circle]',
    },
    {
      id: 'security',
      route: 'security',
      label: 'Security Settings',
      description:
        'Password, 2FA, passkeys and linked accounts',
      icon: 'icon-[heroicons--shield-check]',
    },
  ];
}
