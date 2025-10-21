import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { IS_PUBLIC_KEY } from '../decorators/api-key.decorator';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiKeyGuard: ApiKeyGuard,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // For protected routes, validate API key
    return this.apiKeyGuard.canActivate(context);
  }
}
