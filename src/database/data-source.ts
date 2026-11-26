import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { VendorProfile } from '../users/entities/vendor-profile.entity';
import { VerificationToken } from '../verification/entities/verification-token.entity';
import { GuestSession } from '../guest-session/entities/guest-session.entity';
import { Category } from '../categories/entities/category.entity';
import { Advertisement } from '../advertisements/entities/advertisement.entity';
import { AdvertisementArchive } from '../advertisements/entities/advertisement-archive.entity';
import { ApiLog } from '../api-log/entities/api-log.entity';
import { PromotionalAd } from '../promotional-ads/entities/promotional-ad.entity';
import { Order } from '../orders/entities/order.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { WishlistItem } from '../wishlist/entities/wishlist-item.entity';

dotenv.config();

const isSsl =
  process.env.NODE_ENV === 'production' ||
  process.env.DB_SSL === 'true' ||
  Boolean(process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud'));

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: isSsl ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    VendorProfile,
    VerificationToken,
    GuestSession,
    Category,
    Advertisement,
    AdvertisementArchive,
    ApiLog,
    PromotionalAd,
    Order,
    Notification,
    WishlistItem,
  ],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false,
  timezone: 'Z',
});
