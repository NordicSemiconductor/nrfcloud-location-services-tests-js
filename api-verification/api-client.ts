import * as https from 'https'
import { URL } from 'url'
import { URLSearchParams } from 'url'
import * as jwt from 'jsonwebtoken'
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http'

const token = (tokenKey: string, payload: Record<string, any>) =>
	jwt.sign(payload, tokenKey, { algorithm: 'ES256' })

const DEFAULT_ENDPOINT = 'https://api.beta.nrfcloud.com'

export const apiClient = ({
	endpoint,
	tokenKey,
	tokenPayload,
}: {
	endpoint?: string
	tokenKey: string
	tokenPayload: Record<string, any>
}): {
	head: (
		resource: string,
		payload: Record<string, any>,
		headers?: OutgoingHttpHeaders,
	) => Promise<IncomingHttpHeaders>
	getJSON: <Response extends Record<string, any>>(
		...args: Parameters<typeof executeGet>
	) => Promise<Response>
	getBinary: (...args: Parameters<typeof executeGet>) => Promise<Buffer>
	post: (
		resource: string,
		payload: Record<string, any>,
	) => Promise<Record<string, any>>
} => {
	const post = async (resource: string, payload: Record<string, any>) =>
		new Promise<Record<string, any>>((resolve, reject) => {
			const options = {
				hostname: new URL(endpoint ?? DEFAULT_ENDPOINT).hostname,
				port: 443,
				path: `/v1/${resource}`,
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token(tokenKey, tokenPayload)}`,
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
							`> POST https://${
								new URL(endpoint ?? DEFAULT_ENDPOINT).hostname
							}/v1/${resource}`,
							`${JSON.stringify(payload)}`,
							...Object.entries(options.headers).map(
								([k, v]) => `> ${k}: ${v}`,
							),
							'',
							`< ${res.statusCode} ${res.statusMessage}`,
							...Object.entries(res.headers).map(([k, v]) => `< ${k}: ${v}`),
							`${response.join('')}`,
						].join('\n'),
					)

					if (res.statusCode !== 200)
						return reject(new Error(`Request failed: ${res.statusCode}`))
					resolve(JSON.parse(response.join('')))
				})
			})
			req.on('error', reject)
			req.write(JSON.stringify(payload))
			req.end()
		})

	const executeGet = async (
		resource: string,
		payload: Record<string, any>,
		headers: OutgoingHttpHeaders = {},
	) =>
		new Promise<Buffer>((resolve, reject) => {
			const options = {
				hostname: new URL(endpoint ?? DEFAULT_ENDPOINT).hostname,
				port: 443,
				path: `/v1/${resource}?${new URLSearchParams(payload).toString()}`,
				headers: {
					Authorization: `Bearer ${token(tokenKey, tokenPayload)}`,
					...headers,
				},
			}

			const req = https.get(options, (res) => {
				const response: Buffer[] = []

				res.on('data', (d) => {
					response.push(d)
				})

				res.on('end', () => {
					console.debug(
						[
							`> GET https://${
								new URL(endpoint ?? DEFAULT_ENDPOINT).hostname
							}/v1/${resource}?${new URLSearchParams(payload).toString()}`,
							...Object.entries(options.headers).map(
								([k, v]) => `> ${k}: ${v}`,
							),
							'',
							`< ${res.statusCode} ${res.statusMessage}`,
							...Object.entries(res.headers).map(([k, v]) => `< ${k}: ${v}`),
						].join('\n'),
					)

					if ((res.statusCode ?? -1) > 399)
						return reject(new Error(`Request failed: ${res.statusCode}`))
					return resolve(Buffer.concat(response))
				})
			})
			req.on('error', reject)
			req.end()
		})

	const getJSON = async <Response extends Record<string, any>>(
		...args: Parameters<typeof executeGet>
	): Promise<Response> =>
		executeGet(...args).then((res) => {
			console.debug(res.toString('utf-8'))
			return JSON.parse(res.toString('utf-8'))
		})

	const getBinary = async (
		...args: Parameters<typeof executeGet>
	): Promise<Buffer> =>
		executeGet(...args).then((res) => {
			console.debug(`(${res.length} bytes binary data)`)
			return res
		})

	const head = async (
		resource: string,
		payload: Record<string, any>,
		headers = {},
	) =>
		new Promise<IncomingHttpHeaders>((resolve, reject) => {
			const options = {
				hostname: new URL(endpoint ?? DEFAULT_ENDPOINT).hostname,
				port: 443,
				path: `/v1/${resource}?${new URLSearchParams(payload).toString()}`,
				headers: {
					Authorization: `Bearer ${token(tokenKey, tokenPayload)}`,
					...headers,
				},
				method: 'HEAD',
			}

			const req = https.request(options, (res) => {
				console.debug(
					[
						`> HEAD https://${
							new URL(endpoint ?? DEFAULT_ENDPOINT).hostname
						}/v1/${resource}?${new URLSearchParams(payload).toString()}`,
						`< ${res.statusCode} ${res.statusMessage}`,
						...Object.entries(res.headers).map(([k, v]) => `< ${k}: ${v}`),
					].join('\n'),
				)

				if ((res.statusCode ?? -1) > 399)
					return reject(new Error(`Request failed: ${res.statusCode}`))
				return resolve(res.headers)
			})
			req.on('error', reject)
			req.end()
		})

	return {
		head,
		getJSON,
		getBinary,
		post,
	}
}
