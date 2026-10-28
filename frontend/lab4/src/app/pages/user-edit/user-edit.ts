import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { Loader } from '../../components/loader/loader';
import { UserForm } from '../../components/user-form/user-form';
import { AuthService } from '../../core/auth.service';
import { AuthStore } from '../../core/auth.store';
import { NewUser, User, UserChanges } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action, LoadState, loadWith } from '../../core/rx';
import { UsersApi } from '../../core/users.api';

@Component({
  imports: [RouterLink, UserForm, Loader],
  selector: 'app-user-edit',
  styleUrl: './user-edit.scss',
  templateUrl: './user-edit.html',
})
export class UserEdit {
  readonly username = input<string>();

  private readonly api = inject(UsersApi);
  private readonly auth = inject(AuthService);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);

  protected readonly isNew = computed(() => !this.username());
  protected readonly formError = signal('');
  protected readonly fieldErrors = signal<Record<string, string>>({});
  private lastPassword = '';

  protected readonly state = toSignal(
    toObservable(this.username).pipe(
      loadWith((username) => (username ? this.api.findByUsername(username) : of(null))),
    ),
    { initialValue: { loading: true, data: null, error: null } as LoadState<User | null> },
  );

  protected readonly saveAction = new Action((value: NewUser) => {
    const user = this.state().data;
    if (!user) {
      return this.api.create(value);
    }
    const changes: UserChanges = { username: value.username, email: value.email, role: value.role };
    if (value.password) {
      changes.password = value.password;
    }
    return this.api.update(user.id, changes);
  });

  constructor() {
    this.saveAction.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.formError.set(result.error.message);
        this.fieldErrors.set(result.error.details);
        return;
      }
      const saved = result.data as User;
      if (this.mustLoginAgain(saved)) {
        this.auth
          .logout()
          .pipe(switchMap(() => this.router.navigate(['/login'])))
          .subscribe(() => this.notices.success('Данные вашей учетной записи изменены, войдите снова'));
        return;
      }
      this.notices.success(this.isNew() ? `Учетная запись ${saved.username} создана` : `Учетная запись ${saved.username} обновлена`);
      this.router.navigate(['/users', saved.username]);
    });
  }

  save(value: NewUser): void {
    this.formError.set('');
    this.fieldErrors.set({});
    this.lastPassword = value.password;
    this.saveAction.run(value);
  }

  back(): void {
    const username = this.username();
    this.router.navigate(username ? ['/users', username] : ['/users']);
  }

  private mustLoginAgain(saved: User): boolean {
    const original = this.state().data;
    if (!original || original.username !== this.store.user()?.username) {
      return false;
    }
    return saved.username !== original.username || saved.role !== original.role || this.lastPassword !== '';
  }
}
