import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ListQuery, Page, Student, StudentChanges } from './models';
import { listParams } from './list-params';

@Injectable({ providedIn: 'root' })
export class StudentsApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/requests';

  list(query: ListQuery): Observable<Page<Student>> {
    return this.http.get<Page<Student>>(this.url, { params: listParams(query) });
  }

  get(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.url}/${id}`);
  }

  create(student: StudentChanges): Observable<Student> {
    return this.http.post<Student>(this.url, student);
  }

  replace(id: number, student: StudentChanges): Observable<Student> {
    return this.http.put<Student>(`${this.url}/${id}`, student);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
