import { calculateRentalQuote } from './rental-pricing.mjs';

const messages = {
  'missing-date': '請填寫借用日期，以判斷平日或週末費率。',
  'invalid-date': '請填寫有效的借用日期。',
  'missing-time': '請填寫開始與結束時間，即可查看預估費用。',
  'invalid-time': '請填寫有效的開始與結束時間。',
  'time-order': '結束時間須晚於開始時間；跨日租借請聯絡我們。',
  'partial-hour': '目前僅試算整小時租借；非整小時計費請聯絡我們，不自動進位。',
};
const dayLabels = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
const currency = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 });
const money = (amount) => `NT$${currency.format(amount)}`;

const form = document.getElementById('rental-calculator-form');
if (form) {
  const fields = form.querySelector('fieldset');
  const date = form.elements.namedItem('date');
  const start = form.elements.namedItem('start');
  const end = form.elements.namedItem('end');
  const total = document.getElementById('rental-quote-total');
  const message = document.getElementById('rental-quote-message');
  const detail = document.getElementById('rental-quote-detail');
  const notice = document.getElementById('rental-quote-notice');

  function updateQuote() {
    const quote = calculateRentalQuote({
      date: date.value,
      start: start.value,
      end: end.value,
    });

    date.setAttribute('aria-invalid', String(quote.code === 'invalid-date'));
    const invalidTime = quote.code === 'invalid-time' || quote.code === 'time-order';
    start.setAttribute('aria-invalid', String(invalidTime));
    end.setAttribute('aria-invalid', String(invalidTime));
    // Clear the previous quote before rendering any incomplete/unsupported interval.
    total.textContent = '—';
    detail.textContent = '';
    notice.textContent = '';
    if (quote.status !== 'quoted') {
      message.textContent = messages[quote.code];
      return;
    }

    total.textContent = money(quote.total);
    message.textContent = `${date.value}（${dayLabels[quote.day]}）· ${start.value}–${end.value} · 共 ${quote.hours} 小時`;
    const charges = [];
    if (quote.daytimeMinutes) charges.push(`NT$350 × ${quote.daytimeMinutes / 60} 小時`);
    if (quote.eveningMinutes) charges.push(`NT$400 × ${quote.eveningMinutes / 60} 小時`);
    detail.textContent = `${charges.join(' ＋ ')} = 基本費 ${money(quote.baseTotal)}`;
    notice.textContent = quote.discountType === 'eight-hour'
      ? `連續滿 8 小時折 ${money(quote.discount)}。`
      : quote.discountType === 'period'
        ? `完整涵蓋 ${quote.discountPeriod}，時段優惠折 ${money(quote.discount)}。`
        : '未符合優惠時段或連續 8 小時條件，依基本費試算。';
  }

  form.addEventListener('input', updateQuote);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    updateQuote();
  });
  fields.disabled = false;
  updateQuote();
}
