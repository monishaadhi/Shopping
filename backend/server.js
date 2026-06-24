const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to permit Live Server origin hosts
const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500'];
app.use(cors({
  origin: (origin, callback) => {
    // Enable requests from allowed origins or empty origins (e.g. mobile apps, local file index.html)
    if (
      !origin || 
      origin === 'null' || 
      allowedOrigins.includes(origin) || 
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:')
    ) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
}));

// Body parser middleware
app.use(express.json());

// API route registrations
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Exception:', err);
  res.status(500).json({ error: err.message || 'An internal server error occurred.' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`E-commerce API Server is running on http://localhost:${PORT}`);
});
