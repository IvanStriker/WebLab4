import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loader',
  styleUrl: './loader.scss',
  template: `<div class="loader"><span class="spinner"></span>{{ text() }}</div>`,
})
export class Loader {
  readonly text = input('Загрузка...');
}
