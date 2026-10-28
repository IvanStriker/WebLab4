import { Component, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NewUser, Role, ROLES, User } from '../../core/models';
import { EMAIL_PATTERN, errorText, passwordBytes, USERNAME_PATTERN } from '../../core/validators';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-user-form',
  styleUrl: './user-form.scss',
  templateUrl: './user-form.html',
})
export class UserForm implements OnChanges {
  readonly user = input<User | null>(null);
  readonly showRole = input(true);
  readonly busy = input(false);
  readonly serverErrors = input<Record<string, string>>({});
  readonly submitted = output<NewUser>();
  readonly cancelled = output<void>();

  protected readonly roles = ROLES;
  protected readonly errorText = errorText;

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(USERNAME_PATTERN)] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255), Validators.pattern(EMAIL_PATTERN)],
    }),
    role: new FormControl<Role>('USER', { nonNullable: true }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), passwordBytes],
    }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['user']) {
      return;
    }
    const user = this.user();
    const password = this.form.controls.password;
    if (user) {
      this.form.reset({ username: user.username, email: user.email, role: user.role, password: '' });
      password.removeValidators(Validators.required);
    } else {
      password.addValidators(Validators.required);
    }
    password.updateValueAndValidity();
  }

  protected serverError(field: string): string {
    return this.serverErrors()[field] ?? '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitted.emit({
      username: value.username.trim(),
      email: value.email.trim(),
      role: value.role,
      password: value.password,
    });
  }
}
