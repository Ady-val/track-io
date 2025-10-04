# Backend Receptor - Track.IO

Backend service for receiving and processing signals with PostgreSQL database integration.

## Features

- **Signal Processing**: Receive and process signal data via REST API
- **Database Integration**: Store signals in PostgreSQL using TypeORM
- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **Data Persistence**: Automatic timestamps and data validation
- **API Endpoints**: Complete CRUD operations for signals

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Language**: TypeScript
- **Package Manager**: pnpm

## Database Schema

### raw_signals Table

```sql
CREATE TABLE raw_signals (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### POST /signals

Create a new signal

**Request Body:**

```json
{
  "id": "signal_001",
  "value": "temperature:25.5"
}
```

**Response:**

```json
{
  "message": "Signal processed successfully",
  "data": {
    "id": 1,
    "externalId": "signal_001",
    "value": "temperature:25.5",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

### GET /signals

Get all signals with optional filters

**Query Parameters:**

- `externalId` (optional): Filter by external ID
- `limit` (optional, default: 10): Number of records to return
- `offset` (optional, default: 0): Number of records to skip
- `startDate` (optional): Filter by start date (ISO string)
- `endDate` (optional): Filter by end date (ISO string)

**Response:**

```json
{
  "message": "Signals retrieved successfully",
  "data": [...],
  "total": 100,
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 100
  }
}
```

### GET /signals/count

Get total count of signals

**Response:**

```json
{
  "message": "Signals count retrieved successfully",
  "count": 100
}
```

### GET /signals/:id

Get signal by database ID

### GET /signals/external/:externalId

Get all signals by external ID

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp env.example .env
```

Update the `.env` file with your database configuration:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=track_io

# Application Configuration
PORT=3000
NODE_ENV=development
```

### 3. Start the Database

Make sure PostgreSQL is running. You can use the Docker setup from the `database/` folder:

```bash
cd ../database
docker-compose up -d
```

### 4. Run the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

## Project Structure

```
src/
├── signals/
│   ├── application/
│   │   ├── dtos/
│   │   │   └── signal.dto.ts          # Data Transfer Objects
│   │   └── services/
│   │       └── signal.service.ts      # Business logic
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── signal.entity.ts       # Domain entity
│   │   │   └── raw-signal.entity.ts   # Database entity
│   │   └── repositories/
│   │       └── raw-signal.repository.ts # Data access layer
│   ├── presentation/
│   │   └── controllers/
│   │       └── signal.controller.ts   # REST API endpoints
│   └── signals.module.ts              # Module configuration
├── app.module.ts                      # Main application module
└── main.ts                           # Application entry point
```

## Development Commands

```bash
# Start development server
pnpm run start:dev

# Build the application
pnpm run build

# Run tests
pnpm run test

# Run linting
pnpm run lint

# Format code
pnpm run format

# Check formatting
pnpm run format:check
```

## Database Integration

The application uses TypeORM for database operations with the following features:

- **Entity Mapping**: Automatic mapping between TypeScript classes and database tables
- **Repository Pattern**: Clean data access layer with custom repository
- **Migrations**: Automatic schema synchronization in development
- **Connection Pooling**: Efficient database connection management
- **Query Building**: Type-safe query construction

## Error Handling

The application includes comprehensive error handling:

- **Database Errors**: Proper error logging and user-friendly messages
- **Validation Errors**: Input validation with class-validator
- **HTTP Errors**: Standardized error responses
- **Logging**: Structured logging with NestJS Logger

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Watch mode
pnpm run test:watch
```
