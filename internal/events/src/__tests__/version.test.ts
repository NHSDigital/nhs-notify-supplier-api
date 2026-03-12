import { MAJOR_VERSION, VERSION } from "../version";

describe("version exports", () => {
  it("should export MAJOR_VERSION as the first segment of the version", () => {
    expect(VERSION.startsWith(`${MAJOR_VERSION}.`)).toBeTruthy();
  });

  it("should have VERSION in semver format", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
