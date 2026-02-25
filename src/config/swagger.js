const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Service Marketplace API',
            version: '1.0.0',
            description: 'Internal API documentation'
        },
        servers: [{
            url: 'https://eeriest-asymptotically-sherie.ngrok-free.dev/api'
        }],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            BearerAuth: []
        }]
    },

    apis: ['./src/routes/api.routes.js'],
};

module.exports = swaggerJsdoc(options);