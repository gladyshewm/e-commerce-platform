# E-commerce Microservices Platform

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

An e-commerce platform built with NestJS microservices architecture using RabbitMQ for inter-service communication.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - OAuth2.0 (Google, GitHub)
  - Role-Based Access Control (RBAC)
  - Refresh token rotation
- **Product Management**
  - CRUD operations for products/categories
  - Product reviews and ratings
- **Order Processing**
  - Distributed transactions with Saga Pattern
  - Inventory reservation system
- **Payment Integration**
  - Payment processing flow
  - Refund management
- **Delivery Tracking**
  - Order status updates
  - Delivery lifecycle management
- **Notification System**
  - Email notifications
  - Event-driven architecture
- **API Gateway**
  - Single entry point for all services
  - Request routing and validation
  - Rate limiting with Redis

## Architecture

```mermaid
flowchart TD
    Client-->|HTTP| API_Gateway
    API_Gateway-->Auth_Service
    API_Gateway-->User_Service
    API_Gateway-->Product_Service
    API_Gateway-->Order_Service
    API_Gateway-->Inventory_Service
    Order_Service-->Payment_Service
    Order_Service-->Delivery_Service
    Order_Service-->Notification_Service
    Delivery_Service-->Notification_Service
    User_Service-->Notification_Service
```

## Project Structure

```
  e-commerce-microservices/
  ├── apps/               # Microservices
  │   ├── api-gateway/    # API Gateway
  │   ├── auth/           # Authentication service
  │   ├── user/           # User management
  │   ├── product/        # Product catalog
  │   ├── inventory/      # Inventory management
  │   ├── order/          # Order processing
  │   ├── payment/        # Payment processing
  │   ├── delivery/       # Delivery tracking
  │   └── notification/   # Notifications
  ├── libs/               # Shared libraries
  │   ├── common/         # Common contracts and entities
  │   ├── logger/         # Logging utilities
  │   └── rmq/            # RabbitMQ utilities
  └── docker-compose.yml  # Docker Compose configuration
```

## Technologies

- **Core:** Node.js, NestJS,TypeScript
- **Database:** PostgreSQL with TypeORM
- **Messaging:** RabbitMQ
- **Caching:** Redis
- **Authentication:** JWT, Passport.js, OAuth2.0
- **API Documentation:** Swagger
- **Containerization:** Docker
- **Testing:** Jest

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js v18+
- RabbitMQ
- PostgreSQL

### Installation

1. Clone the repository:

```bash
  git clone https://github.com/gladyshewm/e-commerce-platform.git
  cd e-commerce-platform
```

2. Create `.env` files for each service using the provided examples
3. Start the services:

```bash
  docker-compose up --build
```

4. Access services:

- API Gateway: http://localhost:3000
- Swagger UI: http://localhost:3000/api
- RabbitMQ Management: http://localhost:15672

## Testing

Run unit tests for a specific service:

```bash
  cd apps/<service-name>
  npm run test
```

