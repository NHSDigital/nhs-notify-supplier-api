import populateStandardBreaches from "../handler/populate-standard-breaches";

describe("populateStandardBreaches", () => {
  it("returns a success result", async () => {
    const result = await populateStandardBreaches({ date: "2026-10-08" });

    expect(result).toEqual({
      status: "SUCCESS",
      message: "populate-standard-breaches invoked successfully",
    });
  });
});
