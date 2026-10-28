import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  styleUrl: './pagination.scss',
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly disabled = input(false);
  readonly pageChange = output<number>();
}
