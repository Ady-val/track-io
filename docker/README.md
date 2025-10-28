# Track.IO - Docker Setup

## 🚀 Quick Start

### First Time Setup

1. **Clone the repository and navigate to docker directory:**

   ```bash
   git clone <repository-url>
   cd track-io/docker
   ```

2. **Configure environment variables (optional):**

   ```bash
   cp env.example .env
   # Edit .env file if you need custom settings
   ```

3. **Start the complete system:**

   ```bash
   docker-compose up -d --build
   ```

4. **Run database migrations:**
   ```bash
   docker-compose exec backend npm run migration:run
   ```

**That's it!** The system is now running with:

- ✅ PostgreSQL Database
- ✅ NestJS Backend with migrations executed
- ✅ React + Vite Frontend (Dashboard)
- ✅ React + Vite Virtual Device Simulator

## 📋 Services

- **Frontend (Dashboard)**: http://localhost (or http://[HOST_IP] for network access)
- **Virtual Device**: http://localhost:8080 (or http://[HOST_IP]:8080 for network access)
- **Backend API**: http://localhost:3000 (or http://[HOST_IP]:3000 for network access)
- **Database**: localhost:5432

## 🔄 Updating the System

### When you pull new code changes:

```bash
# 1. Pull latest changes
git pull

# 2. Rebuild and restart services
cd docker
docker-compose up -d --build

# 3. If there are new migrations, run them
docker-compose exec backend npm run migration:run
```

### When you add new migrations:

```bash
# 1. Pull latest changes
git pull

# 2. Rebuild and restart services
cd docker
docker-compose up -d --build

# 3. Run new migrations
docker-compose exec backend npm run migration:run
```

## 🌐 Internal Network Access

The system is configured to work on internal networks. Other devices on the same network can access using the server's IP:

### **Setup for Network Access:**

1. **Find your machine's IP address:**

   ```bash
   # Windows
   ipconfig

   # Linux/Mac
   ip addr show
   ```

2. **Configure the IP in .env file:**

   ```bash
   # Edit .env file and set your IP
   HOST_IP=192.168.1.100  # Replace with your actual IP
   ```

3. **Restart the services:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### **Access URLs:**

- **Frontend**: http://[SERVER_IP]
- **Backend API**: http://[SERVER_IP]:3000

## 🔧 Useful Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f virtual-device

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build backend
docker-compose up -d --build frontend
docker-compose up -d --build virtual-device

# Check service status
docker-compose ps

# Execute commands in containers
docker-compose exec backend npm run migration:run
docker-compose exec backend npm run migration:show
```

## 🛠️ Advanced Configuration

### Environment Variables (Optional)

Create a `.env` file to customize settings:

```env
# Database Configuration
POSTGRES_DB=track_io
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# Service Ports
BACKEND_PORT=3000
FRONTEND_PORT=80
VIRTUAL_DEVICE_PORT=8080

# Network Configuration
# Set this to your machine's IP address for network access
# Leave empty or set to 'localhost' for local-only access
HOST_IP=192.168.1.100

# Node Environment
NODE_ENV=production
```

### Development vs Production

- **Development**: Uses `NODE_ENV=development` for detailed logging
- **Production**: Uses `NODE_ENV=production` for optimized performance

## 🚨 Troubleshooting

### Common Issues:

1. **Port already in use:**

   ```bash
   # Check what's using the port
   netstat -ano | findstr :3000
   netstat -ano | findstr :80
   ```

2. **Database connection issues:**

   ```bash
   # Check database logs
   docker-compose logs postgres
   ```

3. **Backend not starting:**

   ```bash
   # Check backend logs
   docker-compose logs backend
   ```

4. **Frontend not loading:**
   ```bash
   # Check frontend logs
   docker-compose logs frontend
   ```

### Reset Everything:

```bash
# Stop and remove everything
docker-compose down -v
docker system prune -a -f

# Start fresh
docker-compose up -d --build
docker-compose exec backend npm run migration:run
```

## 📁 Project Structure

```
docker/
├── docker-compose.yml           # Main orchestration file
├── Dockerfile.backend           # Backend container definition
├── Dockerfile.frontend          # Frontend container definition
├── Dockerfile.virtual-device    # Virtual Device container definition
├── .dockerignore               # Files to ignore during build
├── .env                        # Environment variables (create from env.example)
├── env.example                 # Environment variables template
└── README.md                   # This file
```

## 🎯 Key Features

- **Single Command Setup**: `docker-compose up -d --build`
- **Automatic Dependencies**: All dependencies installed in containers
- **Database Persistence**: Data survives container restarts
- **Cross-Platform**: Works on Windows and Linux
- **Internal Network Ready**: Accessible from other devices on the same network
- **Easy Updates**: Simple git pull + rebuild process
