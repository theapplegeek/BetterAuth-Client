import {
  Component,
  computed,
  inject,
  Signal,
  viewChild,
} from '@angular/core';
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  Theme,
  ThemeService,
} from '../../../../common/services/theme.service';
import { AuthService } from '../../../../common/auth/auth.service';
import { UserService } from '../../../../common/user/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-menu',
  imports: [
    OverlayModule,
    MenuTrigger,
    Menu,
    MenuContent,
    MenuItem,
  ],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss',
})
export class ProfileMenuComponent {
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService =
    inject(AuthService);
  private readonly _themeService: ThemeService =
    inject(ThemeService);
  private readonly _userService: UserService =
    inject(UserService);

  public profileMenu =
    viewChild<Menu<string>>('profileMenu');
  public themeMenu = viewChild<Menu<string>>('themeMenu');

  public username: Signal<string> = computed((): string => {
    const currentUser = this._userService.user();
    if (!currentUser) return 'User';

    const normalizedName: string = currentUser.name.trim();
    if (normalizedName.length > 0) {
      return normalizedName;
    }

    const normalizedEmail: string = currentUser.email.trim();
    if (normalizedEmail.length > 0) {
      return normalizedEmail;
    }

    return 'User';
  });
  public currentTheme: Signal<Theme> = computed(
    (): Theme => this._themeService.getTheme(),
  );

  public setTheme(theme: Theme): void {
    this._themeService.setTheme(theme);
  }

  public openProfile(): void {
    this._router.navigate(['profile']);
  }

  public openSettings(): void {
    this._router.navigate(['settings']);
  }

  public signOut(): void {
    this._authService.signOut().subscribe();
  }
}
