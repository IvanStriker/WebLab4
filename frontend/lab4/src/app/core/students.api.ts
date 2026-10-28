import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Student, StudentChanges, StudentPage, StudentQuery } from './models';

@Injectable({ providedIn: 'root' })
export class StudentsApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/requests';

  list(query: StudentQuery): Observable<StudentPage> {
    let params = new HttpParams().set('page', query.page).set('size', query.size).set('sort', query.sort);
    if (query.search) {
      params = params.set('search', query.search);
    }
    for (const [key, values] of Object.entries(query.filters)) {
      for (const value of values) {
        params = params.append(key, value);
      }
    }
    return this.http.get<StudentPage>(this.url, { params });
  }

  get(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.url}/${id}`);
  }

  create(student: StudentChanges): Observable<Student> {
    return this.http.post<Student>(this.url, student);
  }

  update(id: number, changes: StudentChanges): Observable<Student> {
    return this.http.patch<Student>(`${this.url}/${id}`, changes);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
