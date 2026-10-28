import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-confirm-button',
  template: `
    <button
      type="button"
      class="btn btn-del"
      [class.confirm]="armed()"
      [disabled]="busy()"
      (click)="click()"
      (blur)="armed.set(false)"
    >
      {{ busy() ? busyText() : armed() ? confirmText() : text() }}
    </button>
  `,
})
export class ConfirmButton {
  readonly text = input('Удалить');
  readonly confirmText = input('Точно удалить?');
  readonly busyText = input('Удаление...');
  readonly busy = input(false);
  readonly confirmed = output<void>();

  protected readonly armed = signal(false);

  click(): void {
    if (!this.armed()) {
      this.armed.set(true);
      return;
    }
    this.armed.set(false);
    this.confirmed.emit();
  }
}
