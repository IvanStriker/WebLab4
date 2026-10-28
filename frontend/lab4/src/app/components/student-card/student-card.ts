import { Component, input } from '@angular/core';
import { STUDENT_FIELDS, Student } from '../../core/models';

@Component({
  selector: 'app-student-card',
  styleUrl: './student-card.scss',
  templateUrl: './student-card.html',
})
export class StudentCard {
  readonly student = input.required<Student>();
  protected readonly fields = STUDENT_FIELDS;

  protected value(key: keyof Student): string {
    const value = this.student()[key];
    if (value === null || value === '') {
      return '—';
    }
    if (key === 'moveinDate') {
      return String(value).split('-').reverse().join('.');
    }
    return String(value);
  }
}
