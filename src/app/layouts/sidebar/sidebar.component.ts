import {Component, computed, inject, signal, Signal, WritableSignal} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {NavItem} from './models/sidebar-item.type';
import {AuthService} from '../../common/auth/auth.service';

@Component({
  selector: 'sidebar-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly _authService: AuthService = inject(AuthService);

  public sidebarVisible: WritableSignal<boolean> = signal(false);
  public desktopSidebarOpen: WritableSignal<boolean> = signal(true);
  public navItems: WritableSignal<NavItem[]> = signal<NavItem[]>([
    { id: 'home', type: 'link', label: 'Home', icon: 'icon-[heroicons--home]', route: '/home' },
    { id: 'customer', type: 'link', label: 'Customer', icon: 'icon-[heroicons--shopping-bag]', route: '/customer' },
    { id: 'wiki', type: 'link', label: 'Wiki', icon: 'icon-[heroicons--book-open]', route: '/wiki' },
    {
      id: 'admin',
      type: 'group',
      label: 'Admin',
      route: '/admin',
      icon: 'icon-[heroicons--shield-check]',
      children: [
        { id: 'users', label: 'Users', icon: 'icon-[heroicons--user]', route: '/admin/users' },
        { id: 'logs', label: 'Logs', icon: 'icon-[heroicons--clipboard-document-list]', route: '/logs' },
      ],
    },
  ]);
  public openGroups: WritableSignal<Record<string, boolean>> = signal<Record<string, boolean>>({});
  public username: Signal<string> = computed((): string => {
    return "User";
  });

  public signOut(): void {
    this._authService.signOut().subscribe();
  }

  public haveAdminRole(): boolean {
    return true;
  }

  public closeSidebar(): void {
    this.sidebarVisible.set(false);
  }

  public changeSidebarVisibility(): void {
    this.sidebarVisible.update(v => !v);
  }

  public toggleDesktopSidebar(): void {
    this.desktopSidebarOpen.update(v => !v);
  }

  public toggleGroup(label: string): void {
    this.openGroups.update(m => ({ ...m, [label]: !m[label] }));
  }

  public isGroupOpen(label: string): boolean {
    return this.openGroups()[label];
  }
}
