import test from 'node:test';
import assert from 'node:assert/strict';
import { handler } from '../netlify/functions/verify-age.mjs';

const post = (body) => handler({ httpMethod: 'POST', body: JSON.stringify(body) });

test('Netlify age function accepts an adult birth date', async () => {
  const result = await post({ birthDate: '2004-07-14' });
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).valid, true);
});

test('Netlify age function rejects a person under 18', async () => {
  const result = await post({ birthDate: '2010-01-01' });
  assert.equal(result.statusCode, 403);
  assert.equal(JSON.parse(result.body).valid, false);
});

test('Netlify age function rejects impossible and malformed dates', async () => {
  for (const birthDate of ['2004-02-30', '14/07/2004', '', null]) {
    const result = await post({ birthDate });
    assert.equal(result.statusCode, 403);
    assert.equal(JSON.parse(result.body).valid, false);
  }
});

test('Netlify age function exposes a lightweight deployment health check', async () => {
  const result = await handler({ httpMethod: 'GET', body: null });
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).ok, true);
});

test('Netlify age function rejects unsupported methods', async () => {
  const result = await handler({ httpMethod: 'PUT', body: null });
  assert.equal(result.statusCode, 405);
  assert.equal(result.headers.Allow, 'GET, POST');
});
