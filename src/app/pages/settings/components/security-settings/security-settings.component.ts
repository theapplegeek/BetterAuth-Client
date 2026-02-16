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
import { Router } from '@angular/router';
import { Passkey } from '@better-auth/passkey';
import { ConfirmDialogComponent } from '../../../../common/components/confirm-dialog/confirm-dialog.component';
import {
  AccountSecurityService,
  LinkedAccount,
  SocialProvider,
  UserSession,
} from '../../../../common/auth/account-security.service';
import { AuthService } from '../../../../common/auth/auth.service';
import { ToastService } from '../../../../common/services/toast.service';
import { User } from '../../../../common/user/models/user.type';
import { UserService } from '../../../../common/user/user.service';

type ProviderId = 'credential' | 'google' | 'discord';
type ProviderCard = {
  provider: ProviderId;
  label: string;
  icon: string;
  connected: boolean;
  canDisconnect: boolean;
};
type SecurityConfirmDialog = {
  action:
    | {
        type: 'delete-passkey';
        passkeyId: string;
      }
    | { type: 'revoke-other-sessions' }
    | { type: 'revoke-all-sessions' }
    | {
        type: 'disconnect-provider';
        provider: ProviderId;
      };
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'primary' | 'danger';
};

@Component({
  selector: 'app-security-settings',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ConfirmDialogComponent,
  ],
  templateUrl: './security-settings.component.html',
  styleUrl: './security-settings.component.scss',
})
export class SecuritySettingsComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _router: Router = inject(Router);
  private readonly _accountSecurityService: AccountSecurityService =
    inject(AccountSecurityService);
  private readonly _authService: AuthService =
    inject(AuthService);
  private readonly _userService: UserService =
    inject(UserService);
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
  public readonly deletingPasskeyId: WritableSignal<
    string | undefined
  > = signal<string | undefined>(undefined);
  public readonly isRevokingOthers: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isRevokingAll: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly linkingProviderId: WritableSignal<
    ProviderId | undefined
  > = signal<ProviderId | undefined>(undefined);
  public readonly unlinkingProviderId: WritableSignal<
    ProviderId | undefined
  > = signal<ProviderId | undefined>(undefined);
  public readonly confirmDialog: WritableSignal<
    SecurityConfirmDialog | undefined
  > = signal<SecurityConfirmDialog | undefined>(undefined);

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
    const passkeyName: string =
      this.passkeyForm.controls.name.value.trim();

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

  public deletePasskey(passkeyId: string): void {
    this.deletingPasskeyId.set(passkeyId);
    this._accountSecurityService
      .deletePasskey(passkeyId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.deletingPasskeyId.set(undefined);
          this._toast.success('Passkey removed.');
          this._loadPasskeys();
        },
        error: (error: unknown): void => {
          this.deletingPasskeyId.set(undefined);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to delete passkey.',
            ),
          );
        },
      });
  }

  public revokeOtherSessions(): void {
    this.isRevokingOthers.set(true);
    this._accountSecurityService
      .revokeOtherSessions()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isRevokingOthers.set(false);
          this._toast.success(
            'Other sessions revoked.',
          );
          this._loadSessions();
        },
        error: (error: unknown): void => {
          this.isRevokingOthers.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to revoke other sessions.',
            ),
          );
        },
      });
  }

  public revokeAllSessions(): void {
    this.isRevokingAll.set(true);
    this._accountSecurityService
      .revokeAllSessions()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isRevokingAll.set(false);
          this._toast.success(
            'All sessions revoked. Redirecting to sign in...',
          );
          this._router.navigate(['/redirect-to-sign-in']);
        },
        error: (error: unknown): void => {
          this.isRevokingAll.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to revoke all sessions.',
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

  public disconnectProvider(provider: ProviderId): void {
    if (provider === 'credential') return;

    this.unlinkingProviderId.set(provider);
    this._accountSecurityService
      .unlinkAccount(provider)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.unlinkingProviderId.set(undefined);
          this._toast.success(
            `${provider} account disconnected.`,
          );
          this._loadAccounts();
        },
        error: (error: unknown): void => {
          this.unlinkingProviderId.set(undefined);
          this._toast.error(
            this._extractErrorMessage(
              error,
              `Unable to disconnect ${provider}.`,
            ),
          );
        },
      });
  }

  public requestDeletePasskey(passkeyId: string): void {
    this.confirmDialog.set({
      action: {
        type: 'delete-passkey',
        passkeyId: passkeyId,
      },
      title: 'Delete this passkey?',
      message:
        'The selected passkey will be removed from your account.',
      confirmLabel: 'Delete Passkey',
      tone: 'danger',
    });
  }

  public requestRevokeOtherSessions(): void {
    this.confirmDialog.set({
      action: { type: 'revoke-other-sessions' },
      title: 'Revoke other sessions?',
      message:
        'All sessions except the current one will be terminated.',
      confirmLabel: 'Revoke Others',
      tone: 'danger',
    });
  }

  public requestRevokeAllSessions(): void {
    this.confirmDialog.set({
      action: { type: 'revoke-all-sessions' },
      title: 'Revoke all sessions?',
      message:
        'You will be signed out and redirected to sign in again.',
      confirmLabel: 'Revoke All',
      tone: 'danger',
    });
  }

  public requestDisconnectProvider(provider: ProviderId): void {
    if (provider === 'credential') return;

    this.confirmDialog.set({
      action: {
        type: 'disconnect-provider',
        provider: provider,
      },
      title: `Disconnect ${provider}?`,
      message:
        'This social account will no longer be linked.',
      confirmLabel: 'Disconnect',
      tone: 'danger',
    });
  }

  public closeConfirmDialog(): void {
    this.confirmDialog.set(undefined);
  }

  public confirmDialogAction(): void {
    const dialog = this.confirmDialog();
    if (!dialog) return;

    this.confirmDialog.set(undefined);
    const action = dialog.action;

    if (action.type === 'delete-passkey') {
      this.deletePasskey(action.passkeyId);
      return;
    }

    if (action.type === 'revoke-other-sessions') {
      this.revokeOtherSessions();
      return;
    }

    if (action.type === 'revoke-all-sessions') {
      this.revokeAllSessions();
      return;
    }

    this.disconnectProvider(action.provider);
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
                new Date(
                  secondPasskey.createdAt,
                ).getTime() -
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
