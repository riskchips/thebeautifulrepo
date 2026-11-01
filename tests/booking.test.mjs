import test from 'node:test';
import assert from 'node:assert/strict';
import * as booking from '../src/domain/booking.mjs';
import {cancel} from '../src/services.mjs';

test('booking operations preserve cancellation and capacity contracts', async t => {
  const bookings = [
    {id: 'target', eventId: 'rovaris', seats: 2, status: 'confirmed'},
    {id: 'other', eventId: 'rovaris', seats: 3, status: 'confirmed'},
    {id: 'wait', eventId: 'rovaris', seats: 2, status: 'waitlisted'},
    {id: 'elsewhere', eventId: 'aerovate', seats: 1, status: 'confirmed'}
  ];

  await t.test('cancels only the matching booking without mutating input', () => {
    const result = booking.cancelBooking(bookings, 'target');
    assert.deepEqual(result.map(record => record.status), ['cancelled', 'confirmed', 'waitlisted', 'confirmed']);
    assert.equal(bookings[0].status, 'confirmed');
    assert.equal(result[1].id, bookings[1].id);
  });

  await t.test('occupied seats count confirmed bookings only', () => {
    assert.equal(booking.occupiedSeats(bookings, 'rovaris'), 5);
  });

  await t.test('allows a reservation to exactly fill event capacity', () => {
    assert.equal(booking.canReserve(10, 7, 3), true);
    assert.equal(booking.canReserve(10, 7, 4), false);
  });

  await t.test('waitlist promotion consumes remaining seats and scopes results by event', () => {
    const candidates = [
      {id: 'too-large', eventId: 'rovaris', seats: 4, status: 'waitlisted'},
      {id: 'fits', eventId: 'rovaris', seats: 2, status: 'waitlisted'},
      {id: 'next', eventId: 'rovaris', seats: 2, status: 'waitlisted'},
      {id: 'other-event', eventId: 'aerovate', seats: 1, status: 'confirmed'}
    ];
    const promoted = booking.promoteWaitlist(candidates, 'rovaris', 3);
    assert.deepEqual(promoted.map(record => record.status), ['waitlisted', 'confirmed', 'waitlisted', 'confirmed']);
    assert.deepEqual(booking.eventBookings(candidates, 'rovaris').map(record => record.id), ['too-large', 'fits', 'next']);
  });

  await t.test('cancelling a waitlisted booking does not promote other waitlisted bookings', () => {
    const state = {
      events: [{id: 'rovaris', capacity: 4}],
      bookings: [
        {id: 'confirmed', eventId: 'rovaris', seats: 2, status: 'confirmed'},
        {id: 'cancelled-waitlist', eventId: 'rovaris', seats: 2, status: 'waitlisted'},
        {id: 'still-waitlisted', eventId: 'rovaris', seats: 2, status: 'waitlisted'}
      ],
      coupons: [],
      clock: '2027-01-10T10:00:00+05:30'
    };

    cancel(state, 'cancelled-waitlist');
    assert.deepEqual(state.bookings.map(record => record.status), ['confirmed', 'cancelled', 'waitlisted']);
  });

  await t.test('cancelling a confirmed booking promotes a waitlisted party that fits free seats', () => {
    const state = {
      events: [{id: 'rovaris', capacity: 7, pricePaise: 25000}],
      bookings: [
        {id: 'cancel-confirmed', eventId: 'rovaris', seats: 3, status: 'confirmed', paidPaise: 78750},
        {id: 'keep-confirmed', eventId: 'rovaris', seats: 3, status: 'confirmed', paidPaise: 78750},
        {id: 'fits', eventId: 'rovaris', seats: 4, status: 'waitlisted', paidPaise: 0},
        {id: 'does-not-fit-after-first', eventId: 'rovaris', seats: 1, status: 'waitlisted', paidPaise: 0}
      ],
      coupons: [],
      clock: '2027-01-10T10:00:00+05:30'
    };

    cancel(state, 'cancel-confirmed');
    assert.deepEqual(state.bookings.map(record => record.status), ['cancelled', 'confirmed', 'confirmed', 'waitlisted']);
    assert.equal(state.bookings[2].paidPaise, 105000);
  });

  await t.test('cancelling a confirmed booking leaves waitlist parties that exceed free seats waiting', () => {
    const state = {
      events: [{id: 'rovaris', capacity: 10, pricePaise: 25000}],
      bookings: [
        {id: 'cancel-confirmed', eventId: 'rovaris', seats: 2, status: 'confirmed', paidPaise: 52500},
        {id: 'keep-confirmed', eventId: 'rovaris', seats: 7, status: 'confirmed', paidPaise: 183750},
        {id: 'too-large', eventId: 'rovaris', seats: 4, status: 'waitlisted', paidPaise: 0}
      ],
      coupons: [],
      clock: '2027-01-10T10:00:00+05:30'
    };

    cancel(state, 'cancel-confirmed');
    assert.deepEqual(state.bookings.map(record => record.status), ['cancelled', 'confirmed', 'waitlisted']);
  });
});
