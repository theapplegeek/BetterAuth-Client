import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // ===============================================
  // Theme
  // ===============================================
  public get theme(): string | null {
    return localStorage.getItem('theme');
  }

  public set theme(value: string | null) {
    if (value) localStorage.setItem('theme', value);
    else localStorage.removeItem('theme');
  }
}
