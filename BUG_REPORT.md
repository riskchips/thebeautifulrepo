# Bug report and verification log

Applicant name:  ARNAB DAS
Personal public repository:  https://github.com/riskchips/thebeautifulrepo.git
Setup/environment:  node

## Summary

Fixed the event explorer so its first page displays the expected events, filtered results are visible, and catalog ordering and filters follow the specification.

## Fix — Show all event explorer results and honor filters

- **Impact / priority:** Medium — the explorer displayed an incomplete event list, and filtered matches could appear to be missing, making search and registration availability harder to use.
- **Reproduction steps:** Open Event explorer with the seed data. It reports 3 matching events but shows only Rovaris on page 1 of 2. Search for `rocket` and apply the filter; the count changes to 1 matching event, but no event card appears.
- **Expected behaviour:** Per `SPEC.md`, catalog pages are one-based, event results are sorted by ascending start time, all selected tags must match, availability counts confirmed seats only, and the tag list contains unique lowercase values. Page 1 should show Rovaris and Aerovate; page 2 should show Celestial Dive. Searching `rocket` should show Aerovate.
- **Actual behaviour before the fix:** Pagination started at the second page-sized slice for page 1, so only one event appeared on page 1 and single-result searches returned an empty page. Sorting was newest-first. Tag filtering used any selected tag, waitlisted seats reduced availability, and the tag list included duplicates.
- **Root cause:** `paginate` used the one-based page number as a zero-based offset. Related catalog helpers also contradicted their documented ordering and filtering behavior.
- **Files changed:** `src/domain/catalog.mjs`, `tests/smoke.test.mjs`.
- **Fix:** Corrected the pagination offset, sorted events by ascending start time, required all selected tags to match, counted confirmed seats for availability, and deduplicated tag options.
- **Verification:** Ran `npm test` — all 23 tests passed. Regression checks cover both pages, search, tags, availability, and unique tags. In a fresh browser session, page 1 showed Rovaris and Aerovate, applying a `rocket` search showed Aerovate, and page 2 showed Celestial Dive.
- **Evidence:** Event explorer API and catalog regression tests in `tests/smoke.test.mjs`.

## Regression checks

- `npm test` — passed; 23 tests, 0 failures, including pagination and filter regressions.
- Verified the explorer in a fresh browser session: both page 1 cards appeared, applying the `rocket` filter displayed Aerovate, and page 2 displayed Celestial Dive.

## Known remaining issues

List unresolved defects and any incomplete work without claiming them as fixed.

## Credits

Credit reused code, assets, libraries and source projects.
