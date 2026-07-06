import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Advertisement } from '../src/advertisements/entities/advertisement.entity';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { UserStatus } from '../src/common/enums/user-status.enum';
import { GuestSession } from '../src/guest-session/entities/guest-session.entity';
import bcrypt from 'bcrypt';

describe('Advertisements Flow (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let advertisementRepository: Repository<Advertisement>;
  let guestSessionRepository: Repository<GuestSession>;

  const testUser1 = {
    firstName: 'Owner',
    lastName: 'User',
    email: 'owner@example.com',
    password: 'SecurePassword123!',
  };

  const testUser2 = {
    firstName: 'NonOwner',
    lastName: 'User',
    email: 'nonowner@example.com',
    password: 'SecurePassword123!',
  };

  let user1Token: string;
  let user2Token: string;
  let activeCategoryId: number;
  let inactiveCategoryId: number;
  let advertisementId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    categoryRepository = moduleFixture.get<Repository<Category>>(getRepositoryToken(Category));
    advertisementRepository = moduleFixture.get<Repository<Advertisement>>(getRepositoryToken(Advertisement));
    guestSessionRepository = moduleFixture.get<Repository<GuestSession>>(getRepositoryToken(GuestSession));

    // Clear existing data for isolation
    await advertisementRepository.createQueryBuilder().delete().execute();
    await categoryRepository.createQueryBuilder().delete().execute();
    await guestSessionRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();

    // Create verified test users in DB
    const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);
    const u1 = await userRepository.save(
      userRepository.create({
        ...testUser1,
        password: hashedPassword,
        status: UserStatus.VERIFIED,
      }),
    );
    const u2 = await userRepository.save(
      userRepository.create({
        ...testUser2,
        password: hashedPassword,
        status: UserStatus.VERIFIED,
      }),
    );

    // Login users to get JWT tokens (requires a guest token first)
    await guestSessionRepository.createQueryBuilder().delete().execute();
    const tokenRes1 = await request(app.getHttpServer()).post('/get_token').expect(201);
    const guestToken1 = tokenRes1.body.guestToken;
    const login1 = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Authorization', `Bearer ${guestToken1}`)
      .send({ email: testUser1.email, password: testUser1.password })
      .expect(201);
    user1Token = login1.body.accessToken;

    // Delete session 1 so we can get tokenRes2 without duplicate key error on static mocked UUID
    await guestSessionRepository.createQueryBuilder().delete().execute();

    const tokenRes2 = await request(app.getHttpServer()).post('/get_token').expect(201);
    const guestToken2 = tokenRes2.body.guestToken;
    const login2 = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Authorization', `Bearer ${guestToken2}`)
      .send({ email: testUser2.email, password: testUser2.password })
      .expect(201);
    user2Token = login2.body.accessToken;

    // Create an active and inactive category in DB
    const activeCat = await categoryRepository.save(
      categoryRepository.create({ name: 'Active Electronics', slug: 'active-electronics', isActive: true }),
    );
    activeCategoryId = activeCat.id;

    const inactiveCat = await categoryRepository.save(
      categoryRepository.create({ name: 'Inactive Books', slug: 'inactive-books', isActive: false }),
    );
    inactiveCategoryId = inactiveCat.id;
  });

  afterAll(async () => {
    await advertisementRepository.createQueryBuilder().delete().execute();
    await categoryRepository.createQueryBuilder().delete().execute();
    await guestSessionRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();
    await app.close();
  });

  describe('POST /advertisements', () => {
    it('should create advertisement successfully with valid inputs and auth token', async () => {
      const payload = {
        title: 'MacBook Pro M3',
        description: 'Brand new MacBook Pro M3 with 16GB RAM',
        price: 1999.99,
        categoryId: activeCategoryId,
        images: ['https://example.com/mac1.jpg', 'https://example.com/mac2.jpg'],
      };

      const res = await request(app.getHttpServer())
        .post('/advertisements')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('slug');
      expect(res.body.title).toBe(payload.title);
      expect(res.body.categoryId).toBe(activeCategoryId);
      advertisementId = res.body.id;
    });

    it('should throw BadRequestException if category is inactive', async () => {
      const payload = {
        title: 'Harry Potter Box Set',
        description: 'All 7 books in perfect condition',
        price: 49.99,
        categoryId: inactiveCategoryId,
      };

      const res = await request(app.getHttpServer())
        .post('/advertisements')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(payload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('inactive categories');
    });

    it('should throw NotFoundException if category does not exist', async () => {
      const payload = {
        title: 'Non-existent category item',
        description: 'Test description',
        price: 99.99,
        categoryId: 999999,
      };

      const res = await request(app.getHttpServer())
        .post('/advertisements')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(payload)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should fail with 400 Bad Request if images array size exceeds 5 items', async () => {
      const payload = {
        title: 'Too Many Images Phone',
        description: 'Test description',
        price: 299.99,
        categoryId: activeCategoryId,
        images: [
          'http://img1.jpg',
          'http://img2.jpg',
          'http://img3.jpg',
          'http://img4.jpg',
          'http://img5.jpg',
          'http://img6.jpg', // 6th image
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/advertisements')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(payload)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /advertisements', () => {
    it('should retrieve list of active advertisements', async () => {
      const res = await request(app.getHttpServer())
        .get('/advertisements')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('title');
    });

    it('should filter advertisements by categoryId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/advertisements?categoryId=${activeCategoryId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((ad: any) => ad.categoryId === activeCategoryId)).toBe(true);
    });
  });

  describe('PATCH /advertisements/:id', () => {
    it('should allow owner to update advertisement details', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/advertisements/${advertisementId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ price: 1850.00 })
        .expect(200);

      expect(parseFloat(res.body.price)).toBe(1850.00);
    });

    it('should reject update attempts by a non-owner with 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/advertisements/${advertisementId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ price: 1000.00 })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /categories/:id (Relationship restrictions)', () => {
    it('should prevent deletion of categories containing active advertisements (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/categories/${activeCategoryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('active advertisements');
    });

    it('should allow deletion of categories containing no advertisements', async () => {
      await request(app.getHttpServer())
        .delete(`/categories/${inactiveCategoryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);
    });
  });

  describe('DELETE /advertisements/:id', () => {
    it('should reject delete attempts by non-owners with 403', async () => {
      await request(app.getHttpServer())
        .delete(`/advertisements/${advertisementId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('should allow owner to delete advertisement', async () => {
      await request(app.getHttpServer())
        .delete(`/advertisements/${advertisementId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);
    });
  });
});
