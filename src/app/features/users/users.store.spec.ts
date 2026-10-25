import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { TEST_USER, provideAuthForTesting } from '@core/auth/testing';
import { AuthService } from '@core/auth/auth.service';
import { provideConfigForTesting } from '@core/config/testing';
import { authInterceptor } from '@core/http/interceptors/auth.interceptor';
import { TEST_API_BASE, testToken, useMockApi } from '../../../mocks/testing';
import { DEFAULT_USERS_QUERY } from './users-query';
import { UsersStore } from './users.store';

describe('UsersStore (against the mock API)', () => {
  const server = useMockApi();

  async function setup() {
    TestBed.configureTestingModule({
      providers: [
        UsersStore,
        provideConfigForTesting({ apiBaseUrl: TEST_API_BASE }),
        provideAuthForTesting(
          { ...TEST_USER, roles: ['admin'] },
          { accessToken: testToken(['admin']) },
        ),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
      ],
    });
    await TestBed.inject(AuthService).init();
    return TestBed.inject(UsersStore);
  }

  const settled = (store: InstanceType<typeof UsersStore>) =>
    vi.waitFor(() => expect(store.loading()).toBe(false));

  it('loads a page and exposes entities, total and the query', async () => {
    const store = await setup();
    store.load({ ...DEFAULT_USERS_QUERY, pageSize: 5 });
    expect(store.loading()).toBe(true);
    await settled(store);

    expect(store.entities()).toHaveLength(5);
    expect(store.total()).toBe(42);
    expect(store.query().pageSize).toBe(5);
    expect(store.hasFilters()).toBe(false);
    expect(store.entities().map((u) => u.name)).toEqual(
      [...store.entities().map((u) => u.name)].sort((a, b) => a.localeCompare(b)),
    );
  });

  it('applies filters and search', async () => {
    const store = await setup();
    store.load({ ...DEFAULT_USERS_QUERY, role: 'admin', q: 'ada' });
    await settled(store);
    expect(store.hasFilters()).toBe(true);
    expect(store.entities().every((u) => u.role === 'admin' && /ada/i.test(u.name + u.email))).toBe(
      true,
    );
  });

  it('flags a failed load and recovers on reload', async () => {
    const store = await setup();
    server.use(
      http.get(`${TEST_API_BASE}/users`, () => HttpResponse.json({}, { status: 500 }), {
        once: true,
      }),
    );
    store.load(DEFAULT_USERS_QUERY);
    await settled(store);
    expect(store.loadFailed()).toBe(true);

    store.reload();
    await settled(store);
    expect(store.loadFailed()).toBe(false);
    expect(store.total()).toBe(42);
  });

  it('updates an entity in place and removes with a reload', async () => {
    const store = await setup();
    store.load(DEFAULT_USERS_QUERY);
    await settled(store);
    const first = store.entities()[0]!;

    const updated = await store.update(first.id, { name: 'Ada Renamed' });
    expect(updated.name).toBe('Ada Renamed');
    expect(store.entityMap()[first.id]?.name).toBe('Ada Renamed');

    await store.remove(first.id);
    await settled(store);
    expect(store.total()).toBe(41);
    expect(store.entityMap()[first.id]).toBeUndefined();
  });

  it('creates a user and reloads the list', async () => {
    const store = await setup();
    store.load({ ...DEFAULT_USERS_QUERY, q: 'zed' });
    await settled(store);
    expect(store.total()).toBe(0);

    await store.create({
      name: 'Zed Shaw',
      email: 'zed@example.com',
      role: 'user',
      status: 'active',
    });
    await settled(store);
    expect(store.entities().map((u) => u.name)).toEqual(['Zed Shaw']);
  });
});
