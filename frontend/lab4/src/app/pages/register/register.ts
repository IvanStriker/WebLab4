import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NoticeStore } from '../../core/notice.store';
import { Action } from '../../core/rx';
import { EMAIL_PATTERN, errorText, passwordBytes, sameAs, USERNAME_PATTERN } from '../../core/validators';

interface RegisterValue {
  username: string;
  email: string;
  password: string;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: '../login/login.scss',
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);
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
    confirm: new FormControl('', { nonNullable: true, validators: [Validators.required, sameAs('password')] }),
  });

  protected readonly action = new Action((value: RegisterValue) =>
    this.auth.register(value.username, value.email, value.password),
  );

  constructor() {
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirm.updateValueAndValidity());

    this.action.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.serverError.set(result.error.message);
        this.serverDetails.set(result.error.details);
        return;
      }
      this.notices.success('Регистрация прошла успешно');
      this.router.navigate(['/profile']);
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
    this.action.run({ username: value.username.trim(), email: value.email.trim(), password: value.password });
  }
}
