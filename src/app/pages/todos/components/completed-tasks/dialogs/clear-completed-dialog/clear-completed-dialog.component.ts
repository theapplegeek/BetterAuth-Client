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
import { fromEvent } from 'rxjs';
import { TodoService } from '../../../../services/todo.service';

export type ClearCompletedDialogData = {
  completedCount: number;
};

export type ClearCompletedDialogResult = {
  cleared: boolean;
};

@Component({
  selector: 'app-clear-completed-dialog',
  templateUrl: './clear-completed-dialog.component.html',
})
export class ClearCompletedDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _todoService: TodoService =
    inject(TodoService);
  private readonly _dialogRef: DialogRef<
    ClearCompletedDialogResult,
    ClearCompletedDialogComponent
  > = inject(
    DialogRef<
      ClearCompletedDialogResult,
      ClearCompletedDialogComponent
    >,
  );
  private readonly _data: ClearCompletedDialogData =
    inject(DIALOG_DATA);

  public readonly completedCount: number =
    this._data.completedCount;

  constructor() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((event: KeyboardEvent): void => {
        this._handleKeydown(event);
      });
  }

  public onClose(): void {
    this._dialogRef.close();
  }

  public clearCompleted(): void {
    this._todoService.clearCompleted();
    this._dialogRef.close({ cleared: true });
  }

  private _handleKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.onClose();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.clearCompleted();
    }
  }
}
