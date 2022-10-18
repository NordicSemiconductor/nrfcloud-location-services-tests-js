import * as fs from 'fs'
import * as path from 'path'
import { AGPSType, DataGram, SCHEMA_VERSION, verify } from './verify-agps-data'

describe('verify', () => {
	it.each([
		[
			'nrfc_agpspayload1.bin',
			{
				schemaVersion: SCHEMA_VERSION,
				entries: [
					{
						type: AGPSType.Ephemerides,
						items: 30,
					},
				],
			},
		],
		[
			'nrfc_agpspayload2.bin',
			{
				schemaVersion: SCHEMA_VERSION,
				entries: [
					{ type: AGPSType.Almanac, items: 31 },
					{ type: AGPSType['GPS time of week'], items: 30 },
					{ type: AGPSType['GPS system clock and time of week'], items: 1 },
					{ type: AGPSType['Approximate location'], items: 1 },
					{ type: AGPSType['UTC parameters'], items: 1 },
					{
						type: AGPSType['Klobuchar ionospheric correction parameters'],
						items: 1,
					},
					{ type: AGPSType['Satellite integrity data'], items: 1 },
				],
			},
		],
	])('should verify the A-GPS message %s to contain %o', (file, expected) => {
		const res = verify(
			fs.readFileSync(path.join(process.cwd(), 'test-data', file)),
		)
		expect('error' in res).toEqual(false)
		expect(
			res as {
				schemaVersion: number
				entries: DataGram[]
			},
		).toMatchObject(expected)
	})

	it.each([['agpspayload1.bin'], ['agpspayload2.bin']])(
		'should not verify %s',
		(file) => {
			const res = verify(
				fs.readFileSync(path.join(process.cwd(), 'test-data', file)),
			)
			expect('error' in res).toEqual(true)
		},
	)
})
