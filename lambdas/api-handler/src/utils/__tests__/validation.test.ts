import { ValidationError } from "../../errors";
import { assertNotEmpty, lowerCaseKeys, validateIso8601Timestamp } from "../validation";

describe("assertNotEmpty", () => {
  const error = new Error();

  it("throws for null", () => {
    expect(() => assertNotEmpty(null, error)).toThrow(Error);
  });

  it("throws for undefined", () => {
    expect(() => assertNotEmpty(undefined, error)).toThrow(Error);
  });

  it("throws for empty string", () => {
    expect(() => assertNotEmpty("", error)).toThrow(Error);
  });

  it("throws for whitespace string", () => {
    expect(() => assertNotEmpty("   ", error)).toThrow(Error);
  });

    it("does not throw for empty array", () => {
    const arr: any[] = [];
    expect(() => assertNotEmpty(arr, error)).toThrow(Error);

  });

  it("does not throw for empty object", () => {
    const obj = {};
    expect(() => assertNotEmpty(obj, error)).toThrow(Error);
  });

  it("returns non-empty string", () => {
    const result = assertNotEmpty("hello", error);
    expect(result).toBe("hello");
  });

  it("returns number", () => {
    const result = assertNotEmpty(42, error);
    expect(result).toBe(42);
  });

  it("returns object", () => {
    const obj = { a: 1 };
    const result = assertNotEmpty(obj, error);
    expect(result).toBe(obj);
  });

  it("returns array", () => {
    const arr = [1, 2, 3];
    const result = assertNotEmpty(arr, error);
    expect(result).toBe(arr);
  });
});

describe("lowerCaseKeys", () => {
  it("lowers case on header keys", () => {
    const headers: Record<string, number> = {'Aa_Bb-Cc':1, 'b':2};
    const result = lowerCaseKeys(headers);
    expect(result).toEqual({'aa_bb-cc':1, 'b':2});
  });

  it("handles empty input", () => {
    const result = lowerCaseKeys({});
    expect(result).toEqual({});
  });
});

describe('validateIso8601Timestamp', () => {
  it.each([['2025-10-16T00:00:00.000Z'], ['2025-10-16T00:00:00Z'], ['2025-10-16T00:00:00.0Z'], ['2025-10-16T00:00:00.999999Z']])
    ('permits valid timestamps', (timestamp: string) => {
    validateIso8601Timestamp(timestamp);
  });

  it.each([['not a date string'], ['2025-10-16T00:00:00'], ['2025-16-10T00:00:00Z'], ['2025-02-31T00:00:00Z']])
    ('rejects invalid timestamps', (timestamp: string) => {
    expect(() => validateIso8601Timestamp(timestamp)).toThrow(ValidationError);
  });

});
