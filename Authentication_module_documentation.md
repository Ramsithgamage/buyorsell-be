# 🔐 NestJS Authentication Module Documentation

## 📋 Project Overview

This project implements a **complete backend authentication system** for an e-commerce platform using:

- **NestJS** - Framework
- **TypeScript** - Language
- **MySQL 8** - Database
- **TypeORM** - ORM
- **JWT Authentication** - Token-based auth
- **Refresh Tokens** - Token rotation
- **Guest Tokens** - Anonymous users
- **Email Verification** - Account verification
- **Class Validator** - Data validation
- **Dockerized MySQL** - Containerized database

## 🏗️ Authentication Architecture

### Token Types

The system supports **three different token types**:

| Token Type | Purpose | Lifetime |
|-----------|---------|----------|
| **Guest Token** | Identifies anonymous visitors before login | 30 Days |
| **Access Token** | Authenticated API access | 24 Hours |
| **Refresh Token** | Generate new access tokens | 7 Days |

### Authentication Flow Diagram

```
Guest User
    ↓
POST /get_token
    ↓
Guest Token Generated
    ↓
POST /auth/register
    ↓
User Created (status = 0)
    ↓
Verification Token Created
    ↓
Verification URL Sent
    ↓
GET /auth/verify
    ↓
User Verified (status = 1)
    ↓
POST /auth/login
    ↓
Access Token + Refresh Token
    ↓
Access Protected APIs
    ↓
POST /auth/refresh_token
    ↓
New Access Token + Refresh Token
    ↓
POST /auth/logout
```

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
```

#### User Status Values

| Status | Meaning |
|--------|---------|
| **0** | Unverified User |
| **1** | Verified User |

### Verification Tokens Table

```sql
CREATE TABLE verification_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
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

## 🔌 API Endpoints

### 1. Get Guest Token

**Request**
```
POST /get_token
```

**Authentication:** None

**Description:** Creates a guest session and returns a **Guest JWT**.

**Response**
```json
{
  "guestToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 2. Register User

**Request**
```
POST /auth/register
```

**Authentication:** ✅ **Guest Token Required**

**Headers**
```
Authorization: Bearer <guest-token>
```

**Body**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Processing Steps**
- ✓ Validate DTO
- ✓ Check duplicate email
- ✓ Hash password
- ✓ Create user
- ✓ Set status = 0
- ✓ Generate verification token
- ✓ Save verification token
- ✓ Print verification URL

**Response**
```json
{
  "message": "Registration successful. Verify your email."
}
```

---

### 3. Verify Email

**Request**
```
GET /auth/verify?token=<verification-token>
```

**Authentication:** None

**Processing Steps**
- ✓ Validate verification token
- ✓ Check expiration
- ✓ Update user status = 1
- ✓ Delete verification token

**Response**
```json
{
  "message": "Email verified successfully"
}
```

---

### 4. Login

**Request**
```
POST /auth/login
```

**Authentication:** ✅ **Guest Token Required**

**Headers**
```
Authorization: Bearer <guest-token>
```

**Body**
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

**Processing Steps**
- ✓ Find user by email
- ✓ Verify password
- ✓ Verify status = 1
- ✓ Generate access token
- ✓ Generate refresh token
- ✓ Hash refresh token
- ✓ Store hashed refresh token

**Response**
```json
{
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

---

### 5. Refresh Token

**Request**
```
POST /auth/refresh_token
```

**Body**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Processing Steps**
- ✓ Validate refresh token
- ✓ Verify user
- ✓ Compare stored hashed token
- ✓ Generate new access token
- ✓ Generate new refresh token
- ✓ Replace stored refresh token

**Response**
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

---

### 6. Get Profile

**Request**
```
GET /profile
```

**Authentication:** ✅ **Access Token Required**

**Headers**
```
Authorization: Bearer <access-token>
```

**Response**
```json
{
  "sub": 1,
  "email": "john@example.com",
  "iat": 123456789,
  "exp": 123456789
}
```

---

### 7. Logout

**Request**
```
POST /auth/logout
```

**Authentication:** ✅ **Access Token Required**

**Headers**
```
Authorization: Bearer <access-token>
```

**Processing Steps**
- ✓ Find current user
- ✓ Remove stored refresh token

**Response**
```json
{
  "message": "Logged out successfully"
}
```

---

## 🔒 Security Features

### Password Hashing

**Passwords are never stored in plaintext.**

```javascript
bcrypt.hash(password, 10);
```

### Refresh Token Hashing

**Refresh tokens are hashed before storage.**

```javascript
bcrypt.hash(refreshToken, 10);
```

> **Important:** Database never stores raw refresh tokens.

### JWT Authentication

**Access tokens contain:**

```json
{
  "sub": 1,
  "email": "john@example.com"
}
```

### Email Verification

**Users cannot login until:** `status = 1`

**Verification tokens expire after:** 24 Hours

### Refresh Token Rotation

```
Old Refresh Token
        ↓
    Invalidated
        ↓
New Refresh Token Generated
```

> **Security Benefit:** This improves security against token theft.

---

## 📦 Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=ecommerce

# Access Token Configuration
JWT_ACCESS_SECRET=access-secret
JWT_ACCESS_EXPIRES_IN=24h

# Refresh Token Configuration
JWT_REFRESH_SECRET=refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Guest Token Configuration
GUEST_TOKEN_SECRET=guest-secret
GUEST_TOKEN_EXPIRES_IN=30d
```

---

## 📁 NestJS Module Structure

```
src/
│
├── auth/
│   ├── controllers/
│   ├── dto/
│   ├── guards/
│   ├── interfaces/
│   ├── strategies/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   └── auth.service.ts
│
├── users/
│   ├── entities/
│   ├── users.module.ts
│   └── users.service.ts
│
├── verification/
│   ├── entities/
│   ├── verification.module.ts
│   └── verification.service.ts
│
├── guest-session/
│   ├── entities/
│   ├── guest-session.module.ts
│   └── guest-session.service.ts
│
└── app.module.ts
```

---

### Current Implementation Features

The current implementation provides a **complete authentication solution** with:

- ✅ Guest session management
- ✅ User registration
- ✅ Email verification
- ✅ Login functionality
- ✅ JWT access tokens
- ✅ JWT refresh tokens
- ✅ Refresh token rotation
- ✅ Protected routes
- ✅ Logout support

### Ready for Production

> The module is **suitable as the authentication foundation** for the e-commerce platform.