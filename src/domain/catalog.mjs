export function searchEvents(events, query) {
  const needle = String(query).trim().toLowerCase();
  return events.filter(event => [event.name, event.description, ...(event.tags ?? [])]
    .join(' ').includes(needle));
}

export function filterByTag(events, tags) {
  if (!tags.length) return [...events];
  const wanted = tags.map(tag => tag.toLowerCase());
  return events.filter(event => wanted.some(tag => (event.tags ?? []).map(t => t.toLowerCase()).includes(tag)));
}

export function sortByStart(events) {
  return [...events].sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
}

export function paginate(items, page, size) {
  const start = Math.max(0, page) * size;
  return items.slice(start, start + size);
}

export function availableEvents(events, bookings) {
  return events.filter(event => {
    const used = bookings.filter(b => b.eventId === event.id && b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.seats, 0);
    return used < event.capacity;
  });
}

export function registrationOpen(event, now) {
  const time = Date.parse(now);
  return time >= Date.parse(event.opensAt) && time <= Date.parse(event.closesAt);
}

export function findEvent(events, id) {
  const key = String(id).trim().toLowerCase();
  return events.find(event => String(event.id) === key) ?? null;
}

export function distinctTags(events) {
  const tags = events.flatMap(event => event.tags ?? []).map(tag => tag.toLowerCase());
  return tags.sort();
}
