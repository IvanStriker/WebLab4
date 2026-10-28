export type Role = 'ADMIN' | 'USER';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
  role: Role;
}

export interface UserChanges {
  username?: string;
  email?: string;
  role?: Role;
  password?: string;
}

export interface ProfileChanges {
  username?: string;
  email?: string;
  password?: string;
}

export interface Student {
  id: number;
  name: string;
  group: string;
  dormitory: number | null;
  room: number | null;
  moveinDate: string | null;
  country: string | null;
  notes: string | null;
}

export type StudentChanges = Partial<Student>;

export type Filters = Record<string, string[]>;

export interface ListQuery {
  search: string;
  filters: Filters;
  sort: string;
  page: number;
  size: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface Column {
  key: string;
  title: string;
}

export interface FilterField {
  key: string;
  title: string;
  type: 'list' | 'numbers' | 'single' | 'date' | 'checkboxes';
  placeholder?: string;
  options?: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AppError {
  status: number;
  message: string;
  details: Record<string, string>;
}

export const COUNTRIES = ['Россия', 'Беларусь', 'Китай'];
export const ROLES = ['USER', 'ADMIN'];

export const STUDENT_FIELDS: Column[] = [
  { key: 'id', title: 'ИСУ' },
  { key: 'name', title: 'ФИО' },
  { key: 'group', title: '№ Группы' },
  { key: 'dormitory', title: '№ Общежития' },
  { key: 'room', title: '№ Комнаты' },
  { key: 'moveinDate', title: 'Срок заселения' },
  { key: 'country', title: 'Гражданство' },
  { key: 'notes', title: 'Заметки' },
];

export const STUDENT_FILTERS: FilterField[] = [
  { key: 'id', title: 'Номер ИСУ', type: 'numbers', placeholder: '501492, 912852' },
  { key: 'name', title: 'ФИО', type: 'list', placeholder: 'Иван Виноградов' },
  { key: 'group', title: 'Номер группы', type: 'list', placeholder: 'P3223, P3224' },
  { key: 'dormitory', title: 'Номер общежития', type: 'numbers', placeholder: '8' },
  { key: 'room', title: 'Номер комнаты', type: 'numbers', placeholder: '34' },
  { key: 'moveinDate', title: 'Срок заселения', type: 'date' },
  { key: 'notes', title: 'Заметки', type: 'single', placeholder: 'Точный текст заметки' },
  { key: 'country', title: 'Гражданство', type: 'checkboxes', options: COUNTRIES },
];

export const USER_FIELDS: Column[] = [
  { key: 'username', title: 'Имя пользователя' },
  { key: 'email', title: 'Почта' },
  { key: 'role', title: 'Роль' },
];

export const USER_FILTERS: FilterField[] = [
  { key: 'username', title: 'Имя пользователя', type: 'list', placeholder: 'admin, ivan_petrov' },
  { key: 'email', title: 'Почта', type: 'list', placeholder: 'name@mail.ru' },
  { key: 'role', title: 'Роль', type: 'checkboxes', options: ROLES },
];
