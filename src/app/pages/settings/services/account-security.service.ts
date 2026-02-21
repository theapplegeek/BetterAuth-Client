import { inject, Injectable } from '@angular/core';
import { from, map, Observable, tap } from 'rxjs';
import { BetterAuthClientService } from '../../../common/auth/better-auth/better-auth-client.service';
import { Session } from 'better-auth';
import { User } from '../../../common/user/models/user.type';
import { UserService } from '../../../common/user/user.service';
import { Passkey } from '@better-auth/passkey';

type BetterAuthError = {
  message?: string;
  code?: string;
  status?: number;
  statusText?: string;
};

export type AccountSession = {
  session: Session;
  user: User;
};

export type LinkedAccount = {
  id: string;
  providerId: string;
  accountId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type UserSession = {
  id: string;
  userId: string;
  token: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type TwoFactorEnableResponse = {
  backupCodes?: string[];
  totpURI?: string;
};

export type SocialProvider = 'google' | 'discord';

type SessionUserResponse = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  role?: string | string[] | null;
  roles?: string[];
  permissions?: string[];
  image?: string | null;
  twoFactorEnabled?: boolean | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

@Injectable({
  providedIn: 'root',
})
export class AccountSecurityService {
  private readonly _authClient = inject(
    BetterAuthClientService,
  ).getClient();
  private readonly _userService: UserService =
    inject(UserService);

  public refreshSession(): Observable<AccountSession> {
    return this._fromResult<{
      session: Session;
      user: SessionUserResponse;
    }>(this._authClient.getSession()).pipe(
      map(
        (payload: {
          session: Session;
          user: SessionUserResponse;
        }): AccountSession => {
          const normalizedUser: User = {
            id: payload.user.id,
            email: payload.user.email,
            emailVerified: payload.user.emailVerified,
            name: payload.user.name,
            image: payload.user.image ?? null,
            role:
              typeof payload.user.role === 'string' &&
              payload.user.role.length > 0
                ? payload.user.role
                : 'user',
            roles: payload.user.roles ?? [],
            permissions: payload.user.permissions ?? [],
            twoFactorEnabled:
              payload.user.twoFactorEnabled ?? false,
            banned: payload.user.banned ?? false,
            banReason: payload.user.banReason ?? null,
            banExpires: payload.user.banExpires
              ? new Date(payload.user.banExpires).toISOString()
              : null,
            createdAt: new Date(payload.user.createdAt),
            updatedAt: new Date(payload.user.updatedAt),
          };

          return {
            session: payload.session,
            user: normalizedUser,
          };
        },
      ),
      tap((session: AccountSession): void => {
        this._userService.user.set(session.user);
      }),
    );
  }

  public updateUserName(name: string): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.updateUser({
        name: name,
      }),
    ).pipe(
      map((): void => undefined),
      tap((): void => {
        const currentUser = this._userService.user();
        if (!currentUser) return;
        this._userService.user.set({
          ...currentUser,
          name: name,
        });
      }),
    );
  }

  public changeEmail(
    newEmail: string,
    callbackURL: string,
  ): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.changeEmail({
        newEmail: newEmail,
        callbackURL: callbackURL,
      }),
    ).pipe(map((): void => undefined));
  }

  public deleteAccount(
    callbackURL: string,
  ): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.deleteUser({
        callbackURL: callbackURL,
      }),
    ).pipe(map((): void => undefined));
  }

  public changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions: boolean;
  }): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.changePassword({
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
        revokeOtherSessions: payload.revokeOtherSessions,
      }),
    ).pipe(map((): void => undefined));
  }

  public requestCredentialPasswordSetup(
    email: string,
    redirectTo: string,
  ): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.requestPasswordReset({
        email: email,
        redirectTo: redirectTo,
      }),
    ).pipe(map((): void => undefined));
  }

  public enableTwoFactor(
    password: string,
  ): Observable<TwoFactorEnableResponse> {
    return this._fromResult<TwoFactorEnableResponse>(
      this._authClient.twoFactor.enable({
        password: password,
      }),
    );
  }

  public disableTwoFactor(
    password: string,
  ): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.twoFactor.disable({
        password: password,
      }),
    ).pipe(map((): void => undefined));
  }

  public listAccounts(): Observable<LinkedAccount[]> {
    return this._fromResult<LinkedAccount[]>(
      this._authClient.listAccounts({}),
    );
  }

  public linkSocialAccount(
    provider: SocialProvider,
    callbackURL: string,
  ): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.signIn.social({
        provider: provider,
        callbackURL: callbackURL,
      }),
    ).pipe(map((): void => undefined));
  }

  public unlinkAccount(
    providerId: string,
  ): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.unlinkAccount({
        providerId: providerId,
      }),
    ).pipe(map((): void => undefined));
  }

  public listPasskeys(): Observable<Passkey[]> {
    return this._fromResult<Passkey[]>(
      this._authClient.passkey.listUserPasskeys({}),
    );
  }

  public addPasskey(name?: string): Observable<Passkey> {
    return this._fromResult<Passkey>(
      this._authClient.passkey.addPasskey({
        name: name,
      }),
    );
  }

  public deletePasskey(id: string): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.passkey.deletePasskey({
        id: id,
      }),
    ).pipe(map((): void => undefined));
  }

  public listSessions(): Observable<UserSession[]> {
    return this._fromResult<UserSession[]>(
      this._authClient.listSessions({}),
    );
  }

  public revokeAllSessions(): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.revokeSessions({}),
    ).pipe(map((): void => undefined));
  }

  public revokeOtherSessions(): Observable<void> {
    return this._fromResult<unknown>(
      this._authClient.revokeOtherSessions({}),
    ).pipe(map((): void => undefined));
  }

  private _fromResult<TData>(
    promise: Promise<{
      data: TData | null;
      error: unknown;
    }>,
  ): Observable<TData> {
    return from(promise).pipe(
      map(
        (result: {
          data: TData | null;
          error: unknown;
        }): TData => {
          if (result.error) {
            throw result.error as BetterAuthError;
          }

          if (result.data === null) {
            throw new Error(
              'Empty response from BetterAuth',
            );
          }

          return result.data;
        },
      ),
    );
  }
}
