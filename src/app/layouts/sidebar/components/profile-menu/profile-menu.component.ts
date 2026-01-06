import {Component, computed, inject, Signal, viewChild} from '@angular/core';
import {Menu, MenuContent, MenuItem, MenuTrigger} from '@angular/aria/menu';
import {OverlayModule} from '@angular/cdk/overlay';
import {Theme, ThemeService} from '../../../../common/services/theme.service';
import {AuthService} from '../../../../common/auth/auth.service';
import {UserService} from '../../../../common/user/user.service';

@Component({
  selector: 'app-profile-menu',
  imports: [
    OverlayModule,
    MenuTrigger,
    Menu,
    MenuContent,
    MenuItem
  ],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss',
})
export class ProfileMenuComponent {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _themeService: ThemeService = inject(ThemeService);
  private readonly _userService: UserService = inject(UserService);

  public profileMenu = viewChild<Menu<string>>('profileMenu');
  public themeMenu = viewChild<Menu<string>>('themeMenu');

  public username: Signal<string> = computed((): string => {
    return this._userService.user()?.name ?? 'User';
  });
  public currentTheme: Signal<Theme> = computed((): Theme => this._themeService.getTheme());

  public setTheme(theme: Theme): void {
    this._themeService.setTheme(theme);
  }

  public signOut(): void {
    this._authService.signOut().subscribe();
  }
}
