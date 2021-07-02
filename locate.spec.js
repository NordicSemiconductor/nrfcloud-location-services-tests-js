const { post } = require("./api");

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
      { location: { lat: 63.418229, lng: 10.406106 }, accuracy: 2066.0 },
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
                timeDiff: 0,
                pci: 426,
                rsrp: 39,
                rsrq: 4,
              },
            ],
          },
        ],
      },
      { location: { lat: 63.419743, lng: 10.415278 }, accuracy: 1192.0 },
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
                timeDiff: 0,
                pci: 426,
                rsrp: 40,
                rsrq: 4,
              },
              {
                earfcn: 100,
                timeDiff: -1897,
                pci: 419,
                rsrp: 21,
                rsrq: 19,
              },
              {
                earfcn: 1650,
                timeDiff: -1888,
                pci: 100,
                rsrp: 29,
                rsrq: 14,
              },
              {
                earfcn: 1650,
                timeDiff: -1888,
                pci: 212,
                rsrp: 23,
                rsrq: 3,
              },
            ],
          },
        ],
      },
      { location: { lat: 63.420022, lng: 10.420556 }, accuracy: 1192.0 },
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
                timeDiff: 0,
                pci: 194,
                rsrp: 42,
                rsrq: 6,
              },
              {
                earfcn: 6300,
                timeDiff: 0,
                pci: 428,
                rsrp: 41,
                rsrq: 5,
              },
              {
                earfcn: 6300,
                timeDiff: 0,
                pci: 63,
                rsrp: 41,
                rsrq: 4,
              },
              {
                earfcn: 6300,
                timeDiff: 0,
                pci: 140,
                rsrp: 36,
                rsrq: -2,
              },
              {
                earfcn: 6300,
                timeDiff: 0,
                pci: 205,
                rsrp: 36,
                rsrq: -2,
              },
            ],
          },
        ],
      },
      {
        accuracy: 439.0,
        location: {
          lat: 63.421306,
          lng: 10.438087,
        },
      },
    ],
  ])("should resolve %j to %j", async (cellTowers, expectedLocation) => {
    expect(await post("location/locate/test-device", cellTowers)).toMatchObject(
      expectedLocation
    );
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
    ).toMatchObject(expectedLocation);
  });
});
