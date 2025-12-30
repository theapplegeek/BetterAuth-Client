import {Component, computed, inject, signal, Signal, WritableSignal} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {NavItem} from './sidebar-item.type';

@Component({
  selector: 'sidebar-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private _router: Router = inject(Router);

  public sidebarVisible: WritableSignal<boolean> = signal(false);
  public desktopSidebarOpen: WritableSignal<boolean> = signal(true);
  public navItems: NavItem[] = [
    { id: 'home', type: 'link', label: 'Home', route: '/home' },
    { id: 'customer', type: 'link', label: 'Customer', route: '/customer' },
    { id: 'wiki', type: 'link', label: 'Wiki', route: '/wiki' },
    {
      id: 'admin',
      type: 'group',
      label: 'Admin',
      children: [
        { id: 'users', label: 'Users', route: '/users' },
        { id: 'logs', label: 'Logs', route: '/logs' },
      ],
    },
  ];
  public openGroups: WritableSignal<Record<string, boolean>> = signal<Record<string, boolean>>({});
  public username: Signal<string> = computed((): string => {
    return "User";
  });

  constructor() {
  }

  public signOut(): void {
    this._router.navigate(['auth', 'sign-out']);
  }

  public haveAdminRole(): boolean {
    return true;
  }

  closeSidebar(): void {
    this.sidebarVisible.set(false);
  }

  public changeSidebarVisibility() {
    this.sidebarVisible.update(v => !v);
  }

  public toggleDesktopSidebar() {
    this.desktopSidebarOpen.update(v => !v);
  }

  public toggleGroup(label: string) {
    this.openGroups.update(m => ({ ...m, [label]: !m[label] }));
  }

  public isGroupOpen(label: string) {
    return this.openGroups()[label];
  }
}
