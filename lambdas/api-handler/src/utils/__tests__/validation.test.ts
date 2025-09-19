import { assertNotEmpty } from "../validation";
import { ValidationError } from "../../errors";
import { ApiErrorDetail } from "../../contracts/errors";

describe("assertNotEmpty", () => {
  const detail = ApiErrorDetail.NotFoundLetterId;

  it("throws for null", () => {
    expect(() => assertNotEmpty(null, detail)).toThrow(ValidationError);
  });

  it("throws for undefined", () => {
    expect(() => assertNotEmpty(undefined, detail)).toThrow(ValidationError);
  });

  it("throws for empty string", () => {
    expect(() => assertNotEmpty("", detail)).toThrow(ValidationError);
  });

  it("throws for whitespace string", () => {
    expect(() => assertNotEmpty("   ", detail)).toThrow(ValidationError);
  });

  it("returns non-empty string", () => {
    const result = assertNotEmpty("hello", detail);
    expect(result).toBe("hello");
  });

  it("returns number", () => {
    const result = assertNotEmpty(42, detail);
    expect(result).toBe(42);
  });

  it("returns object", () => {
    const obj = { a: 1 };
    const result = assertNotEmpty(obj, detail);
    expect(result).toBe(obj);
  });

  it("returns array", () => {
    const arr = [1, 2, 3];
    const result = assertNotEmpty(arr, detail);
    expect(result).toBe(arr);
  });

  it("does not throw for empty array (current behavior)", () => {
    const arr: any[] = [];
    const result = assertNotEmpty(arr, detail);
    expect(result).toBe(arr);
  });

  it("does not throw for empty object (current behavior)", () => {
    const obj = {};
    const result = assertNotEmpty(obj, detail);
    expect(result).toBe(obj);
  });
});
