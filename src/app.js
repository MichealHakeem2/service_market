const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes/api.routes');
const path = require('path');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('./models/associations');
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(morgan('dev'));
app.use('/api', apiRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    requestInterceptor: (req) => {
      req.headers['ngrok-skip-browser-warning'] = '69420';
      return req;
    }
  }
}));
app.use((err, req, res, next) => {
  console.error('🔥 Global Error Handler:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
app.get('/', (req, res) => {
  res.json({
    status: 'API is running 🚀'
  });
});
module.exports = app;