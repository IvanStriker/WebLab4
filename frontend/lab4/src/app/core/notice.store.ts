import { Injectable, signal } from '@angular/core';

export interface Notice {
  id: number;
  text: string;
  error: boolean;
}

@Injectable({ providedIn: 'root' })
export class NoticeStore {
  readonly notices = signal<Notice[]>([]);
  private nextId = 1;

  success(text: string): void {
    this.add(text, false);
  }

  error(text: string): void {
    this.add(text, true);
  }

  remove(id: number): void {
    this.notices.update((list) => list.filter((notice) => notice.id !== id));
  }

  private add(text: string, error: boolean): void {
    const id = this.nextId++;
    this.notices.update((list) => [...list, { id, text, error }]);
    setTimeout(() => this.remove(id), error ? 8000 : 4000);
  }
}
