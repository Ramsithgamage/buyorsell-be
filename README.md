# 🔐 NestJS E-Commerce Authentication System

> A robust, production-ready authentication module for e-commerce platforms built with **NestJS**, **TypeScript**, and **JWT tokens**.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Security Features](#-security-features)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

### Core Authentication Features
- ✅ **Guest Token System** - Anonymous user sessions (10-day expiry)
- ✅ **User Registration** - Email-based account creation
- ✅ **Email Verification** - Secure email verification tokens (24-hour expiry)
- ✅ **Login/Logout** - Secure authentication with JWT tokens
- ✅ **JWT Access Tokens** - Short-lived access tokens (24 hours)
- ✅ **Refresh Token Rotation** - Secure refresh token mechanism (7-day expiry)
- ✅ **Protected Routes** - Guard-based endpoint protection
- ✅ **Password Hashing** - bcrypt password encryption (salt rounds: 10)
- ✅ **Token Hashing** - Refresh tokens hashed before storage

### Technical Features
- 🏗️ **Modular Architecture** - Organized into feature-based modules
- 📝 **Type Safety** - Full TypeScript support
- 🗄️ **TypeORM Integration** - MySQL database with migrations
- 🐳 **Docker Support** - Dockerized MySQL for easy setup
- 🧪 **Unit & E2E Tests** - Jest test suite included
- 📚 **ESLint Configuration** - Code quality enforcement
- 🔍 **Validation** - Class Validator DTOs

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **NestJS** | Latest | Backend Framework |
| **TypeScript** | 5.x | Language |
| **TypeORM** | Latest | Database ORM |
| **MySQL** | 8.x | Relational Database |
| **JWT** | Latest | Token Authentication |
| **bcrypt** | Latest | Password Hashing |
| **Docker** | Latest | Containerization |
| **Jest** | Latest | Testing Framework |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** - v16 or higher
- **npm** - Package manager
- **MySQL** - v8.x (or use Docker)
- **Docker** 

### Verify Installation

```bash
node --version
npm --version
mysql --version
docker --version
```

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd ecommerce-auth
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

```bash
cp .env.example .env
```

### Step 4: Generate JWT Secrets

Generate secure random strings for your JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run the above command 3 times and copy the outputs for the JWT secrets.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_secure_password
DB_NAME=buyorsell

# ==========================================
# JWT ACCESS TOKEN
# ==========================================
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_ACCESS_EXPIRES_IN=24h

# ==========================================
# JWT REFRESH TOKEN
# ==========================================
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# ==========================================
# GUEST TOKEN
# ==========================================
GUEST_TOKEN_SECRET=your_guest_token_secret_here
GUEST_TOKEN_EXPIRES_IN=30d

# ==========================================
# APPLICATION
# ==========================================
NODE_ENV=development
PORT=3000
```

### Using Docker for MySQL (Recommended)

```bash
docker-compose up -d
```

This will start a MySQL 8 instance with the configuration from `docker-compose.yml`.

### Manual MySQL Setup

```sql
CREATE DATABASE buyorsell;
USE buyorsell;

-- Tables will be created by TypeORM
```

---

## 🎯 Running the Application

### Development Mode

```bash
npm run start:dev
```

The application will start on `http://localhost:3000` and watch for file changes.

### Production Mode

```bash
npm run build
npm run start:prod
```

### Generating Database Migrations

```bash
npm run typeorm migration:generate -- src/migrations/InitialMigration
npm run typeorm migration:run
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints Overview

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| **POST** | `/get_token` | None | Get guest token |
| **POST** | `/auth/register` | Guest | Register new user |
| **GET** | `/auth/verify` | None | Verify email address |
| **POST** | `/auth/login` | Guest | Login user |
| **POST** | `/auth/refresh_token` | None | Refresh access token |
| **GET** | `/profile` | Access | Get user profile |
| **POST** | `/auth/logout` | Access | Logout user |

### 1️⃣ Get Guest Token

**Request**
```http
POST /get_token
Content-Type: application/json
```

**Response** (201 Created)
```json
{
  "guestToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2️⃣ Register User

**Request**
```http
POST /auth/register
Authorization: Bearer <guest-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword@123"
}
```

**Validation Rules**
- Email must be unique
- Password must be at least 8 characters
- Password must contain uppercase, lowercase, number, and special character

**Response** (201 Created)
```json
{
  "message": "Registration successful. Verify your email."
}
```

**Email Verification**
> A verification link will be sent to the registered email address

---

### 3️⃣ Verify Email

**Request**
```http
GET /auth/verify?token=<verification-token>
```

**Response** (200 OK)
```json
{
  "message": "Email verified successfully"
}
```

---

### 4️⃣ Login

**Request**
```http
POST /auth/login
Authorization: Bearer <guest-token>
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword@123"
}
```

**Response** (200 OK)
```json
{
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 5️⃣ Refresh Access Token

**Request**
```http
POST /auth/refresh_token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 6️⃣ Get User Profile

**Request**
```http
GET /profile
Authorization: Bearer <access-token>
```

**Response** (200 OK)
```json
{
  "sub": 1,
  "email": "john@example.com",
  "iat": 1686835200,
  "exp": 1686921600
}
```

---

### 7️⃣ Logout

**Request**
```http
POST /auth/logout
Authorization: Bearer <access-token>
```

**Response** (200 OK)
```json
{
  "message": "Logged out successfully"
}
```

---

## 🔒 Security Features

### 🔐 Password Security

**Bcrypt Hashing**
- Passwords are hashed using bcrypt with 10 salt rounds
- Passwords are never stored in plaintext
- Database stores only the hashed password

```javascript
bcrypt.hash(password, 10)
```

### 🔑 Token Security

**Access Tokens**
- Short-lived tokens (24 hours)
- Contains user ID and email
- Used for API endpoint authorization
- Cannot be used after expiration

**Refresh Tokens**
- Longer-lived tokens (7 days)
- Hashed before storage in database
- Rotated on each refresh request
- Old tokens are invalidated

**Guest Tokens**
- 10-day expiration
- Identifies anonymous users
- Required for registration and login

### ✅ Email Verification

- Email verification tokens expire after 24 hours
- User must verify email before login
- Unverified users cannot access protected routes
- Verification tokens are one-time use only

### 🛡️ Protection Mechanisms

| Feature | Description |
|---------|-------------|
| **JWT Guards** | Validates access tokens before route access |
| **Guest Guards** | Validates guest tokens for public endpoints |
| **DTO Validation** | Class Validator validates all input data |
| **CORS** | Configurable Cross-Origin Resource Sharing |
| **Rate Limiting** | Can be added via additional middleware |
| **Input Sanitization** | Prevents SQL injection and XSS attacks |

---

## 📁 Project Structure

```
src/
├── auth/                          # Authentication Module
│   ├── auth.controller.ts         # API endpoints
│   ├── auth.service.ts            # Business logic
│   ├── auth.module.ts             # Module configuration
│   ├── controllers/
│   │   └── auth.controller.spec.ts
│   ├── dto/                       # Data Transfer Objects
│   │   ├── login.dto.ts
│   │   ├── logout.dto.ts
│   │   └── refresh-token.dto.ts
│   ├── guards/                    # Route Guards
│   │   ├── jwt-auth.guard.ts
│   │   └── guest-token.guard.ts
│   ├── interfaces/                # TypeScript Interfaces
│   │   └── jwt-payload.interface.ts
│   └── strategies/                # Passport Strategies
│       └── jwt-access.strategy.ts
│
├── users/                         # Users Module
│   ├── users.service.ts           # User operations
│   ├── users.module.ts            # Module configuration
│   ├── dto/
│   │   └── create-user.dto.ts
│   └── entities/
│       └── user.entity.ts
│
├── verification/                  # Email Verification Module
│   ├── verification.service.ts
│   ├── verification.module.ts
│   └── entities/
│       └── verification-token.entity.ts
│
├── guest-session/                 # Guest Session Module
│   ├── guest-session.service.ts
│   ├── guest-session.module.ts
│   └── entities/
│       └── guest-session.entity.ts
│
├── app.module.ts                  # Root Module
├── app.controller.ts              # App Controller
├── app.service.ts                 # App Service
└── main.ts                        # Application Entry Point

test/
├── app.e2e-spec.ts               # E2E Tests
└── jest-e2e.json                 # Jest Configuration
```

---

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    refresh_token VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Status Values:**
- `0` - Unverified User
- `1` - Verified User

### Verification Tokens Table

```sql
CREATE TABLE verification_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Guest Sessions Table

```sql
CREATE TABLE guest_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    guest_id VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧪 Testing

### Running Unit Tests

```bash
npm run test
```

### Running E2E Tests

```bash
npm run test:e2e
```

### Running Tests with Coverage

```bash
npm run test:cov
```

### Test Files

- `src/auth/auth.service.spec.ts` - Authentication service tests
- `src/auth/auth.controller.spec.ts` - Authentication controller tests
- `src/users/users.service.spec.ts` - Users service tests
- `src/guest-session/guest-session.service.spec.ts` - Guest session tests
- `src/verification/verification.service.spec.ts` - Verification service tests
- `test/app.e2e-spec.ts` - End-to-end integration tests

---

## 📝 Available Scripts

```bash
# Development
npm run start          # Start the application
npm run start:dev      # Start in development mode with hot reload
npm run start:debug    # Start in debug mode

# Building
npm run build          # Build the application

# Production
npm run start:prod     # Start in production mode

# Testing
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage report
npm run test:e2e       # Run end-to-end tests

# Code Quality
npm run lint           # Run ESLint

# Database
npm run typeorm        # TypeORM CLI commands
```

---

## 🐛 Troubleshooting

### Issue: "Connection to MySQL failed"

**Solution:**
1. Verify MySQL is running: `mysql -u root -p`
2. Check database credentials in `.env`
3. Use Docker: `docker-compose up -d`
4. Create database manually: `CREATE DATABASE ecommerce;`

### Issue: "JWT secret not found"

**Solution:**
1. Verify `.env` file exists
2. Check all JWT secrets are set
3. Secrets should be long random strings (use crypto to generate)

### Issue: "Email verification link not working"

**Solution:**
1. Check verification token expiration (24 hours)
2. Verify email was sent correctly
3. Ensure token matches in verification table

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Change port in .env
PORT=3001

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :3000   # Windows
```

### Issue: "Refresh token validation failed"

**Solution:**
1. Verify refresh token hasn't expired (7 days)
2. Check token is properly formatted
3. Ensure token matches stored hash in database

---

## 📖 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Last Updated:** June 13, 2026  
**Version:** 1.0.0
