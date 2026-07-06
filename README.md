# E-Commerce Authentication API (ecomm-api)

A production-grade, highly secure NestJS backend module handling comprehensive guest and authenticated user flows. Built following RESTful design principles and robust Clean Architecture patterns.

---

## 1. Project Description & Stack

The `ecomm-api` provides a secure authentication, hierarchical categories catalog, and advertisements catalog subsystem designed to handle high-throughput client cycles—from guest sessions to email-verified user accounts.

### Technical Stack
* **Framework**: NestJS 11 (Progressive TypeScript Node.js framework)
* **Language**: TypeScript (Strict typing enabled)
* **ORM**: TypeORM (Object-Relational Mapping)
* **Database**: MySQL 8.x
* **Security & Authentication**: Passport.js (`passport-jwt`), `bcrypt` hashing
* **Caching**: `@nestjs/cache-manager` (in-memory caching)
* **SEO Support**: `slugify` for auto-generating URL slugs
* **Deployment & Containerization**: Docker, Docker Compose

---

## 2. Prerequisites

Ensure you have the following components installed locally before starting:
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher
* **Docker & Docker Desktop**: Installed and running (for database containerization)

---

## 3. Environment Setup (.env)

The application enforces configuration validation at startup using `Joi` schema checks. Create a `.env` file in the project root by copying the template:

```bash
cp .env.example .env
```

### Required Configuration Schema

```env
# ==============================================================================
# SERVER ENVIRONMENT
# ==============================================================================
PORT=3000
NODE_ENV=development # Options: development, production, staging, test

# ==============================================================================
# DATABASE SETTINGS
# ==============================================================================
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root_db_password
DB_NAME=ecommerce_auth

# ==============================================================================
# JWT CRYPTOGRAPHIC SECRETS
# Note: For production environments, these secrets MUST be strong random strings
# with a STRICT MINIMUM of 32 characters to prevent bruteforce attacks.
# ==============================================================================
JWT_ACCESS_SECRET=your_jwt_access_secret_key_at_least_32_chars_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_at_least_32_chars_long
GUEST_TOKEN_SECRET=your_guest_token_secret_key_at_least_32_chars_long

# Token Expirations
JWT_ACCESS_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
GUEST_TOKEN_EXPIRES_IN=30d

# ==============================================================================
# EMAIL VERIFICATION CONFIGURATION
# ==============================================================================
VERIFICATION_URL_BASE=http://localhost:3000
VERIFICATION_TOKEN_EXPIRES_IN=86400 # 24 hours in seconds

# ==============================================================================
# GUEST SESSION SETTINGS
# ==============================================================================
GUEST_SESSION_EXPIRES_IN=2592000 # 30 days in seconds

# ==============================================================================
# BCRYPT SECURITY HASHING
# ==============================================================================
BCRYPT_ROUNDS=10 # Allowed range: 8 to 12

# ==============================================================================
# GLOBAL RATE LIMITER (THROTTLER)
# ==============================================================================
THROTTLER_TTL=60      # Window in seconds
THROTTLER_LIMIT=10    # Max requests per window
```

---

## 4. Local Development Guide

Follow these steps to spin up and run the service locally:

### Step 1: Start the Database Container
Run the containerized MySQL database in detached mode:
```bash
docker compose up -d
```
> [!TIP]
> To reset or wipe the local database volume (e.g. for a clean rebuild), stop the service and delete the persistent volume:
> ```bash
> docker compose down -v
> ```

### Step 2: Install Dependencies
Download and install package dependencies:
```bash
npm install
```

### Step 3: Run Database Migrations
Generate and apply the schema to the database using TypeORM migrations:
```bash
npm run migration:run
```

### Step 4: Seed Initial Data
Seed the default categories hierarchy mapping (from standard e-commerce taxonomy):
```bash
npm run seed:categories
```

### Step 5: Run the Development Server
Launch the application with live watch reload enabled:
```bash
npm run start:dev
```
The server will boot and listen on `http://localhost:3000`. Swagger API documentation is served at `http://localhost:3000/api/docs`.

---

## 5. API Architecture & Security Highlights

### Global Interceptors & Exception Filters
* **Standardized Error Layout**: The `GlobalExceptionFilter` intercepts all HTTP and system exceptions, sanitizing validation and error messages. Error responses consistently return:
  ```json
  {
    "success": false,
    "message": "Detailed error string",
    "statusCode": 400
  }
  ```
* **Information Leakage Prevention**: Stack traces and raw SQL queries are automatically caught and logged internally using NestJS `Logger`. Non-HTTP runtime errors are returned to clients as a sanitized `500 Internal server error` message.

### Categories Module Design
* **In-Memory Tree Construction**: Resolves hierarchical category trees efficiently in memory from a flat database search, preventing recursive database load.
* **Active Branch Pruning**: If a parent category is deactivated, all of its descendants are recursively omitted from the public tree response, even if they are individually marked as active.
* **Circular Ancestry Prevention**: Validates modifications to parent nodes recursively, throwing a `400 Bad Request` exception if a cycle (e.g. `A -> B -> A`) is detected.
* **Cache Eviction**: Public read endpoints (`GET /categories`) are cached using `@nestjs/cache-manager`. Write operations (`POST`, `PATCH`, `DELETE`) immediately evict the cache key to maintain consistency.

### Advertisements Module Design
* **Category Linking & Cascade Restrict**: Establishes a Many-to-One link from advertisements to categories using a database-level `{ onDelete: 'RESTRICT' }` constraint. Programmatic validation in `CategoriesService` also checks and blocks category deletions if active ads exist.
* **Active Category Placement Guard**: Restricts advertisements placement to active categories (`is_active = true`). Placement under inactive categories or non-existent categories is validated and rejected with HTTP exceptions in the service layer.
* **Collision-Free Slugs**: Automatically generates unique SEO-friendly URL slugs by combining a slugified version of the title with a `Date.now()` unique timestamp suffix.
* **Media Upload Limitations**: Validates and restricts `images` arrays to a maximum of 5 URLs using whitelist validators (`@ArrayMaxSize(5)`), stored in a MySQL JSON column type.
* **Ownership Access Boundary**: Enforces strict owner-only authorization (`user.sub === advertisement.userId`) via `JwtAuthGuard` and `@CurrentUser()` decorators for updates (`PATCH`) and deletions (`DELETE`). The service method is isolated to allow future Admin override checks.
* **Endpoint caching & Invalidation**: Caches public listings (`GET /advertisements`) and invalidates cache entries immediately on mutations (`POST`, `PATCH`, `DELETE`) to keep cached listings up to date.

### Core Security Practices
1. **Response Serialization (Whitelist Approach)**:
   The application registers a global `ClassSerializerInterceptor` configured with `{ strategy: 'excludeAll' }`. Entities and DTO fields are hidden by default and must be explicitly exposed using the `@Expose()` decorator, ensuring passwords, database hashes, or internal IDs are never leaked to clients.
2. **Rate Limiting (Rate Throttler)**:
   Rate limit policies are applied globally to public-facing endpoints (`/auth/register`, `/auth/login`, `/auth/refresh_token`, `/auth/verify`, and `/categories`) using `@nestjs/throttler` to mitigate brute-force and DDoS attempts.
3. **Session Revocation & Cleanup**:
   A scheduled task (`@Cron`) runs daily to clear expired guest sessions from the database, keeping storage optimized and ensuring expired guest tokens immediately fail DB-backed session checks.
