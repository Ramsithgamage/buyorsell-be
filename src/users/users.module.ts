import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { VendorProfile } from './entities/vendor-profile.entity';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, VendorProfile])],
  controllers: [UsersController, ProfileController],
  providers: [UsersService, ProfileService],
  exports: [UsersService],
})
export class UsersModule {}
