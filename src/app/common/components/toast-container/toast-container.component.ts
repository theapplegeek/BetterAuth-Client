import {
  Component,
  inject,
  Signal,
} from '@angular/core';
import {
  ToastMessage,
  ToastService,
} from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
})
export class ToastContainerComponent {
  private readonly _toastService: ToastService =
    inject(ToastService);

  public readonly messages: Signal<ToastMessage[]> =
    this._toastService.messages;

  public dismiss(id: number): void {
    this._toastService.dismiss(id);
  }
}
