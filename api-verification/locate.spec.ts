import * as path from 'path'
import { apiClient, tokenAuthorization } from './api-client'
import { readJsonFile } from './utils'

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

describe('ground fix services', () => {
	describe('multi-cell location', () => {
		it.each([
			[
				'mcellpayload1.json',
				{ lat: 63.418807, lon: 10.412916, uncertainty: 2238 },
			],
			[
				'mcellpayload2.json',
				{
					uncertainty: 2139,
					lat: 63.42811704,
					lon: 10.33457279,
				},
			],
			[
				'mcellpayload3.json',
				{
					uncertainty: 2139,
					lat: 63.42811704,
					lon: 10.33457279,
				},
			],
			[
				'mcellpayload4.json',
				{
					uncertainty: 440,
					lat: 63.42557256,
					lon: 10.43830085,
				},
			],
		])('should resolve %s to %j', async (file, expectedLocation) => {
			const payload = readJsonFile(path.join(process.cwd(), 'test-data', file))
			expect(
				await post({ resource: 'location/ground-fix', payload }),
			).toMatchLocation(expectedLocation)
		})

		it('should resolve this multi-cell result', async () => {
			const payload = readJsonFile(
				path.join(process.cwd(), 'test-data', 'mcellpayload5.json'),
			)
			await expect(
				post({
					resource: 'location/ground-fix',
					payload,
				}),
			).resolves.not.toBeUndefined()
		})
	})

	describe('single-cell location', () => {
		it.each([
			[
				'scellpayload1.json',
				{
					uncertainty: 2416,
					lat: 63.42373967,
					lon: 10.38332462,
				},
			],
		])('should resolve %j to %j', async (file, expectedLocation) => {
			const payload = readJsonFile(path.join(process.cwd(), 'test-data', file))
			expect(
				await post({
					resource: 'location/ground-fix',
					payload,
				}),
			).toMatchLocation(expectedLocation)
		})
	})

	describe('wifi location', () => {
		it.each([
			[
				'wifipayload1.json',
				{
					lat: 63.4214305,
					lon: 10.437707,
					uncertainty: 60,
				},
			],
			[
				'wifipayload2.json',
				{
					lat: 63.4213862,
					lon: 10.4375898,
					uncertainty: 14.772,
				},
			],
		])('should resolve %s to %j', async (file, expectedLocation) => {
			const payload = readJsonFile(path.join(process.cwd(), 'test-data', file))
			expect(
				await post({ resource: 'location/ground-fix', payload }),
			).toMatchLocation(expectedLocation)
		})
	})
})
