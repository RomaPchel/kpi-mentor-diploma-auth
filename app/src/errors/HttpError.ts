/**
 * Represents an HTTP error, extending the standard Error object.
 * It includes an optional HTTP status code to provide additional context.
 */
export class HttpError extends Error {
  status?: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}