export class HttpError extends Error {
  readonly status: number
  readonly url: string

  constructor(status: number, url: string) {
    super(`HTTP ${status} while fetching ${url}`)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}
