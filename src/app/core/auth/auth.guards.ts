import { inject } from '@angular/core';
import { type CanActivateChildFn, type CanActivateFn, Router } from '@angular/router';
import { type Role } from './auth.models';
import { AuthService } from './auth.service';

type ActivateGuard = CanActivateFn & CanActivateChildFn;

/** Only signed-in users. Others go to /login?returnUrl=<where they were heading>. */
export const authGuard: ActivateGuard = (_route, state) =>
  inject(AuthService).isAuthenticated() ||
  inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

/** Only signed-out users (the login page). Signed-in users go home. */
export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).isAuthenticated() || inject(Router).createUrlTree(['/']);

/** Users with at least one of `roles`. Others see /forbidden. Use under authGuard. */
export function roleGuard(...roles: Role[]): ActivateGuard {
  return () =>
    inject(AuthService).hasAnyRole(roles) || inject(Router).createUrlTree(['/forbidden']);
}
