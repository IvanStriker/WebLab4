import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserCard } from '../../components/user-card/user-card';
import { fullMessage } from '../../core/errors';
import { AuthService } from '../../core/auth.service';
import { AuthStore } from '../../core/auth.store';
import { ProfileChanges } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action } from '../../core/rx';
import { EMAIL_PATTERN, errorText, passwordBytes, USERNAME_PATTERN } from '../../core/validators';

@Component({
  imports: [UserCard, RouterLink, ReactiveFormsModule],
  selector: 'app-profile',
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
})
export class Profile {
  protected readonly store = inject(AuthStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);

  protected readonly editing = signal(false);
  protected readonly errorText = errorText;
  protected readonly serverError = signal('');
  protected readonly serverDetails = signal<Record<string, string>>({});

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(USERNAME_PATTERN)] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255), Validators.pattern(EMAIL_PATTERN)],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.minLength(8), passwordBytes] }),
  });

  protected readonly reloadAction = new Action(() => this.auth.loadMe());
  protected readonly logoutAction = new Action(() => this.auth.logout());
  protected readonly saveAction = new Action((changes: ProfileChanges) => this.auth.updateProfile(changes));

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

  protected detail(field: string): string {
    return this.serverDetails()[field] ?? '';
  }

  startEdit(): void {
    const user = this.store.user();
    if (!user) {
      return;
    }
    this.form.reset({ username: user.username, email: user.email, password: '' });
    this.serverError.set('');
    this.serverDetails.set({});
    this.editing.set(true);
  }

  cancel(): void {
    this.editing.set(false);
  }

  submit(): void {
    const user = this.store.user();
    if (!user) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const changes: ProfileChanges = {};
    if (value.username.trim() !== user.username) {
      changes.username = value.username.trim();
    }
    if (value.email.trim().toLowerCase() !== user.email) {
      changes.email = value.email.trim();
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
