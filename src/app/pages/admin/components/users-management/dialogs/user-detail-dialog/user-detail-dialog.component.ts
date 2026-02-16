import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  DIALOG_DATA,
  DialogRef,
} from '@angular/cdk/dialog';
import { AdminUser } from '../../../../../../common/admin/models/admin.model';

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
}
