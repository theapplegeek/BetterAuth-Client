import { Component, inject } from '@angular/core';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ReactiveFormsModule } from '@angular/forms';

type RolesManagementDialogData = {
  host: any;
};

@Component({
  selector: 'app-roles-management-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './roles-management-dialog.component.html',
})
export class RolesManagementDialogComponent {
  private readonly _data: RolesManagementDialogData =
    inject(DIALOG_DATA);

  public readonly host: any = this._data.host;

  public onClose(): void {
    this.host.closeModal();
  }
}
