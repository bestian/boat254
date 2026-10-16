const DISCOUNT_PERIODS = [
  { start: 9 * 60, end: 13 * 60, label: '09:00–13:00' },
  { start: 13 * 60 + 30, end: 17 * 60 + 30, label: '13:30–17:30' },
  { start: 18 * 60, end: 22 * 60, label: '18:00–22:00' },
];

function timeInMinutes(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

function dayOfWeek(date) {
  if (typeof date !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date)) return null;
  // UTC prevents the visitor's time zone from shifting the selected calendar day.
  const value = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(value.getTime()) || value.toISOString().slice(0, 10) !== date) return null;
  return value.getUTCDay();
}

// Pure same-day quote; monetary formatting belongs to the UI.
export function calculateRentalQuote({ date, start, end }) {
  if (!date) return { status: 'incomplete', code: 'missing-date' };
  const day = dayOfWeek(date);
  if (day === null) return { status: 'invalid', code: 'invalid-date' };
  if (!start || !end) return { status: 'incomplete', code: 'missing-time' };

  const startMinutes = timeInMinutes(start);
  const endMinutes = timeInMinutes(end);
  if (startMinutes === null || endMinutes === null) {
    return { status: 'invalid', code: 'invalid-time' };
  }
  if (endMinutes <= startMinutes) return { status: 'invalid', code: 'time-order' };

  const minutes = endMinutes - startMinutes;
  const weekend = day === 0 || day === 6;
  if (minutes % 60 !== 0) return { status: 'unsupported', code: 'partial-hour' };

  const daytimeMinutes = weekend ? 0 : Math.max(0, Math.min(endMinutes, 18 * 60) - startMinutes);
  const eveningMinutes = minutes - daytimeMinutes;
  const baseTotal = Math.ceil((daytimeMinutes * 350 + eveningMinutes * 400) / 60);
  const period = DISCOUNT_PERIODS.find(({ start, end }) => startMinutes <= start && endMinutes >= end);
  // One discount per booking: the eight-hour discount replaces the period discount.
  const discount = minutes >= 8 * 60 ? 250 : period ? 100 : 0;
  return {
    status: 'quoted',
    day,
    hours: minutes / 60,
    daytimeMinutes,
    eveningMinutes,
    baseTotal,
    discount,
    discountType: discount === 250 ? 'eight-hour' : discount === 100 ? 'period' : null,
    discountPeriod: discount === 100 ? period.label : null,
    total: baseTotal - discount,
  };
}
