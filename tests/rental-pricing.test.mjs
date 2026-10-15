import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRentalQuote } from '../js/rental-pricing.mjs';

const quote = (overrides = {}) => calculateRentalQuote({
  plan: 'weekday', start: '10:00', end: '12:00', nonprofit: false, ...overrides,
});

test('hourly nonprofit discount applies only to the published weekend rate', () => {
  assert.deepEqual(quote(), {
    status: 'quoted', billing: 'hourly', hours: 2, rate: 350, total: 700, notice: null,
  });
  assert.deepEqual(quote({ nonprofit: true }), {
    status: 'quoted', billing: 'hourly', hours: 2, rate: 350, total: 700, notice: 'weekday-nonprofit',
  });
  assert.equal(quote({ plan: 'weekend' }).total, 800);
  assert.equal(quote({ plan: 'weekend', nonprofit: true }).total, 600);
});

test('four-hour package requires exactly four continuous hours without extrapolation', () => {
  assert.equal(quote({ plan: 'four-hour', end: '14:00' }).total, 1600);
  assert.equal(quote({ plan: 'four-hour', end: '14:00', nonprofit: true }).total, 1200);
  for (const end of ['13:59', '14:01', '18:00']) {
    assert.deepEqual(quote({ plan: 'four-hour', end }), {
      status: 'unsupported', code: 'four-hour-duration',
    });
  }
});

test('duration, not clock alignment, determines a whole-hour rental', () => {
  assert.equal(quote({ start: '10:30', end: '11:30' }).total, 350);
  for (const end of ['10:01', '10:59', '11:01', '11:30']) {
    assert.deepEqual(quote({ end }), { status: 'unsupported', code: 'partial-hour' });
  }
});

test('equal, reversed, and overnight intervals never produce a price', () => {
  for (const times of [
    { start: '10:00', end: '10:00' },
    { start: '12:00', end: '10:00' },
    { start: '23:00', end: '01:00' },
  ]) {
    assert.deepEqual(quote(times), { status: 'invalid', code: 'time-order' });
  }
});

test('missing or malformed values cannot leak an amount', () => {
  assert.deepEqual(quote({ start: '' }), { status: 'incomplete', code: 'missing-time' });
  assert.deepEqual(quote({ end: '' }), { status: 'incomplete', code: 'missing-time' });
  for (const start of ['24:00', '12:60', '9:00', 'nonsense']) {
    assert.deepEqual(quote({ start }), { status: 'invalid', code: 'invalid-time' });
  }
  assert.deepEqual(quote({ plan: 'toString' }), { status: 'invalid', code: 'plan' });
});
