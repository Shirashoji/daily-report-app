// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class GitHubAPIError extends AppError {
  constructor(message: string, statusCode: number) {
    super(message, 'GITHUB_API_ERROR', statusCode);
    this.name = 'GitHubAPIError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
