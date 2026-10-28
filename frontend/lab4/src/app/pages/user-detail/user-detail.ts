import { Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ConfirmButton } from '../../components/confirm-button/confirm-button';
import { DetailCard } from '../../components/detail-card/detail-card';
import { Loader } from '../../components/loader/loader';
import { AuthService } from '../../core/auth.service';
import { AuthStore } from '../../core/auth.store';
import { fullMessage } from '../../core/errors';
import { User, USER_FIELDS } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action, LoadState, loadAndPoll } from '../../core/rx';
import { UsersApi } from '../../core/users.api';

@Component({
  imports: [RouterLink, DetailCard, ConfirmButton, Loader],
  selector: 'app-user-detail',
  styleUrl: '../student-detail/student-detail.scss',
  templateUrl: './user-detail.html',
})
export class UserDetail {
  readonly username = input.required<string>();

  private readonly api = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);
  private readonly store = inject(AuthStore);
  private readonly auth = inject(AuthService);
  protected readonly fields = USER_FIELDS;

  protected readonly state = toSignal(
    toObservable(this.username).pipe(loadAndPoll((username) => this.api.findByUsername(username))),
    { initialValue: { loading: true, data: null, error: null } as LoadState<User> },
  );

  protected readonly deleteAction = new Action((user: User) => this.api.remove(user.id));

  constructor() {
    this.deleteAction.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.notices.error(fullMessage(result.error));
        return;
      }
      if (this.username() === this.store.user()?.username) {
        this.auth.accountDeleted();
        return;
      }
      this.notices.success(`Учетная запись ${this.username()} удалена`);
      this.router.navigate(['/users']);
    });
  }
}
