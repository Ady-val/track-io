# Track.IO API - Quick Start Guide

## 🚀 Start the Server

```bash
# 1. Start PostgreSQL database
cd ../database
docker-compose up -d

# 2. Go to backend
cd ../backend-receptor

# 3. Install dependencies
pnpm install

# 4. Run migrations
pnpm run migration:run

# 5. Start the server
pnpm run start:dev
```

Server running at: `http://localhost:3000`

## 📦 Import Postman Collection

1. Open Postman
2. **Import** → Select files:
   - `Track.IO-API.postman_collection.json`
   - `Track.IO-Development.postman_environment.json`
3. Select environment: **Track.IO - Development**
4. Ready to test! 🎉

## 🎯 Common Workflows

### Workflow 1: Setup Basic Data

```
1. Create Area          → POST /areas
2. Create Department    → POST /departments
3. Create Device        → POST /devices (needs areaId)
4. Create Device Signal → POST /device-signals (needs deviceId & departmentId)
```

**Example Sequence (Postman):**

**Step 1: Create Area**
```http
POST http://localhost:3000/areas
{
  "name": "Production Floor A"
}
```
Response: Save the `id` (e.g., `areaId = 1`)

**Step 2: Create Department**
```http
POST http://localhost:3000/departments
{
  "name": "Quality Control"
}
```
Response: Save the `id` (e.g., `departmentId = 1`)

**Step 3: Create Device**
```http
POST http://localhost:3000/devices
{
  "name": "Temperature Sensor 01",
  "areaId": 1,
  "externalId": "TEMP-SENSOR-001"
}
```
Response: Save the `id` (e.g., `deviceId = 1`)

**Step 4: Create Device Signal**
```http
POST http://localhost:3000/device-signals
{
  "name": "Temperature Reading",
  "deviceId": 1,
  "departmentId": 1,
  "externalValueId": "TEMP_VALUE_1"
}
```

### Workflow 2: Send Real-time Data

**Send Signal:**
```http
POST http://localhost:3000/signals
{
  "id": "TEMP_SENSOR_001",
  "value": "25.5"
}
```
✅ Data saved to database  
✅ WebSocket emits event with `type: 'signal'`

**Send Measurement:**
```http
POST http://localhost:3000/measurements
{
  "id": "PRESSURE_SENSOR_001",
  "value": "101.3"
}
```
✅ Data saved to database  
✅ WebSocket emits event with `type: 'measurement'`

### Workflow 3: Query Data

**Get All Devices:**
```http
GET http://localhost:3000/devices?limit=10&offset=0
```

**Get Devices by Area:**
```http
GET http://localhost:3000/devices/area/1
```

**Get Signals with Date Filter:**
```http
GET http://localhost:3000/signals?externalId=TEMP_SENSOR_001&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z&limit=100
```

**Get Measurements Count:**
```http
GET http://localhost:3000/measurements/count
```

## 🔌 WebSocket Connection

Connect to WebSocket for real-time events:

```javascript
// JavaScript/Node.js example
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('new_raw_signal', (message) => {
  console.log('New Signal:', message);
  // message.data.type === 'signal'
  // message.data.data contains signal info
});

socket.on('new_raw_measurement', (message) => {
  console.log('New Measurement:', message);
  // message.data.type === 'measurement'
  // message.data.data contains measurement info
});
```

## 📊 Response Format Examples

### Success Response (Single Item)
```json
{
  "message": "Device created successfully",
  "data": {
    "id": 1,
    "name": "Temperature Sensor 01",
    "areaId": 1,
    "externalId": "TEMP-SENSOR-001",
    "createdAt": "2024-10-09T12:00:00Z",
    "updatedAt": "2024-10-09T12:00:00Z",
    "deletedAt": null,
    "area": {
      "id": 1,
      "name": "Production Floor A"
    }
  }
}
```

### Success Response (List)
```json
{
  "message": "Devices retrieved successfully",
  "data": [...],
  "total": 50,
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 50
  }
}
```

## 🎨 Postman Tips

### Save Response Variables

In Postman Tests tab:
```javascript
// Save areaId from response
const response = pm.response.json();
pm.environment.set("areaId", response.data.id);
```

### Use Variables in Requests

Body:
```json
{
  "name": "New Device",
  "areaId": {{areaId}},
  "externalId": "DEV-{{$randomInt}}"
}
```

### Dynamic Timestamps

Pre-request Script:
```javascript
pm.environment.set("currentDate", new Date().toISOString());
```

Use in request:
```
GET /signals?startDate={{currentDate}}
```

## 🔍 Common Query Parameters

### Pagination
- `limit` (default: 10) - Results per page
- `offset` (default: 0) - Results to skip

### Filters
- **Areas/Departments**: `name`, `includeDeleted`
- **Devices**: `name`, `areaId`, `externalId`, `includeDeleted`
- **Device Signals**: `name`, `deviceId`, `departmentId`, `externalValueId`, `includeDeleted`
- **Signals/Measurements**: `externalId`, `startDate`, `endDate`

## 🗑️ Soft Delete Operations

All main resources support soft delete:

**Delete (soft):**
```http
DELETE http://localhost:3000/devices/1
```
Sets `deletedAt` timestamp

**Restore:**
```http
PATCH http://localhost:3000/devices/1/restore
```
Clears `deletedAt` timestamp

**Include in queries:**
```http
GET http://localhost:3000/devices?includeDeleted=true
```

## ⚡ Quick Testing Checklist

- [ ] Server is running (`pnpm run start:dev`)
- [ ] Database is running (`docker-compose up`)
- [ ] Postman collection imported
- [ ] Environment selected: **Track.IO - Development**
- [ ] Created at least one area
- [ ] Created at least one department
- [ ] Created at least one device
- [ ] Tested signal/measurement endpoints
- [ ] WebSocket connection working (optional)

## 📚 Full Documentation

- **Complete API Guide**: [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)
- **Main README**: [README.md](./README.md)
- **Migrations Guide**: [MIGRATIONS.md](./MIGRATIONS.md)

## 🆘 Troubleshooting

**Server won't start?**
- Check if port 3000 is available
- Verify database connection in `.env`
- Run migrations: `pnpm run migration:run`

**Can't connect to database?**
- Start PostgreSQL: `cd ../database && docker-compose up -d`
- Check credentials in `.env`

**404 errors in Postman?**
- Verify `baseUrl` in environment: `http://localhost:3000`
- Check server logs for errors
- Ensure module is imported in `app.module.ts`

**Validation errors?**
- Check required fields in request body
- Verify data types (numbers vs strings)
- Review DTO definitions in code

---

**Happy Testing! 🎉**

For more details, see [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)

