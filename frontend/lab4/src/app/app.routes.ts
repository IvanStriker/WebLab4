import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { NotFound } from './pages/not-found/not-found';
import { Profile } from './pages/profile/profile';
import { Register } from './pages/register/register';
import { StudentDetail } from './pages/student-detail/student-detail';
import { StudentEdit } from './pages/student-edit/student-edit';
import { Students } from './pages/students/students';
import { UserDetail } from './pages/user-detail/user-detail';
import { UserEdit } from './pages/user-edit/user-edit';
import { Users } from './pages/users/users';

export const routes: Routes = [
  { path: '', component: Home, title: 'CRM студентов' },
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Вход' },
  { path: 'register', component: Register, canActivate: [guestGuard], title: 'Регистрация' },
  { path: 'profile', component: Profile, canActivate: [authGuard], title: 'Профиль' },
  { path: 'students', component: Students, canActivate: [authGuard], title: 'Студенты' },
  { path: 'students/new', component: StudentEdit, canActivate: [adminGuard], title: 'Новый студент' },
  { path: 'students/:id', component: StudentDetail, canActivate: [authGuard], title: 'Студент' },
  { path: 'students/:id/edit', component: StudentEdit, canActivate: [adminGuard], title: 'Редактирование' },
  { path: 'users', component: Users, canActivate: [adminGuard], title: 'Пользователи' },
  { path: 'users/new', component: UserEdit, canActivate: [adminGuard], title: 'Новый пользователь' },
  { path: 'users/:username', component: UserDetail, canActivate: [adminGuard], title: 'Пользователь' },
  { path: 'users/:username/edit', component: UserEdit, canActivate: [adminGuard], title: 'Редактирование' },
  { path: '**', component: NotFound, title: 'Страница не найдена' },
];
