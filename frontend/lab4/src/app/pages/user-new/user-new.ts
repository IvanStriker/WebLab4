import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NewUser, Role } from '../../core/models';
import { NoticeStore } from '../../core/notice.store';
import { Action } from '../../core/rx';
import { UsersApi } from '../../core/users.api';
import { EMAIL_PATTERN, errorText, passwordBytes, USERNAME_PATTERN } from '../../core/validators';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-user-new',
  styleUrl: './user-new.scss',
  templateUrl: './user-new.html',
})
export class UserNew {
  private readonly api = inject(UsersApi);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);

  protected readonly errorText = errorText;
  protected readonly serverError = signal('');
  protected readonly serverDetails = signal<Record<string, string>>({});

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(USERNAME_PATTERN)] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255), Validators.pattern(EMAIL_PATTERN)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), passwordBytes],
    }),
    role: new FormControl<Role>('USER', { nonNullable: true }),
  });

  protected readonly action = new Action((user: NewUser) => this.api.create(user));

  constructor() {
    this.action.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.serverError.set(result.error.message);
        this.serverDetails.set(result.error.details);
        return;
      }
      this.notices.success(`Учетная запись ${result.data?.username} создана`);
      this.router.navigate(['/users']);
    });
  }

  protected detail(field: string): string {
    return this.serverDetails()[field] ?? '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.serverError.set('');
    this.serverDetails.set({});
    const value = this.form.getRawValue();
    this.action.run({
      username: value.username.trim(),
      email: value.email.trim(),
      password: value.password,
      role: value.role,
    });
  }
}
