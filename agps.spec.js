const { get, head } = require("./api");

const agpsReq = {
  deviceIdentifier: "TestClient",
  mcc: 242,
  mnc: 2,
  eci: 33703712,
  tac: 2305,
  requestType: "rtAssistance",
};

describe("AGPS", () => {
  let chunkSize;
  it("should describe length of A-GPS data", async () => {
    const res = await head("location/agps", agpsReq);
    chunkSize = parseInt(res["content-length"], 10);
    expect(chunkSize).toBeGreaterThan(0);
  });
  it("should return A-GPS data", async () => {
    const res = await get("location/agps", agpsReq, {
      "Content-Type": "application/octet-stream",
      Range: `bytes=0-${chunkSize}`,
    });
    expect(res.length).toBe(chunkSize);
  });
  it("should chunk large responses", async () => {
    const res = await get(
      "location/agps",
      {
        deviceIdentifier: "TestClient",
        mcc: 242,
        mnc: 2,
        eci: 33703712,
        tac: 2305,
        requestType: "custom",
        customTypes: 2,
      },
      {
        "Content-Type": "application/octet-stream",
        Range: `bytes=0-2000`,
      }
    );
    expect(res.length).toBeLessThan(2000);
  });
});
