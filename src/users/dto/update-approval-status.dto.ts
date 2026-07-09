import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApprovalStatus } from '../../common/enums/approval-status.enum';

export class UpdateApprovalStatusDto {
  @ApiProperty({
    enum: ApprovalStatus,
    example: ApprovalStatus.APPROVED,
    description: 'The updated approval status of the user account',
  })
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  status!: ApprovalStatus;
}
