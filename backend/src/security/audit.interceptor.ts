import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, user } = req;

    // We primarily want to log state-changing admin actions.
    // In a real production environment, you might be more selective,
    // but logging non-GET requests under /admin or /settings is a good start.
    const isStateChanging = method !== 'GET';
    
    return next.handle().pipe(
      tap({
        next: (res) => {
          if (isStateChanging) {
            this.logAction(user?.id || 'anonymous', method, url, body, true);
          }
        },
        error: (err) => {
          if (isStateChanging) {
            this.logAction(user?.id || 'anonymous', method, url, body, false);
          }
        },
      }),
    );
  }

  private async logAction(actorId: string, method: string, url: string, body: any, success: boolean) {
    try {
      // Create a readable action string
      let action = 'EXECUTE';
      if (method === 'POST') action = 'CREATE';
      if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
      if (method === 'DELETE') action = 'DELETE';

      // Ensure we don't log passwords
      const safeBody = { ...body };
      if (safeBody.password) safeBody.password = '***';

      await this.prisma.auditLog.create({
        data: {
          actorId,
          action,
          resourceType: url,
          requestPayload: safeBody,
          success,
        }
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }
  }
}
