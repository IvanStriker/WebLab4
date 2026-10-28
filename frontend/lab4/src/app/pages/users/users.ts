import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BehaviorSubject, map, switchMap } from 'rxjs';
import { Loader } from '../../components/loader/loader';
import { UserCard } from '../../components/user-card/user-card';
import { AuthService } from '../../core/auth.service';
import { AuthStore } from '../../core/auth.store';
import { fullMessage } from '../../core/errors';
import { User, UserChanges } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action, LoadState, loadWith } from '../../core/rx';
import { UsersApi } from '../../core/users.api';

interface UserUpdate {
  user: User;
  changes: UserChanges;
}

@Component({
  imports: [UserCard, Loader],
  selector: 'app-users',
  styleUrl: './users.scss',
  templateUrl: './users.html',
})
export class Users {
  private readonly api = inject(UsersApi);
  private readonly auth = inject(AuthService);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);

  private readonly reload$ = new BehaviorSubject<void>(undefined);
  protected readonly savingId = signal<number | null>(null);

  protected readonly state = toSignal(this.reload$.pipe(loadWith(() => this.api.list())), {
    initialValue: { loading: true, data: null, error: null } as LoadState<User[]>,
  });

  protected readonly saveAction = new Action((update: UserUpdate) =>
    this.api.update(update.user.id, update.changes).pipe(map(() => update)),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.saveAction.results$.pipe(takeUntilDestroyed(destroyRef)).subscribe((result) => {
      this.savingId.set(null);
      if (result.error) {
        this.notices.error(fullMessage(result.error));
        return;
      }
      const update = result.data as UserUpdate;
      const isMe = update.user.username === this.store.user()?.username;
      if (isMe && (update.changes.username || update.changes.password || update.changes.role)) {
        this.auth
          .logout()
          .pipe(switchMap(() => this.router.navigate(['/login'])))
          .subscribe(() => this.notices.success('Данные вашей учетной записи изменены, войдите снова'));
        return;
      }
      this.notices.success(`Учетная запись ${update.changes.username ?? update.user.username} обновлена`);
      this.reload$.next();
    });
  }

  save(user: User, changes: UserChanges): void {
    if (this.saveAction.busy()) {
      return;
    }
    this.savingId.set(user.id);
    this.saveAction.run({ user, changes });
  }

  reload(): void {
    this.reload$.next();
  }
}
