import { Component, input, OnChanges, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { COUNTRIES, StudentFilters } from '../../core/models';
import { errorText, numberList, splitList } from '../../core/validators';

const TEXT_FIELDS = ['id', 'name', 'group', 'dormitory', 'room', 'moveinDate', 'notes'];

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-filter-panel',
  styleUrl: './filter-panel.scss',
  templateUrl: './filter-panel.html',
})
export class FilterPanel implements OnChanges {
  readonly filters = input<StudentFilters>({});
  readonly apply = output<StudentFilters>();

  protected readonly countries = COUNTRIES;
  protected readonly errorText = errorText;

  protected readonly form = new FormGroup({
    id: new FormControl('', { nonNullable: true, validators: numberList }),
    name: new FormControl('', { nonNullable: true }),
    group: new FormControl('', { nonNullable: true }),
    dormitory: new FormControl('', { nonNullable: true, validators: numberList }),
    room: new FormControl('', { nonNullable: true, validators: numberList }),
    moveinDate: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    country: new FormGroup({
      Россия: new FormControl(false, { nonNullable: true }),
      Беларусь: new FormControl(false, { nonNullable: true }),
      Китай: new FormControl(false, { nonNullable: true }),
    }),
  });

  ngOnChanges(): void {
    const filters = this.filters();
    const countries = filters['country'] ?? [];
    this.form.reset({
      id: (filters['id'] ?? []).join(', '),
      name: (filters['name'] ?? []).join(', '),
      group: (filters['group'] ?? []).join(', '),
      dormitory: (filters['dormitory'] ?? []).join(', '),
      room: (filters['room'] ?? []).join(', '),
      moveinDate: (filters['moveinDate'] ?? [])[0] ?? '',
      notes: (filters['notes'] ?? []).join(', '),
      country: {
        Россия: countries.includes('Россия'),
        Беларусь: countries.includes('Беларусь'),
        Китай: countries.includes('Китай'),
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const result: StudentFilters = {};
    for (const field of TEXT_FIELDS) {
      const text = value[field as keyof typeof value] as string;
      const parts = field === 'notes' || field === 'moveinDate' ? [text.trim()].filter(Boolean) : splitList(text);
      if (parts.length > 0) {
        result[field] = parts;
      }
    }
    const countries = Object.entries(value.country)
      .filter(([, checked]) => checked)
      .map(([country]) => country);
    if (countries.length > 0) {
      result['country'] = countries;
    }
    this.apply.emit(result);
  }

  clear(): void {
    this.apply.emit({});
  }
}
