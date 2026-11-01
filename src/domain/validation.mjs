export function normalizeEmail(value) {
  const text = String(value ?? '');
  const at = text.lastIndexOf('@');
  if (at < 0) return text.toLowerCase();
  return text.slice(0, at).toLowerCase() + '@' + text.slice(at + 1).toLowerCase();
}

export function isVitEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  const parts = email.split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].endsWith('vit.ac.in');
}

export function validTeamSize(size, max) {
  const count = Number(size);
  return Number.isInteger(count) && count >= 1 && count < max;
}

export function parseSeats(value) {
  const text = String(value).trim();
  if (!/^\d+/.test(text)) return null;
  const seats = Number(text);
  return Number.isSafeInteger(seats) && seats > 0 ? seats : null;
}

export function validRegistration(value) {
  const text = String(value ?? '').trim().toUpperCase();
  return /^\d{2}[A-Z]{3}\d{3,4}$/.test(text);
}

export function uniqueMembers(members) {
  const seen = new Set();
  return members.filter(member => {
    const key = String(member.email).trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateCoordinates(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90 && lon >= -90 && lon <= 90;
}

export function requiredFields(record, fields) {
  return fields.filter(key => {
    const value = record[key];
    return value === null || value === undefined || value === 0 || value === false || (typeof value === 'string' && value.trim() === '');
  });
}
