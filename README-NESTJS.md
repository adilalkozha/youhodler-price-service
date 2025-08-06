# YouHodler Price Service - NestJS Migration

This project has been migrated from Express.js to NestJS with RabbitMQ integration while preserving all existing functionality.

## 🚀 New Features

### NestJS Architecture
- **Modular Design**: Organized into feature modules (Price, Health, Metrics, RabbitMQ)
- **Dependency Injection**: Built-in DI container for better testing and modularity
- **Decorators**: Clean, declarative code using TypeScript decorators
- **Guards & Interceptors**: Built-in request/response handling

### RabbitMQ Integration
- **Message Queue**: Asynchronous price processing with RabbitMQ
- **Event-Driven**: Price fetch and cleanup events
- **Scalable**: Multiple workers can process messages
- **Reliable**: Durable queues with error handling

## 📁 Project Structure

```
src/
├── main.ts                          # NestJS bootstrap
├── app.module.ts                    # Root application module
├── common/
│   └── interceptors/
│       └── metrics.interceptor.ts   # HTTP metrics collection
├── modules/
│   ├── price/                       # Price management module
│   │   ├── price.module.ts
│   │   ├── price.controller.ts      # REST API endpoints
│   │   ├── price.service.ts         # Business logic
│   │   ├── binance.service.ts       # Binance API integration
│   │   └── price-calculator.service.ts
│   ├── rabbitmq/                    # Message queue module
│   │   ├── rabbitmq.module.ts
│   │   ├── rabbitmq.service.ts      # RabbitMQ client
│   │   └── price-worker.service.ts  # Background worker
│   ├── health/                      # Health checks module
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   ├── database-health.indicator.ts
│   │   └── binance-health.indicator.ts
│   ├── metrics/                     # Prometheus metrics module
│   │   ├── metrics.module.ts
│   │   ├── metrics.controller.ts
│   │   └── metrics.service.ts
│   └── status/                      # System status module
│       ├── status.module.ts
│       └── status.controller.ts
├── config/                          # Configuration (unchanged)
├── models/                          # Database models (updated with decorators)
└── types/                           # TypeScript types (unchanged)
```

## 🔧 Migration Changes

### 1. Entry Point
- **Old**: `src/server.ts` with Express.js
- **New**: `src/main.ts` with NestJS

### 2. Dependency Management
- **Old**: Manual instantiation and wiring
- **New**: NestJS dependency injection container

### 3. Database Integration
- **Old**: Manual Sequelize setup
- **New**: `@nestjs/sequelize` with decorators

### 4. Background Processing
- **Old**: Simple interval-based worker
- **New**: RabbitMQ-based event processing

## 🌐 API Endpoints (Unchanged)

All existing endpoints work exactly the same:

- `GET /health` - Health check with comprehensive status
- `GET /metrics` - Prometheus metrics
- `GET /api/v1/price` - Current Bitcoin price
- `GET /api/v1/price/history?limit=100` - Price history
- `GET /api/v1/status` - Service status and worker info

## ⚙️ Environment Variables

Add RabbitMQ configuration:

```bash
# Existing variables remain the same
NODE_ENV=development
PORT=3000
# ... other existing vars ...

# New RabbitMQ configuration
RABBITMQ_URL=amqp://localhost:5672
```

## 🚀 Running the Application

### Development
```bash
# NestJS version (recommended)
npm run dev

# Original Express version (fallback)
npm run dev:old
```

### Production
```bash
# Build
npm run build

# Start NestJS version
npm start

# Start original Express version (fallback)
npm run start:old
```

## 🐰 RabbitMQ Setup

### Local Development
```bash
# Using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Access management UI: http://localhost:15672 (guest/guest)
```

### Production
Configure RabbitMQ cluster with proper authentication and monitoring.

## 📊 Message Queue Events

The service now publishes and consumes these events:

### Published Events
- `price.fetch` - Triggers price data fetching
- `price.cleanup` - Triggers old data cleanup

### Consumed Messages
- `price.update` - Price update notifications
- `price.fetch` - Fetch price data command
- `price.cleanup` - Cleanup old data command

## 🔍 Health Checks

Enhanced health checks include:
- **Database**: PostgreSQL connection status
- **Binance API**: External API connectivity
- **Price Data**: Data freshness validation
- **RabbitMQ**: Message queue connectivity (automatic)

## 📈 Metrics

All existing Prometheus metrics are preserved:
- HTTP request metrics
- Binance API metrics
- Price update metrics
- Background worker metrics

## 🔄 Backward Compatibility

The original Express.js version remains available:
- Files preserved in their original locations
- Scripts available as `dev:old` and `start:old`
- All functionality identical

## 🧪 Testing

Existing tests continue to work. Consider adding NestJS-specific tests:

```bash
npm test                 # Run existing tests
npm run test:coverage   # Coverage report
```

## 🚀 Benefits of Migration

1. **Better Architecture**: Modular, testable, maintainable code
2. **Scalability**: Event-driven processing with RabbitMQ
3. **Developer Experience**: Better tooling, decorators, built-in features
4. **Enterprise Ready**: Production-ready patterns and practices
5. **Type Safety**: Enhanced TypeScript support
6. **Testing**: Built-in testing utilities and dependency injection

## 🔧 Troubleshooting

### RabbitMQ Connection Issues
```bash
# Check RabbitMQ status
docker logs rabbitmq

# Verify connection
curl http://localhost:15672/api/overview
```

### Database Issues
The database configuration and migrations remain unchanged.

### Fallback to Express
If needed, use the original Express version:
```bash
npm run dev:old
```

This migration maintains 100% backward compatibility while providing modern, scalable architecture for future development.