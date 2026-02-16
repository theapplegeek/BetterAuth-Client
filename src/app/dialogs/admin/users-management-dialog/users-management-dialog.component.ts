import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ReactiveFormsModule } from '@angular/forms';

type UsersManagementDialogData = {
  host: any;
};

@Component({
  selector: 'app-users-management-dialog',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './users-management-dialog.component.html',
})
export class UsersManagementDialogComponent {
  private readonly _data: UsersManagementDialogData =
    inject(DIALOG_DATA);
  private readonly _host: any = this._data.host;

  public readonly activeModal = (): string =>
    this._host.activeModal();
  public readonly selectedUser = (): any =>
    this._host.selectedUser();
  public readonly roles = (): any[] => this._host.roles();
  public readonly sessions = (): any[] =>
    this._host.sessions();
  public readonly revokingSessionToken = ():
    | string
    | undefined => this._host.revokingSessionToken();
  public readonly isRoleSelected = (
    roleId: number,
  ): boolean => this._host.isRoleSelected(roleId);
  public readonly isSavingUser = (): boolean =>
    this._host.isSavingUser();
  public readonly isSavingPassword = (): boolean =>
    this._host.isSavingPassword();
  public readonly isSavingBan = (): boolean =>
    this._host.isSavingBan();
  public readonly isImpersonatingUser = (): boolean =>
    this._host.isImpersonatingUser();
  public readonly isLoadingSessions = (): boolean =>
    this._host.isLoadingSessions();
  public readonly isRevokingAllSessions = (): boolean =>
    this._host.isRevokingAllSessions();
  public readonly isDeletingUser = (): boolean =>
    this._host.isDeletingUser();

  public readonly userForm = this._host.userForm;
  public readonly passwordForm = this._host.passwordForm;
  public readonly banForm = this._host.banForm;

  public closeModal(): void {
    this._host.closeModal();
  }

  public saveUser(): void {
    this._host.saveUser();
  }

  public onRoleCheckboxChange(
    roleId: number,
    event: Event,
  ): void {
    this._host.onRoleCheckboxChange(roleId, event);
  }

  public savePassword(): void {
    this._host.savePassword();
  }

  public banUser(): void {
    this._host.banUser();
  }

  public confirmImpersonation(): void {
    this._host.confirmImpersonation();
  }

  public revokeAllSessions(): void {
    this._host.revokeAllSessions();
  }

  public revokeSession(session: any): void {
    this._host.revokeSession(session);
  }

  public deleteSelectedUser(): void {
    this._host.deleteSelectedUser();
  }
}
