import {
  Component,
  computed,
  inject,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NavItem } from './models/sidebar-item.type';
import { OverlayModule } from '@angular/cdk/overlay';
import { ProfileMenuComponent } from './components/profile-menu/profile-menu.component';
import { UserService } from '../../common/user/user.service';

@Component({
  selector: 'sidebar-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    OverlayModule,
    ProfileMenuComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly _userService: UserService =
    inject(UserService);

  public sidebarVisible: WritableSignal<boolean> =
    signal(false);
  public desktopSidebarOpen: WritableSignal<boolean> =
    signal(true);
  private readonly _baseNavItems: NavItem[] = [
    {
      id: 'home',
      type: 'link',
      label: 'Dashboard',
      icon: 'icon-[heroicons--squares-2x2]',
      route: '/home',
    },
    {
      id: 'todos',
      type: 'link',
      label: 'My Tasks',
      icon: 'icon-[heroicons--check-badge]',
      route: '/todos',
    },
    {
      id: 'completed',
      type: 'link',
      label: 'Completed',
      icon: 'icon-[heroicons--archive-box]',
      route: '/todos/completed',
    },
    {
      id: 'settings',
      type: 'link',
      label: 'Settings',
      icon: 'icon-[heroicons--cog-8-tooth]',
      route: '/settings',
    },
    {
      id: 'admin',
      type: 'group',
      label: 'Admin',
      route: '/admin',
      icon: 'icon-[heroicons--shield-check]',
      roles: ['admin'],
      children: [
        {
          id: 'users',
          label: 'Users',
          icon: 'icon-[heroicons--users]',
          route: '/admin/users',
          roles: ['admin'],
        },
        {
          id: 'roles',
          label: 'Roles',
          icon: 'icon-[heroicons--lock-open]',
          route: '/admin/roles',
          roles: ['admin'],
        },
        {
          id: 'permissions',
          label: 'Permissions',
          icon: 'icon-[heroicons--key]',
          route: '/admin/permissions',
          roles: ['admin'],
        },
      ],
    },
  ];
  public navItems: Signal<NavItem[]> = computed(
    (): NavItem[] => {
      return this._baseNavItems
        .filter((item: NavItem): boolean =>
          this._canAccess(item.roles),
        )
        .map((item: NavItem): NavItem => {
          if (item.type !== 'group') return item;

          const children =
            item.children?.filter((child) =>
              this._canAccess(child.roles),
            ) ?? [];

          return {
            ...item,
            children: children,
          };
        })
        .filter((item: NavItem): boolean => {
          if (item.type !== 'group') return true;
          return (item.children?.length ?? 0) > 0;
        });
    },
  );
  public openGroups: WritableSignal<
    Record<string, boolean>
  > = signal<Record<string, boolean>>({});

  public closeSidebar(): void {
    this.sidebarVisible.set(false);
  }

  public changeSidebarVisibility(): void {
    this.sidebarVisible.update((v) => !v);
  }

  public toggleDesktopSidebar(): void {
    this.desktopSidebarOpen.update((v) => !v);
  }

  public toggleGroup(label: string): void {
    this.openGroups.update((m) => ({
      ...m,
      [label]: !m[label],
    }));
  }

  public isGroupOpen(label: string): boolean {
    return this.openGroups()[label];
  }

  private _canAccess(requiredRoles?: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = this._userService.user();
    if (!user) return false;

    const mergedRoles = [...user.roles, user.role].filter(
      (value): value is string =>
        typeof value === 'string' && value.length > 0,
    );

    return requiredRoles.some((requiredRole: string) =>
      mergedRoles.includes(requiredRole),
    );
  }
}
