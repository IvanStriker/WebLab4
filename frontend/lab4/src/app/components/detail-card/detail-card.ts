import { Component, input } from '@angular/core';
import { fieldValue, formatValue } from '../../core/format';
import { Column } from '../../core/models';

@Component({
  selector: 'app-detail-card',
  styleUrl: './detail-card.scss',
  templateUrl: './detail-card.html',
})
export class DetailCard {
  readonly fields = input.required<Column[]>();
  readonly item = input.required<object>();

  protected value(key: string): string {
    return formatValue(fieldValue(this.item(), key)) || 'не указано';
  }
}
