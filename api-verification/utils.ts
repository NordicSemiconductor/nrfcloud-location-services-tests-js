import * as fs from 'fs'

export const readJsonFile = (filename: string): any => {
	const data = fs.readFileSync(filename, {
		encoding: 'utf8',
	})

	return JSON.parse(data)
}
