import * as fs from 'fs'
import * as path from 'path'
import {
	AGNSSType,
	type DataGram,
	SCHEMA_VERSION,
	verify,
} from './verify-agnss-data.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

void describe('verify', () => {
	for (const [file, expected] of [
		[
			'nrfc_agnsspayload1.bin',
			{
				schemaVersion: SCHEMA_VERSION,
				entries: [
					{
						type: AGNSSType.Ephemerides,
						items: 30,
					},
				],
			},
		],
		[
			'nrfc_agnsspayload2.bin',
			{
				schemaVersion: SCHEMA_VERSION,
				entries: [
					{ type: AGNSSType.Almanac, items: 31 },
					{ type: AGNSSType['GPS time of week'], items: 30 },
					{ type: AGNSSType['GPS system clock and time of week'], items: 1 },
					{ type: AGNSSType['Approximate location'], items: 1 },
					{ type: AGNSSType['UTC parameters'], items: 1 },
					{
						type: AGNSSType['Klobuchar ionospheric correction parameters'],
						items: 1,
					},
					{ type: AGNSSType['Satellite integrity data'], items: 1 },
				],
			},
		],
	] as [string, Record<string, unknown>][]) {
		void it(`should verify the A-GNSS message ${file} to contain ${JSON.stringify(
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

	for (const file of ['agnsspayload1.bin', 'agnsspayload2.bin']) {
		void it(`should not verify ${file}`, () => {
			const res = verify(
				fs.readFileSync(path.join(process.cwd(), 'test-data', file)),
			)
			assert.equal('error' in res, true)
		})
	}
})
