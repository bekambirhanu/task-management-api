const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { MONGODB_URI } = require('../envVars')
const routeAuth = require('./routes/auth');
const routeCRUD = require('./routes/task');
const notification_router = require('./routes/notification');
const fileRoute = require('./routes/uploads');

const app = express();

// Middleware
// For Protection of some HTTP attacks and better security config related to cors - headers
// Security middleware for production only
if (process.env.NODE_ENV === 'production') {
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  }));
}
else {
  app.use(helmet());
}

// for allowance of cross origin issues
app.use(cors());
// To log requests and responses on the console
app.use(morgan('combined'));
// To parse requests into json format for an efficient data handling
app.use(express.json());
// To check rate limiting
//app.use(rateLimiter);

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication endpoint
app.use('/api', routeAuth);

// Task crud operation endpoint
app.use('/api', routeCRUD);

// Notification endpoints
app.use('/api/notifications', notification_router);

// File Process endpoints
app.use('/api', fileRoute);

// Database connection
try{
  mongoose.connect(MONGODB_URI);
} catch(error) {
  if(error === mongoose.MongooseError) {
    console.log(`MongoDB Connection Error:\n ${error}`);
  }
  else {
    console.log(error);
  }
}

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
