# Local API reference

Base: `http://127.0.0.1:3000`. Write requests must use `Content-Type: application/json`. Errors return `{ "error": "message" }`. No external services are called. The server binds to loopback by default.

## Hosted preview

The live base URL is `https://the-ugly-repo.vercel.app`. It uses the same intentionally defective domain logic with read-only seed data. `/api/health` reports `{ok:true, mode:"hosted-preview", readOnly:true}`. Saved-data writes return 403; `/api/quote` and `/api/diagnostics` remain available because they do not save changes. Use the local base URL for full write workflows.

## Read routes

| Route | Inputs | Returns |
| --- | --- | --- |
| `GET /api/health` | None | `{ok, mode}` |
| `GET /api/dashboard` | None | Fixed clock, events/capacity, revenue, participant counts, preferences, audit |
| `GET /api/events` | `q`, repeatable `tag`, `available=true`, one-based `page`, `size` (1–50) | `{total, tags, events}` |
| `GET /api/bookings` | Optional `eventId` | Array of bookings |
| `GET /api/inventory` | `eventId`, positive integer `teams` (up to 100) | Items, low-stock list, requirements, fulfillment, cost |
| `GET /api/schedule` | `eventId` | Sessions with duration/day/countdown, plus conflict pairs |
| `GET /api/telemetry` | None | Sample series and derived measures |
| `GET /api/operations` | None | Workbench operation names, contracts and example argument arrays |
| `GET /api/report.csv` | None | Downloadable booking CSV |

## Write routes

### `POST /api/quote`

```json
{"eventId":"rovaris","seats":2,"coupon":"STELLAR10"}
```

Returns subtotal, discount, tax, total (all integer paise), formatted total, couponApplied and per-person split. This does not create a booking. Seats must be a JSON integer here.

### `POST /api/bookings`

```json
{"eventId":"rovaris","name":"Applicant Demo","email":"demo@vitstudent.ac.in","registration":"25BCE1234","seats":"2","coupon":"STELLAR10"}
```

Returns HTTP 201 with `{record, quote}`. Booking seats may be decimal-digit text or a positive JSON integer. The event's maxTeam limits party size. An active duplicate email/event combination returns 409. Full events create waitlisted parties. Waitlisted parties have paidPaise = 0; a promoted party gets the current no-coupon demo quote. The sandbox charges nothing.

### `POST /api/bookings/cancel`

```json
{"id":"b-101"}
```

Cancels the matching record and promotes fitting parties from its event waitlist using stored order. Non-fitting parties are skipped; later fitting parties may be promoted. Returns `{bookings}` for the event. Repeating a cancellation must not cancel unrelated bookings.

### `POST /api/inventory`

```json
{"id":"motor","action":"reserve","quantity":2}
```

Action is `reserve`, `release`, or `restock`. Quantity is a positive JSON integer up to 1000. Reserve rejects insufficient usable stock with 409. Returns the updated inventory array.

### `POST /api/preferences`

```json
{"theme":"dark","pageSize":6,"eventId":""}
```

Partial update. Theme is light/dark; pageSize is 1–50; eventId is text, with blank meaning all events. Unknown fields are ignored. Returns merged preferences.

### `POST /api/diagnostics`

```json
{"module":"booking","name":"canReserve","args":[12,8,4]}
```

Runs a named domain operation from `/api/operations` against JSON inputs and returns `{result}`. The JSON array maps positionally to the listed parameters. It does not write to the snapshot. Use correctly typed input per SPEC.md; arbitrary malformed diagnostic arguments may produce an error. Unknown operation names return 404.

### `POST /api/reset`

```json
{}
```

Restores the seed in the local store. Returns `{ok:true}`. This discards only your local demo changes.

## Manual investigation ideas

Try registration at capacity, cancellation with several waitlisted parties, a coupon exactly at its minimum, equipment already partly reserved, adjacent and overnight sessions, duplicate emails with different case, pagination through a filtered result set, and reopening the app after changes. Compare actual behaviour with SPEC.md and write reproducible cases of your own.
