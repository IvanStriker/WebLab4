import { Component, input, OnChanges, output, signal, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role, User, UserChanges } from '../../core/models';
import { EMAIL_PATTERN, errorText, passwordBytes, USERNAME_PATTERN } from '../../core/validators';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-user-card',
  styleUrl: './user-card.scss',
  templateUrl: './user-card.html',
})
export class UserCard implements OnChanges {
  readonly user = input.required<User>();
  readonly editable = input(false);
  readonly busy = input(false);
  readonly save = output<UserChanges>();

  protected readonly editing = signal(false);
  protected readonly errorText = errorText;

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(USERNAME_PATTERN)] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255), Validators.pattern(EMAIL_PATTERN)],
    }),
    role: new FormControl<Role>('USER', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.minLength(8), passwordBytes] }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['user'];
    if (change && !change.firstChange && JSON.stringify(change.previousValue) !== JSON.stringify(change.currentValue)) {
      this.editing.set(false);
    }
  }

  startEdit(): void {
    const user = this.user();
    this.form.reset({ username: user.username, email: user.email, role: user.role, password: '' });
    this.editing.set(true);
  }

  cancel(): void {
    this.editing.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const user = this.user();
    const value = this.form.getRawValue();
    const changes: UserChanges = {};
    if (value.username.trim() !== user.username) {
      changes.username = value.username.trim();
    }
    if (value.email.trim().toLowerCase() !== user.email) {
      changes.email = value.email.trim();
    }
    if (value.role !== user.role) {
      changes.role = value.role;
    }
    if (value.password) {
      changes.password = value.password;
    }
    if (Object.keys(changes).length === 0) {
      this.editing.set(false);
      return;
    }
    this.save.emit(changes);
  }
}
