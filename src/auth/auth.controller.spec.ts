import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GuestTokenGuard } from './guards/guest-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const allow = { canActivate: () => true };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: {} }],
    })
      .overrideGuard(GuestTokenGuard)
      .useValue(allow)
      .overrideGuard(JwtAuthGuard)
      .useValue(allow)
      .overrideGuard(JwtRefreshGuard)
      .useValue(allow)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
