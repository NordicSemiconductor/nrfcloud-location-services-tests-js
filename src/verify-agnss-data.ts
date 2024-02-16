export const SCHEMA_VERSION = 1

export enum AGNSSType {
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
	[AGNSSType['UTC parameters']]: 14,
	[AGNSSType.Ephemerides]: 62,
	[AGNSSType.Almanac]: 31,
	[AGNSSType['Klobuchar ionospheric correction parameters']]: 8,
	[AGNSSType['GPS time of week']]: 4,
	[AGNSSType['GPS system clock and time of week']]: 16,
	[AGNSSType['Approximate location']]: 15,
	[AGNSSType['Satellite integrity data']]: 4,
}

export type AGNSSMessage = {
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
): { error: Error } | AGNSSMessage => {
	// First byte is schemaVersion
	const schemaVersion = buf.readUInt8(0)

	if (schemaVersion !== SCHEMA_VERSION) {
		return {
			error: new Error(
				`Expected schema version ${SCHEMA_VERSION}, got ${schemaVersion}`,
			),
		}
	}

	const entries = []
	let offset = 1

	while (offset <= buf.length) {
		const type = buf.readUInt8(offset)
		debug?.(`Read type ${type} at ${offset}`)
		const len = datagramLength[type]
		if (AGNSSType[type] === undefined || len === undefined)
			return {
				error: new Error(`Encountered unsupported datagram type: ${type}`),
			}
		const numItems = buf.readUInt16LE(offset + 1)
		debug?.(`Read length ${numItems} at ${offset + 1}`)
		offset += 3 + numItems * len // Increase for datagram length
		debug?.(`assume ${numItems * len} bytes of data`)

		if (offset > buf.length)
			return {
				error: new Error(
					`Datagram is ${
						offset - buf.length
					} bytes too short to contain ${numItems} items of ${AGNSSType[type]}`,
				),
			}

		entries.push({ type, items: numItems })

		if (offset === buf.length) {
			break
		}
	}

	return { schemaVersion, entries }
}
