import { Injectable, ForbiddenException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApprovalStatus } from '../../common/enums/approval-status.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    const authenticatedUser = super.handleRequest(err, user, info, context, status);
    
    if (
      authenticatedUser &&
      (authenticatedUser.role === UserRole.VENDOR || authenticatedUser.role === UserRole.ADMIN) &&
      authenticatedUser.approvalStatus !== ApprovalStatus.APPROVED
    ) {
      throw new ForbiddenException('Your account is pending administrative approval');
    }
    
    return authenticatedUser;
  }
}