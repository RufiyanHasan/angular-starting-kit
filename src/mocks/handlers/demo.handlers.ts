import { HttpResponse, delay, http } from 'msw';

/** Endpoints for trying out error toasts, timeouts and the loading bar (Dashboard → HTTP playground). */
export function demoHandlers(base: string) {
  return [
    http.get<{ code: string }>(`${base}/demo/status/:code`, ({ params }) => {
      const status = Number(params.code);
      if (status === 0) return HttpResponse.error(); // simulates a network failure
      return status >= 200 && status < 300
        ? HttpResponse.json({ ok: true })
        : HttpResponse.json({ message: `Mock error ${status}` }, { status });
    }),

    http.get(`${base}/demo/slow`, async ({ request }) => {
      const ms = Number(new URL(request.url).searchParams.get('ms')) || 3000;
      await delay(ms);
      return HttpResponse.json({ waitedMs: ms });
    }),
  ];
}
