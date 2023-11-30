import combinedLteWifi from '../test-data/combined-lte-wifi.json'
import mcellpayload1 from '../test-data/mcellpayload1.json'
import mcellpayload2 from '../test-data/mcellpayload2.json'
import mcellpayload3 from '../test-data/mcellpayload3.json'
import mcellpayload4 from '../test-data/mcellpayload4.json'
import mcellpayload5 from '../test-data/mcellpayload5.json'
import scellpayload1 from '../test-data/scellpayload1.json'
import wifipayload1 from '../test-data/wifipayload1.json'
import wifipayload2 from '../test-data/wifipayload2.json'
import { apiClient, tokenAuthorization } from './api-client.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const { post } = apiClient({
	endpoint: process.env.API_HOST,
	authorizationToken: tokenAuthorization({
		tokenKey: process.env.LOCATION_SERVICES_SERVICE_KEY ?? '',
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

const matchLocation =
	({
		uncertainty: expectedAccuracy,
		lat: expectedLat,
		lon: expectedLng,
	}: Location) =>
	({ uncertainty, lat, lon }: Location) => {
		const passAccuracy = inRange(uncertainty, expectedAccuracy, 5000)
		const passLat = inRange(lat, expectedLat)
		const passLng = inRange(lon, expectedLng)
		if (passAccuracy && passLat && passLng) return
		throw new Error(
			`expected ${JSON.stringify({
				uncertainty,
				lat,
				lon,
			})} to match location ${JSON.stringify({
				uncertainty: expectedAccuracy,
				lat: expectedLat,
				lon: expectedLng,
			})}`,
		)
	}

void describe('ground fix services', () => {
	void describe('multi-cell location', () => {
		for (const [payload, expectedLocation] of [
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
		] as [Record<string, unknown>, Location][]) {
			void it(`should resolve ${JSON.stringify(payload)} to ${JSON.stringify(
				expectedLocation,
			)}`, async () => {
				matchLocation(expectedLocation)(
					(await post({
						resource: 'location/ground-fix',
						payload,
					})) as Location,
				)
			})
		}

		void it('should resolve this multi-cell result', async () =>
			assert.notEqual(
				await post({
					resource: 'location/ground-fix',
					payload: mcellpayload5,
				}),
				undefined,
			))
	})

	void describe('single-cell location', () => {
		for (const [payload, expectedLocation] of [
			[
				scellpayload1,
				{
					uncertainty: 2416,
					lat: 63.42373967,
					lon: 10.38332462,
				},
			],
		] as [Record<string, unknown>, Location][]) {
			void it(`should resolve ${JSON.stringify(payload)} to ${JSON.stringify(
				expectedLocation,
			)}`, async () => {
				matchLocation(expectedLocation)(
					(await post({
						resource: 'location/ground-fix',
						payload,
					})) as Location,
				)
			})
		}
	})

	void describe('wifi location', () => {
		for (const [payload, expectedLocation] of [
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
		] as [Record<string, unknown>, Location][]) {
			void it(`should resolve ${JSON.stringify(payload)} to ${JSON.stringify(
				expectedLocation,
			)}`, async () => {
				matchLocation(expectedLocation)(
					(await post({
						resource: 'location/ground-fix',
						payload,
					})) as Location,
				)
			})
		}

		void it('should require at least 2 access points with MAC addresses', async () =>
			assert.rejects(
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
				/Request failed: 422/,
			))
	})
})
