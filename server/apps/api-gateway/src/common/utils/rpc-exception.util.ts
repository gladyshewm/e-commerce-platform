import { catchError, throwError, OperatorFunction } from 'rxjs';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';

export function handleRpcError(): OperatorFunction<any, any> {
  return catchError((error) => {
    if (error?.statusCode === 400 && error?.errors) {
      return throwError(
        () =>
          new BadRequestException({
            message: error.errors,
            error: 'Bad Request',
            statusCode: HttpStatus.BAD_REQUEST,
          }),
      );
    } else if (error?.statusCode && error?.message) {
      return throwError(
        () => new HttpException(error.message, error.statusCode),
      );
    }

    return throwError(
      () => new InternalServerErrorException('Unexpected microservice error'),
    );
  });
}
