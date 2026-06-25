import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles) return true;
    
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    
    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      return false;
    }
    
    if (!user.roles || !Array.isArray(user.roles)) {
      this.logger.warn(`RolesGuard: User roles invalid or missing. User ID: ${user.sub}, Roles: ${JSON.stringify(user.roles)}`);
      return false;
    }
    
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    
    if (!hasRole) {
      this.logger.warn(`RolesGuard: User does not have required roles. User ID: ${user.sub}, User Roles: ${user.roles.join(', ')}, Required: ${requiredRoles.join(', ')}`);
    }
    
    return hasRole;
  }
}
