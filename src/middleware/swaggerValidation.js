// Optional: Use OpenAPI schema for request validation
const OpenApiValidator = require('express-openapi-validator');

const swaggerValidation = OpenApiValidator.middleware({
    apiSpec: require('../config/swagger'),
    validateRequests: true,
    validateResponses: process.env.NODE_ENV === 'development',
    ignorePaths: /\/api-docs|\/health/,
    fileUploader: false
});

module.exports = swaggerValidation;
