# Database Configuration

This folder contains the PostgreSQL configuration for the Track.IO project using Docker.

## Structure

- `docker-compose.yml` - Docker Compose configuration for PostgreSQL and PgAdmin
- `init/01-create-database.sql` - Database initialization script
- `env.example` - Example file with environment variables

## raw_signals Table

The `raw_signals` table has the following structure:

- `id` (SERIAL PRIMARY KEY) - Auto-generated unique identifier
- `external_id` (VARCHAR(255)) - External signal ID
- `value` (VARCHAR(255)) - Signal value
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation date (auto-generated)
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update date (automatically updated)

## Usage Instructions

### 1. Configure Environment Variables

Copy the example file and modify the variables as needed:

```bash
cp env.example .env
```

### 2. Start the Database

```bash
# From the database/ folder
docker-compose up -d
```

### 3. Verify it's Working

```bash
# View logs
docker-compose logs -f

# Check containers
docker-compose ps
```

### 4. Access PgAdmin

- URL: http://localhost:8080
- Email: adal.vallesb@gmail.com (or as configured in .env)
- Password: admin (or as configured in .env)

### 5. Connect to PostgreSQL from PgAdmin

- Host: postgres (service name)
- Port: 5432
- Database: track_io
- Username: postgres
- Password: postgres (or as configured in .env)

### 6. Connect from Application

```bash
# Connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/track_io
```

## Useful Commands

```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING! This deletes all data)
docker-compose down -v

# View logs in real time
docker-compose logs -f postgres

# Execute commands in PostgreSQL container
docker-compose exec postgres psql -U postgres -d track_io

# Restart only PostgreSQL
docker-compose restart postgres
```
