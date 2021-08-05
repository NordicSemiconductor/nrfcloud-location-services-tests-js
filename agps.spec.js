const api = require("./api");

const get = api.get(process.env.AGPS_SERVICE_KEY, {
  aud: process.env.TEAM_ID,
});

const head = api.head(process.env.AGPS_SERVICE_KEY, {
  aud: process.env.TEAM_ID,
});

describe("AGPS", () => {
  describe("chunking", () => {
    describe("use HEAD request to get response size", () => {
      const agpsReq = {
        deviceIdentifier: "TestClient",
        mcc: 242,
        mnc: 2,
        eci: 33703712,
        tac: 2305,
        requestType: "rtAssistance",
      };
      let chunkSize;

      it("should describe length of A-GPS data", async () => {
        const res = await head("location/agps", agpsReq, undefined);
        chunkSize = parseInt(res["content-length"], 10);
        expect(chunkSize).toBeGreaterThan(0);
      });

      it("should return A-GPS data", async () => {
        expect(chunkSize).toBeGreaterThan(0); // chunk size should have been set
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

    it("should chunk large responses", async () => {
      const res = await get(
        "location/agps",
        {
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

  describe("should support 9 types", () => {
    it.each([[1], [2], [3], [4], [5], [6], [7], [8], [9]])(
      "should resolve custom type %d",
      async (type) => {
        const res = await get(
          "location/agps",
          {
            mcc: 242,
            mnc: 2,
            eci: 33703712,
            tac: 2305,
            requestType: "custom",
            customTypes: type,
          },
          {
            "Content-Type": "application/octet-stream",
            Range: `bytes=0-2000`,
          }
        );
        expect(res.length).toBeGreaterThan(0);
      }
    );
  });
});
