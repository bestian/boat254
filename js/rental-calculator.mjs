import { calculateRentalQuote } from './rental-pricing.mjs';

const messages = {
  'missing-time': '請填寫開始與結束時間，即可查看預估費用。',
  plan: '請選擇有效的租借方案。',
  'invalid-time': '請填寫有效的開始與結束時間。',
  'time-order': '結束時間須晚於開始時間；跨日租借請聯絡我們。',
  'four-hour-duration': '4 小時方案須為連續 4 小時；其他時長請改選每小時方案或洽詢。',
  'partial-hour': '目前僅試算整小時租借；非整小時計費請聯絡我們，不自動進位。',
};
const planLabels = {
  weekday: '平日方案',
  weekend: '假日方案',
  'four-hour': '假日 4 小時方案',
};
const currency = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 });
const money = (amount) => `NT$${currency.format(amount)}`;

const form = document.getElementById('rental-calculator-form');
if (form) {
  const fields = form.querySelector('fieldset');
  const plan = form.elements.namedItem('plan');
  const start = form.elements.namedItem('start');
  const end = form.elements.namedItem('end');
  const nonprofit = form.elements.namedItem('nonprofit');
  const total = document.getElementById('rental-quote-total');
  const message = document.getElementById('rental-quote-message');
  const detail = document.getElementById('rental-quote-detail');
  const notice = document.getElementById('rental-quote-notice');

  function updateQuote() {
    const quote = calculateRentalQuote({
      plan: plan.value,
      start: start.value,
      end: end.value,
      nonprofit: nonprofit.checked,
    });

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
    message.textContent = `${planLabels[plan.value]} · ${start.value}–${end.value} · 共 ${quote.hours} 小時`;
    detail.textContent = quote.billing === 'package'
      ? `連續 4 小時包段：${money(quote.total)}${nonprofit.checked ? '（非營利優惠）' : ''}`
      : `${money(quote.rate)}／小時 × ${quote.hours} 小時 = ${money(quote.total)}${nonprofit.checked && plan.value === 'weekend' ? '（非營利優惠）' : ''}`;
    notice.textContent = quote.notice === 'weekday-nonprofit'
      ? '平日非營利暫依公開原價試算，未套用額外折扣；合作優惠請另洽。'
      : '僅供費用參考，實際檔期與優惠資格請洽詢確認。';
  }

  form.addEventListener('input', updateQuote);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    updateQuote();
  });
  fields.disabled = false;
  updateQuote();
}
