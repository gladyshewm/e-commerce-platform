import { catchError, throwError, OperatorFunction } from 'rxjs';
import { HttpException, InternalServerErrorException } from '@nestjs/common';

export function handleRpcError(): OperatorFunction<any, any> {
  return catchError((error) => {
    if (error?.statusCode && error?.message) {
      return throwError(
        () => new HttpException(error.message, error.statusCode),
      );
    }
    return throwError(
      () => new InternalServerErrorException('Unexpected microservice error'),
    );
  });
}
