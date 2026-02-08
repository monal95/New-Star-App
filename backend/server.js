const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Import routes
const ordersRoutes = require('./routes/orders');
const companiesRoutes = require('./routes/companies');
const companyEmployeesRoutes = require('./routes/companyEmployees');
const labourRoutes = require('./routes/labour');
const wagesRoutes = require('./routes/wages');
const workAssignmentsRoutes = require('./routes/workAssignments');

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// API Routes
app.use('/api/orders', ordersRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/employees', companyEmployeesRoutes);
app.use('/api/labour', labourRoutes);
app.use('/api/wages', wagesRoutes);
app.use('/api/workAssignments', workAssignmentsRoutes);

// Start server after DB connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
