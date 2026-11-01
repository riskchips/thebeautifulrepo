# Behaviour specification

This is the product contract for the event-operations sandbox. Use it to determine intended behaviour. The seed data is fictional. ISO dates have explicit offsets; prices are integer paise. Unless specified otherwise, domain functions accept valid typed inputs and must not mutate caller-owned data. HTTP routes validate shape and size before invoking them. Arrays retain input order unless a sort is explicitly required. Date intervals are half-open.

## Validation

- `normalizeEmail(value)`: Trim surrounding whitespace and lowercase the entire email.
- `isVitEmail(value)`: Accept only nonempty local parts at exactly vit.ac.in or vitstudent.ac.in.
- `validTeamSize(size, max)`: Team size is an integer in the inclusive interval 1..max.
- `parseSeats(value)`: Accept only a positive safe integer written as decimal digits; invalid values return null.
- `validRegistration(value)`: Registration numbers contain exactly two digits, three letters and four digits; ignore case and edge whitespace.
- `uniqueMembers(members)`: Deduplicate members by normalised email while preserving the first original record.
- `validateCoordinates(lat, lon)`: Latitude is in [-90,90], longitude in [-180,180]; both must be finite numbers.
- `requiredFields(record, fields)`: Return missing field names; numeric zero and boolean false are present values.

## Catalog

- `searchEvents(events, query)`: Search name, description and tags, case-insensitively; blank query returns all.
- `filterByTag(events, tags)`: An event must match ALL selected tags; no tags means no filtering; tag matching ignores case.
- `sortByStart(events)`: Return events by ascending start instant without changing the input array.
- `paginate(items, page, size)`: Pages are one-based; return at most size items; pages beyond the data are empty.
- `availableEvents(events, bookings)`: Availability counts only confirmed seats, never waitlisted or cancelled seats.
- `registrationOpen(event, now)`: Registration is open at opensAt and closed at closesAt; compare absolute instants.
- `findEvent(events, id)`: Find by trimmed case-insensitive ID, returning null for an unknown ID.
- `distinctTags(events)`: Return sorted unique lowercase tags across all events.

## Booking

- `occupiedSeats(bookings, eventId)`: Sum only confirmed seats for the requested event.
- `canReserve(capacity, occupied, requested)`: Positive whole-seat requests may exactly fill remaining capacity.
- `cancelBooking(bookings, id)`: Cancel only the matching booking; retain every other record and do not mutate the input.
- `promoteWaitlist(bookings, eventId, free)`: Scan waitlist in input order, skip non-fitting parties, and never promote beyond free seats.
- `duplicateBooking(bookings, eventId, email)`: A same-event, normalised-email booking blocks duplicates unless cancelled.
- `remainingSeats(capacity, occupied)`: Remaining capacity never becomes negative.
- `eventBookings(bookings, eventId)`: Scope the booking list by eventId, not booking ID.
- `teamReady(members, minimum)`: Team readiness requires enough distinct members and acceptance from every member.

## Pricing

- `subtotal(items)`: Line subtotal is unit paise times quantity, summed across all items.
- `discountAmount(amount, percent)`: Clamp percentage to 0..100 and round the calculated discount to integer paise.
- `couponValid(coupon, now, amount)`: Coupons require active=true, startsAt <= now < expiresAt and subtotal >= minimum.
- `taxAmount(netPaise, rateBps)`: Tax basis points use 10000 = 100%; round once to integer paise.
- `totalDue(subtotalPaise, discountPaise, taxPaise)`: Clamp subtotal less discount at zero, then add tax.
- `refundAmount(paidPaise, hoursBefore)`: Refund is 100% at >=48 hours, floor(50%) at >=24 hours, otherwise zero.
- `splitCost(totalPaise, people)`: Split integer paise evenly; assign one extra paise to the first remainder people.
- `formatINR(paise)`: Display paise as rupees with exactly two decimal places.

## Inventory

- `availableQuantity(item)`: Available equipment excludes reserved and damaged units, clamped at zero.
- `reserveItems(items, id, quantity)`: Add a validated reservation to existing reserved quantity for the matching item.
- `releaseItems(items, id, quantity)`: Release reserved quantity without going below zero.
- `lowStock(items, threshold)`: An item is low stock when usable availability is at or below the threshold.
- `bomRequirements(bom, teams)`: Bill-of-materials demand equals per-team quantity multiplied by team count.
- `canFulfill(items, requirements)`: Every requirement must have enough available units; an empty requirement list is fulfillable.
- `restock(items, id, quantity)`: Add delivered units to existing stock; preserve other records.
- `equipmentCost(requirements, items)`: Equipment cost sums unit paise times required quantity; unknown items contribute zero.

## Schedule

- `overlaps(a, b)`: Use half-open intervals: adjacent sessions do not overlap.
- `durationMinutes(start, end)`: Return elapsed minutes across date boundaries, using the explicit time-zone offsets.
- `sortSessions(sessions)`: Sort by absolute instant rather than the written local date/time.
- `conflicts(sessions)`: Return each same-venue overlapping pair once in input order.
- `minutesUntil(start, now)`: Countdown rounds any positive partial minute up and clamps past sessions to zero.
- `withinWindow(session, window)`: The entire session must fit inside the window; equal endpoints are allowed.
- `shiftSession(session, minutes)`: Shift both start and end by minutes, preserving duration and extra fields.
- `dayIndex(start, eventStart)`: Event days are one-based elapsed 24-hour blocks measured from event start.

## Telemetry

- `mean(values)`: Arithmetic mean; an empty series returns zero.
- `peak(values)`: Maximum sample; an empty series returns zero.
- `movingAverage(values, window)`: Trailing moving average includes the current point and at most window-1 preceding points.
- `integrateDistance(samples)`: Trapezoidal speed integration converts millisecond intervals to seconds; output is metres.
- `batteryPercent(voltage, minimum, maximum)`: Use linear interpolation between supplied min/max voltages, clamp to 0..100 and round.
- `verticalVelocity(samples)`: Successive altitude differences divided by positive elapsed seconds; nonpositive intervals yield zero.
- `outliers(values, threshold)`: Flag deviations strictly beyond threshold on either side of the mean; retain original indexes.
- `downsample(values, stride)`: Keep indexes 0, stride, 2*stride, and so on for a positive integer stride.

## Analytics

- `revenue(bookings)`: Revenue includes paidPaise of confirmed bookings only.
- `occupancyPercent(occupied, capacity)`: Occupied seats divided by capacity as a rounded percentage; zero capacity gives zero.
- `uniqueParticipants(bookings)`: Count distinct normalised emails across confirmed bookings.
- `groupByEvent(bookings)`: Group all bookings under eventId, preserving record order.
- `completionPercent(done, total)`: Task completion is rounded and clamped to 0..100; nonpositive total gives zero.
- `median(values)`: Numeric median; even-length lists average the two central values; empty gives zero.
- `topEvents(events, totals, limit)`: Rank by descending totals; break ties by ascending ID and limit result length.
- `csvCell(value)`: CSV cells containing quotes, commas or newlines are quoted and internal quotes doubled.

## Storage

- `parseSnapshot(raw, fallback)`: Only object snapshots are accepted; invalid JSON, arrays, null and primitives use a cloned fallback.
- `migrateSnapshot(snapshot)`: Migrate v1 quantity to v2 seats, preserving an existing seats value and every unrelated field.
- `upsertById(records, record)`: Merge updates by ID with incoming fields winning; append unknown IDs; preserve unrelated fields.
- `removeById(records, id)`: Remove only the requested ID and clone retained records.
- `cacheFresh(entry, nowMs, ttlMs)`: Freshness is 0 <= age < TTL; future-dated entries are not fresh.
- `patchPreferences(current, patch)`: Only theme, pageSize and eventId can be patched; explicit falsy values are retained.
- `mergeSnapshots(local, incoming)`: Merge by ID, choosing the greatest numeric updatedAt; incoming wins ties; preserve first-seen ID order.
- `retainAudit(entries, limit)`: Keep the last limit audit entries in chronological input order; nonpositive limit gives empty.

## Integration rules

Booking creation validates the email, registration number and requested seats, rejects active duplicates, checks registration hours, assigns confirmed or waitlisted status according to remaining capacity, and quotes the ticket price. Cancellation affects only its target and then promotes fitting waitlisted parties in stored order. Writes are serialised and saved atomically. A process restart preserves committed data.

Quotes apply an eligible coupon to subtotal, then tax to the discounted net; demo tax is 500 basis points. Inventory reservations must not exceed usable stock, and a request must fit in full. Schedule entries use explicit ISO dates and include overnight sessions. No real booking, payment, student record, hardware control or email is involved.

The UI exposes the event catalogue, bookings, price breakdown, equipment, schedule, telemetry and dashboard. The diagnostics workbench lets you exercise the exported domain operations with JSON arguments; it is a local developer aid, not an authenticated production API. Mutation of real state occurs only through the documented write routes.
