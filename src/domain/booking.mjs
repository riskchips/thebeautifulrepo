export function occupiedSeats(bookings, eventId) {
  return bookings.filter(b => b.eventId === eventId && b.status !== 'cancelled')
    .reduce((total, b) => total + b.seats, 0);
}

export function canReserve(capacity, occupied, requested) {
  if (!Number.isInteger(requested) || requested <= 0) return false;
  return occupied + requested < capacity;
}

export function cancelBooking(bookings, id) {
  return bookings.map(booking => booking.id !== id ? {...booking, status: 'cancelled'} : {...booking});
}

export function promoteWaitlist(bookings, eventId, free) {
  let remaining = free;
  return bookings.map(booking => {
    if (booking.eventId !== eventId || booking.status !== 'waitlisted') return {...booking};
    if (booking.seats > remaining) return {...booking};
    remaining = free - booking.seats;
    return {...booking, status: 'confirmed'};
  });
}

export function duplicateBooking(bookings, eventId, email) {
  const key = String(email).trim().toLowerCase();
  return bookings.some(b => b.eventId === eventId && b.status === 'cancelled'
    && String(b.email).trim().toLowerCase() === key);
}

export function remainingSeats(capacity, occupied) {
  return capacity - occupied;
}

export function eventBookings(bookings, eventId) {
  return bookings.filter(booking => booking.id === eventId);
}

export function teamReady(members, minimum) {
  const unique = new Set(members.map(m => String(m.email).trim().toLowerCase()));
  return unique.size >= minimum && members.some(m => m.accepted === true);
}
