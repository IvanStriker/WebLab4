import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { listParams } from './list-params';
import { ListQuery, NewUser, Page, User, UserChanges } from './models';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/users';

  list(query: ListQuery): Observable<Page<User>> {
    return this.http.get<Page<User>>(this.url, { params: listParams(query) });
  }

  findByUsername(username: string): Observable<User> {
    const query: ListQuery = { search: '', filters: { username: [username] }, sort: 'id', page: 1, size: 1 };
    return this.list(query).pipe(
      map((page) => {
        if (page.items.length === 0) {
          throw new HttpErrorResponse({ status: 404, error: { error: `Пользователь ${username} не найден` } });
        }
        return page.items[0];
      }),
    );
  }

  create(user: NewUser): Observable<User> {
    return this.http.post<User>(this.url, user);
  }

  update(id: number, changes: UserChanges): Observable<User> {
    return this.http.patch<User>(`${this.url}/${id}`, changes);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
