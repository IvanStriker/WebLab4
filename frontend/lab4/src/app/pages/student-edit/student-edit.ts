import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { Loader } from '../../components/loader/loader';
import { StudentForm } from '../../components/student-form/student-form';
import { Student, StudentChanges } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action, LoadState, loadWith } from '../../core/rx';
import { StudentsApi } from '../../core/students.api';
import { loadStudent } from '../student-id';

@Component({
  imports: [RouterLink, StudentForm, Loader],
  selector: 'app-student-edit',
  styleUrl: './student-edit.scss',
  templateUrl: './student-edit.html',
})
export class StudentEdit {
  readonly id = input<string>();

  private readonly api = inject(StudentsApi);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);

  protected readonly isNew = computed(() => !this.id());
  protected readonly formError = signal('');
  protected readonly fieldErrors = signal<Record<string, string>>({});

  protected readonly state = toSignal(
    toObservable(this.id).pipe(loadWith((id) => (id ? loadStudent(this.api, id) : of(null)))),
    { initialValue: { loading: true, data: null, error: null } as LoadState<Student | null> },
  );

  protected readonly saveAction = new Action((changes: StudentChanges) => {
    const id = this.id();
    return id ? this.api.update(Number(id), changes) : this.api.create(changes);
  });

  constructor() {
    this.saveAction.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.formError.set(result.error.message);
        this.fieldErrors.set(result.error.details);
        return;
      }
      const student = result.data as Student;
      this.notices.success(this.isNew() ? `Студент ${student.name} добавлен` : `Данные студента ${student.id} обновлены`);
      this.router.navigate(['/students', student.id]);
    });
  }

  save(changes: StudentChanges): void {
    this.formError.set('');
    this.fieldErrors.set({});
    if (!this.isNew() && Object.keys(changes).length === 0) {
      this.notices.success('Изменений нет');
      this.back();
      return;
    }
    this.saveAction.run(changes);
  }

  back(): void {
    const id = this.id();
    this.router.navigate(id ? ['/students', id] : ['/students']);
  }
}
