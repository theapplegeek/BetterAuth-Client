import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  DIALOG_DATA,
  DialogRef,
} from '@angular/cdk/dialog';
import {
  AdminRole,
  AdminUser,
} from '../../../../models/admin.model';

export type UserDetailDialogData = {
  user: AdminUser;
};

@Component({
  selector: 'app-user-detail-dialog',
  imports: [DatePipe],
  templateUrl: './user-detail-dialog.component.html',
})
export class UserDetailDialogComponent {
  private readonly _dialogRef: DialogRef<
    void,
    UserDetailDialogComponent
  > = inject(DialogRef<void, UserDetailDialogComponent>);
  private readonly _data: UserDetailDialogData =
    inject(DIALOG_DATA);

  public readonly user: AdminUser = this._data.user;

  public onClose(): void {
    this._dialogRef.close();
  }

  public isBetterAuthAdmin(): boolean {
    return this.user.role === 'admin';
  }

  public formatApplicationRoles(): string {
    if (this.user.roles.length === 0) {
      return 'No app roles';
    }

    return this.user.roles
      .map((role: AdminRole): string => role.name)
      .join(', ');
  }
}
