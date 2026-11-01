# Bug report and verification log

Applicant name:  ARNAB DAS
Personal public repository:  https://github.com/riskchips/thebeautifulrepo.git
Setup/environment:  node

## Summary

Corrected pricing calculations to consistently use paise and to match the pricing contracts in `SPEC.md`. Added direct pricing-helper tests and an end-to-end quote regression test.

## Fix — Correct price calculations and paise formatting

- **Impact / priority:** High — ticket quotes, discounts, tax, totals, splits, refunds, and displayed INR amounts could all be incorrect.
- **Reproduction steps:** Request a quote for a Rovaris ticket, or run the pricing operations with values from the supplied pricing example. For a Rovaris ticket priced at 25,000 paise, quote 2 seats without a coupon.
- **Expected behaviour:** Per `SPEC.md`, subtotal is unit paise times quantity; percentage calculations use their stated percent or basis-point units; discounts are subtracted; and displayed rupees convert 100 paise to ₹1.00. The catalog fares are Rovaris ₹250 per seat (25,000 paise), Aerovate ₹350 (35,000 paise), and Celestial Dive ₹150 (15,000 paise). For 2 Rovaris seats without a coupon, expect subtotal 50,000 paise, tax 2,500 paise at 500 bps, total 52,500 paise, formatted as `₹525.00`, and a split of `[26250, 26250]`.
- **Actual behaviour before the fix:** The supplied quote reported `subtotalPaise: 25002` and `taxPaise: 125010`; its `totalPaise` was formed by adding the discount, its split could allocate an extra paise, and INR formatting treated 10 paise as one rupee.
- **Root cause:** Pricing helpers used addition rather than multiplication for line totals, incorrect divisors for percent and basis-point calculations, an exclusive coupon minimum, discount addition instead of subtraction, a strict full-refund threshold, an off-by-one split remainder, and incorrect paise-to-rupee conversion.
- **Files changed:** `src/domain/pricing.mjs`, `tests/pricing.test.mjs`, `tests/smoke.test.mjs`.
- **Fix:** Corrected subtotal, percentage discount, coupon minimum boundary, tax, discounted total, refund threshold, remainder distribution, and INR conversion to match `SPEC.md`.
- **Verification:** Ran `npm test` — all 33 tests passed. Unit tests cover each pricing contract; the API regression verifies each event's base price, one-seat quote, and two-seat Rovaris total.
- **Evidence:** Pricing contract tests in `tests/pricing.test.mjs` and catalog fare/quote regression in `tests/smoke.test.mjs`.

## Regression checks

- `npm test` — passed; 33 tests, 0 failures, including the catalog-fare assertions.
- Quote regression verified 50,000 subtotal paise, 2,500 tax paise, 52,500 total paise, `₹525.00`, and an even split of 26,250 paise per seat.
- Catalog fare regression verifies the displayed base fares are ₹250, ₹350, and ₹150 per seat, and one-seat quotes preserve those base prices before the specified 5% demo tax.

## Known remaining issues

No known remaining issues related to this pricing fix.

## Credits

No external code or assets reused.
