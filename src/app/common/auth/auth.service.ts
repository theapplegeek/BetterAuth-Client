import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {BetterAuthClientService} from './better-auth/better-auth-client.service';
import {catchError, EMPTY, from, map, tap, throwError} from 'rxjs';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _betterAuthClient: BetterAuthClientService = inject(BetterAuthClientService);
  private readonly _router: Router = inject(Router);
  private readonly _authClient = this._betterAuthClient.getClient();

  public twoFactorEnableData: WritableSignal<{
    backupCodes?: string[],
    totpURI?: string,
  } | undefined> = signal(undefined);
  public jwtToken: WritableSignal<string | undefined> = signal<string | undefined>(undefined);

  // ==========================================================================
  // Sign Up Methods
  // ==========================================================================
  public signUp(userData: { name: string, email: string, password: string }) {
    return from(this._authClient.signUp.email({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      callbackURL: `${window.location.origin}/redirect-to-home`,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // Sign In With Email And Password
  // ==========================================================================
  public signInWithPassword(credentials: { email: string; password: string }) {
    return from(this._authClient.signIn.email({
      email: credentials.email,
      password: credentials.password,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      tap((res: any): void => {
        const twoFactorEnabled: boolean = res.twoFactorRedirect ?? false;
        if (twoFactorEnabled) {
          this._router.navigate(['/redirect-to-two-factor']);
        } else {
          this.enableTwoFactor(credentials.password).subscribe();
        }
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // Two Factor Authentication Methods
  // ==========================================================================
  public enableTwoFactor(password: string) {
    return from(this._authClient.twoFactor.enable({
      password: password,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      tap((res): void => {
        this.twoFactorEnableData.set({...res});
        this._router.navigate(['/redirect-to-enable-two-factor']);
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }

  public verifyTwoFactorTOTP(code: string) {
    return from(this._authClient.twoFactor.verifyTotp({
      code: code,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      tap((): void => {
        this.getJwtToken();
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }

  public verifyTwoFactorBackupCode(code: string) {
    return from(this._authClient.twoFactor.verifyBackupCode({
      code: code,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      tap((): void => {
        this.getJwtToken();
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // Passkey Authentication Methods
  // ==========================================================================
  public signInWithPasskey(autoFill: boolean) {
    return from(this._authClient.signIn.passkey({
      autoFill: autoFill ? true : undefined,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      tap((): void => {
        this.getJwtToken();
        this._router.navigate(['/redirect-to-home']);
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        if ('code' in err && err.code === 'AUTH_CANCELLED') {
          return EMPTY;
        }
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // Magic Link Authentication Methods
  // ==========================================================================
  public signInWithMagicLink(email: string) {
    return from(this._authClient.signIn.magicLink({
      email: email,
      callbackURL: `${window.location.origin}/redirect-to-home`,
      newUserCallbackURL: `${window.location.origin}/redirect-to-home`,
      errorCallbackURL: `${window.location.origin}/redirect-to-sign-in`,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // Social Authentication Methods
  // ==========================================================================
  public signInWithGoogle() {
    return from(this._authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/redirect-to-home`,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }

  public signInWithDiscord() {
    return from(this._authClient.signIn.social({
      provider: 'discord',
      callbackURL: `${window.location.origin}/redirect-to-home`,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }

  // ==========================================================================
  // Sign Out
  // ==========================================================================
  public signOut() {
    return from(this._authClient.signOut())
      .pipe(
        map((res) => {
          if (res.error) throw res.error;
          return res.data;
        }),
        tap((): void => {
          this._router.navigate(['/redirect-to-sign-in']);
        }),
        catchError((err: any) => {
          // TODO: Handle better auth error
          return throwError(() => err);
        })
      );
  }

  // ==========================================================================
  // Get JWT Token
  // ==========================================================================
  public getJwtToken() {
    return from(this._authClient.token())
      .pipe(
        map((res) => {
          if (res.error) throw res.error;
          return res.data;
        }),
        tap((res): void => {
          this.jwtToken.set(res.token);
        }),
        catchError((err) => {
          // TODO: Handle better auth error
          return throwError(() => err);
        })
      );
  }

  // ==========================================================================
  // Password Reset Methods
  // ==========================================================================
  public requestResetPassword(email: string) {
    return from(this._authClient.requestPasswordReset({
      email: email,
      redirectTo: `${window.location.origin}/redirect-to-reset-password`,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }

  public resetPassword(newPassword: string, token: string) {
    return from(this._authClient.resetPassword({
      newPassword: newPassword,
      token: token,
    })).pipe(
      map((res) => {
        if (res.error) throw res.error;
        return res.data;
      }),
      tap((): void => {
        this._router.navigate(['/redirect-to-sign-in']);
      }),
      catchError((err: any) => {
        // TODO: Handle better auth error
        return throwError(() => err);
      })
    );
  }
}
