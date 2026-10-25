import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { LocalDatePipe } from './local-date.pipe';

@Component({
  imports: [LocalDatePipe],
  template: `<p>{{ date | localDate: 'long' }}</p>
    <p>{{ bad | localDate }}</p>`,
})
class Host {
  date = '2025-01-04T12:00:00Z';
  bad = 'not a date';
}

describe('LocalDatePipe', () => {
  it('formats in the active language and follows language changes', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [date, bad] = (fixture.nativeElement as HTMLElement).querySelectorAll('p');
    expect(date?.textContent).toBe('January 4, 2025');
    expect(bad?.textContent).toBe('');

    TestBed.inject(TranslocoService).setActiveLang('es');
    await fixture.whenStable();
    expect(date?.textContent).toBe('4 de enero de 2025');
  });
});
