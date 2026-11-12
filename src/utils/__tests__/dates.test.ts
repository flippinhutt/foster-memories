import { daysInCare, displayToIsoDate, formatDate, greeting, parseDisplayDate } from '../dates';

describe('parseDisplayDate', () => {
  it.each([
    ['03-14-2026', true],
    ['02-29-2024', true],
    ['02-29-2026', false],
    ['13-01-2026', false],
    ['3-14-2026', false],
    ['2026-03-14', false],
    ['', false],
  ])('%s valid=%s', (value, valid) => {
    expect(parseDisplayDate(value) !== null).toBe(valid);
  });
});

describe('date conversion', () => {
  it('converts between MM-DD-YYYY and stored ISO dates', () => {
    expect(displayToIsoDate('03-14-2026')).toBe('2026-03-14');
    expect(formatDate('2026-03-14')).toBe('03-14-2026');
    expect(() => displayToIsoDate('02-30-2026')).toThrow('Invalid date');
  });
});

describe('daysInCare', () => {
  const now = new Date(2026, 2, 20, 15);

  it('counts arrival day as day 1', () => {
    expect(daysInCare('2026-03-20', null, now)).toBe(1);
    expect(daysInCare('2026-03-14', null, now)).toBe(7);
  });

  it('stops at departure', () => {
    expect(daysInCare('2026-03-01', '2026-03-10', now)).toBe(10);
  });

  it('returns null without arrival or for future arrival', () => {
    expect(daysInCare(null, null, now)).toBeNull();
    expect(daysInCare('2026-04-01', null, now)).toBeNull();
  });
});

describe('greeting', () => {
  it('follows the time of day', () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe('Good morning');
    expect(greeting(new Date(2026, 0, 1, 13))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 0, 1, 21))).toBe('Good evening');
  });
});
