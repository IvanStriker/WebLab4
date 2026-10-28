import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { catchError, EMPTY, exhaustMap, switchMap } from 'rxjs';
import { Navbar } from './components/navbar/navbar';
import { Notice } from './components/notice/notice';
import { Stars } from './components/stars/stars';
import { AuthService } from './core/auth.service';
import { AuthStore } from './core/auth.store';
import { poll } from './core/rx';

@Component({
  imports: [RouterOutlet, Navbar, Stars, Notice],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly store = inject(AuthStore);

  constructor() {
    toObservable(this.store.isLoggedIn)
      .pipe(
        switchMap((loggedIn) => (loggedIn ? poll() : EMPTY)),
        exhaustMap(() => this.auth.loadMe().pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
