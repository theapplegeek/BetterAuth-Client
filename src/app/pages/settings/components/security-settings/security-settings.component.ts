import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Passkey } from '@better-auth/passkey';
import {
  AccountSecurityService,
  LinkedAccount,
  SocialProvider,
  UserSession,
} from '../../services/account-security.service';
import { AuthService } from '../../../../common/auth/auth.service';
import { AppDialogService } from '../../../../common/services/app-dialog.service';
import { ToastService } from '../../../../common/services/toast.service';
import { User } from '../../../../common/user/models/user.type';
import { UserService } from '../../../../common/user/user.service';
import {
  DeletePasskeyDialogComponent,
  DeletePasskeyDialogResult,
} from './dialogs/delete-passkey-dialog/delete-passkey-dialog.component';
import {
  DisconnectProviderDialogComponent,
  DisconnectProviderDialogResult,
} from './dialogs/disconnect-provider-dialog/disconnect-provider-dialog.component';
import {
  RevokeAllSessionsDialogComponent,
  RevokeAllSessionsDialogResult,
} from './dialogs/revoke-all-sessions-dialog/revoke-all-sessions-dialog.component';
import {
  RevokeOtherSessionsDialogComponent,
  RevokeOtherSessionsDialogResult,
} from './dialogs/revoke-other-sessions-dialog/revoke-other-sessions-dialog.component';
import { trimControl } from '../../../../common/forms/input-normalizer.util';

type ProviderId = 'credential' | 'google' | 'discord';
type ProviderCard = {
  provider: ProviderId;
  label: string;
  icon: string;
  connected: boolean;
  canDisconnect: boolean;
};
type SecurityPanelId =
  | 'password'
  | 'two-factor'
  | 'passkeys'
  | 'sessions'
  | 'accounts';
type SecurityPanelTab = {
  id: SecurityPanelId;
  label: string;
  shortLabel: string;
  icon: string;
};

@Component({
  selector: 'app-security-settings',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './security-settings.component.html',
  styleUrl: './security-settings.component.scss',
})
export class SecuritySettingsComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _accountSecurityService: AccountSecurityService =
    inject(AccountSecurityService);
  private readonly _authService: AuthService =
    inject(AuthService);
  private readonly _userService: UserService =
    inject(UserService);
  private readonly _dialogService: AppDialogService =
    inject(AppDialogService);
  private readonly _toast: ToastService =
    inject(ToastService);

  public readonly user = computed((): User | undefined =>
    this._userService.user(),
  );
  public readonly hasCredentialAccount = computed(
    (): boolean =>
      this.connectedProviders().some(
        (provider: ProviderCard): boolean =>
          provider.provider === 'credential' &&
          provider.connected,
      ),
  );

  public readonly isLoading: WritableSignal<boolean> =
    signal<boolean>(true);
  public readonly isChangingPassword: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isRequestingCredentialSetup: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isUpdatingTwoFactor: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isAddingPasskey: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly linkingProviderId: WritableSignal<
    ProviderId | undefined
  > = signal<ProviderId | undefined>(undefined);
  public readonly activeSecurityPanel: WritableSignal<SecurityPanelId> =
    signal<SecurityPanelId>('password');
  public readonly securityPanelTabs: SecurityPanelTab[] = [
    {
      id: 'password',
      label: 'Password',
      shortLabel: 'Password',
      icon: 'icon-[heroicons--key]',
    },
    {
      id: 'two-factor',
      label: '2FA',
      shortLabel: '2FA',
      icon: 'icon-[heroicons--shield-check]',
    },
    {
      id: 'passkeys',
      label: 'Passkeys',
      shortLabel: 'Passkeys',
      icon: 'icon-[heroicons--finger-print]',
    },
    {
      id: 'sessions',
      label: 'Sessions',
      shortLabel: 'Sessions',
      icon: 'icon-[heroicons--computer-desktop]',
    },
    {
      id: 'accounts',
      label: 'Connected Accounts',
      shortLabel: 'Accounts',
      icon: 'icon-[heroicons--link]',
    },
  ];

  public readonly passkeys: WritableSignal<Passkey[]> =
    signal<Passkey[]>([]);
  public readonly sessions: WritableSignal<UserSession[]> =
    signal<UserSession[]>([]);
  public readonly connectedProviders: WritableSignal<
    ProviderCard[]
  > = signal<ProviderCard[]>([]);
  public readonly currentSessionId: WritableSignal<
    string | undefined
  > = signal<string | undefined>(undefined);

  public readonly changePasswordForm = new FormGroup({
    currentPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
      ],
    }),
    revokeOtherSessions: new FormControl(true, {
      nonNullable: true,
    }),
  });
  public readonly twoFactorForm = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  public readonly passkeyForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
  });

  constructor() {
    this.loadSecurityState();
  }

  public setActiveSecurityPanel(
    panelId: SecurityPanelId,
  ): void {
    this.activeSecurityPanel.set(panelId);
  }

  public isSecurityPanelActive(
    panelId: SecurityPanelId,
  ): boolean {
    return this.activeSecurityPanel() === panelId;
  }

  public loadSecurityState(): void {
    this.isLoading.set(true);
    this._accountSecurityService
      .refreshSession()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: ({ session, user }): void => {
          this.currentSessionId.set(session.id);
          this._userService.user.set(user);
          this._loadAccounts();
          this._loadPasskeys();
          this._loadSessions();
          this.isLoading.set(false);
        },
        error: (error: unknown): void => {
          this.isLoading.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to load security settings.',
            ),
          );
        },
      });
  }

  public requestCredentialSetup(): void {
    const currentUser: User | undefined = this.user();
    if (!currentUser?.email) {
      this._toast.error(
        'Unable to read your account email.',
      );
      return;
    }

    this.isRequestingCredentialSetup.set(true);
    this._accountSecurityService
      .requestCredentialPasswordSetup(
        currentUser.email,
        `${window.location.origin}/redirect-to-reset-password`,
      )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isRequestingCredentialSetup.set(false);
          this._toast.success(
            'Check your inbox: we sent a link to set your password.',
          );
        },
        error: (error: unknown): void => {
          this.isRequestingCredentialSetup.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to send password setup email.',
            ),
          );
        },
      });
  }

  public changePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    if (!this.hasCredentialAccount()) {
      this._toast.warning(
        'Link credential login before changing password.',
      );
      return;
    }

    const revokeOtherSessions: boolean =
      this.changePasswordForm.controls.revokeOtherSessions
        .value;

    this.isChangingPassword.set(true);
    this._accountSecurityService
      .changePassword({
        currentPassword:
          this.changePasswordForm.controls.currentPassword
            .value,
        newPassword:
          this.changePasswordForm.controls.newPassword
            .value,
        revokeOtherSessions: revokeOtherSessions,
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isChangingPassword.set(false);
          this.changePasswordForm.reset({
            currentPassword: '',
            newPassword: '',
            revokeOtherSessions: true,
          });
          this._toast.success(
            'Password changed successfully.',
          );

          if (revokeOtherSessions) {
            this._loadSessions();
          }
        },
        error: (error: unknown): void => {
          this.isChangingPassword.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to change password.',
            ),
          );
        },
      });
  }

  public updateTwoFactor(): void {
    if (this.twoFactorForm.invalid) {
      this.twoFactorForm.markAllAsTouched();
      return;
    }

    if (!this.hasCredentialAccount()) {
      this._toast.warning(
        'Credential login is required before managing 2FA.',
      );
      return;
    }

    const password: string =
      this.twoFactorForm.controls.password.value;
    const twoFactorEnabled: boolean =
      this.user()?.twoFactorEnabled ?? false;

    this.isUpdatingTwoFactor.set(true);

    if (!twoFactorEnabled) {
      this._authService
        .enableTwoFactor(password)
        .subscribe({
          next: (): void => {
            this.isUpdatingTwoFactor.set(false);
            this._toast.success(
              'Two-factor setup started. Complete verification in the next screen.',
            );
          },
          error: (error: unknown): void => {
            this.isUpdatingTwoFactor.set(false);
            this._toast.error(
              this._extractErrorMessage(
                error,
                'Unable to start 2FA setup.',
              ),
            );
          },
        });
      return;
    }

    this._accountSecurityService
      .disableTwoFactor(password)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isUpdatingTwoFactor.set(false);
          this.twoFactorForm.reset({
            password: '',
          });
          this._toast.success(
            'Two-factor authentication disabled.',
          );
          this.loadSecurityState();
        },
        error: (error: unknown): void => {
          this.isUpdatingTwoFactor.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to disable 2FA.',
            ),
          );
        },
      });
  }

  public addPasskey(): void {
    trimControl(this.passkeyForm.controls.name);

    if (this.passkeyForm.invalid) {
      this.passkeyForm.markAllAsTouched();
      return;
    }

    const passkeyName: string =
      this.passkeyForm.controls.name.value;

    this.isAddingPasskey.set(true);
    this._accountSecurityService
      .addPasskey(passkeyName || undefined)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isAddingPasskey.set(false);
          this.passkeyForm.reset({
            name: '',
          });
          this._toast.success(
            'Passkey registered successfully.',
          );
          this._loadPasskeys();
        },
        error: (error: unknown): void => {
          this.isAddingPasskey.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to add passkey.',
            ),
          );
        },
      });
  }

  public connectProvider(provider: ProviderId): void {
    if (provider === 'credential') {
      this.requestCredentialSetup();
      return;
    }

    this.linkingProviderId.set(provider);
    this._accountSecurityService
      .linkSocialAccount(
        provider as SocialProvider,
        `${window.location.origin}/settings/security`,
      )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.linkingProviderId.set(undefined);
        },
        error: (error: unknown): void => {
          this.linkingProviderId.set(undefined);
          this._toast.error(
            this._extractErrorMessage(
              error,
              `Unable to connect ${provider}.`,
            ),
          );
        },
      });
  }

  public requestDeletePasskey(passkeyId: string): void {
    this._dialogService
      .open<
        DeletePasskeyDialogResult,
        { passkeyId: string },
        DeletePasskeyDialogComponent
      >(DeletePasskeyDialogComponent, {
        width: 'min(100vw - 2rem, 36rem)',
        maxWidth: '36rem',
        data: { passkeyId: passkeyId },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (
          result: DeletePasskeyDialogResult | undefined,
        ): void => {
          if (result?.deleted) {
            this._loadPasskeys();
          }
        },
      );
  }

  public requestRevokeOtherSessions(): void {
    this._dialogService
      .open<
        RevokeOtherSessionsDialogResult,
        unknown,
        RevokeOtherSessionsDialogComponent
      >(RevokeOtherSessionsDialogComponent, {
        width: 'min(100vw - 2rem, 36rem)',
        maxWidth: '36rem',
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (
          result: RevokeOtherSessionsDialogResult | undefined,
        ): void => {
          if (result?.revoked) {
            this._loadSessions();
          }
        },
      );
  }

  public requestRevokeAllSessions(): void {
    this._dialogService
      .open<
        RevokeAllSessionsDialogResult,
        unknown,
        RevokeAllSessionsDialogComponent
      >(RevokeAllSessionsDialogComponent, {
        width: 'min(100vw - 2rem, 36rem)',
        maxWidth: '36rem',
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  public requestDisconnectProvider(provider: ProviderId): void {
    if (provider === 'credential') return;

    this._dialogService
      .open<
        DisconnectProviderDialogResult,
        { provider: 'google' | 'discord' },
        DisconnectProviderDialogComponent
      >(DisconnectProviderDialogComponent, {
        width: 'min(100vw - 2rem, 36rem)',
        maxWidth: '36rem',
        data: {
          provider: provider,
        },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (
          result: DisconnectProviderDialogResult | undefined,
        ): void => {
          if (result?.disconnected) {
            this._loadAccounts();
          }
        },
      );
  }

  private _loadAccounts(): void {
    this._accountSecurityService
      .listAccounts()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (accounts: LinkedAccount[]): void => {
          this.connectedProviders.set(
            this._toProviderCards(accounts),
          );
        },
        error: (): void => {
          this.connectedProviders.set(
            this._toProviderCards([]),
          );
        },
      });
  }

  private _loadPasskeys(): void {
    this._accountSecurityService
      .listPasskeys()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (passkeys: Passkey[]): void => {
          const sortedPasskeys = [...passkeys].sort(
            (
              firstPasskey: Passkey,
              secondPasskey: Passkey,
            ): number => {
              return (
                new Date(secondPasskey.createdAt).getTime() -
                new Date(firstPasskey.createdAt).getTime()
              );
            },
          );
          this.passkeys.set(sortedPasskeys);
        },
        error: (): void => {
          this.passkeys.set([]);
        },
      });
  }

  private _loadSessions(): void {
    this._accountSecurityService
      .listSessions()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (sessions: UserSession[]): void => {
          this.sessions.set(this._sortSessions(sessions));
        },
        error: (): void => {
          this.sessions.set([]);
        },
      });
  }

  private _sortSessions(
    sessions: UserSession[],
  ): UserSession[] {
    const currentSessionId = this.currentSessionId();

    return [...sessions].sort(
      (
        firstSession: UserSession,
        secondSession: UserSession,
      ): number => {
        if (
          firstSession.id === currentSessionId &&
          secondSession.id !== currentSessionId
        ) {
          return -1;
        }
        if (
          secondSession.id === currentSessionId &&
          firstSession.id !== currentSessionId
        ) {
          return 1;
        }

        return (
          new Date(secondSession.updatedAt).getTime() -
          new Date(firstSession.updatedAt).getTime()
        );
      },
    );
  }

  private _toProviderCards(
    linkedAccounts: LinkedAccount[],
  ): ProviderCard[] {
    const connectedProviders = new Set<ProviderId>(
      linkedAccounts
        .map((account: LinkedAccount): string =>
          account.providerId.toLowerCase(),
        )
        .filter(
          (providerId: string): providerId is ProviderId =>
            providerId === 'credential' ||
            providerId === 'google' ||
            providerId === 'discord',
        ),
    );

    return [
      {
        provider: 'credential',
        label: 'Credentials',
        icon: 'icon-[heroicons--key]',
        connected: connectedProviders.has('credential'),
        canDisconnect: false,
      },
      {
        provider: 'google',
        label: 'Google',
        icon: 'icon-[logos--google-icon]',
        connected: connectedProviders.has('google'),
        canDisconnect: true,
      },
      {
        provider: 'discord',
        label: 'Discord',
        icon: 'icon-[logos--discord-icon]',
        connected: connectedProviders.has('discord'),
        canDisconnect: true,
      },
    ];
  }

  private _extractErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (!error || typeof error !== 'object') {
      return fallback;
    }

    const candidate = error as {
      message?: string;
      statusText?: string;
    };
    return (
      candidate.message ?? candidate.statusText ?? fallback
    );
  }
}
