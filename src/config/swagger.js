const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Task Management API',
            version: '1.0.0',
            description: 'A production-ready task management system with real-time features',
            contact: {
                name: 'API Support',
                email: 'support@taskmanager.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Development server'
            },
            {
                url: 'https://api.taskmanager.com/api',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['email', 'password', 'first_name', 'last_name', 'sex'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 6,
                            example: 'Password123!'
                        },
                        first_name: {
                            type: 'string',
                            example: 'John'
                        },
                        last_name: {
                            type: 'string',
                            example: 'Doe'
                        },
                        sex: {
                            type: 'string',
                            enum: ['male', 'female']
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'manager', 'admin'],
                            default: 'user'
                        }
                    }
                },
                Task: {
                    type: 'object',
                    required: ['title', 'description', 'status'],
                    properties: {
                        title: {
                            type: 'string',
                            maxLength: 100,
                            example: 'Complete project documentation'
                        },
                        description: {
                            type: 'string',
                            maxLength: 1000,
                            example: 'Write comprehensive documentation for the new feature'
                        },
                        status: {
                            type: 'string',
                            enum: ['todo', 'in-progress', 'done'],
                            default: 'todo'
                        },
                        priority: {
                            type: 'string',
                            enum: ['low', 'medium', 'high'],
                            default: 'medium'
                        },
                        dueDate: {
                            type: 'string',
                            format: 'date-time'
                        },
                        assignedTo: {
                            type: 'array',
                            items: {
                                type: 'string',
                                format: 'uuid'
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Error description'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object'
                            }
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid'
                },
                NotFoundError: {
                    description: 'The requested resource was not found'
                },
                ValidationError: {
                    description: 'Input validation failed'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: [
        './src/routes/*.js',
        './src/controllers/*.js',
        './src/models/*.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;