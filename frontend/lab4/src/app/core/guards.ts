import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { NoticeStore } from './notice.store';

export const authGuard: CanActivateFn = (route, state) => {
  if (inject(AuthStore).isLoggedIn()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const adminGuard: CanActivateFn = (route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  if (!store.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  if (!store.isAdmin()) {
    inject(NoticeStore).error('Недостаточно прав: страница доступна только администратору');
    return router.createUrlTree(['/students']);
  }
  return true;
};

export const guestGuard: CanActivateFn = () => {
  if (inject(AuthStore).isLoggedIn()) {
    return inject(Router).createUrlTree(['/profile']);
  }
  return true;
};
