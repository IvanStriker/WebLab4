export type Role = 'ADMIN' | 'USER';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
}

export interface UserChanges {
  username?: string;
  email?: string;
  role?: Role;
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

export interface StudentPage {
  items: Student[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export type StudentFilters = Record<string, string[]>;

export interface StudentQuery {
  search: string;
  filters: StudentFilters;
  sort: string;
  page: number;
  size: number;
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

export const STUDENT_FIELDS = [
  { key: 'id', title: 'ИСУ' },
  { key: 'name', title: 'ФИО' },
  { key: 'group', title: '№ Группы' },
  { key: 'dormitory', title: '№ Общежития' },
  { key: 'room', title: '№ Комнаты' },
  { key: 'moveinDate', title: 'Срок заселения' },
  { key: 'country', title: 'Гражданство' },
  { key: 'notes', title: 'Заметки' },
] as const;

export const COUNTRIES = ['Россия', 'Беларусь', 'Китай'];
