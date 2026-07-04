import { HttpException } from '@nestjs/common';

export const apiError = (messages: string[], status: number): HttpException => {
  return new HttpException({ errors: { body: messages } }, status);
};
