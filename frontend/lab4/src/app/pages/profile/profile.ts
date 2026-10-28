import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ConfirmButton } from '../../components/confirm-button/confirm-button';
import { DetailCard } from '../../components/detail-card/detail-card';
import { UserForm } from '../../components/user-form/user-form';
import { AuthService } from '../../core/auth.service';
import { AuthStore } from '../../core/auth.store';
import { fullMessage } from '../../core/errors';
import { NewUser, ProfileChanges, USER_FIELDS } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action } from '../../core/rx';

@Component({
  imports: [DetailCard, UserForm, ConfirmButton, RouterLink],
  selector: 'app-profile',
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile {
  protected readonly store = inject(AuthStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);

  protected readonly fields = USER_FIELDS;
  protected readonly editing = signal(false);
  protected readonly serverError = signal('');
  protected readonly serverDetails = signal<Record<string, string>>({});

  protected readonly logoutAction = new Action(() => this.auth.logout());
  protected readonly deleteAction = new Action(() => this.auth.deleteMe());
  protected readonly saveAction = new Action((changes: ProfileChanges) => this.auth.updateProfile(changes));

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.logoutAction.results$.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      this.notices.success('Вы вышли из системы');
      this.router.navigate(['/login']);
    });
    this.deleteAction.results$.pipe(takeUntilDestroyed(destroyRef)).subscribe((result) => {
      if (result.error) {
        this.notices.error(fullMessage(result.error));
      } else {
        this.auth.accountDeleted();
      }
    });
    this.saveAction.results$.pipe(takeUntilDestroyed(destroyRef)).subscribe((result) => {
      if (result.error) {
        this.serverError.set(result.error.message);
        this.serverDetails.set(result.error.details);
        return;
      }
      this.editing.set(false);
      this.notices.success('Изменения сохранены');
    });
  }

  startEdit(): void {
    this.serverError.set('');
    this.serverDetails.set({});
    this.editing.set(true);
  }

  save(value: NewUser): void {
    const user = this.store.user();
    if (!user) {
      return;
    }
    const changes: ProfileChanges = {};
    if (value.username !== user.username) {
      changes.username = value.username;
    }
    if (value.email.toLowerCase() !== user.email) {
      changes.email = value.email;
    }
    if (value.password) {
      changes.password = value.password;
    }
    if (Object.keys(changes).length === 0) {
      this.notices.success('Изменений нет');
      this.editing.set(false);
      return;
    }
    this.serverError.set('');
    this.serverDetails.set({});
    this.saveAction.run(changes);
  }
}
