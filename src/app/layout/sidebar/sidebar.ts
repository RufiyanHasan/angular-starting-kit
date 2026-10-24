import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_ITEMS } from '../nav-items';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: { '[class.open]': 'open()' },
})
export class Sidebar {
  readonly open = input(false);
  protected readonly items = NAV_ITEMS;
}
