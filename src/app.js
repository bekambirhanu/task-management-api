const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const limiter = require('./middleware/rateLimit')
const { MONGODB_URI } = require('../envVars')
const routeAuth = require('./routes/auth');
const routeCRUD = require('./routes/task');
const notificationRouter = require('./routes/notification');
const fileRoute = require('./routes/uploads');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const swaggerValidation = require('./middleware/swaggerValidation');


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
app.use(express.urlencoded({extended: true}));
// To check rate limiting
//app.use(rateLimiter);
app.use('/api', limiter);
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger
app.use(swaggerValidation);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Task Manager API Documentation"
}));

// Optional: Add JSON endpoint for Swagger spec
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});
// Authentication endpoint
app.use('/api', routeAuth);

// Task crud operation endpoint
app.use('/api', routeCRUD);

// Notification endpoints
app.use('/api/notifications', notificationRouter);

// File Process endpoints
app.use('/api', fileRoute);

// Database connection
try{
  mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  });
} catch(error) {
    console.log(`MongoDB Connection Error:\n ${error.message}`);

    // process.exit(1);
}

// Basic health check route
app.get('/health', (req, res) => {

  const dbStatus = mongoose.connection.readyState === 1? "connected": "disconnected";

  res.status(200).json({ 
    status: 'OK',
    dbStatus: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.use(/(.*)/, (req, res) => {
  res.status(404).json({
    success: false,
    message: `request ${req.originalUrl} is not found!`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
