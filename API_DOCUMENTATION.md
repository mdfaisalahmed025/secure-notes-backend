# API Documentation: Secure Note-Taking Application

Base URL: `http://187.53.142.30:5000/api` (Live on VPS) or `http://localhost:5000/api` (Local)

---

## 1. Authentication Endpoints

### Register User
- **Method**: `POST`
- **Endpoint**: `/auth/register`
- **Body**:
  ```json
  {
    "username": "alice",
    "email": "alice@example.com",
    "password": "Password123!",
    "role": "user",
    "interests": ["chess", "reading", "ai"]
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "_id": "6af2bb...",
      "username": "alice",
      "email": "alice@example.com",
      "role": "user",
      "interests": ["chess", "reading", "ai"],
      "token": "eyJhbGciOi..."
    }
  }
  ```

### Login User
- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Index Support**: Handled by `{ email: 1 }` (unique).
- **Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "_id": "6af2bb...",
      "username": "alice",
      "email": "alice@example.com",
      "role": "user",
      "interests": ["chess", "reading", "ai"],
      "token": "eyJhbGciOi..."
    }
  }
  ```

### Get Current User Profile
- **Method**: `GET`
- **Endpoint**: `/auth/me`
- **Headers**: `Authorization: Bearer <token>`

---

## 2. Notes Endpoints (User & Admin)

### Create Note
- **Method**: `POST`
- **Endpoint**: `/notes`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Architecture RFC",
    "content": "Designing compound index strategy for MongoDB collections."
  }
  ```

### Get My Notes (Paginated)
- **Method**: `GET`
- **Endpoint**: `/notes?page=1&limit=5`
- **Headers**: `Authorization: Bearer <token>`
- **Index Support**: Covered by compound index `{ userId: 1, createdAt: -1 }`.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [...],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

### Get Specific Note
- **Method**: `GET`
- **Endpoint**: `/notes/:id`
- **Headers**: `Authorization: Bearer <token>`
- **RBAC Rule**: User can only view their own note; Admin can view any note.

### Update Note
- **Method**: `PUT`
- **Endpoint**: `/notes/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Updated Title",
    "content": "Updated Content"
  }
  ```

### Delete Note
- **Method**: `DELETE`
- **Endpoint**: `/notes/:id`
- **Headers**: `Authorization: Bearer <token>`

---

## 3. Admin Endpoints (Admin Role Only)

### List All Users (Paginated)
- **Method**: `GET`
- **Endpoint**: `/admin/users?page=1&limit=10`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Index Support**: Covered by `{ createdAt: -1 }` on `User` collection.

### Create User by Admin
- **Method**: `POST`
- **Endpoint**: `/admin/users`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Body**:
  ```json
  {
    "username": "devops_user",
    "email": "devops@example.com",
    "password": "Password123!",
    "role": "admin",
    "interests": ["docker", "k8s", "linux"]
  }
  ```

### Delete User (Cascade Delete)
- **Method**: `DELETE`
- **Endpoint**: `/admin/users/:id`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Action**: Deletes user and cascade removes all notes and posts created by this user.

### List Everyone's Notes (Paginated)
- **Method**: `GET`
- **Endpoint**: `/admin/notes?page=1&limit=10`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Index Support**: Covered by `{ createdAt: -1 }` on `Note` collection.

---

## 4. Aggregation Scenarios

### Scenario 1: Group Users by Interests
- **Method**: `GET`
- **Endpoint**: `/aggregations/group-by-interests`
- **Headers**: `Authorization: Bearer <token>`
- **Index Support**: Multikey index `{ interests: 1 }` on `User` collection.
- **Pipeline Implementation**:
  ```javascript
  User.aggregate([
    { $unwind: "$interests" },
    {
      $group: {
        _id: "$interests",
        totalUsers: { $sum: 1 },
        users: {
          $push: {
            _id: "$_id",
            username: "$username",
            email: "$email",
            role: "$role"
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  ```

### Scenario 2: User Posts ($lookup)
- **Method**: `GET`
- **Endpoint**: `/aggregations/user-posts/:userId`
- **Headers**: `Authorization: Bearer <token>`
- **Index Support**: `{ userId: 1, createdAt: -1 }` on `Post` collection.
- **Pipeline Implementation**:
  ```javascript
  User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "userId",
        as: "posts"
      }
    },
    {
      $project: {
        _id: 1,
        username: 1,
        email: 1,
        role: 1,
        interests: 1,
        totalPosts: { $size: "$posts" },
        posts: 1
      }
    }
  ]);
  ```

---

## 5. Public Posts Endpoints

### Publish Post
- **Method**: `POST`
- **Endpoint**: `/posts`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Quantum Computing 101",
    "content": "Exploring qubits, superposition, and entanglement."
  }
  ```

### List Public Posts (Paginated)
- **Method**: `GET`
- **Endpoint**: `/posts?page=1&limit=10`
- **Access**: Public / Authenticated
