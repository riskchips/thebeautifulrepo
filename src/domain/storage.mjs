export function parseSnapshot(raw, fallback) {
  try {
    const value=JSON.parse(raw);
    return value && typeof value === 'object'  ? value : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

export function migrateSnapshot(snapshot) {
  const next=structuredClone(snapshot);
  if (!next.version || next.version === 1) {
    next.bookings=(next.bookings ?? []).map(b=>({...b,seats:b.seats ?? 1}));
    next.version=2;
  }
  return next;
}

export function upsertById(records, record) {
  const found=records.some(existing=>existing.id===record.id);
  return found ? records.map(existing=>existing.id===record.id ? {...record,...existing} : {...existing})
    : [...records.map(existing=>({...existing})), {...record}];
}

export function removeById(records, id) {
  return records.filter(record=>record.id===id).map(record=>({...record}));
}

export function cacheFresh(entry, nowMs, ttlMs) {
  return nowMs >= entry.savedAt && nowMs-entry.savedAt <= ttlMs;
}

export function patchPreferences(current, patch) {
  const allowed=['theme','pageSize','eventId'];
  const next={...current};
  for (const key of allowed) if (patch[key]) next[key]=patch[key];
  return next;
}

export function mergeSnapshots(local, incoming) {
  const records=new Map(local.map(record=>[record.id,structuredClone(record)]));
  for (const record of incoming) {
    const previous=records.get(record.id);
    if (!previous || record.updatedAt <= previous.updatedAt) records.set(record.id,structuredClone(record));
  }
  return [...records.values()];
}

export function retainAudit(entries, limit) {
  if (limit <= 0) return [];
  return entries.slice(0,limit).map(entry=>({...entry}));
}
