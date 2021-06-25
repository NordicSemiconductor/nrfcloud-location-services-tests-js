const { get } = require("./api");

describe.only("SCELL", () => {
  it.each([
    [
      {
        mcc: 242,
        mnc: 2,
        tac: 2305,
        eci: 33703712,
      },
      { 
        "alt": 0,
         "lat": 63.418229,
         "lon": 10.406106,
         "uncertainty": 4133, },
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
