import { apiClient } from './api-client'

const endpoint = process.env.API_HOST

const { getJSON } = apiClient({
	endpoint,
	authorizationToken: process.env.EVALUATION_TOKEN as string,
})

describe('authenticate using evaluation token', () => {
	it('should accept the evaluation token', async () => {
		const res = await getJSON<{ host: string; path: string }>({
			resource: 'location/pgps',
			payload: {
				predictionCount: 6,
				predictionIntervalMinutes: 120,
			},
		})
		expect(res.host).not.toBeUndefined()
		expect(res.path).not.toBeUndefined()
	})
})
