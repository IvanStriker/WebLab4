import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NoticeStore } from '../../core/notice.store';
import { Action } from '../../core/rx';
import { errorText } from '../../core/validators';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  readonly returnUrl = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);

  protected readonly errorText = errorText;
  protected readonly serverError = signal('');
  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: Validators.required }),
    password: new FormControl('', { nonNullable: true, validators: Validators.required }),
  });

  protected readonly action = new Action((value: { username: string; password: string }) =>
    this.auth.login(value.username.trim(), value.password),
  );

  constructor() {
    this.action.results$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((result) => {
      if (result.error) {
        this.serverError.set(result.error.message);
        return;
      }
      this.notices.success(`Добро пожаловать, ${result.data?.username}`);
      this.router.navigateByUrl(this.returnUrl() || '/students');
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.serverError.set('');
    this.action.run(this.form.getRawValue());
  }
}
