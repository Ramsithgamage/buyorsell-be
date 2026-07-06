import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { VerificationToken } from '../verification/entities/verification-token.entity';
import { GuestSession } from '../guest-session/entities/guest-session.entity';
import { Category } from '../categories/entities/category.entity';
import { Advertisement } from '../advertisements/entities/advertisement.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, VerificationToken, GuestSession, Category, Advertisement],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false,
});
