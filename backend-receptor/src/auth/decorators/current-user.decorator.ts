import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  id: number;
  username: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUser }>();
    return request.user;
  }
);
