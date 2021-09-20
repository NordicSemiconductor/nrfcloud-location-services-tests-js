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
