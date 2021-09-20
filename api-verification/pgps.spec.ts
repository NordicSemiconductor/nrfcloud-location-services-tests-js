import { IncomingHttpHeaders } from 'http'
import * as https from 'https'
import { apiClient, tokenAuthorization } from './api-client'

const { getJSON } = apiClient({
	endpoint: process.env.API_HOST,
	authorizationToken: tokenAuthorization({
		tokenKey: process.env.PGPS_SERVICE_KEY ?? '',
		tokenPayload: {
			aud: process.env.TEAM_ID,
		},
	}),
})

describe('PGPS', () => {
	it('should return predicted assistance GPS data', async () => {
		const res = await getJSON<{ host: string; path: string }>({
			resource: 'location/pgps',
			payload: {
				predictionCount: 6,
				predictionIntervalMinutes: 120,
			},
		})
		expect(res.host).not.toBeUndefined()
		expect(res.path).not.toBeUndefined()

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
		expect(dl.statusCode).toEqual(200)
		expect(dl.headers).toMatchObject({
			'content-type': 'application/octet-stream',
		})
	})
})
