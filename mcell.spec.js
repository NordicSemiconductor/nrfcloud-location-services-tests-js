const { post } = require("./api");

describe("MCELL", () => {
  it.each([
    [
      [
        {
          radioType: "lte",
          mobileCountryCode: 242,
          mobileNetworkCode: 2,
          locationAreaCode: 2305,
          cellId: 33703712,
          neighborId: 428,
          signalStrength: -91,
          channel: 6300,
          serving: true,
        },
        {
          radioType: "lte",
          neighborId: 426,
          signalStrength: -102,
          channel: 6300,
          serving: false,
        },
      ],
      { location: { lat: 63.419743, lng: 10.415278 }, accuracy: 1192.0 },
    ],
    [
      [
        {
          radioType: "lte",
          mobileCountryCode: 242,
          mobileNetworkCode: 2,
          locationAreaCode: 2305,
          cellId: 33703712,
          neighborId: 428,
          signalStrength: -93,
          channel: 6300,
          serving: true,
        },
        {
          radioType: "lte",
          neighborId: 426,
          signalStrength: -101,
          channel: 6300,
          serving: false,
        },
        {
          radioType: "lte",
          neighborId: 419,
          signalStrength: -120,
          channel: 100,
          serving: false,
        },
        {
          radioType: "lte",
          neighborId: 100,
          signalStrength: -112,
          channel: 1650,
          serving: false,
        },
        {
          radioType: "lte",
          neighborId: 212,
          signalStrength: -118,
          channel: 1650,
          serving: false,
        },
      ],
      { location: { lat: 63.420022, lng: 10.420556 }, accuracy: 1192.0 },
    ],
    [
      [
        {
          radioType: "lte",
          mobileCountryCode: 242,
          mobileNetworkCode: 2,
          locationAreaCode: 2305,
          cellId: 35496972,
          neighborId: 132,
          signalStrength: -93,
          channel: 6300,
          serving: true,
        },
        {
          radioType: "lte",
          neighborId: 194,
          signalStrength: -99,
          channel: 6300,
          serving: false,
        },
        {
          radioType: "lte",
          neighborId: 428,
          signalStrength: -100,
          channel: 6300,
          serving: false,
        },
        {
          radioType: "lte",
          neighborId: 63,
          signalStrength: -100,
          channel: 6300,
          serving: false,
        },
        {
          radioType: "lte",
          neighborId: 140,
          signalStrength: -105,
          channel: 6300,
          serving: false,
        },
        {
          radioType: "lte",
          neighborId: 205,
          signalStrength: -105,
          channel: 6300,
          serving: false,
        },
      ],
      {
        accuracy: 439.0,
        location: {
          lat: 63.421306,
          lng: 10.438087,
        },
      },
    ],
  ])("should resolve %j to %j", async (cellTowers, expectedLocation) => {
    expect(await post("location/multi-cell", cellTowers)).toMatchObject(
      expectedLocation
    );
  });
});
