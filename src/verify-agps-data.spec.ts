import * as fs from 'fs'
import * as path from 'path'
import {
	AGPSType,
	DataGram,
	SCHEMA_VERSION,
	verify,
} from './verify-agps-data.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

void describe('verify', () => {
	for (const [file, expected] of [
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
	] as [string, Record<string, unknown>][]) {
		void it(`should verify the A-GPS message ${file} to contain ${JSON.stringify(
			expected,
		)}`, () => {
			const res = verify(
				fs.readFileSync(path.join(process.cwd(), 'test-data', file)),
			)
			assert.equal('error' in res, false)
			assert.deepEqual(
				res as {
					schemaVersion: number
					entries: DataGram[]
				},
				expected,
			)
		})
	}

	for (const file of ['agpspayload1.bin', 'agpspayload2.bin']) {
		void it(`should not verify ${file}`, () => {
			const res = verify(
				fs.readFileSync(path.join(process.cwd(), 'test-data', file)),
			)
			assert.equal('error' in res, true)
		})
	}
})
