import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  styleUrl: './icon.scss',
  templateUrl: './icon.html',
})
export class Icon {
  readonly name = input.required<'students' | 'users' | 'profile' | 'logout' | 'register'>();
}
