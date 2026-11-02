import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface StandardResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}
export class TransformInterceptorInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data: T) => ({
        success: true as const,
        message: 'Success',
        statusCode,
        data,
      }))
    );
  }
}
