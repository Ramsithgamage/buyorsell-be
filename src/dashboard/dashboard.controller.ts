import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ─── USER / VENDOR ─────────────────────────────────────────────────────────

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get ad stats for the authenticated user (USER or VENDOR)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns totalAds and activeAds counts for the current user',
    schema: {
      example: { totalAds: 10, activeAds: 7 },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  getMyStats(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getMyStats(user.sub!);
  }

  @Get('my-ads')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get paginated list of the authenticated user\'s own ads (all statuses)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of the current user\'s advertisements',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  getMyAds(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getMyAds(
      user.sub!,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────────────

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide stats (ADMIN only)' })
  @ApiResponse({
    status: 200,
    description:
      'Returns totalUsers, totalVendors, pendingApprovals, totalAds, activeAds',
    schema: {
      example: {
        totalUsers: 120,
        totalVendors: 15,
        pendingApprovals: 3,
        totalAds: 540,
        activeAds: 498,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'ADMIN role required' })
  getAdminStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated list of all users (ADMIN only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by user role',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users with role and approval status',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'ADMIN role required' })
  getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
  ) {
    return this.dashboardService.getAllUsers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      role,
    );
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all users with PENDING approval status (ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users awaiting approval',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'ADMIN role required' })
  getPendingApprovals() {
    return this.dashboardService.getPendingApprovals();
  }
}
