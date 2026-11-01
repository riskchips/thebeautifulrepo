import test from 'node:test';
import assert from 'node:assert/strict';
import * as pricing from '../src/domain/pricing.mjs';

test('pricing helpers follow the paise contracts', async t => {
  await t.test('subtotal multiplies each unit price by its quantity', () => {
    assert.equal(pricing.subtotal([{unitPaise: 1250, quantity: 2}, {unitPaise: 501, quantity: 3}]), 4003);
  });

  await t.test('discount clamps percentages and rounds to integer paise', () => {
    assert.equal(pricing.discountAmount(1001, 10), 100);
    assert.equal(pricing.discountAmount(100, -10), 0);
    assert.equal(pricing.discountAmount(100, 150), 100);
  });

  await t.test('coupon minimum is inclusive and expiration is exclusive', () => {
    const coupon = {active: true, startsAt: '2027-01-01T00:00:00Z', expiresAt: '2027-01-02T00:00:00Z', minPaise: 5000};
    assert.equal(pricing.couponValid(coupon, '2027-01-01T00:00:00Z', 5000), true);
    assert.equal(pricing.couponValid(coupon, '2027-01-02T00:00:00Z', 5000), false);
    assert.equal(pricing.couponValid({...coupon, active: false}, '2027-01-01T12:00:00Z', 5000), false);
  });

  await t.test('tax basis points use 10000 as 100 percent', () => {
    assert.equal(pricing.taxAmount(25002, 500), 1250);
    assert.equal(pricing.taxAmount(1, 5000), 1);
  });

  await t.test('total subtracts the discount and clamps the net at zero', () => {
    assert.equal(pricing.totalDue(10000, 2500, 375), 7875);
    assert.equal(pricing.totalDue(1000, 1500, 20), 20);
  });

  await t.test('refund thresholds include exactly 48 and 24 hours', () => {
    assert.equal(pricing.refundAmount(1001, 48), 1001);
    assert.equal(pricing.refundAmount(1001, 24), 500);
    assert.equal(pricing.refundAmount(1001, 23), 0);
  });

  await t.test('split assigns only remainder pennies to the first people', () => {
    assert.deepEqual(pricing.splitCost(10, 3), [4, 3, 3]);
    assert.deepEqual(pricing.splitCost(9, 3), [3, 3, 3]);
  });

  await t.test('INR formatting converts paise to rupees', () => {
    assert.equal(pricing.formatINR(150012), '₹1500.12');
  });
});
