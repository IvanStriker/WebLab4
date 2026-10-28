import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AuthStore } from '../../core/auth.store';
import { NoticeStore } from '../../core/notice.store';
import { Icon } from '../icon/icon';

@Component({
  imports: [RouterLink, RouterLinkActive, Icon],
  selector: 'app-navbar',
  styleUrl: './navbar.scss',
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly store = inject(AuthStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notices = inject(NoticeStore);

  logout(): void {
    this.auth.logout().subscribe(() => {
      this.notices.success('Вы вышли из системы');
      this.router.navigate(['/login']);
    });
  }
}
