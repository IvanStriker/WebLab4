import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Loader } from '../../components/loader/loader';
import { StudentCard } from '../../components/student-card/student-card';
import { AuthStore } from '../../core/auth.store';
import { fullMessage } from '../../core/errors';
import { Student } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action, LoadState, loadWith } from '../../core/rx';
import { StudentsApi } from '../../core/students.api';
import { loadStudent } from '../student-id';

@Component({
  imports: [RouterLink, StudentCard, Loader],
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

  protected readonly confirm = signal(false);

  protected readonly state = toSignal(
    toObservable(this.id).pipe(loadWith((id) => loadStudent(this.api, id))),
    { initialValue: { loading: true, data: null, error: null } as LoadState<Student> },
  );

  protected readonly deleteAction = new Action((student: Student) => this.api.remove(student.id));

  constructor() {
    this.deleteAction.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.confirm.set(false);
        this.notices.error(fullMessage(result.error));
        return;
      }
      this.notices.success(`Студент ${this.id()} удалён`);
      this.router.navigate(['/students']);
    });
  }

  remove(student: Student): void {
    if (!this.confirm()) {
      this.confirm.set(true);
      return;
    }
    this.deleteAction.run(student);
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
