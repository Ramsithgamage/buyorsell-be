import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';

describe('AppController', () => {
  let appController: AppController;
  const authService = { getGuestToken: jest.fn() };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: AuthService, useValue: authService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('get_token', () => {
    it('delegates guest token generation to AuthService', async () => {
      authService.getGuestToken.mockResolvedValue({ guestToken: 'abc' });
      await expect(appController.getGuestToken()).resolves.toEqual({
        guestToken: 'abc',
      });
    });
  });
});
