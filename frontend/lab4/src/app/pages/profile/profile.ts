import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { UserCard } from '../../components/user-card/user-card';
import { fullMessage } from '../../core/errors';
import { AuthService } from '../../core/auth.service';
import { AuthStore, tokenPayload } from '../../core/auth.store';
import { NoticeStore } from '../../core/notice.store';
import { Action } from '../../core/rx';

@Component({
  imports: [UserCard, RouterLink],
  selector: 'app-profile',
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile {
  protected readonly store = inject(AuthStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);

  protected readonly tokenExpires = computed(() => {
    const payload = tokenPayload(this.store.accessToken());
    return payload ? new Date(Number(payload['exp']) * 1000).toLocaleTimeString('ru-RU') : '';
  });

  protected readonly reloadAction = new Action(() => this.auth.loadMe());
  protected readonly logoutAction = new Action(() => this.auth.logout());

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.reloadAction.results$.pipe(takeUntilDestroyed(destroyRef)).subscribe((result) => {
      if (result.error) {
        this.notices.error(fullMessage(result.error));
      } else {
        this.notices.success('Данные профиля обновлены');
      }
    });
    this.logoutAction.results$.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      this.notices.success('Вы вышли из системы');
      this.router.navigate(['/login']);
    });
  }
}
