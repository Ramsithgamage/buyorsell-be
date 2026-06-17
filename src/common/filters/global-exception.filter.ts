import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resMessage = (exceptionResponse as any).message;
        if (resMessage) {
          message = Array.isArray(resMessage) ? resMessage.join(', ') : String(resMessage);
        } else {
          message = exception.message;
        }
      } else {
        message = exception.message || String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      // Log unhandled server error with stack trace internally
      this.logger.error(
        `Unhandled exception at ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      // Do not expose sensitive error details or stack trace to client
      message = 'Internal server error';
    } else {
      this.logger.error(
        `Non-Error exception caught at ${request.method} ${request.url}: ${JSON.stringify(exception)}`,
      );
    }

    // Log the API error response as a warning for visibility in logs
    this.logger.warn(
      `[${request.method}] ${request.url} - Status: ${status} - Message: ${message}`,
    );

    response.status(status).json({
      success: false,
      message,
      statusCode: status,
    });
  }
}
