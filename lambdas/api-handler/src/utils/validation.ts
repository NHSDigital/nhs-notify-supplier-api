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
