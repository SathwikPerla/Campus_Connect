# WhisprNet API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "string (3-30 chars)",
  "email": "valid email",
  "password": "string (min 6 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": { ... }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token",
  "user": { ... }
}
```

#### GET /auth/google
Initiate Google OAuth login.

#### GET /auth/google/callback
Google OAuth callback (handled automatically).

#### POST /auth/forgot-password
Send password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

#### GET /auth/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

### Posts

#### GET /posts
Get all approved posts with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Posts per page (default: 10)

**Response:**
```json
{
  "success": true,
  "posts": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### POST /posts/create
Create a new post.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "Post content (1-2000 chars)",
  "image": "optional image URL",
  "isAnonymous": false,
  "tags": ["tag1", "tag2"]
}
```

#### GET /posts/:id
Get a single post by ID.

#### POST /posts/:id/like
Like or unlike a post.

**Headers:** `Authorization: Bearer <token>`

#### PUT /posts/:id
Update a post (owner only).

**Headers:** `Authorization: Bearer <token>`

#### DELETE /posts/:id
Delete a post (owner only).

**Headers:** `Authorization: Bearer <token>`

#### GET /posts/user/:userId
Get posts by a specific user.

### Comments

#### GET /comments/post/:postId
Get comments for a post.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Comments per page

#### POST /comments/create
Create a new comment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "postId": "post-id",
  "text": "Comment text (1-500 chars)",
  "parentComment": "optional parent comment id"
}
```

#### POST /comments/:id/like
Like or unlike a comment.

**Headers:** `Authorization: Bearer <token>`

#### PUT /comments/:id
Update a comment (owner only).

**Headers:** `Authorization: Bearer <token>`

#### DELETE /comments/:id
Delete a comment (owner only).

**Headers:** `Authorization: Bearer <token>`

### Users

#### GET /users/:userId
Get user profile by ID.

#### PUT /users/profile
Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "new-username",
  "avatar": "avatar-url"
}
```

#### GET /users/search/:query
Search users by username or email.

### Chat

#### GET /chat/conversations
Get user's conversations.

**Headers:** `Authorization: Bearer <token>`

#### GET /chat/messages/:otherUserId
Get messages with a specific user.

**Headers:** `Authorization: Bearer <token>`

#### POST /chat/send
Send a message (also handled via Socket.io).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "receiverId": "user-id",
  "text": "message text",
  "messageType": "text",
  "attachment": "optional attachment"
}
```

#### PUT /chat/mark-read/:roomId
Mark messages as read.

**Headers:** `Authorization: Bearer <token>`

#### GET /chat/unread-count
Get unread message count.

**Headers:** `Authorization: Bearer <token>`

## Socket.io Events

### Client to Server

#### join-room
Join a chat room.
```javascript
socket.emit('join-room', roomId);
```

#### send-message
Send a message.
```javascript
socket.emit('send-message', {
  senderId: 'user-id',
  receiverId: 'user-id',
  text: 'message text',
  roomId: 'room-id'
});
```

#### typing
Send typing indicator.
```javascript
socket.emit('typing', {
  roomId: 'room-id',
  userId: 'user-id',
  username: 'username',
  isTyping: true
});
```

### Server to Client

#### receive-message
Receive a new message.
```javascript
socket.on('receive-message', (message) => {
  // Handle new message
});
```

#### user-typing
Receive typing indicator.
```javascript
socket.on('user-typing', (data) => {
  // Handle typing indicator
});
```

#### message-error
Receive message error.
```javascript
socket.on('message-error', (error) => {
  // Handle error
});
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15 minutes per IP address.

## AI Moderation

Posts and comments are automatically moderated before being saved. If content is flagged as inappropriate, the request will be rejected with a moderation message.




