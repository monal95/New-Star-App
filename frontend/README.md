# Smart Tailoring Management System - Frontend

A modern React + Vite application with Tailwind CSS for managing tailoring business operations. Built with a focus on user experience and responsive design.

## Overview

The frontend is a single-page application (SPA) that provides an intuitive interface for managing tailoring business operations. It includes dashboards for different user roles (companies and employees), order management, and employee management features.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Linting**: ESLint 9
- **CSS Processing**: PostCSS

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package managers.

## Installation

1. Navigate to the frontend directory:

   ``ash
   cd frontend
   ``

2. Install dependencies:

   ``ash
   npm install
   ``

## Running the Application

### Development

Start the development server with hot module replacement:

``ash
npm run dev
``

The application will be available at http://localhost:5173

### Build for Production

Create an optimized production build:

``ash
npm run build
``

### Preview Production Build

Preview the production build locally:

``ash
npm run preview
``

### Linting

Check code quality with ESLint:

``ash
npm run lint
``

## Project Structure

``
frontend/
 src/
    App.jsx              # Root component
    main.jsx             # Entry point
    index.css            # Global styles
    components/          # React components
       CivilDashboard.jsx
       CivilForm.jsx
       CompanyDashboard.jsx
       CompanyList.jsx
       CompanyOrders.jsx
       Sidebar.jsx
    services/            # API services
       api.js          # API client
    assets/             # Images, fonts, etc.
 public/                  # Static files
 index.html              # HTML template
 vite.config.js          # Vite configuration
 tailwind.config.js      # Tailwind CSS configuration
 postcss.config.js       # PostCSS configuration
 eslint.config.js        # ESLint configuration
``

## Components

### CivilDashboard
Dashboard for displaying civil/employee information and operations.

### CivilForm
Form component for civil/employee data entry and management.

### CompanyDashboard
Main dashboard for company-level operations and overview.

### CompanyList
List view component for displaying companies.

### CompanyOrders
Component for managing and displaying company orders.

### Sidebar
Navigation sidebar for application menu.

## Services

### API Service
The pi.js service handles all communication with the backend API. It provides methods for:
- Company management (CRUD operations)
- Employee management (CRUD operations)
- Order management (CRUD operations)

## Configuration Files

- **vite.config.js** - Vite build configuration
- **tailwind.config.js** - Tailwind CSS customization
- **postcss.config.js** - PostCSS processing configuration
- **eslint.config.js** - Code quality rules

## Key Dependencies

- **react** - UI framework
- **react-dom** - React DOM rendering
- **lucide-react** - Icon library
- **tailwindcss** - Utility-first CSS framework

## Dev Dependencies

- **vite** - Build tool and dev server
- **@vitejs/plugin-react** - React support for Vite
- **eslint** - Code linting
- **tailwindcss** - CSS framework
- **autoprefixer** - CSS prefixing

## Development Workflow

1. Start the development server with 
pm run dev
2. Make changes to components in src/
3. Vite will automatically hot-reload your changes
4. Run 
pm run lint to check code quality
5. Build for production with 
pm run build

## Browser Support

Modern browsers supporting:
- ES6+ JavaScript
- CSS Grid and Flexbox
- Modern CSS features used by Tailwind CSS

## Contributing

1. Create a feature branch
2. Make your changes
3. Run 
pm run lint to check code quality
4. Submit a pull request

## License

MIT
