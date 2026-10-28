import { Component, input, OnChanges, output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { FilterField, Filters } from '../../core/models';
import { errorText, numberList, splitList } from '../../core/validators';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-filter-panel',
  styleUrl: './filter-panel.scss',
  templateUrl: './filter-panel.html',
})
export class FilterPanel implements OnChanges {
  readonly fields = input.required<FilterField[]>();
  readonly filters = input<Filters>({});
  readonly apply = output<Filters>();

  protected readonly errorText = errorText;
  protected form = new FormRecord<FormControl<string> | FormGroup>({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields']) {
      this.buildForm();
    }
    this.fillForm();
  }

  protected control(key: string): FormControl<string> {
    return this.form.get(key) as FormControl<string>;
  }

  private buildForm(): void {
    this.form = new FormRecord<FormControl<string> | FormGroup>({});
    for (const field of this.fields()) {
      if (field.type === 'checkboxes') {
        const group = new FormGroup<Record<string, FormControl<boolean>>>({});
        for (const option of field.options ?? []) {
          group.addControl(option, new FormControl(false, { nonNullable: true }));
        }
        this.form.addControl(field.key, group);
      } else {
        const validators = field.type === 'numbers' ? numberList : null;
        this.form.addControl(field.key, new FormControl('', { nonNullable: true, validators }));
      }
    }
  }

  private fillForm(): void {
    const filters = this.filters();
    for (const field of this.fields()) {
      const values = filters[field.key] ?? [];
      if (field.type === 'checkboxes') {
        const group = this.form.get(field.key) as FormGroup;
        for (const option of field.options ?? []) {
          group.get(option)?.setValue(values.includes(option));
        }
      } else {
        this.control(field.key).setValue(values.join(', '));
      }
    }
    this.form.markAsUntouched();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const result: Filters = {};
    for (const field of this.fields()) {
      let values: string[];
      if (field.type === 'checkboxes') {
        const group = this.form.get(field.key) as FormGroup;
        values = (field.options ?? []).filter((option) => group.get(option)?.value);
      } else if (field.type === 'list' || field.type === 'numbers') {
        values = splitList(this.control(field.key).value);
      } else {
        values = [this.control(field.key).value.trim()].filter(Boolean);
      }
      if (values.length > 0) {
        result[field.key] = values;
      }
    }
    this.apply.emit(result);
  }

  clear(): void {
    this.apply.emit({});
  }
}
