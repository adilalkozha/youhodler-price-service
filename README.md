# Bitcoin Price Service

Enterprise-grade microservice for Bitcoin price tracking with PostgreSQL persistence and Prometheus metrics.

## Features

- **Real-time Price Tracking**: Fetches Bitcoin prices from Binance API every 10 seconds
- **Configurable Commission**: Applies service commission to bid/ask prices
- **PostgreSQL Persistence**: Stores all price history in database
- **Prometheus Metrics**: Built-in observability with detailed metrics
- **Background Worker**: Fault-tolerant price update mechanism with exponential backoff
- **RESTful API**: Clean HTTP API with comprehensive error handling
- **Docker Support**: Full containerization with multi-stage builds
- **TypeScript**: Fully typed codebase with strict type checking
- **Production Ready**: Graceful shutdown, health checks, and monitoring

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Binance API   │    │  Background     │    │   PostgreSQL    │
│                 │◄───┤  Worker         ├───►│   Database      │
│  Price Source   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTTP API      │    │  Price Service  │    │   Prometheus    │
│                 │◄───┤                 ├───►│   Metrics       │
│  REST Endpoints │    │  Business Logic │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd bitcoin-price-service
   cp .env.example .env
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Check health**:
   ```bash
   curl http://localhost:3000/health
   ```

### Development Setup

1. **Prerequisites**:
   - Node.js 18+
   - TypeScript
   - PostgreSQL 15+

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start PostgreSQL** (using Docker):
   ```bash
   docker run --name postgres-dev -e POSTGRES_PASSWORD=password -e POSTGRES_DB=bitcoin_price_db -p 5432:5432 -d postgres:15-alpine
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### GET /api/v1/price
Get current Bitcoin price with applied commission.

**Response**:
```json
{
  "success": true,
  "data": {
    "symbol": "BTCUSDT",
    "bidPrice": 49950.0,
    "askPrice": 50150.1,
    "midPrice": 50050.05,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "commission": 0.0001,
    "spread": 200.1,
    "spreadPercentage": 0.3999
  },
  "meta": {
    "lastUpdated": "2024-01-01T12:00:00.000Z",
    "recordId": 1
  }
}
```

### GET /api/v1/price/history?limit=100
Get price history (default limit: 100, max: 1000).

### GET /health
Service health check.

### GET /metrics
Prometheus metrics endpoint.

### GET /api/v1/status
Service status and configuration.

## Configuration

Configure via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `UPDATE_INTERVAL` | Price update interval (ms) | `10000` |
| `SERVICE_COMMISSION` | Commission rate (0-1) | `0.0001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | Required |
| `DB_USERNAME` | Database username | Required |
| `DB_PASSWORD` | Database password | Required |
| `BINANCE_BASE_URL` | Binance API base URL | `https://api.binance.com` |
| `BINANCE_SYMBOL` | Trading symbol | `BTCUSDT` |
| `LOG_LEVEL` | Logging level | `info` |

## Development

### Available Scripts

```bash
npm run build          # Build TypeScript
npm run start          # Start production server
npm run dev            # Start development server with hot reload
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix
npm run typecheck      # Run TypeScript type checking
```

### Using Makefile

```bash
make help              # Show all available commands
make dev               # Start development environment
make prod              # Start production environment
make clean             # Clean build artifacts
```

## Monitoring

### Prometheus Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `binance_api_requests_total` - Binance API requests counter
- `price_updates_total` - Price update attempts counter
- `current_bitcoin_price` - Current Bitcoin mid price gauge
- `background_worker_status` - Worker status (1=running, 0=stopped)

### Health Checks
- Application health: `GET /health`
- Docker health checks included
- Database connectivity verification

### Logging
- Structured JSON logging with Winston
- Configurable log levels
- Request/response logging
- Error tracking with stack traces

## Production Deployment

### Docker Production
```bash
# Build and start production services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Scale if needed
docker-compose up -d --scale app=3
```

### Kubernetes
The service is Kubernetes-ready with:
- Health check endpoints
- Graceful shutdown handling
- Configurable resource limits
- StatefulSet support for database

### Security Features
- Non-root container user
- Input validation with Joi
- SQL injection protection via Sequelize ORM
- Rate limiting ready (add middleware)
- CORS configuration
- Security headers (add helmet middleware)

## Architecture Decisions

### Why PostgreSQL?
- **Reliability**: ACID compliance for financial data
- **Scalability**: Handles high-frequency price updates
- **Analytics**: Rich querying capabilities for price history
- **Observability**: Built-in monitoring and logging

### Why Background Worker?
- **Reliability**: Independent of HTTP requests
- **Fault Tolerance**: Exponential backoff on failures
- **Performance**: Non-blocking price updates
- **Monitoring**: Dedicated metrics for worker health

### Why Prometheus Metrics?
- **Industry Standard**: Compatible with monitoring stacks
- **Real-time**: Live metrics for operational insights
- **Alerting**: Integration with AlertManager
- **Grafana**: Ready for visualization dashboards

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- TypeScript with strict mode
- ESLint with TypeScript rules
- Prettier for formatting
- 100% type coverage required

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the logs: `docker-compose logs -f app`
- Review health check: `curl http://localhost:3000/health`