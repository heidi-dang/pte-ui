import type { ApiErrorPayload } from '../shared/api/practice';
import type { Response } from 'express';

export class ApiError extends Error {
  constructor(
    public httpStatus: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toPayload(): ApiErrorPayload {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  send(res: Response): void {
    res.status(this.httpStatus).json({
      success: false,
      error: this.toPayload(),
    });
  }
}

export function badRequest(code: string, message: string, details?: unknown): ApiError {
  return new ApiError(400, code, message, details);
}

export function forbidden(code: string, message: string, details?: unknown): ApiError {
  return new ApiError(403, code, message, details);
}

export function notFound(code: string, message: string, details?: unknown): ApiError {
  return new ApiError(404, code, message, details);
}

export function conflict(code: string, message: string, details?: unknown): ApiError {
  return new ApiError(409, code, message, details);
}

export function internal(code: string, message: string, details?: unknown): ApiError {
  return new ApiError(500, code, message, details);
}
