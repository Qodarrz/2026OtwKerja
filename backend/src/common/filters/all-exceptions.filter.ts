import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const requestUrl = httpAdapter.getRequestUrl(request);
    const requestMethod = request.method || 'UNKNOWN';

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (httpStatus >= 500) {
      this.logger.error(`--- INTERNAL SERVER ERROR --- [${requestMethod}] ${requestUrl}`);
      this.logger.error(exception);
      
      if (exception instanceof Error) {
          this.logger.error(`Message: ${exception.message}`);
          this.logger.error(`Stack: ${exception.stack}`);
      } else {
          this.logger.error(`Exception is not an Error object: ${JSON.stringify(exception)}`);
          try {
              const keys = Object.getOwnPropertyNames(exception);
              const detail: any = {};
              keys.forEach(key => {
                  detail[key] = (exception as any)[key];
              });
              this.logger.error(`Exception Details: ${JSON.stringify(detail)}`);
          } catch (e) {}
      }
    } else {
      const message = (exception as any)?.response?.message || (exception as any)?.message || 'Client Exception';
      this.logger.warn(`[${httpStatus}] [${requestMethod}] ${requestUrl} - ${message}`);
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: (exception as any)?.message || 'Internal server error',
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
