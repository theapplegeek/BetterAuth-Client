import {
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import {
  DIALOG_DATA,
  DialogRef,
} from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type ConfirmDialogTone = 'primary' | 'danger';

export type ConfirmDialogData = {
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel?: string;
  tone?: ConfirmDialogTone;
};

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _dialogRef: DialogRef<
    boolean,
    ConfirmDialogComponent
  > = inject(DialogRef<boolean, ConfirmDialogComponent>);
  private readonly _data: ConfirmDialogData = inject(
    DIALOG_DATA,
  );

  public readonly title: string =
    this._data.title || 'Confirm action';
  public readonly message: string =
    this._data.message || '';
  public readonly cancelLabel: string =
    this._data.cancelLabel || 'Cancel';
  public readonly confirmLabel: string =
    this._data.confirmLabel || 'Confirm';
  public readonly tone: ConfirmDialogTone =
    this._data.tone || 'primary';

  constructor() {
    this._dialogRef.keydownEvents
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((event: KeyboardEvent): void => {
        this._handleKeydown(event);
      });
  }

  public onCancel(): void {
    this._dialogRef.close(false);
  }

  public onConfirm(): void {
    this._dialogRef.close(true);
  }

  private _handleKeydown(event: KeyboardEvent): void {
    if (
      event.key === 'Enter' &&
      !(event.target instanceof HTMLTextAreaElement)
    ) {
      event.preventDefault();
      this.onConfirm();
    }
  }
}
