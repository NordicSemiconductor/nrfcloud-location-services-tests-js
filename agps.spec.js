const { get } = require("./api");

describe("AGPS", () => {
  it.only("should return A-GPS data", async () => {
    const res = await get(
      "location/agps",
      {
        deviceIdentifier: "TestClient",
        mcc: 242,
        mnc: 2,
        eci: 33703712,
        tac: 2305,
        requestType: "rtAssistance",
      },
      {
        "Content-Type": "application/octet-stream",
        Range: "bytes=0-500",
      }
    );
    expect(res.length).toBeGreaterThan(0);
  });
});
