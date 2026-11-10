# Secure Note-Taking Application

A complete REST API with role-based access control (RBAC), JWT authentication, strictly optimized MongoDB indexes, aggregation pipelines, pagination, and a functional frontend.

## Key Features
- **Authentication & RBAC**: Secure password hashing with `bcryptjs`, JWT bearer authentication, and role separation (`user` vs `admin`).
- **Strict Indexing Strategy**: All indexes are defined explicitly via `schema.index(...)` without any unnecessary or duplicate indexes.
- **Pagination**: All list operations support indexed pagination (`page`, `limit`, `totalPages`, `hasNextPage`, `hasPrevPage`).
- **Aggregation Pipelines**:
  - **Scenario 1 (Group by Interests)**: Exactly one `collection.aggregate()` call unwinding and grouping users by interests, backed by `{ interests: 1 }` multikey index.
  - **Scenario 2 (User Posts $lookup)**: Single aggregation pipeline with `$lookup` to join posts for a specific user, backed by `{ userId: 1, createdAt: -1 }` on Posts.
- **Functional Frontend**: Integrated single-page interface to test auth, note CRUD, admin capabilities, and both aggregation queries.

