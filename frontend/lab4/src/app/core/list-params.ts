import { HttpParams } from '@angular/common/http';
import { ListQuery } from './models';

export function listParams(query: ListQuery): HttpParams {
  let params = new HttpParams().set('page', query.page).set('size', query.size).set('sort', query.sort);
  if (query.search) {
    params = params.set('search', query.search);
  }
  for (const [key, values] of Object.entries(query.filters)) {
    for (const value of values) {
      params = params.append(key, value);
    }
  }
  return params;
}
