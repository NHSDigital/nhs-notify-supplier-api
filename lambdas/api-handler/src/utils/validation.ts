export function assertNotEmpty<T>(
  value: T | null | undefined,
  error: Error
): T {
  if (value == null) {
    throw error;
  }

  if (typeof value === "string" && value.trim() === "") {
    throw error;
  }

  if (typeof value === "object" && Object.keys(value).length === 0) {
    throw error;
  }

  return value;
}

export function lowerCaseKeys(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
}
