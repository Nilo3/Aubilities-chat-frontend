# Default environment
ENV ?= dev

# Include environment-specific .env file
-include .env.$(ENV)

# Default target
.DEFAULT_GOAL := help

# PHONY targets
.PHONY: help build build-frontend build-cdk bootstrap synth deploy doctor diff clean

help: ## Show this help message
	@echo "Usage: make [target] ENV=[dev|demo|prod]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Environments:"
	@echo "  dev   - Development environment (default)"
	@echo "  demo  - Demo environment"
	@echo "  prod  - Production environment"

build-frontend: ## Build the frontend application
	@echo "Building frontend for $(ENV) environment..."
	@if [ "$(ENV)" = "prod" ]; then \
	    cd frontend && npm run build:prod; \
	elif [ "$(ENV)" = "dev" ]; then \
	    cd frontend && npm run build:dev; \
	elif [ "$(ENV)" = "demo" ]; then \
	    cd frontend && npm run build:demo; \
	else \
	    echo "Unsupported ENV value: $(ENV). Using default build (prod)."; \
	    cd frontend && npm run build:prod; \
	fi

build-cdk: ## Build the CDK TypeScript code
	@echo "Building CDK TypeScript..."
	@npm run build

build: build-frontend build-cdk ## Build everything (frontend and CDK)
	@echo "Build complete!"

bootstrap: ## Bootstrap CDK for specified environment
	@echo "Bootstrapping CDK for $(ENV) environment..."
	@AWS_ACCOUNT_ID=$(AWS_ACCOUNT_ID) \
	AWS_REGION=$(AWS_REGION) \
	AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) \
	AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) \
	CERTIFICATE_ARN=$(CERTIFICATE_ARN) \
	cdk bootstrap aws://$(AWS_ACCOUNT_ID)/$(AWS_REGION)

synth: build ## Synthesize CloudFormation template for specified environment
	@echo "Synthesizing CloudFormation template for $(ENV) environment..."
	@AWS_ACCOUNT_ID=$(AWS_ACCOUNT_ID) \
	AWS_REGION=$(AWS_REGION) \
	AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) \
	AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) \
	CERTIFICATE_ARN=$(CERTIFICATE_ARN) \
	cdk synth --context env=$(ENV)

deploy: build ## Deploy CDK stack to specified environment
	@echo "Deploying to $(ENV) environment..."
	@AWS_ACCOUNT_ID=$(AWS_ACCOUNT_ID) \
	AWS_REGION=$(AWS_REGION) \
	AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) \
	AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) \
	CERTIFICATE_ARN=$(CERTIFICATE_ARN) \
	cdk deploy --context env=$(ENV) --require-approval never

doctor: ## Run CDK doctor for specified environment
	@echo "Running CDK doctor for $(ENV) environment..."
	@AWS_ACCOUNT_ID=$(AWS_ACCOUNT_ID) \
	AWS_REGION=$(AWS_REGION) \
	AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) \
	AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) \
	CERTIFICATE_ARN=$(CERTIFICATE_ARN) \
	cdk doctor --context env=$(ENV)

diff: build ## Show differences between deployed stack and current state
	@echo "Showing differences for $(ENV) environment..."
	@AWS_ACCOUNT_ID=$(AWS_ACCOUNT_ID) \
	AWS_REGION=$(AWS_REGION) \
	AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) \
	AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) \
	CERTIFICATE_ARN=$(CERTIFICATE_ARN) \
	cdk diff --context env=$(ENV)

clean: ## Remove compiled files and CDK output
	@echo "Cleaning up compiled files and CDK output..."
	@find . -type f -name "*.js" ! -name "jest.config.js" ! -path "*node_modules*" -delete
	@find . -type f -name "*.d.ts" ! -path "*node_modules*" ! -path "./frontend/src/*" -delete
	@rm -rf .cdk.staging cdk.out frontend/dist
	@echo "Cleanup complete."