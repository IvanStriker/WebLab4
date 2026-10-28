import { computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, merge, Observable, tap, withLatestFrom } from 'rxjs';
import { Filters, ListQuery, Page } from './models';
import { LoadState, loadWith, poll } from './rx';

export const PAGE_SIZES = [5, 10, 20, 50];

export interface ListConfig<T> {
  filterKeys: string[];
  sortKeys: string[];
  defaultSort: string;
  load: (query: ListQuery) => Observable<Page<T>>;
}

export class ListState<T> {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  private readonly query$: Observable<ListQuery>;

  readonly query: Signal<ListQuery>;
  readonly state: Signal<LoadState<Page<T>>>;
  readonly filterCount: Signal<number>;

  constructor(private readonly config: ListConfig<T>) {
    this.query$ = this.route.queryParamMap.pipe(
      map((params) => this.toQuery(params)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    );
    this.query = toSignal(this.query$, { requireSync: true });
    this.filterCount = computed(() => Object.keys(this.query().filters).length);

    this.state = toSignal(
      merge(
        combineLatest([this.query$, this.reload$]).pipe(map(([query]) => ({ query, silent: false }))),
        poll().pipe(
          withLatestFrom(this.query$),
          map(([, query]) => ({ query, silent: true })),
        ),
      ).pipe(
        loadWith(
          (request) => config.load(request.query),
          (request) => request.silent,
        ),
        tap((state) => this.fixPage(state)),
      ),
      { initialValue: { loading: true, data: null, error: null } as LoadState<Page<T>> },
    );
  }

  search(text: string): void {
    this.navigate({ search: text || null, page: null });
  }

  sortBy(key: string): void {
    const sort = this.query().sort === key ? `-${key}` : key;
    this.navigate({ sort, page: null });
  }

  applyFilters(filters: Filters): void {
    const params: Params = { page: null };
    for (const key of this.config.filterKeys) {
      params[key] = filters[key] ?? null;
    }
    this.navigate(params);
  }

  changePage(page: number): void {
    this.navigate({ page });
  }

  changeSize(size: number): void {
    this.navigate({ size, page: null });
  }

  reload(): void {
    this.reload$.next();
  }

  resetAll(): void {
    this.router.navigate([], { relativeTo: this.route });
  }

  private toQuery(params: ParamMap): ListQuery {
    const filters: Filters = {};
    for (const key of this.config.filterKeys) {
      const values = params.getAll(key);
      if (values.length > 0) {
        filters[key] = values;
      }
    }
    const sort = params.get('sort') ?? this.config.defaultSort;
    const page = Number(params.get('page') ?? 1);
    const size = Number(params.get('size') ?? 10);
    return {
      search: params.get('search') ?? '',
      filters,
      sort: this.config.sortKeys.includes(sort.replace('-', '')) ? sort : this.config.defaultSort,
      page: Number.isInteger(page) && page > 0 ? page : 1,
      size: PAGE_SIZES.includes(size) ? size : 10,
    };
  }

  private fixPage(state: LoadState<Page<T>>): void {
    const page = state.data;
    if (!state.loading && page && page.totalPages > 0 && page.page > page.totalPages) {
      this.navigate({ page: page.totalPages });
    }
  }

  private navigate(params: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge' });
  }
}
