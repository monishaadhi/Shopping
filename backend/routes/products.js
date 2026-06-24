const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products
// Optional query params: search (searches name and description), category
router.get('/', (req, res) => {
  const { search, category } = req.query;

  try {
    let sql = 'SELECT * FROM products';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sort products by id so they display in a deterministic order
    sql += ' ORDER BY id ASC';

    const products = db.prepare(sql).all(params);
    res.json(products);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Server error retrieving products list' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID format' });
  }

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Fetch product by ID error:', err);
    res.status(500).json({ error: 'Server error retrieving product details' });
  }
});

module.exports = router;
