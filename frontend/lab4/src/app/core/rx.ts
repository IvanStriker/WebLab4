import { signal } from '@angular/core';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
  finalize,
  fromEvent,
  map,
  Observable,
  of,
  OperatorFunction,
  scan,
  share,
  startWith,
  Subject,
  switchMap,
  timer,
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

export const POLL_PERIOD = 15000;

function isConnectionError(error: AppError | null): boolean {
  return error !== null && (error.status === 0 || error.status >= 500);
}

export function poll(period = POLL_PERIOD): Observable<number> {
  return fromEvent(document, 'visibilitychange').pipe(
    map(() => true),
    startWith(false),
    switchMap((returned) => (document.hidden ? EMPTY : timer(returned ? 0 : period, period))),
  );
}

interface LoadStep<T> {
  state: LoadState<T>;
  silent: boolean;
}

export function loadWith<Q, T>(
  request: (query: Q) => Observable<T>,
  isSilent: (query: Q) => boolean = () => false,
): OperatorFunction<Q, LoadState<T>> {
  const start: LoadState<T> = { loading: true, data: null, error: null };
  return (source) =>
    source.pipe(
      switchMap((query) => {
        const silent = isSilent(query);
        const result$ = request(query).pipe(
          map((data): LoadState<T> => ({ loading: false, data, error: null })),
          catchError((error) => of<LoadState<T>>({ loading: false, data: null, error: toAppError(error) })),
          map((state): LoadStep<T> => ({ state, silent })),
        );
        return silent ? result$ : result$.pipe(startWith({ state: start, silent }));
      }),
      scan((previous, next) => {
        if (next.state.loading || (next.silent && isConnectionError(next.state.error))) {
          return { ...next.state, data: previous.data };
        }
        return next.state;
      }, start),
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
