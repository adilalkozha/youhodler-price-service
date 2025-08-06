# Bitcoin Price Service Makefile

.PHONY: help build build-dev up up-dev down down-dev logs test test-watch lint typecheck clean install

# Default target
help:
	@echo "Available commands:"
	@echo "  install       - Install dependencies"
	@echo "  build         - Build TypeScript"
	@echo "  build-docker  - Build Docker image"
	@echo "  up            - Start production services"
	@echo "  up-dev        - Start development services"
	@echo "  down          - Stop all services"
	@echo "  down-dev      - Stop development services"
	@echo "  logs          - Show logs from all services"
	@echo "  logs-app      - Show logs from app service only"
	@echo "  test          - Run tests"
	@echo "  test-watch    - Run tests in watch mode"
	@echo "  test-coverage - Run tests with coverage"
	@echo "  lint          - Run linter"
	@echo "  lint-fix      - Run linter with auto-fix"
	@echo "  typecheck     - Run TypeScript type checking"
	@echo "  clean         - Clean build artifacts"
	@echo "  clean-docker  - Clean Docker artifacts"

# Install dependencies
install:
	npm install

# Build TypeScript
build:
	npm run build

# Build Docker image
build-docker:
	docker build -t bitcoin-price-service .

# Start production services
up:
	docker-compose up -d

# Start development services
up-dev:
	docker-compose -f docker-compose.dev.yml up -d

# Stop all services
down:
	docker-compose down

# Stop development services
down-dev:
	docker-compose -f docker-compose.dev.yml down

# Show logs from all services
logs:
	docker-compose logs -f

# Show logs from app service only
logs-app:
	docker-compose logs -f app

# Show logs from development app
logs-dev:
	docker-compose -f docker-compose.dev.yml logs -f app

# Run tests
test:
	npm test

# Run tests in watch mode
test-watch:
	npm run test:watch

# Run tests with coverage
test-coverage:
	npm run test:coverage

# Run linter
lint:
	npm run lint

# Run linter with auto-fix
lint-fix:
	npm run lint:fix

# Run TypeScript type checking
typecheck:
	npm run typecheck

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf node_modules
	rm -rf coverage
	rm -rf logs

# Clean Docker artifacts
clean-docker:
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f
	docker volume prune -f

# Full reset (clean everything and reinstall)
reset: clean clean-docker
	npm install

# Check service health
health:
	curl -f http://localhost:3000/health || exit 1

# Show service status
status:
	curl -s http://localhost:3000/api/v1/status | jq '.'

# Show current price
price:
	curl -s http://localhost:3000/api/v1/price | jq '.'

# Show metrics
metrics:
	curl -s http://localhost:3000/metrics

# Development workflow
dev: up-dev logs-dev

# Production workflow
prod: build-docker up logs

# CI/CD workflow
ci: install lint typecheck test build