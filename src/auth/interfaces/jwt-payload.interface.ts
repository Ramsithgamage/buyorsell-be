import { UserRole } from '../../common/enums/user-role.enum';
import { ApprovalStatus } from '../../common/enums/approval-status.enum';

export interface JwtPayload {
  sub?: number;
  email?: string;
  guestId?: string;
  type: 'guest' | 'access' | 'refresh';
  role?: UserRole;
  approvalStatus?: ApprovalStatus;
}