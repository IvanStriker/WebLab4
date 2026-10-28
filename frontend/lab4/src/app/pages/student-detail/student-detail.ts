import { Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ConfirmButton } from '../../components/confirm-button/confirm-button';
import { DetailCard } from '../../components/detail-card/detail-card';
import { Loader } from '../../components/loader/loader';
import { AuthStore } from '../../core/auth.store';
import { fullMessage } from '../../core/errors';
import { STUDENT_FIELDS, Student } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action, LoadState, loadAndPoll } from '../../core/rx';
import { StudentsApi } from '../../core/students.api';
import { loadStudent } from '../student-id';

@Component({
  imports: [RouterLink, DetailCard, ConfirmButton, Loader],
  selector: 'app-student-detail',
  styleUrl: './student-detail.scss',
  templateUrl: './student-detail.html',
})
export class StudentDetail {
  readonly id = input.required<string>();

  private readonly api = inject(StudentsApi);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);
  protected readonly store = inject(AuthStore);
  protected readonly fields = STUDENT_FIELDS;

  protected readonly state = toSignal(
    toObservable(this.id).pipe(loadAndPoll((id) => loadStudent(this.api, id))),
    { initialValue: { loading: true, data: null, error: null } as LoadState<Student> },
  );

  protected readonly deleteAction = new Action((student: Student) => this.api.remove(student.id));

  constructor() {
    this.deleteAction.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.notices.error(fullMessage(result.error));
        return;
      }
      this.notices.success(`Студент ${this.id()} удалён`);
      this.router.navigate(['/students']);
    });
  }

  exportJson(student: Student): void {
    const blob = new Blob([JSON.stringify(student, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_${student.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
