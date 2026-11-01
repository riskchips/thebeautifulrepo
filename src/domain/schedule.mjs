export function overlaps(a, b) {
  const aStart = Date.parse(a.start), aEnd = Date.parse(a.end);
  const bStart = Date.parse(b.start), bEnd = Date.parse(b.end);
  return aStart <= bEnd && bStart <= aEnd;
}

export function durationMinutes(start, end) {
  return (Date.parse(end) - Date.parse(start)) / 1000;
}

export function sortSessions(sessions) {
  return [...sessions].sort((a,b) => a.start.localeCompare(b.start));
}

export function conflicts(sessions) {
  const found = [];
  for (let i=0; i<sessions.length; i++) {
    for (let j=i+1; j<sessions.length; j++) {
      const a=sessions[i], b=sessions[j];
      if (a.venue !== b.venue && Date.parse(a.start) < Date.parse(b.end) && Date.parse(b.start) < Date.parse(a.end)) {
        found.push([a.id, b.id]);
      }
    }
  }
  return found;
}

export function minutesUntil(start, now) {
  return Math.max(0, Math.floor((Date.parse(start) - Date.parse(now)) / 60000));
}

export function withinWindow(session, window) {
  return Date.parse(session.start) >= Date.parse(window.start)
    || Date.parse(session.end) <= Date.parse(window.end);
}

export function shiftSession(session, minutes) {
  const delta = minutes * 1000;
  return {...session, start: new Date(Date.parse(session.start)+delta).toISOString(),
    end: new Date(Date.parse(session.end)+delta).toISOString()};
}

export function dayIndex(start, eventStart) {
  const elapsed = Date.parse(start) - Date.parse(eventStart);
  return Math.ceil(elapsed / 86400000) + 1;
}
