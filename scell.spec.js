const { get } = require("./api");

describe("SCELL", () => {
  it.each([
    [
      {
        mcc: 242,
        mnc: 2,
        tac: 2305,
        eci: 33703712,
      },
      {
        lat: 63.418807,
        lon: 10.412916,
        uncertainty: 4476,
      },
    ],
  ])("should resolve %j to %j", async (cell, expectedLocation) => {
    expect(
      await get("location/single-cell", {
        ...cell,
        deviceIdentifier: "TestClient",
        format: "json",
      })
    ).toMatchObject(expectedLocation);
  });
});
