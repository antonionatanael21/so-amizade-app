import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge } from './age';
import { validateUsername, calculateCommonInterests, sanitizeText } from './validation';
import { formatCurrencyBRL, DEFAULT_PLANS } from './pricing';

test('Age verification rejects under 18', () => {
  const ref = new Date('2026-11-04T12:00:00Z');
  // 17 years old
  const res17 = calculateAge('2009-12-01', ref);
  assert.equal(res17.isValid, false);
  assert.equal(res17.age, 16);

  // Turns 18 tomorrow -> invalid today
  const resAlmost18 = calculateAge('2008-11-05', ref);
  assert.equal(resAlmost18.isValid, false);
  assert.equal(resAlmost18.age, 17);
});

test('Age verification accepts 18 years or older', () => {
  const ref = new Date('2026-11-04T12:00:00Z');
  // Turned 18 yesterday
  const res18 = calculateAge('2008-11-03', ref);
  assert.equal(res18.isValid, true);
  assert.equal(res18.age, 18);

  // 25 years old
  const res25 = calculateAge('2001-05-15', ref);
  assert.equal(res25.isValid, true);
  assert.equal(res25.age, 25);
});

test('Age verification rejects invalid or future dates', () => {
  const ref = new Date('2026-11-04T12:00:00Z');
  const future = calculateAge('2027-01-01', ref);
  assert.equal(future.isValid, false);

  const invalid = calculateAge('not-a-date', ref);
  assert.equal(invalid.isValid, false);
});

test('Username validation checks reserved and invalid handles', () => {
  assert.equal(validateUsername('admin').isValid, false);
  assert.equal(validateUsername('soamizade').isValid, false);
  assert.equal(validateUsername('ab').isValid, false); // too short
  assert.equal(validateUsername('user with spaces').isValid, false);
  assert.equal(validateUsername('user@invalid!').isValid, false);
  assert.equal(validateUsername('joao_silva').isValid, true);
  assert.equal(validateUsername('mari.recife').isValid, true);
});

test('Common interests calculation', () => {
  const userA = ['cinema', 'livros', 'tecnologia', 'café'];
  const userB = ['fotografia', 'LIVROS', 'cinema', 'viagens'];
  const common = calculateCommonInterests(userA, userB);
  assert.deepEqual(common, ['LIVROS', 'cinema']);
});

test('Sanitization removes raw script/HTML tags', () => {
  const raw = '<script>alert("hack")</script>Olá amigo!';
  const clean = sanitizeText(raw);
  assert.equal(clean.includes('<'), false);
  assert.equal(clean.includes('>'), false);
});

test('Pricing formatting in BRL', () => {
  assert.equal(formatCurrencyBRL(9.90).includes('9,90'), true);
  assert.equal(formatCurrencyBRL(99.00).includes('99,00'), true);
  assert.equal(DEFAULT_PLANS.length, 2);
});

test('Auth domain and OAuth redirect URI format validation', () => {
  const customDomain = 'login.soamizade.com.br';
  const redirectUri = `https://${customDomain}/__/auth/handler`;
  assert.equal(redirectUri, 'https://login.soamizade.com.br/__/auth/handler');
  assert.ok(/^https:\/\/[a-z0-9.-]+\/__\/auth\/handler$/.test(redirectUri));
});
