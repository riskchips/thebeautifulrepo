import {randomUUID} from 'node:crypto';
import {validation as v,catalog as c,booking as b,pricing as p,inventory as i,schedule as s,telemetry as t,analytics as a,storage as st} from './registry.mjs';
export class InputError extends Error { constructor(message,status=400){super(message);this.status=status;} }
export function requireText(value,label,max=200) {
  if(typeof value!=='string'||!value.trim()||value.length>max) throw new InputError(`${label} must be a nonempty string (max ${max} characters).`);
  return value;
}
export function integer(value,label,min=1,max=10000) {
  if(!Number.isInteger(value)||value<min||value>max) throw new InputError(`${label} must be an integer from ${min} to ${max}.`);
  return value;
}
export function getEvent(state,id) {
  const event=c.findEvent(state.events,requireText(id,'Event ID'));
  if(!event) throw new InputError('Event not found.',404);
  return event;
}
export function quote(state,event,seats,couponCode='') {
  const sub=p.subtotal([{unitPaise:event.pricePaise,quantity:seats}]);
  const coupon=state.coupons.find(coupon=>coupon.code===String(couponCode).trim().toUpperCase());
  const eligible=coupon&&p.couponValid(coupon,state.clock,sub);
  const discount=eligible?p.discountAmount(sub,coupon.percent):0;
  const tax=p.taxAmount(Math.max(0,sub-discount),500);
  const total=p.totalDue(sub,discount,tax);
  return {subtotalPaise:sub,discountPaise:discount,taxPaise:tax,totalPaise:total,formatted:p.formatINR(total),couponApplied:eligible?coupon.code:null,split:p.splitCost(total,seats)};
}
export function createBooking(state,input) {
  const missing=v.requiredFields(input,['eventId','name','email','registration','seats']);
  if(missing.length) throw new InputError('Missing fields: '+missing.join(', '));
  const event=getEvent(state,input.eventId);
  requireText(input.name,'Name',80);requireText(input.email,'Email',120);requireText(input.registration,'Registration',20);
  const seats=v.parseSeats(input.seats);
  if(seats===null||!v.validTeamSize(seats,event.maxTeam)) throw new InputError('Invalid number of seats for this event.');
  const email=v.normalizeEmail(input.email);
  if(!v.isVitEmail(email)||!v.validRegistration(input.registration)) throw new InputError('Use a valid VIT email and registration number.');
  if(!c.registrationOpen(event,state.clock)) throw new InputError('Registration is closed.',409);
  if(b.duplicateBooking(state.bookings,event.id,email)) throw new InputError('This email already has an active booking for the event.',409);
  const occupied=b.occupiedSeats(state.bookings,event.id);
  const status=b.canReserve(event.capacity,occupied,seats)?'confirmed':'waitlisted';
  const price=quote(state,event,seats,input.coupon);
  const record={id:randomUUID(),eventId:event.id,name:input.name.trim(),email,registration:input.registration.trim().toUpperCase(),seats,status,paidPaise:status==='confirmed'?price.totalPaise:0,updatedAt:Date.now()};
  state.bookings=st.upsertById(state.bookings,record);
  return {record,quote:price};
}
export function cancel(state,id) {
  const target=state.bookings.find(x=>x.id===id);
  if(!target) throw new InputError('Booking not found.',404);
  const event=getEvent(state,target.eventId);
  state.bookings=b.cancelBooking(state.bookings,id);
  const free=b.remainingSeats(event.capacity,b.occupiedSeats(state.bookings,event.id));
  const previous=new Map(state.bookings.map(x=>[x.id,x.status]));
  state.bookings=b.promoteWaitlist(state.bookings,event.id,free).map(record=>{
    if(previous.get(record.id)==='waitlisted'&&record.status==='confirmed') return {...record,paidPaise:quote(state,event,record.seats).totalPaise,updatedAt:Date.now()};
    return record;
  });
  return {bookings:b.eventBookings(state.bookings,event.id)};
}
export function dashboard(state) {
  const totals=Object.fromEntries(state.events.map(event=>[event.id,b.occupiedSeats(state.bookings,event.id)]));
  const events=state.events.map(event=>({...event,occupied:totals[event.id],remaining:b.remainingSeats(event.capacity,totals[event.id]),occupancy:a.occupancyPercent(totals[event.id],event.capacity),open:c.registrationOpen(event,state.clock)}));
  return {clock:state.clock,events,revenuePaise:a.revenue(state.bookings),participants:a.uniqueParticipants(state.bookings),medianParty:a.median(state.bookings.filter(x=>x.status==='confirmed').map(x=>x.seats)),top:a.topEvents(state.events,totals,3),groups:a.groupByEvent(state.bookings),audit:state.audit,preferences:state.preferences};
}
export function equipment(state,eventId,teams) {
  const requirements=i.bomRequirements(state.bom[eventId]??[],teams);
  return {items:state.inventory.map(item=>({...item,available:i.availableQuantity(item)})),low:i.lowStock(state.inventory,2),requirements,canFulfill:i.canFulfill(state.inventory,requirements),costPaise:i.equipmentCost(requirements,state.inventory)};
}
export function timeline(state,eventId) {
  const event=getEvent(state,eventId);
  const sessions=state.sessions.filter(x=>x.eventId===event.id);
  return {conflicts:s.conflicts(sessions),sessions:s.sortSessions(sessions).map(session=>({...session,duration:s.durationMinutes(session.start,session.end),day:s.dayIndex(session.start,event.start),countdown:s.minutesUntil(session.start,state.clock),withinWindow:s.withinWindow(session,event)}))};
}
export function telemetryReport(state) {
  const samples=state.telemetry,speeds=samples.map(x=>x.speed),altitudes=samples.map(x=>x.altitude);
  return {samples,meanSpeed:t.mean(speeds),peakAltitude:t.peak(altitudes),smoothed:t.movingAverage(speeds,3),distance:t.integrateDistance(samples),battery:t.batteryPercent(11.1,9,12.6),verticalVelocity:t.verticalVelocity(samples),outliers:t.outliers(speeds,2),preview:t.downsample(samples,2)};
}
