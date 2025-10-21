import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      this.logger.warn('API request without API key', {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        url: request.url,
      });
      throw new UnauthorizedException('API key is required');
    }

    if (!this.validateApiKey(apiKey)) {
      this.logger.warn('Invalid API key provided', {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        url: request.url,
        apiKeyPrefix: apiKey.substring(0, 8) + '...',
      });
      throw new UnauthorizedException('Invalid API key');
    }

    this.logger.log('API key validated successfully', {
      ip: request.ip,
      url: request.url,
    });

    return true;
  }

  private extractApiKey(request: Request): string | null {
    const apiKeyHeader = request.headers['x-api-key'] as string;
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    return null;
  }

  private validateApiKey(apiKey: string): boolean {
    const validApiKeys = this.getValidApiKeys();
    return validApiKeys.includes(apiKey);
  }

  private getValidApiKeys(): string[] {
    const apiKeys = process.env.API_KEYS;
    if (!apiKeys) {
      this.logger.error('No API keys configured in environment variables');
      return [];
    }

    return apiKeys
      .split(',')
      .map((key) => key.trim())
      .filter((key) => key.length > 0);
  }
}
