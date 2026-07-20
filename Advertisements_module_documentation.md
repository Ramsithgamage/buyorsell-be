# 📢 NestJS Advertisements Module Documentation

## 📋 Project Overview

The **Advertisements Module** handles user-posted advertisements within the e-commerce application. It links advertisements to their respective catalog categories, ensures SEO-optimized URL routing, enforces upload limits, protects mutating endpoints with owner-only access controls, and optimizes listing read queries using caching.

Key technical features include:
- **NestJS Framework** - Route matching, authorization guards, serialization, and dependency management.
- **TypeORM & MySQL** - Relational mapping, transaction handling, and table constraint checking.
- **Active Category Placement Guard** - Enforces that advertisements are only placed under categories with `isActive = true`.
- **Collision-Free Slugs** - Automatically creates unique URLs by appending a timestamp suffix to a slugified version of the title.
- **Media Support** - Custom array-size validator checking and restricting uploads to a maximum of 5 images.
- **Ownership Boundary Enforcement** - Restricts `PATCH` and `DELETE` mutations to the advertisement creator (`user.sub === advertisement.userId`). Isolates ownership checks to allow future Admin override extensions.
- **Write-Eviction Caching** - Stores public listing queries in local memory cache, evicting all listing caches immediately upon any creation, update, or deletion.
- **Cascade Deletion Restriction (`RESTRICT`)** - Establishes a database-level restrict constraint that blocks deleting categories that contain advertisements.
- **Advertisement Archival** - Safely moves deleted advertisements to an `advertisement_archives` table within a TypeORM transaction to maintain a history of deleted listings.

---

## 🏗️ Architecture & Flow Diagrams

### 1. Creation Flow (Active Category Validation)
Before an advertisement is saved, the service verifies that the category exists and is currently active.

```
POST /advertisements
        │
        ▼
CategoriesService.findById(categoryId)
        │
   (Not Found) ──► Throws 440 Not Found
        │
   (Exists)
        ▼
Check if category.isActive === true
        │
     (False) ──► Throws 400 Bad Request
        │
     (True)
        ▼
Auto-generate unique slug (title + Date.now())
        ▼
Save to Database & Evict cache
```

### 2. Mutation Flow (Access Boundary)
Protected endpoints (`PATCH` and `DELETE`) ensure the modifying client matches the owner user stored in the database.

```
PATCH/DELETE /advertisements/:id
        │
        ▼
Extract user context from @CurrentUser()
        ▼
Fetch advertisement details from DB
        │
    (Not Found) ──► Throws 404 Not Found
        │
    (Exists)
        ▼
Check: user.sub === advertisement.userId
        │
     (False) ──► Throws 403 Forbidden
        │
     (True)
        ▼
Proceed with DB mutation & Evict cache
```

### 3. Category Deletion Protection
MySQL schema restrictions combined with service checks protect category taxonomy mapping integrity.

```
DELETE /categories/:id
        │
        ▼
Fetch Category with relations: ['advertisements']
        ▼
Verify if any advertisements are active
        │
     (True) ──► Throws 409 Conflict (Programmatic safety)
        │
     (False)
        ▼
Attempt Database REMOVE query
        │
  (DB RESTRICT fails if any ad exists) ──► Throws 409 Conflict (DB Safety net)
        │
  (No ads exist)
        ▼
Category Deleted successfully
```

### 4. Deletion & Archival Flow
When an advertisement is deleted, it is safely moved to an archive table inside a transaction.

```
DELETE /advertisements/:id
        │
        ▼
Extract user context & verify ownership/admin
        ▼
Begin Database Transaction
        │
    (Inside Transaction)
        ▼
Create AdvertisementArchive record
        ▼
Save to advertisement_archives table
        ▼
Delete from advertisements table
        │
    (Transaction Commit)
        ▼
Return 204 No Content & Evict cache
```

---

## 🗄️ Database Schema

### `advertisements` Table

```sql
CREATE TABLE advertisements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    images JSON NULL,
    is_active TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) 
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT FK_advertisements_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,

    CONSTRAINT FK_advertisements_category_id 
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE RESTRICT
);

-- Indexing
CREATE UNIQUE INDEX IDX_advertisements_slug ON advertisements(slug);
CREATE INDEX IDX_advertisements_user_id ON advertisements(user_id);
CREATE INDEX IDX_advertisements_category_id ON advertisements(category_id);
```

### `advertisement_archives` Table

```sql
CREATE TABLE advertisement_archives (
    id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    images JSON NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    archived_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    archived_by INT NOT NULL
);
```

---

## 🔌 API Endpoints

### 1. Get All Active Advertisements

**Request**
```
GET /advertisements
```
*Query Params (Optional):* `categoryId` (number)

**Authentication:** None (Public)

**Caching:** ✅ **Cached** (Evicted immediately on creation, modification, or deletion).

**Response**
```json
[
  {
    "id": 1,
    "title": "MacBook Pro M3",
    "slug": "macbook-pro-m3-1782978972642",
    "description": "Brand new MacBook Pro M3 with 16GB RAM",
    "price": 1999.99,
    "userId": 1,
    "categoryId": 3,
    "images": [
      "https://example.com/mac1.jpg",
      "https://example.com/mac2.jpg"
    ],
    "isActive": true,
    "createdAt": "2026-07-02T13:00:00.000Z",
    "updatedAt": "2026-07-02T13:00:00.000Z"
  }
]
```

---

### 2. Get Specific Advertisement

**Request**
```
GET /advertisements/:id
```

**Authentication:** None (Public)

**Response**
```json
{
  "id": 1,
  "title": "MacBook Pro M3",
  "slug": "macbook-pro-m3-1782978972642",
  "description": "Brand new MacBook Pro M3 with 16GB RAM",
  "price": 1999.99,
  "userId": 1,
  "categoryId": 3,
  "images": [
    "https://example.com/mac1.jpg"
  ],
  "isActive": true,
  "createdAt": "2026-07-02T13:00:00.000Z",
  "updatedAt": "2026-07-02T13:00:00.000Z"
}
```

---

### 3. Create Advertisement

**Request**
```
POST /advertisements
```

**Authentication:** ✅ **Access Token Required**

**Headers**
```
Authorization: Bearer <access-token>
```

**Body**
```json
{
  "title": "MacBook Pro M3",
  "description": "Brand new MacBook Pro M3 with 16GB RAM",
  "price": 1999.99,
  "categoryId": 3,
  "images": [
    "https://example.com/mac1.jpg",
    "https://example.com/mac2.jpg"
  ]
}
```

**Response**
```json
{
  "id": 1,
  "title": "MacBook Pro M3",
  "slug": "macbook-pro-m3-1782978972642",
  "description": "Brand new MacBook Pro M3 with 16GB RAM",
  "price": 1999.99,
  "userId": 1,
  "categoryId": 3,
  "images": [
    "https://example.com/mac1.jpg",
    "https://example.com/mac2.jpg"
  ],
  "isActive": true,
  "createdAt": "2026-07-02T13:05:00.000Z",
  "updatedAt": "2026-07-02T13:05:00.000Z"
}
```

---

### 4. Update Advertisement

**Request**
```
PATCH /advertisements/:id
```

**Authentication:** ✅ **Access Token Required (Owner Only)**

**Headers**
```
Authorization: Bearer <access-token>
```

**Body**
```json
{
  "price": 1850.00
}
```

**Response**
```json
{
  "id": 1,
  "title": "MacBook Pro M3",
  "slug": "macbook-pro-m3-1782978972642",
  "description": "Brand new MacBook Pro M3 with 16GB RAM",
  "price": 1850.00,
  "userId": 1,
  "categoryId": 3,
  "images": [
    "https://example.com/mac1.jpg"
  ],
  "isActive": true,
  "createdAt": "2026-07-02T13:05:00.000Z",
  "updatedAt": "2026-07-02T13:10:00.000Z"
}
```

---

### 5. Delete Advertisement

**Request**
```
DELETE /advertisements/:id
```

**Authentication:** ✅ **Access Token Required (Owner or APPROVED ADMIN Only)**

**Headers**
```
Authorization: Bearer <access-token>
```

**Response**
```
204 No Content
```

---

## 🗃️ Data Validation (DTOs)

### `CreateAdDto`
- `title`: `@IsString()`, `@IsNotEmpty()`
- `description`: `@IsString()`, `@IsNotEmpty()`
- `price`: `@IsNumber()`, `@IsPositive()`, `@Min(0)`
- `categoryId`: `@IsInt()`, `@IsPositive()`
- `images`: `@IsOptional()`, `@IsArray()`, `@IsString({ each: true })`, `@ArrayMaxSize(5)`
- `isActive`: `@IsOptional()`, `@IsBoolean()`

### `UpdateAdDto`
- Inherits `PartialType(CreateAdDto)`. Any field is optional for updates.

### `AdResponseDto`
- Serialized response target. Every field is explicitly configured with `@Expose()` (class-transformer) and `@ApiProperty()` (NestJS Swagger) to ensure zero internal database keys or raw attributes leak to consumers.

---

## 📁 NestJS Module Structure

```
src/
│
├── advertisements/
│   ├── dto/
│   │   ├── create-ad.dto.ts
│   │   ├── update-ad.dto.ts
│   │   └── ad-response.dto.ts
│   │
│   ├── entities/
│   │   ├── advertisement.entity.ts
│   │   └── advertisement-archive.entity.ts
│   │
│   ├── advertisements.controller.ts
│   ├── advertisements.module.ts
│   └── advertisements.service.ts
│
├── categories/
│   ├── entities/
│   │   └── category.entity.ts
│   └── categories.service.ts
│
├── database/
│   ├── data-source.ts
│   └── migrations/
│       └── 1782978972642-AddAdvertisementsTable.ts
│
└── app.module.ts
```

---

## 🚀 Setup & Testing Commands

### Apply Migration Scheme
Applies database layout, unique indexes, and foreign key cascades/restrictions:
```bash
npm run migration:run
```

### Run Unit Tests
Runs the service and controller test suites verifying business logic rules and ownership bounds:
```bash
npx jest src/advertisements
```

### Run E2E Integration Tests
Runs the end-to-end user request flows including token validation, creation limits, and deletion restrictions:
```bash
npm run test:e2e
```
