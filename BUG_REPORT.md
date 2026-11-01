# Bug report and verification log

Applicant name:  ARNAB DAS
Personal public repository:  https://github.com/riskchips/thebeautifulrepo.git
Setup/environment:  node

## Summary

Fixed an inverted event occupancy calculation that displayed misleading percentages on the overview page. Occupancy now uses confirmed occupied seats divided by event capacity, and events with no occupied seats display 0%. Added a dashboard regression test.

## Fix 1 — Correct event occupancy percentages

- **Impact / priority:** Medium — the overview showed incorrect event capacity usage, which could mislead planning and registration decisions.
- **Reproduction steps:** Start the app with its seed data and view the overview page. Rovaris has 11 confirmed seats out of 12, Aerovate has 2 out of 16, and Celestial Dive has 0 out of 20.
- **Expected behaviour:** Per `SPEC.md`, `occupancyPercent(occupied, capacity)` is occupied seats divided by capacity as a rounded percentage, with zero capacity returning zero. The overview should show 92%, 13%, and 0%, respectively.
- **Actual behaviour before the fix:** The overview showed 109% for Rovaris, 800% for Aerovate, and `—%` for Celestial Dive.
- **Root cause:** `occupancyPercent` divided capacity by occupied seats instead of occupied seats by capacity. With zero occupied seats, the result was non-finite and did not serialize as a percentage.
- **Files changed:** `src/domain/analytics.mjs`, `tests/smoke.test.mjs`.
- **Fix:** Reversed the ratio to `occupied / capacity * 100`; added a dashboard regression test asserting the seed event percentages are `[92, 13, 0]`.
- **Verification:** Ran `npm test` — all 19 tests passed. Reloaded the local homepage after restarting the app and confirmed the cards display 92%, 13%, and 0%.
- **Evidence:** Automated dashboard regression test in `tests/smoke.test.mjs`.

Repeat this section for additional fixes.

## Regression checks

- `npm test` — passed; 19 tests, 0 failures, including the new occupancy regression test.
- Manually reloaded the homepage and confirmed the displayed occupancy values match the expected percentages.

## Known remaining issues

List unresolved defects and any incomplete work without claiming them as fixed.

## Credits

Credit reused code, assets, libraries and source projects.
