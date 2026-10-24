import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CONFIG_URL, ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('is empty before load', () => {
    expect(service.config()).toBeNull();
    expect(() => service.get('appName')).toThrow(/before config was loaded/);
  });

  it('loads and validates config.json', async () => {
    const loading = service.load();
    http.expectOne(CONFIG_URL).flush({ appName: 'Acme', mockApi: true });
    await loading;

    expect(service.get('appName')).toBe('Acme');
    expect(service.config()?.mockApi).toBe(true);
  });

  it('rejects when config.json is invalid', async () => {
    const loading = service.load();
    http.expectOne(CONFIG_URL).flush({ logLevel: 'nope' });
    await expect(loading).rejects.toThrow(/logLevel/);
  });

  it('rejects when config.json cannot be fetched', async () => {
    const loading = service.load();
    http.expectOne(CONFIG_URL).flush(null, { status: 404, statusText: 'Not Found' });
    await expect(loading).rejects.toBeTruthy();
  });
});
