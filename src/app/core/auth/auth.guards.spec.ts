import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { authGuard, guestGuard, roleGuard } from './auth.guards';
import { type User } from './auth.models';
import { AuthService } from './auth.service';
import { TEST_USER, provideAuthForTesting } from './testing';

@Component({ template: '' })
class Blank {}

describe('auth guards', () => {
  async function navigate(user: User | null, url: string): Promise<string> {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting(),
        provideAuthForTesting(user),
        provideRouter([
          { path: 'login', component: Blank, canActivate: [guestGuard] },
          { path: 'forbidden', component: Blank },
          {
            path: '',
            canActivateChild: [authGuard],
            children: [
              { path: 'home', component: Blank },
              { path: 'admin', component: Blank, canActivate: [roleGuard('admin')] },
            ],
          },
        ]),
      ],
    });
    await TestBed.inject(AuthService).init();
    await (await RouterTestingHarness.create()).navigateByUrl(url);
    return TestBed.inject(Router).url;
  }

  it('authGuard redirects anonymous users to login with a returnUrl', async () => {
    expect(await navigate(null, '/home?tab=2')).toBe('/login?returnUrl=%2Fhome%3Ftab%3D2');
  });

  it('authGuard lets signed-in users through', async () => {
    expect(await navigate(TEST_USER, '/home')).toBe('/home');
  });

  it('guestGuard sends signed-in users away from login', async () => {
    expect(await navigate(TEST_USER, '/login')).toBe('/');
  });

  it('roleGuard sends users without the role to /forbidden', async () => {
    expect(await navigate({ ...TEST_USER, roles: ['user'] }, '/admin')).toBe('/forbidden');
  });

  it('roleGuard lets users with the role through', async () => {
    expect(await navigate({ ...TEST_USER, roles: ['admin'] }, '/admin')).toBe('/admin');
  });
});
