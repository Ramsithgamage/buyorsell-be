import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiLog } from './entities/api-log.entity';

@Injectable()
export class ApiLogInterceptor implements NestInterceptor {
  private readonly consoleLogger = new Logger(ApiLogInterceptor.name);

  constructor(
    @InjectRepository(ApiLog)
    private readonly logRepository: Repository<ApiLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = performance.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Math.round(performance.now() - startTime);
        const response = ctx.getResponse();
        this.saveLog(request, response.statusCode, durationMs, null);
      }),
      catchError((err) => {
        const durationMs = Math.round(performance.now() - startTime);
        const statusCode = err.status || err.statusCode || 500;
        
        let errorMessage = 'Internal server error';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof err === 'object') {
          const resMessage = err.message || (err.response && (err.response.message || err.response));
          if (resMessage) {
            errorMessage = Array.isArray(resMessage) ? resMessage.join(', ') : String(resMessage);
          }
        }

        this.saveLog(request, statusCode, durationMs, errorMessage);
        return throwError(() => err);
      }),
    );
  }

  private saveLog(
    request: any,
    statusCode: number,
    durationMs: number,
    errorMessage: string | null,
  ): void {
    try {
      const method = request.method || 'UNKNOWN';
      const path = request.path || request.url || '/';
      const userId = request.user?.sub ? Number(request.user.sub) : null;

      const maskedBody = this.maskSensitiveData(request.body);
      const query = request.query ? { ...request.query } : {};

      const apiLog = this.logRepository.create({
        method,
        path,
        statusCode,
        durationMs,
        userId,
        metadata: {
          query,
          body: maskedBody,
          errorMessage,
        },
      });

      this.logRepository.save(apiLog).catch((err) => {
        this.consoleLogger.error('Failed to save API log to database', err instanceof Error ? err.stack : err);
      });
    } catch (err) {
      this.consoleLogger.error('Error constructing or initiating API log save', err instanceof Error ? err.stack : err);
    }
  }

  private maskSensitiveData(data: any): any {
    if (!data) return data;
    try {
      const cloned = JSON.parse(JSON.stringify(data));
      const mask = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return;
        const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken'];
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
              obj[key] = '********';
            } else if (typeof obj[key] === 'object') {
              mask(obj[key]);
            }
          }
        }
      };
      mask(cloned);
      return cloned;
    } catch {
      return data;
    }
  }
}
