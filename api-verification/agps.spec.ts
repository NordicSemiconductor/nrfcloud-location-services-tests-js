import { AGPSMessage, SCHEMA_VERSION, verify } from '../src/verify-agps-data'
import { apiClient, tokenAuthorization } from './api-client'

const { getBinary, head } = apiClient({
	endpoint: process.env.API_HOST,
	authorizationToken: tokenAuthorization({
		tokenKey: process.env.AGPS_SERVICE_KEY ?? '',
		tokenPayload: {
			aud: process.env.TEAM_ID,
		},
	}),
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
				const res = await head({ resource: 'location/agps', payload: agpsReq })
				chunkSize = parseInt(res['content-length'] ?? '0', 10)
				expect(chunkSize).toBeGreaterThan(0)
			})

			it('should return A-GPS data', async () => {
				expect(chunkSize).toBeGreaterThan(0) // chunk size should have been set
				const res = await getBinary({
					resource: 'location/agps',
					payload: agpsReq,
					headers: {
						'Content-Type': 'application/octet-stream',
						Range: `bytes=0-${chunkSize}`,
					},
				})
				expect(res.length).toBe(chunkSize)

				// Verify response
				const verified = verify(res)
				expect('error' in verified).toEqual(false)
				expect((verified as AGPSMessage).schemaVersion).toEqual(SCHEMA_VERSION)
			})

			it('should chunk large responses', async () => {
				const res = await getBinary({
					resource: 'location/agps',
					payload: {
						mcc: 242,
						mnc: 2,
						eci: 33703712,
						tac: 2305,
						requestType: 'custom',
						customTypes: 2,
					},
					headers: {
						'Content-Type': 'application/octet-stream',
						Range: `bytes=0-2000`,
					},
				})
				expect(res.length).toBeLessThan(2000)

				// Verify response
				const verified = verify(res)
				expect('error' in verified).toEqual(false)
				expect((verified as AGPSMessage).schemaVersion).toEqual(SCHEMA_VERSION)
				expect((verified as AGPSMessage).entries).toHaveLength(1)
				expect((verified as AGPSMessage).entries[0].type).toEqual(2)
				expect((verified as AGPSMessage).entries[0].items).toBeGreaterThan(0)
			})
		})
	})

	describe('should support 8 types', () => {
		it.each([[1], [2], [3], [4], [6], [7], [8], [9]])(
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

				const headRes = await head({
					resource: 'location/agps',
					payload: agpsReq,
				})
				const chunkSize = parseInt(headRes['content-length'] ?? '0', 10)
				expect(chunkSize).toBeGreaterThan(0)

				const res = await getBinary({
					resource: 'location/agps',
					payload: agpsReq,
					headers: {
						'Content-Type': 'application/octet-stream',
						Range: `bytes=0-${chunkSize}`,
					},
				})
				expect(res.length).toEqual(chunkSize)

				// Verify response
				const verified = verify(res)
				expect('error' in verified).toEqual(false)
				expect((verified as AGPSMessage).schemaVersion).toEqual(SCHEMA_VERSION)
				expect((verified as AGPSMessage).entries).toHaveLength(1)
				expect((verified as AGPSMessage).entries[0].type).toEqual(type)
				expect((verified as AGPSMessage).entries[0].items).toBeGreaterThan(0)
			},
		)
	})

	it('should combine types', async () => {
		const types = new Set([1, 3, 4, 6, 7, 8, 9])
		const agpsReq = {
			mcc: 242,
			mnc: 2,
			eci: 33703712,
			tac: 2305,
			requestType: 'custom',
			customTypes: [...types],
		}

		const headRes = await head({
			resource: 'location/agps',
			payload: agpsReq,
		})
		const chunkSize = parseInt(headRes['content-length'] ?? '0', 10)
		expect(chunkSize).toBeGreaterThan(0)

		const res = await getBinary({
			resource: 'location/agps',
			payload: agpsReq,
			headers: {
				'Content-Type': 'application/octet-stream',
				Range: `bytes=0-${chunkSize}`,
			},
		})
		expect(res.length).toEqual(chunkSize)

		// Verify response
		const verified = verify(res)
		expect('error' in verified).toEqual(false)
		expect((verified as AGPSMessage).schemaVersion).toEqual(SCHEMA_VERSION)
		expect((verified as AGPSMessage).entries).toHaveLength(7)
		expect(
			new Set((verified as AGPSMessage).entries.map(({ type }) => type)),
		).toEqual(types)
	})
})
