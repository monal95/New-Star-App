# Smart Tailoring Management System

A complete management system for tailoring businesses with authentication, order management, and workforce tracking.

## ✨ Features

- **🔐 Secure Authentication** - Auto-created admin user with bcrypt password hashing
- **📊 Dashboard** - Comprehensive business analytics and management
- **👥 Employee Management** - Track employees and assignments
- **📦 Order Management** - Manage customer orders and status
- **💼 Company Management** - Handle company accounts and details
- **⚡ Real-time Updates** - Live order status updates
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

## Quick Overview

- **Backend:** Node.js + Express API with MongoDB database
- **Frontend:** React + Vite single-page app with Tailwind CSS
- **Authentication:** Auto-admin creation on first server start

## Prerequisites

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)

## Repository Layout

```
Smart-Tailoring-Management-System/
├── backend/                    # Node.js + Express API
│   ├── routes/                # API route modules
│   ├── utils/                 # Utility functions (including admin init)
│   ├── config/                # Configuration files
│   ├── server.js             # Entry point
│   └── package.json
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── styles/            # CSS files
│   │   └── App.jsx            # Root component
│   └── package.json
└── [Documentation files]
```

## Quick Start

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
MongoDB connected: newstar_tailors
✓ Admin user already exists
Server running on port 5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Access:** http://localhost:5173

### Login Credentials

On first run, admin user is created automatically:

```
Email: monalprashanth98@gmail.com
Password: newstar1234
```

⚠️ **Important:** Change password after first login

## Configuration

### Backend (.env)

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017
DB_NAME=newstar_tailors
NODE_ENV=development
```

### Frontend

No additional configuration needed — automatically connects to backend on port 5000.

## API Endpoints

### Authentication ✨ NEW
- `POST /api/auth/login` - User login
- `GET /api/auth/check` - Check if admin exists

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee

### Labour
- `GET /api/labour` - Get all labour
- `POST /api/labour` - Add labour
- `PUT /api/labour/:id` - Update labour

## Documentation

For detailed information, see:

- **[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)** - Step-by-step installation
- **[AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)** - Complete authentication guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick lookup
- **[STATUS.md](./STATUS.md)** - Current implementation status

## Project Structure

```
backend/
├── routes/
│   ├── auth.js                 # Authentication routes
│   ├── orders.js
│   ├── companies.js
│   ├── companyEmployees.js
│   ├── labour.js
│   ├── wages.js
│   └── workAssignments.js
├── utils/
│   └── initializeAdmin.js     # Admin auto-creation
├── config/
│   └── db.js                   # Database connection
├── server.js
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── CivilDashboard.jsx
│   │   ├── CompanyDashboard.jsx
│   │   └── ...
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   └── animations.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
└── package.json
```

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB
- bcrypt (password hashing)
- CORS

### Frontend
- React 19
- Vite 7
- Tailwind CSS 4
- Lucide React (icons)
- ESLint

## Security Features

✅ **Password Hashing** - bcrypt with 10 salt rounds  
✅ **Input Validation** - Server-side validation  
✅ **Auto Admin Creation** - Prevents duplicate admins  
✅ **CORS Protection** - Cross-origin security  
✅ **Error Handling** - Secure error messages  

## Development

### Running Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (new terminal)
cd frontend
npm run dev
```

### Production Build

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## Database

The system uses MongoDB with the following collections:

- `admins` - Administrator accounts
- `companies` - Company information
- `companyEmployees` - Employee details
- `orders` - Customer/Company orders
- `labour` - Labour/Tailor information
- `wages` - Wage information
- `workAssignments` - Work assignment tracking

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F
```

### MongoDB Connection Failed

1. Ensure MongoDB is running
2. Check `MONGODB_URI` in `.env`
3. Verify database name matches

### Modules Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

---

## Support

For issues or questions:

1. Check the documentation files
2. Verify MongoDB is running
3. Check backend logs
4. Ensure ports 5000 and 5173 are available

**Current Version:** 1.0.0  
**Last Updated:** March 11, 2026  
**Status:** ✅ Production Ready

The backend exposes a health route at `GET /api/health` and mounts API routes under `/api`:

- `/api/orders` (routes in `backend/routes/orders.js`)
- `/api/companies` (routes in `backend/routes/companies.js`)
- `/api/employees` (routes in `backend/routes/companyEmployees.js`)
- `/api/labour` (routes in `backend/routes/labour.js`)

## Frontend — setup & run

1. Install dependencies and run dev server:

	```bash
	cd frontend
	npm install
	npm run dev
	```

2. Build for production:

	```bash
	npm run build
	npm run preview
	```

The frontend talks to the backend API; update the API base URL in `frontend/src/services/api.js` if needed.

## Configuration

- Database connection settings are read from environment variables in `backend/config/db.js` (see `MONGODB_URI` and `DB_NAME`).

## Development notes

- Backend main script: `backend/server.js` — it connects to MongoDB before starting the HTTP server.
- Backend scripts (see `backend/package.json`): `start`, `dev`.
- Frontend scripts (see `frontend/package.json`): `dev`, `build`, `preview`, `lint`.

## Contributing

Open issues or PRs for bug fixes and improvements. Keep changes focused and add brief notes in PR descriptions.

## License

This project uses the existing license in the repository root.

---

If you'd like, I can also:

- Add a sample `.env.example` in `backend/`.
- Add a short CONTRIBUTING.md with development workflow.
