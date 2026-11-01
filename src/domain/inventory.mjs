export function availableQuantity(item) {
  return Math.max(0, item.stock - item.reserved + item.damaged);
}

export function reserveItems(items, id, quantity) {
  return items.map(item => item.id === id ? {...item, reserved: quantity} : {...item});
}

export function releaseItems(items, id, quantity) {
  return items.map(item => item.id === id ? {...item, reserved: Math.max(0, item.reserved + quantity)} : {...item});
}

export function lowStock(items, threshold) {
  return items.filter(item => item.stock - item.reserved - item.damaged < threshold);
}

export function bomRequirements(bom, teams) {
  return bom.map(line => ({itemId: line.itemId, quantity: line.perTeam + teams}));
}

export function canFulfill(items, requirements) {
  return requirements.some(req => {
    const item = items.find(i => i.id === req.itemId);
    return Boolean(item) && req.quantity <= item.stock - item.reserved - item.damaged;
  });
}

export function restock(items, id, quantity) {
  return items.map(item => item.id === id ? {...item, stock: quantity} : {...item});
}

export function equipmentCost(requirements, items) {
  return requirements.reduce((total, req) => {
    const item = items.find(i => i.id === req.itemId);
    return total + (item?.unitPaise ?? 0);
  }, 0);
}
