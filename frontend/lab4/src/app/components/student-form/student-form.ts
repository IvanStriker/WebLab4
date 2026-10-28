import { Component, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { COUNTRIES, Student, StudentChanges } from '../../core/models';
import {
  errorText,
  GROUP_PATTERN,
  moveinDate,
  NAME_PATTERN,
  positiveInteger,
  sixMonthsLater,
  today,
} from '../../core/validators';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-student-form',
  styleUrl: './student-form.scss',
  templateUrl: './student-form.html',
})
export class StudentForm implements OnChanges {
  readonly student = input<Student | null>(null);
  readonly busy = input(false);
  readonly serverErrors = input<Record<string, string>>({});
  readonly submitted = output<StudentChanges>();
  readonly cancelled = output<void>();

  protected readonly countries = COUNTRIES;
  protected readonly minDate = today();
  protected readonly maxDate = sixMonthsLater();
  protected readonly errorText = errorText;

  protected readonly form = new FormGroup({
    id: new FormControl<number | null>(null, [Validators.required, positiveInteger]),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(NAME_PATTERN)] }),
    group: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(GROUP_PATTERN)] }),
    dormitory: new FormControl<number | null>(null, positiveInteger),
    room: new FormControl<number | null>(null, positiveInteger),
    moveinDate: new FormControl('', { nonNullable: true, validators: moveinDate(null) }),
    country: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['student']) {
      return;
    }
    const student = this.student();
    this.form.controls.moveinDate.setValidators(moveinDate(student?.moveinDate ?? null));
    if (student) {
      this.form.reset({
        id: student.id,
        name: student.name,
        group: student.group,
        dormitory: student.dormitory,
        room: student.room,
        moveinDate: student.moveinDate ?? '',
        country: student.country ?? '',
        notes: student.notes ?? '',
      });
      this.form.controls.id.disable();
    } else {
      this.form.controls.id.enable();
    }
  }

  protected serverError(field: string): string {
    return this.serverErrors()[field] ?? '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const values: StudentChanges = {
      id: raw.id === null ? undefined : Number(raw.id),
      name: raw.name.trim(),
      group: raw.group.trim(),
      dormitory: raw.dormitory === null ? null : Number(raw.dormitory),
      room: raw.room === null ? null : Number(raw.room),
      moveinDate: raw.moveinDate || null,
      country: raw.country || null,
      notes: raw.notes.trim() || null,
    };
    this.submitted.emit(values);
  }
}
