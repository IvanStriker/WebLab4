import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Student } from '../core/models';
import { StudentsApi } from '../core/students.api';

export function loadStudent(api: StudentsApi, id: string): Observable<Student> {
  const number = Number(id);
  if (!Number.isInteger(number) || number <= 0) {
    return throwError(
      () => new HttpErrorResponse({ status: 404, error: { error: `Некорректный номер ИСУ «${id}»` } }),
    );
  }
  return api.get(number);
}
