import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { KeyValuePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, merge, tap, withLatestFrom } from 'rxjs';
import { FilterPanel } from '../../components/filter-panel/filter-panel';
import { Loader } from '../../components/loader/loader';
import { Pagination } from '../../components/pagination/pagination';
import { AuthStore } from '../../core/auth.store';
import { fullMessage } from '../../core/errors';
import { STUDENT_FIELDS, Student, StudentFilters, StudentPage } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action, LoadState, loadWith, poll, searchText } from '../../core/rx';
import { StudentsApi } from '../../core/students.api';
import { filtersToParams, PAGE_SIZES, paramsToQuery, sameQuery } from './student-query';

@Component({
  imports: [ReactiveFormsModule, RouterLink, KeyValuePipe, FilterPanel, Pagination, Loader],
  selector: 'app-students',
  styleUrl: './students.scss',
  templateUrl: './students.html',
})
export class Students {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(StudentsApi);
  private readonly notices = inject(NoticeStore);
  protected readonly store = inject(AuthStore);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly showExtra = signal(false);
  protected readonly showFilters = signal(false);
  protected readonly confirmId = signal<number | null>(null);
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected readonly fields = computed(() =>
    this.showExtra() ? STUDENT_FIELDS : STUDENT_FIELDS.filter((field) => ['id', 'name', 'group'].includes(field.key)),
  );

  private readonly reload$ = new BehaviorSubject<void>(undefined);
  private readonly query$ = this.route.queryParamMap.pipe(map(paramsToQuery), distinctUntilChanged(sameQuery));
  protected readonly query = toSignal(this.query$, { requireSync: true });

  protected readonly state = toSignal(
    merge(
      combineLatest([this.query$, this.reload$]).pipe(map(([query]) => ({ query, silent: false }))),
      poll().pipe(
        withLatestFrom(this.query$),
        map(([, query]) => ({ query, silent: true })),
      ),
    ).pipe(
      loadWith(
        (request) => this.api.list(request.query),
        (request) => request.silent,
      ),
      tap((state) => this.fixPage(state)),
    ),
    { initialValue: { loading: true, data: null, error: null } as LoadState<StudentPage> },
  );

  protected readonly filterCount = computed(() => Object.keys(this.query().filters).length);

  protected readonly deleteAction = new Action((student: Student) => this.api.remove(student.id).pipe(map(() => student)));

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.query$.pipe(takeUntilDestroyed(destroyRef)).subscribe((query) => {
      if (query.search !== this.searchControl.value.trim()) {
        this.searchControl.setValue(query.search, { emitEvent: false });
      }
    });

    this.searchControl.valueChanges
      .pipe(searchText(), takeUntilDestroyed(destroyRef))
      .subscribe((search) => this.navigate({ search: search || null, page: null }));

    this.deleteAction.results$.pipe(takeUntilDestroyed(destroyRef)).subscribe((result) => {
      this.confirmId.set(null);
      if (result.error) {
        this.notices.error(fullMessage(result.error));
      } else {
        this.notices.success(`Студент ${result.data?.name} удалён`);
      }
      this.reload$.next();
    });
  }

  protected value(student: Student, key: keyof Student): string {
    const value = student[key];
    if (value === null) {
      return '';
    }
    return key === 'moveinDate' ? String(value).split('-').reverse().join('.') : String(value);
  }

  protected sortMark(key: string): string {
    const sort = this.query().sort;
    if (sort === key) {
      return '▲';
    }
    return sort === `-${key}` ? '▼' : '';
  }

  sortBy(key: string): void {
    const sort = this.query().sort === key ? `-${key}` : key;
    this.navigate({ sort, page: null });
  }

  applyFilters(filters: StudentFilters): void {
    this.navigate(filtersToParams(filters));
  }

  changePage(page: number): void {
    this.navigate({ page });
  }

  changeSize(size: string): void {
    this.navigate({ size, page: null });
  }

  reload(): void {
    this.reload$.next();
  }

  resetAll(): void {
    this.router.navigate([], { relativeTo: this.route });
  }

  remove(student: Student): void {
    if (this.confirmId() !== student.id) {
      this.confirmId.set(student.id);
      return;
    }
    this.deleteAction.run(student);
  }

  private fixPage(state: LoadState<StudentPage>): void {
    const page = state.data;
    if (!state.loading && page && page.totalPages > 0 && page.page > page.totalPages) {
      this.navigate({ page: page.totalPages });
    }
  }

  private navigate(params: Params): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge' });
  }
}
