import { apiClient, tokenAuthorization } from './api-client'

const { post } = apiClient({
	endpoint: process.env.API_HOST,
	authorizationToken: tokenAuthorization({
		tokenKey: process.env.CELLGEO_SERVICE_KEY ?? '',
		tokenPayload: {
			aud: process.env.TEAM_ID,
		},
	}),
})

const inRange = (received: number, expected: number, delta = 0.5): boolean => {
	const floor = expected - delta
	const ceiling = expected + delta
	return floor <= received && received <= ceiling
}

type Location = { uncertainty: number; lat: number; lon: number }

declare global {
	/* eslint-disable-next-line */
	namespace jest {
		/* eslint-disable-next-line */
		interface Matchers<R> {
			toMatchLocation: (expected: Location) => CustomMatcherResult
		}
	}
}

expect.extend({
	toMatchLocation: (
		{ uncertainty, lat, lon }: Location,
		{
			uncertainty: expectedAccuracy,
			lat: expectedLat,
			lon: expectedLng,
		}: Location,
	) => {
		const passAccuracy = inRange(uncertainty, expectedAccuracy, 5000)
		const passLat = inRange(lat, expectedLat)
		const passLng = inRange(lon, expectedLng)
		if (passAccuracy && passLat && passLng) {
			return {
				message: () =>
					`expected ${JSON.stringify({
						uncertainty,
						lat,
						lon,
					})} not to match location ${JSON.stringify({
						uncertainty: expectedAccuracy,
						lat: expectedLat,
						lon: expectedLng,
					})}`,
				pass: true,
			}
		} else {
			return {
				message: () =>
					`expected ${JSON.stringify({
						uncertainty,
						lat,
						lon,
					})} to match location ${JSON.stringify({
						uncertainty: expectedAccuracy,
						lat: expectedLat,
						lon: expectedLng,
					})}`,
				pass: false,
			}
		}
	},
})

describe('multi-cell location', () => {
	it.each([
		[
			{
				lte: [
					{
						mcc: 242,
						mnc: 2,
						eci: 33703712,
						tac: 2305,
						earfcn: 6300,
						adv: 97,
						rsrp: -97,
						rsrq: -9,
						nmr: [],
					},
				],
			},
			{ lat: 63.418807, lon: 10.412916, uncertainty: 2238 },
		],
		[
			{
				lte: [
					{
						mcc: 242,
						mnc: 2,
						eci: 33703712,
						tac: 2305,
						earfcn: 6300,
						adv: 65535,
						rsrp: -97,
						rsrq: -9,
						nmr: [
							{
								earfcn: 6300,
								pci: 426,
								rsrp: -104,
								rsrq: -18,
							},
						],
					},
				],
			},
			{
				uncertainty: 2139,
				lat: 63.42811704,
				lon: 10.33457279,
			},
		],
		[
			{
				lte: [
					{
						mcc: 242,
						mnc: 2,
						eci: 33703712,
						tac: 2305,
						earfcn: 6300,
						adv: 65535,
						rsrp: -97,
						rsrq: -9,
						nmr: [
							{
								earfcn: 6300,
								pci: 426,
								rsrp: -104,
								rsrq: -18,
							},
							{
								earfcn: 100,
								pci: 419,
								rsrp: -116,
								rsrq: -11,
							},
							{
								earfcn: 1650,
								pci: 100,
								rsrp: -120,
								rsrq: -9,
							},
							{
								earfcn: 1650,
								pci: 212,
								rsrp: -123,
								rsrq: -7,
							},
						],
					},
				],
			},
			{
				uncertainty: 2139,
				lat: 63.42811704,
				lon: 10.33457279,
			},
		],
		[
			{
				lte: [
					{
						mcc: 242,
						mnc: 2,
						eci: 35496972,
						tac: 2305,
						earfcn: 6300,
						adv: 65535,
						rsrp: -97,
						rsrq: -9,
						nmr: [
							{
								earfcn: 6300,
								pci: 194,
								rsrp: -104,
								rsrq: -18,
							},
							{
								earfcn: 6300,
								pci: 428,
								rsrp: -116,
								rsrq: -11,
							},
							{
								earfcn: 6300,
								pci: 63,
								rsrp: -120,
								rsrq: -9,
							},
							{
								earfcn: 6300,
								pci: 140,
								rsrp: -123,
								rsrq: -7,
							},
							{
								earfcn: 6300,
								pci: 205,
								rsrp: -123,
								rsrq: -7,
							},
						],
					},
				],
			},
			{
				uncertainty: 440,
				lat: 63.42557256,
				lon: 10.43830085,
			},
		],
	])('should resolve %j to %j', async (cellTowers, expectedLocation) => {
		expect(
			await post({ resource: 'location/cell', payload: cellTowers }),
		).toMatchLocation(expectedLocation)
	})

	it('should resolve this multi-cell result', async () => {
		await expect(
			post({
				resource: 'location/cell',
				payload: {
					lte: [
						{
							mcc: 242,
							mnc: 2,
							eci: 34237195,
							tac: 2305,
							earfcn: 1650,
							adv: 65535,
							rsrp: -74,
							rsrq: -7,
							nmr: [
								{
									pci: 64,
									rsrp: -85,
									rsrq: -18,
									earfcn: 1650,
								},
								{
									pci: 100,
									rsrp: -94,
									rsrq: -26,
									earfcn: 1650,
								},
								{
									pci: 191,
									rsrp: -95,
									rsrq: -26,
									earfcn: 1650,
								},
							],
						},
					],
				},
			}),
		).resolves.not.toBeUndefined()
	})
})

describe('single-cell location', () => {
	it.each([
		[
			{
				mcc: 242,
				mnc: 2,
				tac: 2305,
				eci: 33703712,
			},
			{
				uncertainty: 2416,
				lat: 63.42373967,
				lon: 10.38332462,
			},
		],
	])('should resolve %j to %j', async (cell, expectedLocation) => {
		expect(
			await post({
				resource: 'location/cell',
				payload: {
					lte: [cell],
				},
			}),
		).toMatchLocation(expectedLocation)
	})
})

describe('wifi location', () => {
	it.each([
		[
			{
				accessPoints: [
					{
						macAddress: '40:01:7a:c9:10:22',
						ssid: 'TnGroup',
					},
					{
						macAddress: '80:e0:1d:2a:92:f2',
					},
				],
			},
			{
				lat: 63.4214305,
				lon: 10.437707,
				uncertainty: 60,
			},
		],
		[
			{
				accessPoints: [
					{
						macAddress: '40:01:7a:c9:10:22',
						ssid: 'TnGroup',
						signalStrength: -65,
						channel: 1,
					},
					{
						macAddress: '80:e0:1d:2a:92:f2',
						ssid: 'TnGroup',
						signalStrength: -70,
						channel: 1,
					},
					{
						macAddress: '40:01:7a:c9:10:21',
						ssid: 'Telenor_Guest',
						signalStrength: -65,
						channel: 1,
					},
					{
						macAddress: '40:01:7a:c9:10:27',
						ssid: 'TnNorgeMacOS',
						signalStrength: -65,
						channel: 1,
					},
					{
						macAddress: '80:e0:1d:2a:92:f1',
						ssid: 'Telenor_Guest',
						signalStrength: -69,
						channel: 1,
					},
					{
						macAddress: '80:e0:1d:2a:92:f5',
						ssid: 'TnNorge',
						signalStrength: -69,
						channel: 1,
					},
					{
						macAddress: '96:15:44:ac:6c:87',
						ssid: 'Geotek',
						signalStrength: -71,
						channel: 1,
					},
					{
						macAddress: '7c:10:c9:02:b8:68',
						ssid: 'PTU_TEST',
						signalStrength: -64,
						channel: 8,
					},
					{
						macAddress: '9a:15:44:ac:6c:6e',
						ssid: 'Pets',
						signalStrength: -68,
						channel: 11,
					},
					{
						macAddress: '4c:e1:75:bf:e2:a0',
						ssid: 'NORDIC-GUEST',
						signalStrength: -41,
						channel: 11,
					},
					{
						macAddress: '4c:e1:75:bf:e2:a1',
						ssid: 'NORDIC-INTERNAL',
						signalStrength: -41,
						channel: 11,
					},
					{
						macAddress: '82:15:44:ac:6b:1f',
						ssid: 'Geogjest',
						signalStrength: -75,
						channel: 11,
					},
					{
						macAddress: '82:15:54:ac:6c:6e',
						ssid: 'Geogjest',
						signalStrength: -85,
						channel: 36,
					},
					{
						macAddress: '86:15:54:ac:6c:6e',
						ssid: 'Geoprosjekt',
						signalStrength: -85,
						channel: 36,
					},
					{
						macAddress: '9a:15:54:ac:6c:6e',
						ssid: 'Pets',
						signalStrength: -85,
						channel: 36,
					},
					{
						macAddress: '9e:15:54:ac:6c:6e',
						ssid: 'Geoccast',
						signalStrength: -85,
						channel: 36,
					},
					{
						macAddress: '96:15:54:ac:6c:6e',
						ssid: 'Geotek',
						signalStrength: -85,
						channel: 36,
					},
					{
						macAddress: 'b6:15:54:ac:6c:6e',
						signalStrength: -85,
						channel: 36,
					},
					{
						macAddress: '7c:10:c9:02:b8:6c',
						ssid: 'PTU_TEST_5G',
						signalStrength: -62,
						channel: 36,
					},
					{
						macAddress: '80:e0:1d:2a:92:fd',
						ssid: 'TnGroup',
						signalStrength: -84,
						channel: 36,
					},
					{
						macAddress: '80:e0:1d:2a:92:f9',
						ssid: 'Telenor_Linx',
						signalStrength: -84,
						channel: 36,
					},
					{
						macAddress: '80:e0:1d:2a:92:f8',
						ssid: 'TnNorgeMacOS',
						signalStrength: -84,
						channel: 36,
					},
					{
						macAddress: '8a:15:54:ac:6c:6e',
						ssid: 'Geoikt',
						signalStrength: -86,
						channel: 36,
					},
					{
						macAddress: 'fe:cb:ac:8f:77:3f',
						ssid: 'Geotek',
						signalStrength: -85,
						channel: 48,
					},
					{
						macAddress: '80:e0:1d:02:2e:2d',
						ssid: 'TnGroup',
						signalStrength: -83,
						channel: 48,
					},
					{
						macAddress: '80:e0:1d:02:2e:2e',
						ssid: 'Telenor_Guest',
						signalStrength: -84,
						channel: 48,
					},
					{
						macAddress: 'f6:cb:ac:8f:77:3f',
						ssid: 'Geoccast',
						signalStrength: -84,
						channel: 48,
					},
					{
						macAddress: '4c:e1:75:bf:09:2f',
						ssid: 'NORDIC-GUEST',
						signalStrength: -68,
						channel: 116,
					},
					{
						macAddress: '4c:e1:75:bf:e2:af',
						ssid: 'NORDIC-GUEST',
						signalStrength: -46,
						channel: 132,
					},
					{
						macAddress: '4c:e1:75:bf:e2:ae',
						ssid: 'NORDIC-INTERNAL',
						signalStrength: -46,
						channel: 132,
					},
				],
			},
			{
				lat: 63.4213862,
				lon: 10.4375898,
				uncertainty: 14.772,
			},
		],
	])('should resolve %j to %j', async (wifis, expectedLocation) => {
		expect(
			await post({ resource: 'location/wifi', payload: wifis }),
		).toMatchLocation(expectedLocation)
	})
})
