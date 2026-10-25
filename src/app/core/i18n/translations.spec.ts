import en from '../../../../public/assets/i18n/en.json';
import es from '../../../../public/assets/i18n/es.json';

/** Flattens `{ a: { b: 'x' } }` to `{ 'a.b': 'x' }`. */
function flatten(obj: object, prefix = ''): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null
      ? { ...acc, ...flatten(value, path) }
      : { ...acc, [path]: String(value) };
  }, {});
}

const params = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

describe('translation files', () => {
  const source = flatten(en);

  it.each([['es', es]])('%s has exactly the keys of en.json', (_, translation) => {
    expect(Object.keys(flatten(translation)).sort()).toEqual(Object.keys(source).sort());
  });

  it.each([['es', es]])('%s uses the same {{ params }} as en.json', (_, translation) => {
    const target = flatten(translation);
    for (const [key, text] of Object.entries(source)) {
      expect(params(target[key] ?? ''), key).toEqual(params(text));
    }
  });
});
