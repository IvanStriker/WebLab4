import { KeyValuePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ConfirmButton } from '../../components/confirm-button/confirm-button';
import { DataTable } from '../../components/data-table/data-table';
import { FilterPanel } from '../../components/filter-panel/filter-panel';
import { ListToolbar } from '../../components/list-toolbar/list-toolbar';
import { Loader } from '../../components/loader/loader';
import { Pagination } from '../../components/pagination/pagination';
import { AuthService } from '../../core/auth.service';
import { AuthStore } from '../../core/auth.store';
import { fullMessage } from '../../core/errors';
import { ListState } from '../../core/list-state';
import { User, USER_FIELDS, USER_FILTERS } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action } from '../../core/rx';
import { UsersApi } from '../../core/users.api';

@Component({
  imports: [RouterLink, KeyValuePipe, ListToolbar, FilterPanel, DataTable, ConfirmButton, Pagination, Loader],
  selector: 'app-users',
  styleUrl: '../students/students.scss',
  templateUrl: './users.html',
})
export class Users {
  private readonly api = inject(UsersApi);
  private readonly notices = inject(NoticeStore);
  private readonly auth = inject(AuthService);
  protected readonly store = inject(AuthStore);

  protected readonly columns = USER_FIELDS;
  protected readonly filterFields = USER_FILTERS;
  protected readonly showFilters = signal(false);

  protected readonly list = new ListState<User>({
    filterKeys: USER_FIELDS.map((field) => field.key),
    sortKeys: USER_FIELDS.map((field) => field.key),
    defaultSort: 'username',
    load: (query) => this.api.list(query),
  });

  protected readonly deleteAction = new Action((user: User) => this.api.remove(user.id).pipe(map(() => user)));

  constructor() {
    this.deleteAction.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.notices.error(fullMessage(result.error));
      } else if (result.data?.username === this.store.user()?.username) {
        this.auth.accountDeleted();
        return;
      } else {
        this.notices.success(`Учетная запись ${result.data?.username} удалена`);
      }
      this.list.reload();
    });
  }

  protected asUser(row: object): User {
    return row as User;
  }
}
