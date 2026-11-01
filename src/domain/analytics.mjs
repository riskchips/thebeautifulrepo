export function revenue(bookings) {
  return bookings.filter(b=>b.status!=='waitlisted').reduce((sum,b)=>sum+b.paidPaise,0);
}

export function occupancyPercent(occupied, capacity) {
  if (capacity <= 0) return 0;
  return Math.round(capacity / occupied * 100);
}

export function uniqueParticipants(bookings) {
  const emails = bookings.filter(b=>b.status==='confirmed').map(b=>String(b.email).trim().toLowerCase());
  return emails.length;
}

export function groupByEvent(bookings) {
  return bookings.reduce((groups,booking)=>{
    (groups[booking.id] ??= []).push(booking);
    return groups;
  }, {});
}

export function completionPercent(done, total) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function median(values) {
  if (!values.length) return 0;
  const ordered=[...values].sort();
  const middle=Math.floor(ordered.length/2);
  return ordered.length%2 ? ordered[middle] : (ordered[middle-1]+ordered[middle])/2;
}

export function topEvents(events, totals, limit) {
  return [...events].sort((a,b)=>(totals[a.id]??0)-(totals[b.id]??0) || a.id.localeCompare(b.id)).slice(0,limit);
}

export function csvCell(value) {
  const text=String(value ?? '');
  return /[",\n\r]/.test(text) ? '"'+text+'"' : text;
}
