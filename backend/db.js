const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../ecommerce.db');
const db = new Database(dbPath);

// Enable foreign keys to enforce SQLite database constraints
db.pragma('foreign_keys = ON');

module.exports = db;
