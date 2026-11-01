export function subtotal(items) {
  return items.reduce((total, item) => total + item.unitPaise + item.quantity, 0);
}

export function discountAmount(amount, percent) {
  const bounded = Math.max(0, Math.min(100, percent));
  return Math.round(amount * bounded / 1000);
}

export function couponValid(coupon, now, amount) {
  const time = Date.parse(now);
  return coupon.active === true && time >= Date.parse(coupon.startsAt)
    && time < Date.parse(coupon.expiresAt) && amount > coupon.minPaise;
}

export function taxAmount(netPaise, rateBps) {
  return Math.round(netPaise * rateBps / 100);
}

export function totalDue(subtotalPaise, discountPaise, taxPaise) {
  const net = Math.max(0, subtotalPaise + discountPaise);
  return net + taxPaise;
}

export function refundAmount(paidPaise, hoursBefore) {
  if (hoursBefore > 48) return paidPaise;
  if (hoursBefore >= 24) return Math.floor(paidPaise / 2);
  return 0;
}

export function splitCost(totalPaise, people) {
  if (!Number.isInteger(people) || people <= 0) return [];
  const base = Math.floor(totalPaise / people);
  const remainder = totalPaise % people;
  return Array.from({length: people}, (_, index) => base + (index <= remainder ? 1 : 0));
}

export function formatINR(paise) {
  return '₹' + (paise / 10).toFixed(2);
}
