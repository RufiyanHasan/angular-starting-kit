import { Injectable } from '@angular/core';
import { CrudResource } from '@core/http/crud-resource';
import { type User, type UserInput } from './user.model';

/** `/users` REST resource. All CRUD methods come from CrudResource. */
@Injectable({ providedIn: 'root' })
export class UsersApi extends CrudResource<User, UserInput> {
  protected readonly path = 'users';
}
