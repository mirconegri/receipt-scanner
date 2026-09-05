/** Generates a locally-unique id (timestamp + random suffix). These ids
 * never leave the device and are never used for anything security
 * sensitive, so a full UUID/crypto dependency would be overkill. */
export function generateId(prefix = 'id'): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
