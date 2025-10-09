# Backend Receptor - Track.IO

Backend service for receiving and processing signals with PostgreSQL database integration.

## Features

- **Signal & Measurement Processing**: Receive and process signal and measurement data via REST API
- **Real-time Communication**: WebSocket support for live data streaming
- **Resource Management**: Complete CRUD operations for areas, departments, devices, and device signals
- **Database Integration**: Store data in PostgreSQL using TypeORM with migrations
- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **Data Persistence**: Automatic timestamps, soft deletes, and data validation
- **API Documentation**: Complete Postman collection with all endpoints

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Language**: TypeScript
- **Package Manager**: pnpm

## 📖 API Documentation

### Postman Collection

This project includes a complete Postman collection with all API endpoints. You can find the following files in the `backend-receptor` directory:

- **`Track.IO-API.postman_collection.json`** - Complete API collection
- **`Track.IO-Development.postman_environment.json`** - Development environment
- **`Track.IO-Production.postman_environment.json`** - Production environment template
- **`POSTMAN_GUIDE.md`** - Complete guide for using the Postman collection

### Quick Import

1. Open Postman
2. Click **Import** → **File**
3. Select `Track.IO-API.postman_collection.json`
4. Select the environment files
5. Start testing!

For detailed instructions, see [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)

## Modules & Endpoints

### 1. Areas
- `POST /areas` - Create area
- `GET /areas` - List areas with pagination
- `GET /areas/:id` - Get area by ID
- `PATCH /areas/:id` - Update area
- `DELETE /areas/:id` - Soft delete area
- `PATCH /areas/:id/restore` - Restore area

### 2. Departments
- `POST /departments` - Create department
- `GET /departments` - List departments with pagination
- `GET /departments/:id` - Get department by ID
- `PATCH /departments/:id` - Update department
- `DELETE /departments/:id` - Soft delete department
- `PATCH /departments/:id/restore` - Restore department

### 3. Devices
- `POST /devices` - Create device
- `GET /devices` - List devices with pagination
- `GET /devices/:id` - Get device by ID
- `GET /devices/area/:areaId` - Get devices by area
- `GET /devices/external/:externalId` - Get device by external ID
- `PATCH /devices/:id` - Update device
- `DELETE /devices/:id` - Soft delete device
- `PATCH /devices/:id/restore` - Restore device

### 4. Device Signals
- `POST /device-signals` - Create device signal
- `GET /device-signals` - List device signals with pagination
- `GET /device-signals/:id` - Get device signal by ID
- `GET /device-signals/device/:deviceId` - Get signals by device
- `GET /device-signals/department/:departmentId` - Get signals by department
- `PATCH /device-signals/:id` - Update device signal
- `DELETE /device-signals/:id` - Soft delete device signal
- `PATCH /device-signals/:id/restore` - Restore device signal

### 5. Raw Signals
- `POST /signals` - Process signal (emits WebSocket event with type='signal')
- `GET /signals` - List signals with pagination and date filters
- `GET /signals/:id` - Get signal by ID
- `GET /signals/external/:externalId` - Get signals by external ID
- `GET /signals/count` - Get total count

### 6. Raw Measurements
- `POST /measurements` - Process measurement (emits WebSocket event with type='measurement')
- `GET /measurements` - List measurements with pagination and date filters
- `GET /measurements/:id` - Get measurement by ID
- `GET /measurements/external/:externalId` - Get measurements by external ID
- `GET /measurements/count` - Get total count

## Database Schema

The application uses PostgreSQL with the following main tables:

- **areas** - Geographical or organizational areas
- **departments** - Organizational departments
- **devices** - IoT devices with area assignments
- **device_signals** - Signal configurations for devices
- **raw_signals** - Time-series signal data
- **raw_measurements** - Time-series measurement data

All tables include:
- Auto-incrementing primary key
- Created/updated timestamps
- Soft delete support (except raw_signals and raw_measurements)

## WebSocket Events

The backend emits real-time events via WebSocket:

### Event: `new_raw_signal`
```json
{
  "event": "new_raw_signal",
  "data": {
    "type": "signal",
    "data": {
      "id": 1,
      "externalId": "TEMP_SENSOR_001",
      "value": "25.5",
      "createdAt": "2024-10-09T12:00:00Z"
    }
  },
  "timestamp": "2024-10-09T12:00:00Z"
}
```

### Event: `new_raw_measurement`
```json
{
  "event": "new_raw_measurement",
  "data": {
    "type": "measurement",
    "data": {
      "id": 1,
      "externalId": "PRESSURE_SENSOR_001",
      "value": "101.3",
      "createdAt": "2024-10-09T12:00:00Z"
    }
  },
  "timestamp": "2024-10-09T12:00:00Z"
}
```

Connect to WebSocket at: `ws://localhost:3000`

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

### 4. Run Database Migrations

```bash
# Generate a new migration
pnpm run migration:generate -- src/migrations/MigrationName

# Run pending migrations
pnpm run migration:run

# Revert last migration
pnpm run migration:revert
```

### 5. Run the Application

```bash
# Development mode with watch
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

The application will be available at `http://localhost:3000`

## Project Structure

```
backend-receptor/
├── src/
│   ├── areas/                    # Areas module
│   │   ├── application/
│   │   ├── controllers/
│   │   ├── domain/
│   │   └── areas.module.ts
│   ├── departments/              # Departments module
│   │   ├── application/
│   │   ├── controllers/
│   │   ├── domain/
│   │   └── departments.module.ts
│   ├── devices/                  # Devices module
│   │   ├── application/
│   │   ├── controllers/
│   │   ├── domain/
│   │   └── devices.module.ts
│   ├── device-signals/           # Device Signals module
│   │   ├── application/
│   │   ├── controllers/
│   │   ├── domain/
│   │   └── device-signals.module.ts
│   ├── signals/                  # Raw Signals module
│   │   ├── application/
│   │   ├── controllers/
│   │   ├── domain/
│   │   └── signals.module.ts
│   ├── measurements/             # Raw Measurements module
│   │   ├── application/
│   │   ├── controllers/
│   │   ├── domain/
│   │   └── measurements.module.ts
│   ├── websocket/                # WebSocket module
│   │   ├── constants/
│   │   ├── gateways/
│   │   ├── services/
│   │   └── websocket.module.ts
│   ├── migrations/               # Database migrations
│   ├── app.module.ts            # Main application module
│   └── main.ts                  # Application entry point
├── Track.IO-API.postman_collection.json
├── Track.IO-Development.postman_environment.json
├── Track.IO-Production.postman_environment.json
├── POSTMAN_GUIDE.md
├── MIGRATIONS.md
└── README.md
```

### Module Architecture

Each module follows clean architecture principles:

```
module/
├── application/
│   ├── dtos/           # Data Transfer Objects
│   ├── services/       # Business logic
│   └── mappers/        # Domain to DTO mapping (if needed)
├── controllers/        # REST API endpoints
├── domain/
│   ├── entities/       # Domain and database entities
│   └── repositories/   # Data access layer
└── module.module.ts    # Module configuration
```

## Development Commands

```bash
# Start development server with watch mode
pnpm run start:dev

# Build the application
pnpm run build

# Start production server
pnpm run start:prod

# Run in debug mode
pnpm run start:debug

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run end-to-end tests
pnpm run test:e2e

# Run test coverage
pnpm run test:cov

# Run linting
pnpm run lint

# Format code
pnpm run format

# Check formatting
pnpm run format:check

# Database migrations
pnpm run migration:generate -- src/migrations/MigrationName
pnpm run migration:run
pnpm run migration:revert
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
