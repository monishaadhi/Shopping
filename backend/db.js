const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath;

if (process.env.VERCEL) {
  dbPath = '/tmp/ecommerce.db';
  const sourcePath = path.resolve(__dirname, '../ecommerce.db');
  if (!fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(sourcePath, dbPath);
      console.log('Successfully copied seeded database to /tmp/ecommerce.db');
    } catch (err) {
      console.error('Error copying database to /tmp:', err);
    }
  }
} else {
  dbPath = path.resolve(__dirname, '../ecommerce.db');
}

const db = new Database(dbPath);

// Enable foreign keys to enforce SQLite database constraints
db.pragma('foreign_keys = ON');

module.exports = db;
