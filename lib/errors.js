export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || null;
  }
}

export function badRequest(message, code) {
  return new HttpError(400, message, code);
}
