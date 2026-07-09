import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from './users.service';
import { UpdateApprovalStatusDto } from './dto/update-approval-status.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'The unique ID of the user whose status needs to be updated', type: Number })
  @ApiOperation({ summary: 'Update registration approval status (Requires ADMIN role)' })
  @ApiResponse({
    status: 200,
    description: 'Approval status successfully updated',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Invalid input parameters or body schema',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description: 'Missing or invalid JWT access token',
  })
  @ApiResponse({
    status: 403,
    type: ErrorResponseDto,
    description: 'Authenticated user lacks required ADMIN role or approval status',
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'User not found',
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApprovalStatusDto: UpdateApprovalStatusDto,
  ) {
    await this.usersService.updateApprovalStatus(id, updateApprovalStatusDto.status);
    return {
      message: 'User status successfully updated',
    };
  }
}
