# Redis Session Storage

A Node.js application that implements user authentication and session management using Redis as the session store. This project demonstrates how to create a secure and scalable session management system with Express.js, Redis, and Prisma.

## Features

- User registration and authentication
- Secure password hashing with bcryptjs
- Session management with Redis
- Session expiration (7 days)
- User data persistence with Prisma ORM
- TypeScript for type safety
- Error handling middleware

## Technologies

- **Node.js**: JavaScript runtime
- **Express.js**: Web server framework
- **TypeScript**: Type-safe JavaScript
- **Redis**: In-memory data store for session management
- **Prisma ORM**: Database access layer
- **SQLite**: Database for development
- **bcryptjs**: Password hashing library
- **cookie-parser**: Cookie handling middleware
- **express-async-errors**: Async error handling

## Prerequisites

- Node.js (v14 or higher)
- Redis server running locally or remotely
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd session-storage
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

4. Start the Redis server (if not already running):
   ```bash
   redis-server
   ```

5. Start the application:
   ```bash
   npm run dev
   ```

## Project Structure

```
session-storage/
├── prisma/
│   ├── migrations/       # Database migrations
│   ├── schema.prisma     # Prisma schema
│   └── dev.db            # SQLite database
├── src/
│   ├── @types/
│   │   └── express.d.ts  # Express type definitions
│   ├── errorHandler.ts   # Error handling middleware
│   ├── index.ts          # Main application entry point
│   ├── prisma.ts         # Prisma client configuration
│   ├── redis.ts          # Redis client configuration
│   └── sessionHandler.ts # Session handling middleware
├── package.json
└── tsconfig.json
```

## Configuration

### Redis Configuration

The Redis client is configured in `src/redis.ts`. By default, it connects to a local Redis server:

```typescript
import Redis from "ioredis";

const redis = new Redis({
  host: "localhost",
  port: 6379,
});

export { redis };
```

You can modify the configuration to connect to a remote Redis server by updating the host and port values.

### Database Configuration

The database is configured in `prisma/schema.prisma`. By default, it uses SQLite:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

For production, you might want to switch to a more robust database like PostgreSQL or MySQL.

## API Endpoints

### User Registration

- **URL**: `/user`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": "clq1234abcdef",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-03-30T20:00:00.000Z",
      "updateAt": "2025-03-30T20:00:00.000Z"
    },
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```

### User Sign In

- **URL**: `/user/signin`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "id": "clq1234abcdef",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-03-30T20:00:00.000Z",
    "updateAt": "2025-03-30T20:00:00.000Z"
  }
  ```

### Get User Information

- **URL**: `/user`
- **Method**: `GET`
- **Headers**: Cookie with session-id
- **Response**:
  ```json
  {
    "id": "clq1234abcdef",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-03-30T20:00:00.000Z",
    "updateAt": "2025-03-30T20:00:00.000Z"
  }
  ```

### Sign Out (Delete Session)

- **URL**: `/user/session`
- **Method**: `DELETE`
- **Headers**: Cookie with session-id
- **Response**: Status 204 (No Content)

## Session Management

Sessions are stored in Redis with a 7-day expiration. The session data is stored as a hash with the key `session:{sessionId}`. The session ID is stored in a cookie named `session-id`.

The `sessionHandler` middleware validates the session and attaches the user data to the request object:

```typescript
export async function sessionHandler(request: Request, response: Response, next: NextFunction) {
  const sessionId = request.cookies["session-id"];
  if (!sessionId) {
    request.session = null;
    return next();
  }

  const REDIS_SESSION_KEY = `session:${sessionId}`;
  const userHasValidSession = await redis.exists(REDIS_SESSION_KEY);
  if (!userHasValidSession) {
    request.session = null;
    return next();
  }

  const userSession = await redis.hgetall(REDIS_SESSION_KEY);

  const userData: UserSession = {
    id: userSession.id,
    name: userSession.name,
    email: userSession.email,
    createdAt: new Date(userSession.createdAt),
    updatedAt: new Date(userSession.updatedAt),
  };
  request.session = userData;

  next();
}
```

## Development

To start the development server with hot reloading:

```bash
npm run dev
```

## License

ISC
