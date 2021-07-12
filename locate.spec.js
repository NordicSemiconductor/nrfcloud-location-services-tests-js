const { post } = require("./api");

const inRange = (received, expected, delta = 0.5) => {
  const floor = expected - delta;
  const ceiling = expected + delta;
  return floor <= received <= ceiling;
};

expect.extend({
  toMatchLocation: (
    { accuracy, location: { lat, lng } },
    {
      accuracy: expectedAccuracy,
      location: { lat: expectedLat, lng: expectedLng },
    }
  ) => {
    const passAccuracy = inRange(accuracy, expectedAccuracy, 1000);
    const passLat = inRange(lat, expectedLat);
    const passLng = inRange(lng, expectedLng);
    if (passAccuracy && passLat && passLng) {
      return {
        message: () =>
          `expected ${{
            accuracy,
            location: { lat, lng },
          }} not to match location ${{
            accuracy: expectedAccuracy,
            location: { lat: expectedLat, lng: expectedLng },
          }}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${{
            accuracy,
            location: { lat, lng },
          }} to match location ${{
            accuracy: expectedAccuracy,
            location: { lat: expectedLat, lng: expectedLng },
          }}`,
        pass: false,
      };
    }
  },
});

describe("multi-cell location", () => {
  it.each([
    [
      {
        lte: [
          {
            mcc: 242,
            mnc: 2,
            cid: 33703712,
            tac: 2305,
            earfcn: 6300,
            adv: 97,
            rsrp: 48,
            rsrq: 16,
            nmr: [],
          },
        ],
      },
      { location: { lat: 63.418807, lng: 10.412916 }, accuracy: 2238 },
    ],
    [
      {
        lte: [
          {
            mcc: 242,
            mnc: 2,
            cid: 33703712,
            tac: 2305,
            earfcn: 6300,
            adv: 65535,
            rsrp: 50,
            rsrq: 26,
            nmr: [
              {
                earfcn: 6300,
                pci: 426,
                rsrp: 39,
                rsrq: 4,
              },
            ],
          },
        ],
      },
      {
        accuracy: 2139,
        location: {
          lat: 63.42811704,
          lng: 10.33457279,
        },
      },
    ],
    [
      {
        lte: [
          {
            mcc: 242,
            mnc: 2,
            cid: 33703712,
            tac: 2305,
            earfcn: 6300,
            adv: 65535,
            rsrp: 48,
            rsrq: 20,
            nmr: [
              {
                earfcn: 6300,
                pci: 426,
                rsrp: 40,
                rsrq: 4,
              },
              {
                earfcn: 100,
                pci: 419,
                rsrp: 21,
                rsrq: 19,
              },
              {
                earfcn: 1650,
                pci: 100,
                rsrp: 29,
                rsrq: 14,
              },
              {
                earfcn: 1650,
                pci: 212,
                rsrp: 23,
                rsrq: 3,
              },
            ],
          },
        ],
      },
      {
        accuracy: 2139,
        location: {
          lat: 63.42811704,
          lng: 10.33457279,
        },
      },
    ],
    [
      {
        lte: [
          {
            mcc: 242,
            mnc: 2,
            cid: 35496972,
            tac: 2305,
            earfcn: 6300,
            adv: 65535,
            rsrp: 48,
            rsrq: 18,
            nmr: [
              {
                earfcn: 6300,
                pci: 194,
                rsrp: 42,
                rsrq: 6,
              },
              {
                earfcn: 6300,
                pci: 428,
                rsrp: 41,
                rsrq: 5,
              },
              {
                earfcn: 6300,
                pci: 63,
                rsrp: 41,
                rsrq: 4,
              },
              {
                earfcn: 6300,
                pci: 140,
                rsrp: 36,
                rsrq: -2,
              },
              {
                earfcn: 6300,
                pci: 205,
                rsrp: 36,
                rsrq: -2,
              },
            ],
          },
        ],
      },
      {
        accuracy: 440,
        location: {
          lat: 63.42557256,
          lng: 10.43830085,
        },
      },
    ],
  ])("should resolve %j to %j", async (cellTowers, expectedLocation) => {
    expect(
      await post("location/locate/test-device", cellTowers)
    ).toMatchLocation(expectedLocation);
  });
});

describe("single-cell location", () => {
  it.each([
    [
      {
        mcc: 242,
        mnc: 2,
        tac: 2305,
        cid: 33703712,
      },
      {
        accuracy: 2416,
        location: {
          lat: 63.42373967,
          lng: 10.38332462,
        },
      },
    ],
  ])("should resolve %j to %j", async (cell, expectedLocation) => {
    expect(
      await post("location/locate/test-device", {
        lte: [cell],
      })
    ).toMatchLocation(expectedLocation);
  });
});
