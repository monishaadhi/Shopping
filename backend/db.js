const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbPath;

if (process.env.VERCEL) {
  dbPath = '/tmp/ecommerce.db';
  const possiblePaths = [
    path.resolve(__dirname, '../ecommerce.db'),
    path.resolve(process.cwd(), 'ecommerce.db'),
    path.resolve(__dirname, 'ecommerce.db'),
    path.resolve(process.cwd(), 'backend/ecommerce.db')
  ];
  let sourcePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      sourcePath = p;
      break;
    }
  }
  if (!fs.existsSync(dbPath)) {
    try {
      if (sourcePath) {
        fs.copyFileSync(sourcePath, dbPath);
        console.log(`Successfully copied seeded database from ${sourcePath} to /tmp/ecommerce.db`);
      } else {
        console.error('Source database file not found in any of the search paths:', possiblePaths);
      }
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
