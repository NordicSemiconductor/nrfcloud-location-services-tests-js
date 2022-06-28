import { Either, left, right } from 'fp-ts/lib/Either'

export const SCHEMA_VERSION = 1

export enum AGPSType {
	'UTC parameters' = 1,
	'Ephemerides' = 2,
	'Almanac' = 3,
	'Klobuchar ionospheric correction parameters' = 4,
	'GPS time of week' = 6,
	'GPS system clock and time of week' = 7,
	'Approximate location' = 8,
	'Satellite integrity data' = 9,
}

export const datagramLength: { [type: number]: number } = {
	[AGPSType['UTC parameters']]: 14,
	[AGPSType.Ephemerides]: 62,
	[AGPSType.Almanac]: 31,
	[AGPSType['Klobuchar ionospheric correction parameters']]: 8,
	[AGPSType['GPS time of week']]: 4,
	[AGPSType['GPS system clock and time of week']]: 16,
	[AGPSType['Approximate location']]: 15,
	[AGPSType['Satellite integrity data']]: 4,
}

export type AGPSMessage = {
	schemaVersion: number
	entries: DataGram[]
}

export type DataGram = {
	type: number
	items: number
}

export const verify = (
	buf: Buffer,
	debug?: (message?: any, ...optionalParams: any[]) => void,
): Either<Error, AGPSMessage> => {
	// First byte is schemaVersion
	const schemaVersion = buf.readUInt8(0)

	if (schemaVersion !== SCHEMA_VERSION) {
		return left(
			new Error(
				`Expected schema version ${SCHEMA_VERSION}, got ${schemaVersion}`,
			),
		)
	}

	const entries = []
	let offset = 1

	while (offset <= buf.length) {
		const type = buf.readUInt8(offset)
		debug?.(`Read type ${type} at ${offset}`)
		if (AGPSType[type] === undefined)
			return left(new Error(`Encountered unsupported datagram type: ${type}`))

		const numItems = buf.readUInt16LE(offset + 1)
		debug?.(`Read length ${numItems} at ${offset + 1}`)
		offset += 3 + numItems * datagramLength[type] // Increase for datagram length
		debug?.(`assume ${numItems * datagramLength[type]} bytes of data`)

		if (offset > buf.length)
			return left(
				new Error(
					`Datagram is ${
						offset - buf.length
					} bytes too short to contain ${numItems} items of ${AGPSType[type]}`,
				),
			)

		entries.push({ type, items: numItems })

		if (offset === buf.length) {
			break
		}
	}

	return right({ schemaVersion, entries })
}
