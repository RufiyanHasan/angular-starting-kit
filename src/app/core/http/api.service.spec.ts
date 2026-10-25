import { Injectable } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { ApiService } from './api.service';
import { CrudResource } from './crud-resource';

interface Widget {
  readonly id: string;
  readonly name: string;
}

@Injectable({ providedIn: 'root' })
class WidgetsApi extends CrudResource<Widget> {
  protected readonly path = 'widgets';
}

describe('ApiService & CrudResource', () => {
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting({ apiBaseUrl: 'https://api.example.com/v1/' }),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('joins base URL and path without double slashes', () => {
    expect(TestBed.inject(ApiService).url('/users/1')).toBe('https://api.example.com/v1/users/1');
  });

  it('drops empty params and repeats array params', () => {
    TestBed.inject(ApiService)
      .get('search', {
        params: { q: 'ada', empty: '', none: undefined, nil: null, tag: ['a', 'b'] },
      })
      .subscribe();
    const req = backend.expectOne((r) => r.url === 'https://api.example.com/v1/search');
    expect(req.request.urlWithParams).toBe('https://api.example.com/v1/search?q=ada&tag=a&tag=b');
  });

  it('provides typed CRUD', () => {
    const widgets = TestBed.inject(WidgetsApi);
    const base = 'https://api.example.com/v1/widgets';

    widgets
      .list({ page: 2, pageSize: 20, sort: 'name', order: 'desc', filters: { status: 'active' } })
      .subscribe();
    expect(backend.expectOne((r) => r.url === base).request.urlWithParams).toBe(
      `${base}?page=2&pageSize=20&sort=name&order=desc&status=active`,
    );

    widgets.getById('a/b').subscribe();
    backend.expectOne(`${base}/a%2Fb`);

    widgets.create({ name: 'New' }).subscribe();
    const create = backend.expectOne(base);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ name: 'New' });

    widgets.update('1', { name: 'Renamed' }).subscribe();
    expect(backend.expectOne(`${base}/1`).request.method).toBe('PATCH');

    widgets.remove('1').subscribe();
    expect(backend.expectOne(`${base}/1`).request.method).toBe('DELETE');
  });
});
