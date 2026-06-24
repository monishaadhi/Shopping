const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// All order routes require authentication
router.use(authMiddleware);

// POST /api/orders
// Converted all cart items into a new order, clears cart, deducts stock
router.post('/', (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch current cart items for user
    const cartItems = db.prepare(`
      SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(userId);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty. Add products before checking out.' });
    }

    // 2. Define the transaction for order placement
    const placeOrderTransaction = db.transaction((items) => {
      // Check stock levels inside transaction to prevent race conditions
      for (const item of items) {
        const product = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(item.product_id);
        if (!product) {
          throw new Error(`Product ${item.name} no longer exists.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${item.name}". Only ${product.stock} items remaining.`);
        }
      }

      // Calculate total: subtotal + $5 flat shipping fee
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalPrice = subtotal + 5.00;

      // Create order (defaulting status to 'confirmed')
      const orderInfo = db.prepare('INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)')
                          .run(userId, totalPrice, 'confirmed');
      const orderId = orderInfo.lastInsertRowid;

      // Prepare statements for order items and stock deduction
      const insertOrderItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
      const deductStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

      // Record items and decrement stock
      for (const item of items) {
        insertOrderItem.run(orderId, item.product_id, item.quantity, item.price);
        deductStock.run(item.quantity, item.product_id);
      }

      // Clear the user's cart
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

      return orderId;
    });

    // Execute the transaction
    const orderId = placeOrderTransaction(cartItems);

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: orderId
    });
  } catch (err) {
    console.error('Order placement transaction failed:', err);
    // Error could be thrown manually inside the transaction
    if (err.message.includes('stock') || err.message.includes('exists')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error placing your order. Please try again.' });
  }
});

// GET /api/orders
// Returns all orders for the logged-in user
router.get('/', (req, res) => {
  const userId = req.user.id;

  try {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json(orders);
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ error: 'Server error retrieving order history' });
  }
});

// GET /api/orders/:id
// Returns details for a single order including all purchased items
router.get('/:id', (req, res) => {
  const userId = req.user.id;
  const orderId = parseInt(req.params.id, 10);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID format' });
  }

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.prepare(`
      SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price, p.name, p.image_url, p.category
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId);

    res.json({
      ...order,
      items
    });
  } catch (err) {
    console.error('Fetch order detail error:', err);
    res.status(500).json({ error: 'Server error retrieving order details' });
  }
});

module.exports = router;
