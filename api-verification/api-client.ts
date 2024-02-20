import { IncomingMessage, type OutgoingHttpHeaders } from 'http'
import * as https from 'https'
import * as jwt from 'jsonwebtoken'
import { URL, URLSearchParams } from 'url'

const token = (tokenKey: string, payload: Record<string, any>) =>
	jwt.sign(payload, tokenKey, { algorithm: 'ES256' })

export const tokenAuthorization = ({
	tokenKey,
	tokenPayload,
}: {
	tokenKey: string
	tokenPayload: Record<string, any>
}): string => token(tokenKey, tokenPayload)

const DEFAULT_ENDPOINT = 'https://api.nrfcloud.com'

const ok = (res: IncomingMessage) =>
	(res?.statusCode ?? -1) >= 200 && (res?.statusCode ?? -1) < 300

export const apiClient = ({
	endpoint,
	authorizationToken,
}: {
	endpoint?: string
	authorizationToken: string
}): {
	head: typeof head
	getJSON: typeof getJSON
	post: typeof post
	postBinary: typeof postBinary
	deleteJSON: typeof deleteJSON
} => {
	const e = new URL(endpoint ?? DEFAULT_ENDPOINT)
	const post = async ({
		resource,
		payload,
	}: {
		resource: string
		payload: Record<string, any>
	}) =>
		new Promise<Record<string, any>>((resolve, reject) => {
			const options = {
				hostname: e.hostname,
				port: 443,
				path: `/v1/${resource}`,
				method: 'POST',
				headers: {
					Authorization: `Bearer ${authorizationToken}`,
					'Content-Type': 'application/json',
				},
			}

			const req = https.request(options, (res) => {
				const response: string[] = []

				res.on('data', (d) => {
					response.push(d.toString())
				})

				res.on('end', () => {
					console.debug(
						[
							`> POST https://${e.hostname}/v1/${resource}`,
							`${JSON.stringify(payload)}`,
							...Object.entries(options.headers).map(
								([k, v]) => `> ${k}: ${v}`,
							),
							'',
							`< ${res.statusCode} ${res.statusMessage}`,
							...Object.entries(res.headers).map(
								([k, v]): string => `< ${k}: ${JSON.stringify(v)}`,
							),
							'<',
							`< ${response.join('')}`,
						].join('\n'),
					)

					if (!ok(res))
						return reject(new Error(`Request failed: ${res.statusCode}`))
					resolve(JSON.parse(response.join('')))
				})
			})
			req.on('error', reject)
			req.write(JSON.stringify(payload))
			req.end()
		})

	const postBinary = async ({
		resource,
		payload,
		headers,
	}: {
		resource: string
		payload: any
		headers?: Record<string, string>
	}) =>
		new Promise<Buffer>((resolve, reject) => {
			const options = {
				hostname: e.hostname,
				port: 443,
				path: `/v1/${resource}`,
				method: 'POST',
				headers: {
					Authorization: `Bearer ${authorizationToken}`,
					'Content-Type': 'application/octet-stream',
					...headers,
				},
			}

			const req = https.request(options, (res) => {
				const response: Buffer[] = []

				res.on('data', (d) => {
					response.push(d)
				})

				res.on('end', () => {
					console.debug(
						[
							`> POST https://${e.hostname}/v1/${resource}`,
							payload,
							...Object.entries(options.headers).map(
								([k, v]) => `> ${k}: ${v}`,
							),
							'',
							`< ${res.statusCode} ${res.statusMessage}`,
							...Object.entries(res.headers).map(
								([k, v]) => `< ${k}: ${JSON.stringify(v)}`,
							),
							'<',
							`< ${Buffer.concat(response).toString('hex')}`,
						].join('\n'),
					)

					if (!ok(res))
						return reject(new Error(`Request failed: ${res.statusCode}`))
					resolve(Buffer.concat(response))
				})
			})
			req.on('error', reject)
			req.write(payload)
			req.end()
		})

	const executeMethod =
		(method: string) =>
		async ({
			resource,
			payload,
			headers,
			debugResponse,
		}: {
			resource: string
			payload?: Record<string, any>
			headers?: OutgoingHttpHeaders
			debugResponse: (res: Buffer) => string[]
		}) =>
			new Promise<Buffer>((resolve, reject) => {
				const options = {
					hostname: e.hostname,
					method,
					port: 443,
					path: `/v1/${resource}${
						payload !== undefined
							? `?${new URLSearchParams(payload).toString()}`
							: ''
					}`,
					headers: {
						Authorization: `Bearer ${authorizationToken}`,
						...headers,
					},
				}

				const req = https.get(options, (res) => {
					const response: Buffer[] = []

					res.on('data', (d) => {
						response.push(d)
					})

					res.on('end', () => {
						const data = Buffer.concat(response)
						console.debug(
							[
								`> ${method} https://${e.hostname}/v1/${resource}${
									payload !== undefined
										? `?${new URLSearchParams(payload).toString()}`
										: ''
								}`,
								...Object.entries(options.headers).map(
									([k, v]) => `> ${k}: ${JSON.stringify(v)}`,
								),
								'',
								`< ${res.statusCode} ${res.statusMessage}`,
								...Object.entries(res.headers).map(
									([k, v]): string => `< ${k}: ${JSON.stringify(v)}`,
								),
								'<',
								...debugResponse(data),
							].join('\n'),
						)

						if ((res.statusCode ?? -1) > 399)
							return reject(new Error(`Request failed: ${res.statusCode}`))
						return resolve(data)
					})
				})
				req.on('error', reject)
				req.end()
			})

	const executeGet = executeMethod('GET')
	const executeDelete = executeMethod('DELETE')

	const getJSON = async <Response extends Record<string, any>>(
		args: Pick<
			Parameters<typeof executeGet>[0],
			Exclude<keyof Parameters<typeof executeGet>[0], 'debugResponse'>
		>,
	): Promise<Response> =>
		executeGet({
			...args,
			debugResponse: (res: Buffer) => [`< ${res.toString('utf-8')}`],
		}).then((res) => JSON.parse(res.toString('utf-8')))

	const deleteJSON = async <Response extends Record<string, any>>(
		args: Pick<
			Parameters<typeof executeDelete>[0],
			Exclude<keyof Parameters<typeof executeDelete>[0], 'debugResponse'>
		>,
	): Promise<Response> =>
		executeDelete({
			...args,
			debugResponse: (res: Buffer) => [`< ${res.toString('utf-8')}`],
		}).then((res) => JSON.parse(res.toString('utf-8')))

	const head = async ({
		resource,
		payload,
		headers,
	}: {
		resource: string
		payload: Record<string, any>
		headers?: Record<string, string>
	}): Promise<Headers> => {
		const url = new URL(
			`https://${e.hostname}/v1/${resource}?${new URLSearchParams(
				payload,
			).toString()}`,
		)

		const res = await fetch(url, {
			method: 'HEAD',
			headers: {
				Authorization: `Bearer ${authorizationToken}`,
				...headers,
			},
		})

		console.debug(
			[
				`> HEAD ${url.toString()}`,
				`< ${res.status} ${res.statusText}`,
				...[...new Set(res.headers.entries())].map(([k, v]) => `< ${k}: ${v}`),
			].join('\n'),
		)

		if ((res.status ?? -1) > 399)
			throw new Error(`Request failed: ${res.status}`)
		return res.headers
	}

	return {
		head,
		getJSON,
		post,
		postBinary,
		deleteJSON,
	}
}
