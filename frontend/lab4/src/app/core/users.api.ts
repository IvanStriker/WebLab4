import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NewUser, User, UserChanges } from './models';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  list(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  create(user: NewUser): Observable<User> {
    return this.http.post<User>('/api/users', user);
  }

  update(id: number, changes: UserChanges): Observable<User> {
    return this.http.patch<User>(`/api/users/${id}`, changes);
  }
}
