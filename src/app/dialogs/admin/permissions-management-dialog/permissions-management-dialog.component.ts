import { Component, inject } from '@angular/core';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ReactiveFormsModule } from '@angular/forms';

type PermissionsManagementDialogData = {
  host: any;
};

@Component({
  selector: 'app-permissions-management-dialog',
  imports: [ReactiveFormsModule],
  templateUrl:
    './permissions-management-dialog.component.html',
})
export class PermissionsManagementDialogComponent {
  private readonly _data: PermissionsManagementDialogData =
    inject(DIALOG_DATA);

  public readonly host: any = this._data.host;

  public onClose(): void {
    this.host.closeModal();
  }
}
