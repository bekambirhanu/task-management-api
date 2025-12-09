const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { MONGODB_URI } = require('../envVars')
const routeAuth = require('./routes/auth');
const routeCRUD = require('./routes/task');

const app = express();

// Middleware
// For Protection of some HTTP attacks and better security config related to cors - headers
app.use(helmet());
// for allowance of cross origin issues
app.use(cors());
// To log requests and responses on the console
app.use(morgan('combined'));
// To parse requests into json format for an efficient data handling
app.use(express.json());

//authentication endpoint
app.use('/api', routeAuth)

//task crud operation endpoint
app.use('/api', routeCRUD)

//realtime endpoint

// Database connection
mongoose.connect(MONGODB_URI);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
