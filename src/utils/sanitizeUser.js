function isPlainObject(val) {
  return val !== null && typeof val === "object" && val.constructor === Object;
}

export function stripPasswordHash(obj) {
  if (Array.isArray(obj)) return obj.map(stripPasswordHash);
  if (!isPlainObject(obj)) return obj; // Dates, Decimals, null, primitives — pass through untouched

  const clone = { ...obj };
  delete clone.passwordHash;
  for (const key in clone) {
    clone[key] = stripPasswordHash(clone[key]);
  }
  return clone;
}