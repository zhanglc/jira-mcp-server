export class ApiError extends Error {
  public readonly statusCode: number | undefined;
  public readonly originalError: any;

  constructor(message: string, statusCode?: number, originalError?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.originalError = originalError;

    // 确保错误堆栈正确显示
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static fromJiraClientError(error: any): ApiError {
    const message = error.message || 'Unknown Jira API error';
    let statusCode = error.statusCode || error.status;
    
    // Extract status code from common Jira error patterns
    if (!statusCode && typeof message === 'string') {
      if (message.includes('Issue Does Not Exist') || message.includes('Issue does not exist')) {
        statusCode = 404;
      } else if (message.includes('No project could be found') || message.includes('Project not found')) {
        statusCode = 404;
      } else if (message.includes('Authentication') || message.includes('Unauthorized')) {
        statusCode = 401;
      } else if (message.includes('Permission') || message.includes('Forbidden')) {
        statusCode = 403;
      } else if (message.includes('Internal server error') || message.includes('500')) {
        statusCode = 500;
      }
    }
    
    return new ApiError(
      `Jira API Error: ${message}`,
      statusCode,
      error
    );
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      stack: this.stack
    };
  }
}
