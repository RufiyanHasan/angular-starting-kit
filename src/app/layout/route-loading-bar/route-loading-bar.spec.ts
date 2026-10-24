import { TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router, type Event } from '@angular/router';
import { Subject } from 'rxjs';
import { RouteLoadingBar } from './route-loading-bar';

describe('RouteLoadingBar', () => {
  it('shows while a navigation is pending', async () => {
    const events = new Subject<Event>();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { events } }],
    });
    const fixture = TestBed.createComponent(RouteLoadingBar);
    const bar = () => (fixture.nativeElement as HTMLElement).querySelector('[role="progressbar"]');

    await fixture.whenStable();
    expect(bar()).toBeNull();

    events.next(new NavigationStart(1, '/users'));
    await fixture.whenStable();
    expect(bar()).not.toBeNull();

    events.next(new NavigationEnd(1, '/users', '/users'));
    await fixture.whenStable();
    expect(bar()).toBeNull();
  });
});
