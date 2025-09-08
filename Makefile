.PHONY: help up down dev build clean logs status health check-deps install migrate

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment (local pnpm dev)
	@trap 'echo "Shutting down services..."; kill -TERM $$(jobs -p) 2>/dev/null; exit 0' INT TERM; pnpm dev

install: ## Install all dependencies
	pnpm install

# Docker commands
up: ## Start all services with Docker
	docker compose up -d
	@echo "Starting services..."
	@sleep 5
	@make status

down: ## Stop all Docker services
	docker compose down

build: ## Build Docker images
	docker compose build

clean: ## Stop services and remove volumes
	docker compose down -v
	docker compose rm -f

# Database commands
db: ## Start only the database
	docker compose up -d db
	@echo "Waiting for database to be ready..."
	@sleep 3
	@make check-db

migrate: ## Run database migrations (requires auth-service)
	cd apps/auth-service && pnpm ba:migrate && pnpm prisma:mig

# Monitoring commands
logs: ## Show logs from all services
	docker compose logs -f

logs-web: ## Show logs from web service
	docker compose logs -f web

logs-auth: ## Show logs from auth service
	docker compose logs -f auth-service

logs-db: ## Show logs from database
	docker compose logs -f db

status: ## Show status of all services
	@echo "=== Docker Services Status ==="
	@docker compose ps
	@echo ""
	@make health

health: ## Check health of all services
	@echo "=== Health Checks ==="
	@make check-db
	@make check-auth
	@make check-web

check-db: ## Check database connectivity
	@echo -n "Database: "
	@if docker compose exec -T db pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then \
		echo "✅ Running"; \
	else \
		echo "❌ Not ready"; \
	fi

check-auth: ## Check auth service
	@echo -n "Auth Service: "
	@if curl -s http://localhost:4001/api/auth/sign-up > /dev/null 2>&1; then \
		echo "✅ Running (http://localhost:4001)"; \
	else \
		echo "❌ Not responding"; \
	fi

check-web: ## Check web application
	@echo -n "Web App: "
	@if curl -s http://localhost:3000 > /dev/null 2>&1; then \
		echo "✅ Running (http://localhost:3000)"; \
	else \
		echo "❌ Not responding"; \
	fi

# Quick setup for new developers
setup: ## Complete setup: install deps, start db, run migrations
	@echo "🚀 Setting up development environment..."
	pnpm install
	@make db
	@echo "⏳ Waiting for database..."
	@sleep 5
	@make migrate
	@echo "✅ Setup complete! Run 'make dev' to start development"

# Docker development workflow
docker-dev: ## Start full stack with Docker and show health
	@make up
	@echo "⏳ Waiting for services to start..."
	@sleep 10
	@make health
	@echo ""
	@echo "🎉 All services are running!"
	@echo "   Web App: http://localhost:3000"
	@echo "   Auth API: http://localhost:4001"
	@echo "   Database: localhost:5432"

# Cleanup commands  
reset: ## Reset everything (stop, clean, rebuild)
	@make clean
	@make build
	@make up