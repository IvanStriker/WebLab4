import { ParamMap, Params } from '@angular/router';
import { STUDENT_FIELDS, StudentFilters, StudentQuery } from '../../core/models';

export const PAGE_SIZES = [5, 10, 20, 50];
const FIELD_KEYS: string[] = STUDENT_FIELDS.map((field) => field.key);

export function paramsToQuery(params: ParamMap): StudentQuery {
  const filters: StudentFilters = {};
  for (const key of FIELD_KEYS) {
    const values = params.getAll(key);
    if (values.length > 0) {
      filters[key] = values;
    }
  }
  const sort = params.get('sort') ?? 'id';
  const page = Number(params.get('page') ?? 1);
  const size = Number(params.get('size') ?? 10);
  return {
    search: params.get('search') ?? '',
    filters,
    sort: FIELD_KEYS.includes(sort.replace('-', '')) ? sort : 'id',
    page: Number.isInteger(page) && page > 0 ? page : 1,
    size: PAGE_SIZES.includes(size) ? size : 10,
  };
}

export function filtersToParams(filters: StudentFilters): Params {
  const params: Params = { page: null };
  for (const key of FIELD_KEYS) {
    params[key] = filters[key] ?? null;
  }
  return params;
}

export function sameQuery(a: StudentQuery, b: StudentQuery): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
