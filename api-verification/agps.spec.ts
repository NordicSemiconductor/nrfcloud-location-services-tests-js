import { apiClient } from './api-client'

const { getBinary, head } = apiClient({
	endpoint: process.env.API_HOST,
	tokenKey: process.env.AGPS_SERVICE_KEY ?? '',
	tokenPayload: {
		aud: process.env.TEAM_ID,
	},
})

describe('AGPS', () => {
	describe('chunking', () => {
		describe('use HEAD request to get response size', () => {
			const agpsReq = {
				deviceIdentifier: 'TestClient',
				mcc: 242,
				mnc: 2,
				eci: 33703712,
				tac: 2305,
				requestType: 'rtAssistance',
			}
			let chunkSize: number

			it('should describe length of A-GPS data', async () => {
				const res = await head('location/agps', agpsReq)
				chunkSize = parseInt(res['content-length'] ?? '0', 10)
				expect(chunkSize).toBeGreaterThan(0)
			})

			it('should return A-GPS data', async () => {
				expect(chunkSize).toBeGreaterThan(0) // chunk size should have been set
				const res = await getBinary('location/agps', agpsReq, {
					'Content-Type': 'application/octet-stream',
					Range: `bytes=0-${chunkSize}`,
				})
				expect(res.length).toBe(chunkSize)
			})

			it('should chunk large responses', async () => {
				const res = await getBinary(
					'location/agps',
					{
						mcc: 242,
						mnc: 2,
						eci: 33703712,
						tac: 2305,
						requestType: 'custom',
						customTypes: 2,
					},
					{
						'Content-Type': 'application/octet-stream',
						Range: `bytes=0-2000`,
					},
				)
				expect(res.length).toBeLessThan(2000)
			})
		})

		it('should chunk large responses', async () => {
			const res = await getBinary(
				'location/agps',
				{
					mcc: 242,
					mnc: 2,
					eci: 33703712,
					tac: 2305,
					requestType: 'custom',
					customTypes: 2,
				},
				{
					'Content-Type': 'application/octet-stream',
					Range: `bytes=0-2000`,
				},
			)
			expect(res.length).toBeLessThan(2000)
		})
	})

	describe('should support 9 types', () => {
		it.each([[1], [2], [3], [4], [5], [6], [7], [8], [9]])(
			'should resolve custom type %d',
			async (type) => {
				const agpsReq = {
					mcc: 242,
					mnc: 2,
					eci: 33703712,
					tac: 2305,
					requestType: 'custom',
					customTypes: type,
				}

				const headRes = await head('location/agps', agpsReq)
				const chunkSize = parseInt(headRes['content-length'] ?? '0', 10)
				expect(chunkSize).toBeGreaterThan(0)

				const res = await getBinary('location/agps', agpsReq, {
					'Content-Type': 'application/octet-stream',
					Range: `bytes=0-${chunkSize}`,
				})
				expect(res.length).toEqual(chunkSize)
			},
		)
	})
})
