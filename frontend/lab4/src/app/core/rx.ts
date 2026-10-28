import { signal } from '@angular/core';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  finalize,
  map,
  Observable,
  of,
  OperatorFunction,
  scan,
  share,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { toAppError } from './errors';
import { AppError } from './models';

export interface LoadState<T> {
  loading: boolean;
  data: T | null;
  error: AppError | null;
}

export function searchText(delay = 400): OperatorFunction<string, string> {
  return (source) =>
    source.pipe(
      map((text) => text.trim()),
      debounceTime(delay),
      distinctUntilChanged(),
    );
}

export function loadWith<Q, T>(request: (query: Q) => Observable<T>): OperatorFunction<Q, LoadState<T>> {
  const start: LoadState<T> = { loading: true, data: null, error: null };
  return (source) =>
    source.pipe(
      switchMap((query) =>
        request(query).pipe(
          map((data): LoadState<T> => ({ loading: false, data, error: null })),
          catchError((error) => of<LoadState<T>>({ loading: false, data: null, error: toAppError(error) })),
          startWith(start),
        ),
      ),
      scan((previous, next) => (next.loading ? { ...next, data: previous.data } : next), start),
    );
}

export interface ActionResult<R> {
  data: R | null;
  error: AppError | null;
}

export class Action<T, R> {
  readonly busy = signal(false);
  readonly results$: Observable<ActionResult<R>>;
  private readonly trigger = new Subject<T>();

  constructor(request: (value: T) => Observable<R>) {
    this.results$ = this.trigger.pipe(
      exhaustMap((value) => {
        this.busy.set(true);
        return request(value).pipe(
          map((data): ActionResult<R> => ({ data, error: null })),
          catchError((error) => of<ActionResult<R>>({ data: null, error: toAppError(error) })),
          finalize(() => this.busy.set(false)),
        );
      }),
      share(),
    );
  }

  run(value: T): void {
    this.trigger.next(value);
  }
}
