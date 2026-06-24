const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// All cart routes require authentication
router.use(authMiddleware);

// GET /api/cart
// Returns all cart items for the logged-in user joined with product details
router.get('/', (req, res) => {
  const userId = req.user.id;

  try {
    const cartItems = db.prepare(`
      SELECT 
        ci.id, 
        ci.user_id, 
        ci.product_id, 
        ci.quantity, 
        ci.added_at, 
        p.name, 
        p.price, 
        p.stock, 
        p.image_url, 
        p.category 
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.added_at DESC
    `).all(userId);

    res.json(cartItems);
  } catch (err) {
    console.error('Fetch cart error:', err);
    res.status(500).json({ error: 'Server error retrieving cart items' });
  }
});

// POST /api/cart
// Body: { product_id, quantity }
router.post('/', (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity } = req.body;

  const productId = parseInt(product_id, 10);
  const qty = parseInt(quantity, 10);

  if (isNaN(productId) || isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Invalid product ID or quantity. Quantity must be greater than 0.' });
  }

  try {
    // Check if the product exists
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is in stock at all
    if (product.stock <= 0) {
      return res.status(400).json({ error: 'This product is out of stock' });
    }

    // Check if product is already in user's cart
    const existingItem = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId);

    let finalQty = qty;
    if (existingItem) {
      finalQty = existingItem.quantity + qty;
    }

    // Validate that the request does not exceed available stock
    if (finalQty > product.stock) {
      return res.status(400).json({ 
        error: `Cannot add more. Only ${product.stock} items are available in stock, and you already have ${existingItem ? existingItem.quantity : 0} in your cart.` 
      });
    }

    if (existingItem) {
      // Update quantity
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(finalQty, existingItem.id);
      res.json({ message: 'Cart item quantity updated successfully', cartItemId: existingItem.id, quantity: finalQty });
    } else {
      // Insert new cart item
      const info = db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, productId, qty);
      res.status(201).json({ message: 'Product added to cart successfully', cartItemId: info.lastInsertRowid, quantity: qty });
    }
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Server error adding product to cart' });
  }
});

// PUT /api/cart/:id
// Body: { quantity }
router.put('/:id', (req, res) => {
  const userId = req.user.id;
  const cartItemId = parseInt(req.params.id, 10);
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);

  if (isNaN(cartItemId) || isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Invalid cart item ID or quantity' });
  }

  try {
    // Check if the cart item exists and belongs to the user
    const cartItem = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(cartItemId, userId);
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Check product stock
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(cartItem.product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product associated with this cart item does not exist' });
    }

    if (qty > product.stock) {
      return res.status(400).json({ error: `Cannot update quantity. Only ${product.stock} items available in stock.` });
    }

    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, cartItemId);
    res.json({ message: 'Cart quantity updated successfully', quantity: qty });
  } catch (err) {
    console.error('Update cart item error:', err);
    res.status(500).json({ error: 'Server error updating cart quantity' });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const cartItemId = parseInt(req.params.id, 10);

  if (isNaN(cartItemId)) {
    return res.status(400).json({ error: 'Invalid cart item ID' });
  }

  try {
    // Check if the cart item exists and belongs to the user
    const cartItem = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(cartItemId, userId);
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    db.prepare('DELETE FROM cart_items WHERE id = ?').run(cartItemId);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ error: 'Server error removing item from cart' });
  }
});

module.exports = router;
