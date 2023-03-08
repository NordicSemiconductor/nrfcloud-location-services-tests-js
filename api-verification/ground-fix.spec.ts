import combinedLteWifi from '../test-data/combined-lte-wifi.json'
import mcellpayload1 from '../test-data/mcellpayload1.json'
import mcellpayload2 from '../test-data/mcellpayload2.json'
import mcellpayload3 from '../test-data/mcellpayload3.json'
import mcellpayload4 from '../test-data/mcellpayload4.json'
import mcellpayload5 from '../test-data/mcellpayload5.json'
import scellpayload1 from '../test-data/scellpayload1.json'
import wifipayload1 from '../test-data/wifipayload1.json'
import wifipayload2 from '../test-data/wifipayload2.json'
import { apiClient, tokenAuthorization } from './api-client'

const { post } = apiClient({
	endpoint: process.env.API_HOST,
	authorizationToken: tokenAuthorization({
		tokenKey: process.env.GROUNDFIX_SERVICE_KEY ?? '',
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

describe('ground fix services', () => {
	describe('multi-cell location', () => {
		it.each([
			[mcellpayload1, { lat: 63.418807, lon: 10.412916, uncertainty: 2238 }],
			[
				mcellpayload2,
				{
					uncertainty: 2139,
					lat: 63.42811704,
					lon: 10.33457279,
				},
			],
			[
				mcellpayload3,
				{
					uncertainty: 2139,
					lat: 63.42811704,
					lon: 10.33457279,
				},
			],
			[
				mcellpayload4,
				{
					uncertainty: 440,
					lat: 63.42557256,
					lon: 10.43830085,
				},
			],
			[
				combinedLteWifi,
				{
					uncertainty: 440,
					lat: 63.42557256,
					lon: 10.43830085,
				},
			],
		])('should resolve %s to %j', async (payload, expectedLocation) => {
			expect(
				await post({ resource: 'location/ground-fix', payload }),
			).toMatchLocation(expectedLocation)
		})

		it('should resolve this multi-cell result', async () =>
			expect(
				post({
					resource: 'location/ground-fix',
					payload: mcellpayload5,
				}),
			).resolves.not.toBeUndefined())
	})

	describe('single-cell location', () => {
		it.each([
			[
				scellpayload1,
				{
					uncertainty: 2416,
					lat: 63.42373967,
					lon: 10.38332462,
				},
			],
		])('should resolve %j to %j', async (payload, expectedLocation) =>
			expect(
				await post({
					resource: 'location/ground-fix',
					payload,
				}),
			).toMatchLocation(expectedLocation),
		)
	})

	describe('wifi location', () => {
		it.each([
			[
				wifipayload1,
				{
					lat: 63.4214305,
					lon: 10.437707,
					uncertainty: 60,
				},
			],
			[
				wifipayload2,
				{
					lat: 63.4213862,
					lon: 10.4375898,
					uncertainty: 14.772,
				},
			],
		])('should resolve %s to %j', async (payload, expectedLocation) => {
			expect(
				await post({ resource: 'location/ground-fix', payload }),
			).toMatchLocation(expectedLocation)
		})

		it('should require at least 2 access points with MAC addresses', async () =>
			expect(
				post({
					resource: 'location/ground-fix',
					payload: {
						wifi: {
							accessPoints: [
								{
									macAddress: '40:01:7a:c9:10:22',
								},
							],
						},
					},
				}),
			).rejects.toThrow('Request failed: 422'))
	})
})
