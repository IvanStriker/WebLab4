import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-not-found',
  template: `
    <section class="panel narrow">
      <h1>404</h1>
      <p>Такой страницы нет.</p>
      <a routerLink="/" class="btn">На главную</a>
    </section>
  `,
})
export class NotFound {}
