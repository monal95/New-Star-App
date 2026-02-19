# Smart Tailoring Management System - Backend

A Node.js and Express-based REST API for managing tailoring business operations, including companies, employees, and orders.

## Overview

The backend provides a comprehensive API for the Smart Tailoring Management System, handling all business logic and data management for a tailoring company's operations. It connects to MongoDB for persistent data storage and supports features like company management, employee tracking, and order processing.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Development**: Nodemon for auto-reload

## Prerequisites

- Node.js (v14 or higher)
- MongoDB instance (local or cloud-based)
- npm or yarn package manager

## Installation

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a .env file in the backend directory with the following configuration:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-tailoring
   NODE_ENV=development
   ```

## Running the Server

### Development Mode

Run with auto-reload on file changes:

```bash
npm run dev
```

The server will start on http://localhost:5000 (or the port specified in .env)

### Production Mode

Run the server in production:

```bash
npm start
```

## Project Structure

```
backend/
├── api/              # API route handlers and controllers
├── config/           # Configuration files
│   └── db.js         # Database connection setup
├── middleware/       # Express middleware
├── models/           # MongoDB data models/schemas
├── routes/           # API route definitions
│   ├── companies.js
│   ├── companyEmployees.js
│   └── orders.js
├── server.js         # Entry point
└── package.json
```

## API Endpoints

### Companies
- GET /api/companies - List all companies
- POST /api/companies - Create a new company
- GET /api/companies/:id - Get company details
- PUT /api/companies/:id - Update company
- DELETE /api/companies/:id - Delete company

### Company Employees
- GET /api/employees - List all employees
- POST /api/employees - Create a new employee
- GET /api/employees/:id - Get employee details
- PUT /api/employees/:id - Update employee
- DELETE /api/employees/:id - Delete employee

### Orders
- GET /api/orders - List all orders
- POST /api/orders - Create a new order
- GET /api/orders/:id - Get order details
- PUT /api/orders/:id - Update order
- DELETE /api/orders/:id - Delete order

## Environment Variables

- PORT - Server port (default: 5000)
- MONGODB_URI - MongoDB connection string
- NODE_ENV - Environment mode (development/production)

## Dependencies

- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable management
- **mongodb** - MongoDB driver

## Dev Dependencies

- **nodemon** - Auto-restart server on file changes

## Error Handling

The API returns standard HTTP status codes:
- 200 - Success
- 201 - Created
- 400 - Bad request
- 404 - Not found
- 500 - Server error

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License
