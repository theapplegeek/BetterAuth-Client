import {
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';

export type ToastType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

export type ToastMessage = {
  id: number;
  type: ToastType;
  text: string;
  durationMs: number;
};

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _messages: WritableSignal<
    ToastMessage[]
  > = signal<ToastMessage[]>([]);
  private readonly _timeouts = new Map<
    number,
    ReturnType<typeof setTimeout>
  >();
  private _nextId = 1;

  public readonly messages: Signal<ToastMessage[]> =
    this._messages.asReadonly();

  public success(
    text: string,
    durationMs = 4500,
  ): void {
    this.show('success', text, durationMs);
  }

  public error(
    text: string,
    durationMs = 7000,
  ): void {
    this.show('error', text, durationMs);
  }

  public warning(
    text: string,
    durationMs = 5500,
  ): void {
    this.show('warning', text, durationMs);
  }

  public info(
    text: string,
    durationMs = 4500,
  ): void {
    this.show('info', text, durationMs);
  }

  public show(
    type: ToastType,
    text: string,
    durationMs = 5000,
  ): void {
    const id: number = this._nextId++;
    const message: ToastMessage = {
      id,
      type,
      text,
      durationMs,
    };

    this._messages.update(
      (messages: ToastMessage[]): ToastMessage[] => [
        ...messages,
        message,
      ],
    );

    const timeoutId = setTimeout((): void => {
      this.dismiss(id);
    }, durationMs);

    this._timeouts.set(id, timeoutId);
  }

  public dismiss(id: number): void {
    const timeoutId = this._timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this._timeouts.delete(id);
    }

    this._messages.update(
      (messages: ToastMessage[]): ToastMessage[] =>
        messages.filter(
          (message: ToastMessage): boolean =>
            message.id !== id,
        ),
    );
  }

  public clear(): void {
    this._timeouts.forEach((timeoutId): void => {
      clearTimeout(timeoutId);
    });
    this._timeouts.clear();
    this._messages.set([]);
  }
}
