import {effect, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {StorageService} from './storage.service';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _storageService: StorageService = inject(StorageService);

  private readonly userTheme: WritableSignal<Theme> = signal<Theme>(
    (this._storageService.theme as Theme) ?? 'system'
  );
  public readonly resolvedTheme: WritableSignal<'light' | 'dark'> = signal<'light' | 'dark'>('light');

  constructor() {
    effect((): void => {
      const theme: Theme = this.userTheme();
      const systemDark: boolean = window.matchMedia('(prefers-color-scheme: dark)').matches;

      const resolved: 'light' | 'dark' =
        theme === 'system'
          ? systemDark ? 'dark' : 'light'
          : theme;
      this.resolvedTheme.set(resolved);

      document.body.setAttribute('data-theme', this.resolvedTheme());
      this._storageService.theme = theme === 'system' ? null : theme;
    });
  }

  public getTheme(): Theme {
    return this.userTheme();
  }

  public setTheme(theme: Theme): void {
    this.userTheme.set(theme);
  }
}
