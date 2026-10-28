import { Component, inject } from '@angular/core';
import { NoticeStore } from '../../core/notice.store';

@Component({
  selector: 'app-notice',
  styleUrl: './notice.scss',
  templateUrl: './notice.html',
})
export class Notice {
  protected readonly store = inject(NoticeStore);
}
