import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRentalQuote } from '../js/rental-pricing.mjs';

const quote = (overrides = {}) => calculateRentalQuote({
  date: '2026-10-19', start: '10:00', end: '12:00', ...overrides,
});

test('Monday 12:00–19:00 splits daytime and evening rates, then discounts the included period', () => {
  const result = quote({ start: '12:00', end: '19:00' });
  assert.equal(result.daytimeMinutes, 360);
  assert.equal(result.eveningMinutes, 60);
  assert.equal(result.baseTotal, 2500);
  assert.equal(result.discount, 100);
  assert.equal(result.discountPeriod, '13:30–17:30');
  assert.equal(result.total, 2400);
});

test('all five weekdays split at 18:00; both weekend days charge 400 throughout', () => {
  for (const date of ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']) {
    assert.equal(quote({ date, start: '17:00', end: '18:00' }).total, 350);
    assert.equal(quote({ date, start: '18:00', end: '19:00' }).total, 400);
  }
  for (const date of ['2026-10-24', '2026-10-25']) {
    assert.equal(quote({ date }).total, 800);
    assert.equal(quote({ date, start: '17:00', end: '19:00' }).total, 800);
    assert.equal(quote({ date, start: '12:00', end: '19:00' }).total, 2700);
  }
});

test('a period discount requires full containment, including exact boundaries', () => {
  for (const [start, end, total] of [
    ['09:00', '13:00', 1300],
    ['13:30', '17:30', 1300],
    ['18:00', '22:00', 1500],
    ['08:30', '13:30', 1650],
  ]) {
    assert.equal(quote({ start, end }).total, total);
  }
  for (const [start, end] of [
    ['09:01', '13:01'], ['08:59', '12:59'],
    ['13:31', '17:31'], ['13:29', '17:29'],
    ['18:01', '22:01'], ['17:59', '21:59'],
    ['10:00', '14:00'],
  ]) {
    assert.equal(quote({ start, end }).discount, 0);
  }
});

test('eight-hour discount applies once at and above eight hours, without stacking period discounts', () => {
  assert.equal(quote({ start: '10:00', end: '17:00' }).discount, 0);
  for (const [start, end, total] of [
    ['10:00', '18:00', 2550], // Eight hours without a complete discount period.
    ['09:00', '17:00', 2550], // Also contains the morning period.
    ['09:00', '18:00', 2900], // Contains two periods.
    ['06:00', '22:00', 5550], // Sixteen hours, still only one discount.
  ]) {
    const result = quote({ start, end });
    assert.equal(result.discount, 250);
    assert.equal(result.discountType, 'eight-hour');
    assert.equal(result.total, total);
  }
  assert.equal(quote({ date: '2026-10-24', start: '09:00', end: '17:00' }).total, 2950);
});

test('whole-hour duration may start on minutes and is split proportionally across 18:00', () => {
  assert.equal(quote({ start: '10:30', end: '11:30' }).total, 350);
  assert.equal(quote({ start: '17:30', end: '18:30' }).total, 375);
  assert.equal(quote({ start: '17:01', end: '18:01' }).total, 351);
  for (const end of ['10:01', '10:59', '11:01', '11:30']) {
    assert.deepEqual(quote({ end }), { status: 'unsupported', code: 'partial-hour' });
  }
});

test('monetary amounts round up to whole dollars without rounding rental hours', () => {
  const result = quote({ date: '2026-10-23', start: '11:45', end: '23:45' });
  assert.equal(result.daytimeMinutes, 375);
  assert.equal(result.eveningMinutes, 345);
  assert.equal(result.baseTotal, 4488);
  assert.equal(result.discount, 250);
  assert.equal(result.total, 4238);
  // A fraction below .5 must still round up; exact integers must stay unchanged.
  assert.equal(quote({ start: '17:05', end: '18:05' }).total, 355);
  assert.equal(quote({ start: '17:06', end: '18:06' }).total, 355);
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

test('missing or malformed dates and times cannot leak an amount', () => {
  assert.deepEqual(quote({ date: '' }), { status: 'incomplete', code: 'missing-date' });
  for (const date of ['2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-01', '2026-10-00', '2026-1-1', 'nonsense']) {
    assert.deepEqual(quote({ date }), { status: 'invalid', code: 'invalid-date' });
  }
  assert.equal(quote({ date: '2024-02-29' }).total, 700);
  assert.deepEqual(quote({ start: '' }), { status: 'incomplete', code: 'missing-time' });
  assert.deepEqual(quote({ end: '' }), { status: 'incomplete', code: 'missing-time' });
  for (const start of ['24:00', '12:60', '9:00', 'nonsense']) {
    assert.deepEqual(quote({ start }), { status: 'invalid', code: 'invalid-time' });
  }
});
