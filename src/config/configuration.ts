import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database Configuration
  DB_HOST: Joi.string()
    .default('localhost')
    .required(),

  DB_PORT: Joi.number()
    .default(3306)
    .required(),

  DB_USERNAME: Joi.string()
    .required()
    .messages({
      'any.required': 'DB_USERNAME is required',
    }),

  DB_PASSWORD: Joi.string()
    .required()
    .messages({
      'any.required': 'DB_PASSWORD is required',
    }),

  DB_NAME: Joi.string()
    .required()
    .messages({
      'any.required': 'DB_NAME is required',
    }),

  // JWT Configuration
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'JWT_ACCESS_SECRET is required',
      'string.min': 'JWT_ACCESS_SECRET must be at least 32 characters',
    }),

  JWT_ACCESS_EXPIRES_IN: Joi.string()
    .default('24h')
    .required(),

  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'JWT_REFRESH_SECRET is required',
      'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters',
    }),

  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d')
    .required(),

  GUEST_TOKEN_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'GUEST_TOKEN_SECRET is required',
      'string.min': 'GUEST_TOKEN_SECRET must be at least 32 characters',
    }),

  GUEST_TOKEN_EXPIRES_IN: Joi.string()
    .default('30d')
    .required(),

  // Verification Configuration
  VERIFICATION_URL_BASE: Joi.string()
    .uri()
    .required()
    .messages({
      'any.required': 'VERIFICATION_URL_BASE is required',
      'string.uri': 'VERIFICATION_URL_BASE must be a valid URI',
    }),

  VERIFICATION_TOKEN_EXPIRES_IN: Joi.number()
    .default(86400)
    .required(),

  // Guest Session Configuration
  GUEST_SESSION_EXPIRES_IN: Joi.number()
    .default(2592000)
    .required(),

  // Bcrypt Configuration
  BCRYPT_ROUNDS: Joi.number()
    .default(10)
    .min(8)
    .max(12)
    .required()
    .messages({
      'number.min': 'BCRYPT_ROUNDS must be at least 8',
      'number.max': 'BCRYPT_ROUNDS must not exceed 12',
    }),

  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'staging', 'test')
    .default('development')
    .required(),

  // Server Configuration
  PORT: Joi.number()
    .default(3000)
    .required(),
}).unknown(true);

export interface EnvironmentVariables {
  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;

  // JWT
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  GUEST_TOKEN_SECRET: string;
  GUEST_TOKEN_EXPIRES_IN: string;

  // Verification
  VERIFICATION_URL_BASE: string;
  VERIFICATION_TOKEN_EXPIRES_IN: number;

  // Guest Session
  GUEST_SESSION_EXPIRES_IN: number;

  // Bcrypt
  BCRYPT_ROUNDS: number;

  // Environment
  NODE_ENV: 'development' | 'production' | 'staging' | 'test';

  // Server
  PORT: number;
}
