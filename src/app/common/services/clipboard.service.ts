import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  public async copyText(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }
}
