import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { AppTitleStrategy } from './app-title-strategy';

@Component({ template: '' })
class Blank {}

describe('AppTitleStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting({ appName: 'Acme' }),
        provideRouter([
          { path: 'titled', title: 'Users', component: Blank },
          { path: 'untitled', component: Blank },
        ]),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
      ],
    });
  });

  it('suffixes the route title with the app name', async () => {
    await (await RouterTestingHarness.create()).navigateByUrl('/titled');
    expect(TestBed.inject(Title).getTitle()).toBe('Users · Acme');
  });

  it('falls back to the app name', async () => {
    await (await RouterTestingHarness.create()).navigateByUrl('/untitled');
    expect(TestBed.inject(Title).getTitle()).toBe('Acme');
  });
});
