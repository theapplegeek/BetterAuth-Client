import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

export type ConfirmDialogTone = 'primary' | 'danger';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);

  public readonly open = input<boolean>(false);
  public readonly title = input<string>('Confirm action');
  public readonly message = input<string>('');
  public readonly cancelLabel = input<string>('Cancel');
  public readonly confirmLabel = input<string>('Confirm');
  public readonly tone = input<ConfirmDialogTone>('primary');

  public readonly cancel = output<void>();
  public readonly confirm = output<void>();

  constructor() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((event: KeyboardEvent): void => {
        this._handleKeydown(event);
      });
  }

  public onCancel(): void {
    this.cancel.emit();
  }

  public onConfirm(): void {
    this.confirm.emit();
  }

  private _handleKeydown(event: KeyboardEvent): void {
    if (!this.open()) return;
    if (event.defaultPrevented) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel.emit();
      return;
    }

    if (
      event.key === 'Enter' &&
      !(event.target instanceof HTMLTextAreaElement)
    ) {
      event.preventDefault();
      this.confirm.emit();
    }
  }
}
