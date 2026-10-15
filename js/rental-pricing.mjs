const PLANS = {
  weekday: { rate: 350 },
  weekend: { rate: 400, nonprofitRate: 300 },
  'four-hour': { total: 1600, nonprofitTotal: 1200 },
};

function timeInMinutes(value) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

// No DOM, currency formatting, rounding, or unpublished discount assumptions.
export function calculateRentalQuote({ plan, start, end, nonprofit }) {
  if (!Object.hasOwn(PLANS, plan)) return { status: 'invalid', code: 'plan' };
  if (!start || !end) return { status: 'incomplete', code: 'missing-time' };

  const startMinutes = timeInMinutes(start);
  const endMinutes = timeInMinutes(end);
  if (startMinutes === null || endMinutes === null) {
    return { status: 'invalid', code: 'invalid-time' };
  }
  if (endMinutes <= startMinutes) return { status: 'invalid', code: 'time-order' };

  const minutes = endMinutes - startMinutes;
  if (plan === 'four-hour' && minutes !== 240) {
    return { status: 'unsupported', code: 'four-hour-duration' };
  }
  if (minutes % 60 !== 0) return { status: 'unsupported', code: 'partial-hour' };

  const hours = minutes / 60;
  const pricing = PLANS[plan];
  if (plan === 'four-hour') {
    return {
      status: 'quoted',
      billing: 'package',
      hours,
      total: nonprofit ? pricing.nonprofitTotal : pricing.total,
      notice: null,
    };
  }

  const rate = nonprofit && pricing.nonprofitRate ? pricing.nonprofitRate : pricing.rate;
  return {
    status: 'quoted',
    billing: 'hourly',
    hours,
    rate,
    total: rate * hours,
    notice: plan === 'weekday' && nonprofit ? 'weekday-nonprofit' : null,
  };
}
