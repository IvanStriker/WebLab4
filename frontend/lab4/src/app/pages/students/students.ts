import { KeyValuePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ConfirmButton } from '../../components/confirm-button/confirm-button';
import { DataTable } from '../../components/data-table/data-table';
import { FilterPanel } from '../../components/filter-panel/filter-panel';
import { ListToolbar } from '../../components/list-toolbar/list-toolbar';
import { Loader } from '../../components/loader/loader';
import { Pagination } from '../../components/pagination/pagination';
import { AuthStore } from '../../core/auth.store';
import { fullMessage } from '../../core/errors';
import { ListState } from '../../core/list-state';
import { STUDENT_FIELDS, STUDENT_FILTERS, Student } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action } from '../../core/rx';
import { StudentsApi } from '../../core/students.api';

@Component({
  imports: [RouterLink, KeyValuePipe, ListToolbar, FilterPanel, DataTable, ConfirmButton, Pagination, Loader],
  selector: 'app-students',
  styleUrl: './students.scss',
  templateUrl: './students.html',
})
export class Students {
  private readonly api = inject(StudentsApi);
  private readonly notices = inject(NoticeStore);
  protected readonly store = inject(AuthStore);

  protected readonly filterFields = STUDENT_FILTERS;
  protected readonly showExtra = signal(false);
  protected readonly showFilters = signal(false);

  protected readonly columns = computed(() =>
    this.showExtra() ? STUDENT_FIELDS : STUDENT_FIELDS.filter((field) => ['id', 'name', 'group'].includes(field.key)),
  );

  protected readonly list = new ListState<Student>({
    filterKeys: STUDENT_FIELDS.map((field) => field.key),
    sortKeys: STUDENT_FIELDS.map((field) => field.key),
    defaultSort: 'id',
    load: (query) => this.api.list(query),
  });

  protected readonly deleteAction = new Action((student: Student) => this.api.remove(student.id).pipe(map(() => student)));

  constructor() {
    this.deleteAction.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.notices.error(fullMessage(result.error));
      } else {
        this.notices.success(`Студент ${result.data?.name} удалён`);
      }
      this.list.reload();
    });
  }

  protected asStudent(row: object): Student {
    return row as Student;
  }
}
