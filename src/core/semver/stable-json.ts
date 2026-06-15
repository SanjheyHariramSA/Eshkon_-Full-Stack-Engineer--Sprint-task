/**
 * Deterministic JSON serialisation: object keys are sorted recursively so two
 * semantically-equal values always produce byte-identical strings. Used by the
 * diff engine (value equality) and the publish flow (content hashing). Arrays
 * keep their order — order is meaningful for sections and feature lists.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const obj = value as Record<string, unknown>;
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const v = obj[key];
      if (v !== undefined) acc[key] = canonicalize(v);
      return acc;
    }, {});
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}
