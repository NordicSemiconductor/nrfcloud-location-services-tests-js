import type { IncomingHttpHeaders } from 'http'
import * as https from 'https'
import { apiClient, tokenAuthorization } from './api-client.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const { getJSON } = apiClient({
	endpoint: process.env.API_HOST,
	authorizationToken: tokenAuthorization({
		tokenKey: process.env.LOCATION_SERVICES_SERVICE_KEY ?? '',
		tokenPayload: {
			aud: process.env.TEAM_ID,
		},
	}),
})

void describe('PGPS', () => {
	void it('should return predicted assistance GPS data', async () => {
		const res = await getJSON<{ host: string; path: string }>({
			resource: 'location/pgps',
			payload: {
				predictionCount: 6,
				predictionIntervalMinutes: 120,
			},
		})
		assert.notEqual(res.host, undefined)
		assert.notEqual(res.path, undefined)

		const dl = await new Promise<{
			statusCode?: number
			headers: IncomingHttpHeaders
			data: Buffer
		}>((resolve, reject) =>
			https
				.get(`https://${res.host}/${res.path}`, (res) => {
					res.on('data', (data) =>
						resolve({
							statusCode: res.statusCode,
							headers: res.headers,
							data,
						}),
					)
				})
				.on('error', reject),
		)
		assert.equal(dl.statusCode, 200)
		assert.equal(dl.headers['content-type'], 'application/octet-stream')
	})
})
