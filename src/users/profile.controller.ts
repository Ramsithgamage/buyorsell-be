import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  ProfileService,
} from './profile.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get profile details of the authenticated user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  getProfile(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.profileService.getProfile(user.sub!);
  }

  @Patch()
  @ApiOperation({ summary: 'Update first/last name' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.profileService.updateProfile(user.sub!, dto);
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload profile picture (JPEG/PNG/WebP, max 2 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!AVATAR_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Avatar must be a JPEG, PNG or WebP image'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UserResponseDto> {
    return this.profileService.setAvatar(user.sub!, file);
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Remove profile picture' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  removeAvatar(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.profileService.removeAvatar(user.sub!);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(user.sub!, dto);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete (soft-delete & anonymize) the authenticated account',
  })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Pending orders exist, or last active admin',
  })
  deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.profileService.deleteAccount(user.sub!, dto.password);
  }
}
