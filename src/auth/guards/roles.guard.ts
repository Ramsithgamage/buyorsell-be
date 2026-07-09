import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApprovalStatus } from '../../common/enums/approval-status.enum';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no roles are explicitly required, we still check status approval for VENDOR/ADMIN
    if (!requiredRoles) {
      if (user && (user.role === UserRole.VENDOR || user.role === UserRole.ADMIN)) {
        if (user.approvalStatus !== ApprovalStatus.APPROVED) {
          throw new ForbiddenException('Your account is pending administrative approval');
        }
      }
      return true;
    }

    // Check if user is logged in
    if (!user) {
      return false;
    }

    // Check if user has the required role
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    // Check approval status for VENDOR and ADMIN roles
    if (
      (user.role === UserRole.VENDOR || user.role === UserRole.ADMIN) &&
      user.approvalStatus !== ApprovalStatus.APPROVED
    ) {
      throw new ForbiddenException('Your account is pending administrative approval');
    }

    return true;
  }
}
