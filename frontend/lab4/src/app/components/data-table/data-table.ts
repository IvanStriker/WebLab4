import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output, TemplateRef } from '@angular/core';
import { fieldValue, formatValue } from '../../core/format';
import { Column } from '../../core/models';

@Component({
  imports: [NgTemplateOutlet],
  selector: 'app-data-table',
  styleUrl: './data-table.scss',
  templateUrl: './data-table.html',
})
export class DataTable {
  readonly columns = input.required<Column[]>();
  readonly rows = input.required<object[]>();
  readonly sort = input('');
  readonly loading = input(false);
  readonly emptyText = input('Ничего не найдено');
  readonly actions = input<TemplateRef<{ $implicit: object }>>();
  readonly sortChange = output<string>();

  protected cell(row: object, key: string): string {
    return formatValue(fieldValue(row, key));
  }

  protected rowKey(row: object): unknown {
    return fieldValue(row, 'id');
  }

  protected sortMark(key: string): string {
    if (this.sort() === key) {
      return 'asc';
    }
    return this.sort() === `-${key}` ? 'desc' : '';
  }
}
