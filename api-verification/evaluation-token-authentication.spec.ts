import { apiClient } from './api-client.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const endpoint = process.env.API_HOST

const { getJSON } = apiClient({
	endpoint,
	authorizationToken: process.env.EVALUATION_TOKEN as string,
})

void describe('authenticate using evaluation token', () => {
	void it('should accept the evaluation token', async () => {
		const res = await getJSON<{ host: string; path: string }>({
			resource: 'location/pgps',
			payload: {
				predictionCount: 6,
				predictionIntervalMinutes: 120,
			},
		})
		assert.notEqual(res.host, undefined)
		assert.notEqual(res.path, undefined)
	})
})
