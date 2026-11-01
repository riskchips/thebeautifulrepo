# Bug report and verification log

Applicant name:  ARNAB DAS
Personal public repository:  https://github.com/riskchips/thebeautifulrepo.git
Setup/environment:  node

## Summary

Fixed booking cancellation so only the requested booking changes, and waitlisted parties are promoted only after a confirmed booking is cancelled and when a party fits the available event seats.

## Fix — Correct cancellation scope and waitlist promotion

- **Impact / priority:** High — cancellation could mark unrelated bookings as cancelled, and its follow-up logic could promote waitlisted bookings even when the cancelled booking had not occupied seats.
- **Reproduction steps:** Start with multiple bookings across events. Send `POST /api/bookings/cancel` with `{"id":"b-101"}`. Also try cancelling a waitlisted booking while another party remains waitlisted.
- **Expected behaviour:** Per `SPEC.md`, cancel only the matching booking. After a confirmed booking is cancelled, count the event's free seats and promote waitlisted parties in stored order only if each party fits the remaining seats. Do not promote a party that is too large for the available seats. Cancelling a waitlisted booking releases no seats and must not trigger promotion.
- **Actual behaviour before the fix:** Cancelling one booking marked every other booking cancelled and left the selected booking unchanged. Separately, cancelling a waitlisted booking could trigger promotion of another waitlisted party despite no confirmed seats being released.
- **Root cause:** `cancelBooking` assigned the `cancelled` status to records whose IDs did not match the requested ID. The cancellation service also ran waitlist promotion unconditionally without checking the target booking's prior status.
- **Files changed:** `src/domain/booking.mjs`, `src/services.mjs`, `tests/booking.test.mjs`, `tests/smoke.test.mjs`.
- **Fix:** Cancel only the matching ID and preserve every other booking's status. Promote the waitlist only after a confirmed booking is cancelled, and only for parties that fit the available seats. Also corrected confirmed-seat counting, exact-capacity reservations, waitlist seat consumption, and event-scoped booking results.
- **Verification:** Ran `npm test` — all 42 tests passed. API coverage confirms cancelling confirmed booking `b-101` promotes the fitting waitlist booking; service regressions verify a fitting party is promoted, a party too large for remaining seats stays waitlisted, and cancelling a waitlisted booking does not promote anyone.
- **Evidence:** Booking helper/service tests in `tests/booking.test.mjs` and cancellation API regression in `tests/smoke.test.mjs`.

## Regression checks

- `npm test` — passed; 42 tests, 0 failures.
- API regression verified confirmed cancellation promotes a fitting waitlisted booking without changing other event records.
- Service regression verified cancelling a waitlisted booking does not promote any other waitlisted booking.
- Service regressions verified confirmed cancellation promotes parties only when they fit the available seats and does not exceed capacity.

## Known remaining issues

No known remaining issues related to this cancellation fix.

## Credits

No external code or assets reused.
