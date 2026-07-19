# 📊 NestJS API Logging Module Documentation

## 📋 Overview

The `ApiLogModule` implements an **asynchronous, fire-and-forget API request and response logging system** for the NestJS e-commerce application. It captures request metadata, execution duration, and response status codes, storing them in a dedicated MySQL database table (Leter move on to a dedicated DB).

### Key Features

- ⚡ **Non-Blocking Execution**: Database write operations run asynchronously outside the application response promise chain (fire-and-forget). Failure to save logs does not block or impact the user's request.
- 🔒 **Security & Sensitive Data Masking**: Automatically clones incoming payloads and replaces sensitive fields (like `password`, `token`, `accessToken`, `refreshToken`) with a masked string (`********`) to prevent accidental storage of credentials.
- 🕒 **Performance Tracking**: Records execution time using high-resolution performance markers (`performance.now()`).
- 🧹 **Automated Retention**: Runs a daily CRON cleanup job at midnight to delete logs older than 7 days, maintaining a stable database size.
- 🛡️ **Guards-Only Scope**: In compliance with the NestJS lifecycle, only requests that successfully pass global Guards and reach the interceptor/controller layer are logged.

---

## 🏗️ Architecture & Request Flow

The logging system is built around a global `NestInterceptor` and a scheduled cleanup service.

```
Incoming Request
       │
       ▼
   [Guards] (e.g. ThrottlerGuard, AuthGuard)
       │
  ┌────┴──────────────────────────┐
  │ Pass                          │ Fail (Throws)
  ▼                               ▼
[ApiLogInterceptor]       [Exception Filter]
  │ (Start Timing)                │
  ▼                               ▼
[Controller Handler]     (Skip Interceptor)
  │ (Success/Error)
  ▼
[ApiLogInterceptor] (End Timing)
  ├─────────────────────────────────────────┐
  │                                         │
  ▼ (Standard NestJS chain)                 ▼ (Async / Non-blocking)
Return client response              Save to `api_logs`
                                            │
                                            ▼ (If DB Fails)
                                    Catch & log to console
```

---

## 🗄️ Database Schema

### `api_logs` Table

The database schema maps to the `ApiLog` entity with the following layout:

```sql
CREATE TABLE `api_logs` (
  `id` VARCHAR(36) NOT NULL,
  `method` VARCHAR(10) NOT NULL,
  `path` VARCHAR(255) NOT NULL,
  `statusCode` INT NOT NULL,
  `durationMs` INT NOT NULL,
  `userId` INT NULL,
  `metadata` JSON NOT NULL,
  `createdAt` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `IDX_API_LOGS_METHOD` (`method`),
  INDEX `IDX_API_LOGS_STATUS_CODE` (`statusCode`),
  INDEX `IDX_API_LOGS_USER_ID` (`userId`),
  INDEX `IDX_API_LOGS_CREATED_AT` (`createdAt`)
) ENGINE=InnoDB;
```

#### Field Specifications
*   `id`: Primary key, auto-generated UUID (`varchar(36)`).
*   `method`: HTTP verb (e.g., `GET`, `POST`, `PUT`, `DELETE`). Indexed.
*   `path`: Request URL path.
*   `statusCode`: Response HTTP status code (e.g., `200`, `201`, `400`, `500`). Indexed.
*   `durationMs`: High-precision request execution time in milliseconds.
*   `userId`: The database ID of the authenticated user (nullable for public endpoints). Indexed.
*   `metadata`: JSON column containing query parameters, deep-masked body, and any caught exception messages.
*   `createdAt`: Timestamp of when the request was processed. Indexed.

---

## 🔌 Code & Components

### 1. The Entity: `ApiLog`
*Path:* [api-log.entity.ts](file:///d:/Industry%20Project/Recfort/ecomm-api/src/api-log/entities/api-log.entity.ts)

Explicitly defines TypeORM bindings. Uses uppercase deterministic index names to avoid database naming collision/migration drifts on different machines.

### 2. The Interceptor: `ApiLogInterceptor`
*Path:* [api-log.interceptor.ts](file:///d:/Industry%20Project/Recfort/ecomm-api/src/api-log/api-log.interceptor.ts)

- **Performance Timing**: Captures high-resolution duration via `performance.now()`.
- **Payload Masking**: Performs safe recursive traversal of request payload object keys:
  ```typescript
  const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken'];
  ```
- **Error Capturing**: Converts thrown exceptions into standard logs without interfering with the NestJS `GlobalExceptionFilter` response formats.
- **Asynchronous Execution**: Launches repository `.save(apiLog)` inside an isolated thread/promise context, handling errors in a standard NestJS console logger:
  ```typescript
  this.logRepository.save(apiLog).catch((err) => {
    this.consoleLogger.error('Failed to save API log to database', err);
  });
  ```

### 3. Log Retention: `ApiLogCleanupService`
*Path:* [api-log-cleanup.service.ts](file:///d:/Industry%20Project/Recfort/ecomm-api/src/api-log/api-log-cleanup.service.ts)

Utilizes `@nestjs/schedule` to run a daily cleanup operation:
```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async cleanupOldLogs() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  await this.logRepository.delete({
    createdAt: LessThan(sevenDaysAgo)
  });
}
```

### 4. Integration Module: `ApiLogModule`
*Path:* [api-log.module.ts](file:///d:/Industry%20Project/Recfort/ecomm-api/src/api-log/api-log.module.ts)

Binds `ApiLogInterceptor` to the global `APP_INTERCEPTOR` provider token so it automatically processes every request routed to controllers.

---

## 🛠️ Verification & Run Steps

### Running Migration
Apply the database changes manually:
```bash
npm run migration:run
```

### Manual Testing
1. Send a request to any controller (e.g. `POST /auth/login`).
2. Run database query `SELECT * FROM api_logs;` to verify the log schema is correctly populated.
3. Validate that:
   - Sensitive fields in `metadata.body` are masked with `********`.
   - Execution duration is measured accurately (`durationMs`).
   - `userId` is correctly extracted from the JWT token for authenticated endpoints.
