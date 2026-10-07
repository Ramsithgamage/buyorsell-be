# 📂 NestJS Categories Module Documentation

## 📋 Project Overview

The **Categories Module** provides a flexible and efficient self-referencing hierarchical structure for categorizing products (e.g., *Mobiles -> Mobile Phones -> Mobile Phone Accessories*). It includes features designed to maintain database integrity, support search-engine optimized (SEO) URLs, optimize request speeds, and simplify administration.

Key technical components include:
- **NestJS** - Framework
- **TypeORM & MySQL** - Database mapping and self-referencing tables
- **In-Memory Tree Building** - Custom algorithm for scalable category retrieval
- **Recursive Ancestor Filtering** - Inactive categories prune their entire sub-tree from public responses
- **Circular Ancestry Prevention** - Validates parent assignment to prevent infinite loops (e.g., `A -> B -> A`)
- **Write-Eviction Caching** - In-memory caching for read operations, invalidated automatically on database updates
- **Cascade Strategy** - Promotion of child subcategories to roots (`ON DELETE SET NULL`) when a parent category is deleted to protect existing product associations

---

## 🏗️ Category Architecture & Flow Diagrams

### 1. In-Memory Tree Construction
Instead of running expensive database recursive queries (such as CTEs) which are database-vendor dependent, the service loads categories in a flat array and reconstructs the hierarchy in-memory.

```
Database (Flat Categories)
  ├─ Mobiles (id: 1, parent: null)
  ├─ Mobile Phones (id: 2, parent: 1)
  └─ Accessories (id: 3, parent: 2)
              ↓
  Custom In-Memory Tree Builder
              ↓
Category Tree Response JSON
{
  "id": 1,
  "name": "Mobiles",
  "children": [
    {
      "id": 2,
      "name": "Mobile Phones",
      "children": [
        {
          "id": 3,
          "name": "Accessories",
          "children": []
        }
      ]
    }
  ]
}
```

### 2. Active Branch Pruning (Public Endpoint Only)
If a category is deactivated (`isActive = false`), it and all its children/descendants are recursively removed from the public category tree, ensuring inactive sections are hidden from consumers.

```
[Mobiles (Active)] ──► [Mobile Phones (Inactive)] ──► [Accessories (Active)]
                                  │                             │
                        (Descendants Pruned)          (Descendants Pruned)
                                  ▼                             ▼
                           Omitted from Tree             Omitted from Tree
```

### 3. Circular Loop Prevention
During any updates to `parentId`, the system recursively climbs the ancestor chain of the proposed parent to ensure the current category's own `id` is not present, avoiding circular relationships.

```
Change A's parent to C:
[A] ◄── [B] ◄── [C]
 ▲               │
 │               ▼
 └─(Checks Chain: A is in C's ancestry!) ──► Throws 400 Bad Request
```

---

## 🗄️ Database Schema

### `categories` Table

```sql
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    is_active TINYINT NOT NULL DEFAULT 1,
    parent_id INT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) 
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT FK_categories_parent_id 
        FOREIGN KEY (parent_id) 
        REFERENCES categories(id) 
        ON DELETE SET NULL
);

-- Indexing
CREATE UNIQUE INDEX IDX_categories_name ON categories(name);
CREATE UNIQUE INDEX IDX_categories_slug ON categories(slug);
CREATE INDEX IDX_categories_parent_id ON categories(parent_id);
```

#### Cascade Deletion Strategy (Logical Soft Delete)
Instead of deleting records from the database or setting child `parent_id` parameters to NULL, the module uses a **Logical Cascading Inactivation Strategy** to preserve structural integrity. When a category is deleted, the target category and all its deep descendants are recursively updated to `isActive = false` in the database, preserving all existing parent-child relationships and product associations.

---

## 🔌 API Endpoints

### 1. Get Categories Tree

**Request**
```
GET /categories
```

**Authentication:** None (Public)

**Caching:** ✅ **Cached** (Returns cached structure. Evicts immediately on creation, modification, or deletion).

**Description:** Returns the active category tree hierarchy. Inactive branches are excluded.

**Response**
```json
[
  {
    "id": 1,
    "name": "Mobiles",
    "slug": "mobiles",
    "isActive": true,
    "parentId": null,
    "createdAt": "2026-06-25T12:00:00.000Z",
    "updatedAt": "2026-06-25T12:00:00.000Z",
    "children": [
      {
        "id": 2,
        "name": "Mobile Phones",
        "slug": "mobile-phones",
        "isActive": true,
        "parentId": 1,
        "createdAt": "2026-06-25T12:00:00.000Z",
        "updatedAt": "2026-06-25T12:00:00.000Z",
        "children": []
      }
    ]
  }
]
```

---

### 2. Create Category

**Request**
```
POST /categories
```

**Authentication:** ✅ **Access Token Required**

**Headers**
```
Authorization: Bearer <access-token>
```

**Body**
```json
{
  "name": "Computers & Tablets",
  "slug": "computers-tablets",
  "isActive": true,
  "parentId": 2
}
```

*Note: If `slug` is omitted, it will automatically be generated in lowercase, URL-friendly format using `slugify`.*

**Response**
```json
{
  "id": 3,
  "name": "Computers & Tablets",
  "slug": "computers-tablets",
  "isActive": true,
  "parentId": 2,
  "createdAt": "2026-06-25T12:05:00.000Z",
  "updatedAt": "2026-06-25T12:05:00.000Z",
  "children": []
}
```

---

### 3. Update Category

**Request**
```
PATCH /categories/:id
```

**Authentication:** ✅ **Access Token Required**

**Headers**
```
Authorization: Bearer <access-token>
```

**Body**
```json
{
  "name": "Laptop Accessories",
  "parentId": null
}
```

**Response**
```json
{
  "id": 3,
  "name": "Laptop Accessories",
  "slug": "computers-tablets",
  "isActive": true,
  "parentId": null,
  "createdAt": "2026-06-25T12:05:00.000Z",
  "updatedAt": "2026-06-25T12:10:00.000Z",
  "children": []
}
```

---

### 4. Delete Category (Logical Soft Delete / Deactivation)

**Request**
```
DELETE /categories/:id
```

**Authentication:** ✅ **Access Token Required (Requires ADMIN role)**

**Headers**
```
Authorization: Bearer <access-token>
```

**Response**
- `204 No Content`: Successful deactivation of the category and all its descendants.
- `404 Not Found`: Category does not exist.
- `409 Conflict`: The target category or any of its descendants contains active advertisements.

**Description:** Performs a recursive deactivation cascade:
1. Validates category exists.
2. Traverses and collects all descendant categories.
3. Checks if any of these categories contain active advertisements; if they do, throws a `ConflictException` (409).
4. Recursively updates the `isActive` column to `false` for the category and all its descendants.
5. Evicts the `'categories_tree_active'` key from the cache.

---

## 🗃️ Data Validation (DTOs)

### `CreateCategoryDto`
- `name`: `@IsString()`, `@IsNotEmpty()`, `@MinLength(2)`, `@MaxLength(100)`
- `slug`: `@IsOptional()`, `@IsString()`, `@MinLength(2)`, `@MaxLength(120)` (checked against `^[a-z0-9]+(?:-[a-z0-9]+)*$` pattern)
- `isActive`: `@IsOptional()`, `@IsBoolean()`
- `parentId`: `@IsOptional()`, `@IsInt()`, `@Min(1)`

### `UpdateCategoryDto`
- Implements `PartialType(CreateCategoryDto)`, allowing any individual field to be updated optionally.

---

## 📁 NestJS Module Structure

```
src/
│
├── categories/
│   ├── dto/
│   │   ├── create-category.dto.ts
│   │   ├── update-category.dto.ts
│   │   └── category-response.dto.ts
│   │
│   ├── entities/
│   │   └── category.entity.ts
│   │
│   ├── categories.controller.ts
│   ├── categories.module.ts
│   └── categories.service.ts
│
├── database/
│   ├── data-source.ts
│   ├── migrations/
│   │   └── 1782381982504-AddCategoriesTable.ts
│   └── seeds/
│       └── category.seed.ts
│
└── app.module.ts
```

---

## 🚀 Setup Commands

### Run Schema Migrations
Applies the Category schema database structure:
```powershell
npm run migration:run
```

### Seed Default Database Categories
Populates standard catalog hierarchies (Mobiles, Electronics, Vehicles, Property, Essentials, etc.) parsed from the project's specification documents:
```powershell
npm run seed:categories
```

### Verify Using Swagger Docs
Visit the local interactive API page at:
`http://localhost:3000/api/docs`
