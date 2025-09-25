import { assertNotEmpty } from "../validation";

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
