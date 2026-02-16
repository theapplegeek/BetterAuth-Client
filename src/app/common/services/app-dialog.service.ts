import {
  Injectable,
  TemplateRef,
  inject,
} from '@angular/core';
import {
  Dialog,
  DialogConfig,
  DialogRef,
} from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root',
})
export class AppDialogService {
  private readonly _dialog: Dialog = inject(Dialog);

  public open<R = unknown, D = unknown, C = unknown>(
    component: ComponentType<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C>;
  public open<R = unknown, D = unknown, C = unknown>(
    template: TemplateRef<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C>;
  public open<R = unknown, D = unknown, C = unknown>(
    componentOrTemplate:
      | ComponentType<C>
      | TemplateRef<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C> {
    return this._dialog.open(componentOrTemplate, {
      hasBackdrop: true,
      backdropClass: 'app-cdk-dialog-backdrop',
      panelClass: 'app-cdk-dialog-panel',
      autoFocus: 'dialog',
      restoreFocus: true,
      ...config,
    });
  }
}
