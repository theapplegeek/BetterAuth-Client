import {
  Component,
  DestroyRef,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  DIALOG_DATA,
  DialogRef,
} from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { AdminHttpService } from '../../../../http/admin-http.service';
import {
  AdminUser,
  AdminUserSession,
} from '../../../../../../common/admin/models/admin.model';
import { ToastService } from '../../../../../../common/services/toast.service';

export type UserSessionsDialogData = {
  user: AdminUser;
};

export type UserSessionsDialogResult = {
  updated: boolean;
};

@Component({
  selector: 'app-user-sessions-dialog',
  imports: [DatePipe],
  templateUrl: './user-sessions-dialog.component.html',
})
export class UserSessionsDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _dialogRef: DialogRef<
    UserSessionsDialogResult,
    UserSessionsDialogComponent
  > = inject(
    DialogRef<
      UserSessionsDialogResult,
      UserSessionsDialogComponent
    >,
  );
  private readonly _data: UserSessionsDialogData =
    inject(DIALOG_DATA);

  private _hasUpdates: boolean = false;

  public readonly user: AdminUser = this._data.user;
  public readonly sessions: WritableSignal<
    AdminUserSession[]
  > = signal<AdminUserSession[]>([]);
  public readonly isLoadingSessions: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly revokingSessionToken: WritableSignal<
    string | undefined
  > = signal<string | undefined>(undefined);
  public readonly isRevokingAllSessions: WritableSignal<boolean> =
    signal<boolean>(false);

  constructor() {
    this._loadSessions();
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.onClose();
        }
      });
  }

  public onClose(): void {
    this._dialogRef.close({ updated: this._hasUpdates });
  }

  public revokeSession(session: AdminUserSession): void {
    const sessionToken: string =
      session.token || session.id;

    this.revokingSessionToken.set(sessionToken);
    this._adminService
      .revokeUserSession(sessionToken)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.revokingSessionToken.set(undefined);
          this._hasUpdates = true;
          this._loadSessions();
        },
        error: (error: unknown): void => {
          this.revokingSessionToken.set(undefined);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to revoke session.',
            ),
          );
        },
      });
  }

  public revokeAllSessions(): void {
    this.isRevokingAllSessions.set(true);
    this._adminService
      .revokeUserSessions(this.user.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isRevokingAllSessions.set(false);
          this._hasUpdates = true;
          this._loadSessions();
        },
        error: (error: unknown): void => {
          this.isRevokingAllSessions.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to revoke all user sessions.',
            ),
          );
        },
      });
  }

  private _loadSessions(): void {
    this.isLoadingSessions.set(true);
    this._adminService
      .listUserSessions(this.user.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (sessions: AdminUserSession[]): void => {
          const sortedSessions = [...sessions].sort(
            (
              firstSession: AdminUserSession,
              secondSession: AdminUserSession,
            ): number => {
              return (
                new Date(secondSession.updatedAt).getTime() -
                new Date(firstSession.updatedAt).getTime()
              );
            },
          );
          this.sessions.set(sortedSessions);
          this.isLoadingSessions.set(false);
        },
        error: (error: unknown): void => {
          this.isLoadingSessions.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to load user sessions.',
            ),
          );
        },
      });
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
