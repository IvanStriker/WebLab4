import { Component, input, OnChanges, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PAGE_SIZES } from '../../core/list-state';
import { searchText } from '../../core/rx';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-list-toolbar',
  styleUrl: './list-toolbar.scss',
  templateUrl: './list-toolbar.html',
})
export class ListToolbar implements OnChanges {
  readonly search = input('');
  readonly placeholder = input('Поиск...');
  readonly filterCount = input(0);
  readonly filtersOpen = input(false);
  readonly size = input(10);
  readonly searchChange = output<string>();
  readonly toggleFilters = output<void>();
  readonly sizeChange = output<number>();

  protected readonly sizes = PAGE_SIZES;
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    this.searchControl.valueChanges
      .pipe(searchText(), takeUntilDestroyed())
      .subscribe((text) => this.searchChange.emit(text));
  }

  ngOnChanges(): void {
    if (this.search() !== this.searchControl.value.trim()) {
      this.searchControl.setValue(this.search(), { emitEvent: false });
    }
  }

  protected changeSize(value: string): void {
    this.sizeChange.emit(Number(value));
  }
}
