// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure the data directory exists
const dataDir = path.dirname(process.env.DB_PATH || path.join(__dirname, '../data/integriting.db'));
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/integriting.db');

// Get database connection
const getConnection = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('SQLite connection error:', err);
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
};

// Run a query with parameters
const runQuery = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Get all rows from a query
const getAllQuery = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get a single row from a query
const getQuery = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Initialize database (create tables if they don't exist)
const initializeDatabase = async () => {
  try {
    const db = await getConnection();
    
    // Enable foreign keys
    await runQuery(db, 'PRAGMA foreign_keys = ON');
    
    // Check if Users table exists
    const usersTableCheck = await getQuery(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='Users'");
    
    // If Users table doesn't exist, create all tables
    if (!usersTableCheck) {
      console.log('Initializing database tables...');
      
      // Create Users table
      await runQuery(db, `
        CREATE TABLE Users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'editor',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create Categories table
      await runQuery(db, `
        CREATE TABLE Categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default categories
      await runQuery(db, `
        INSERT INTO Categories (name) VALUES 
        ('Governance'),
        ('Compliance'),
        ('Financial Crimes'),
        ('Policy')
      `);
      
      // Create Publications table
      await runQuery(db, `
        CREATE TABLE Publications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          summary TEXT,
          category_id INTEGER,
          pdf_file_path TEXT,
          file_size INTEGER,
          cover_image_path TEXT,
          published_date DATE NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES Categories(id)
        )
      `);
      
      // Create Services table
      await runQuery(db, `
        CREATE TABLE Services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          order_number INTEGER,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create ServiceLogos table
      await runQuery(db, `
        CREATE TABLE ServiceLogos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_id INTEGER NOT NULL,
          client_name TEXT,
          logo_url TEXT NOT NULL,
          order_number INTEGER,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES Services(id) ON DELETE CASCADE
        )
      `);
      
      // Create Seminars table
      await runQuery(db, `
        CREATE TABLE Seminars (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          image_path TEXT,
          event_date DATE NOT NULL,
          status TEXT NOT NULL,
          seats_available INTEGER,
          location TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create Newspapers table
      await runQuery(db, `
        CREATE TABLE Newspapers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          pdf_file_path TEXT NOT NULL,
          issue_date DATE NOT NULL,
          cover_image_path TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create WhistleblowerReports table
      await runQuery(db, `
        CREATE TABLE WhistleblowerReports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT,
          message TEXT NOT NULL,
          is_anonymous INTEGER NOT NULL DEFAULT 1,
          reference_number TEXT,
          admin_notes TEXT,
          status TEXT NOT NULL DEFAULT 'Pending',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Database tables created successfully');
      
      // Create default admin user
      const isProduction = process.env.NODE_ENV === 'production';
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

      if (isProduction) {
        // Refuse to seed a guessable admin account in production.
        if (!adminPassword || adminPassword === 'admin123' || adminPassword.length < 10) {
          throw new Error(
            'FATAL: ADMIN_DEFAULT_PASSWORD is missing or weak. Set a strong ' +
            '(>=10 char, not "admin123") ADMIN_DEFAULT_PASSWORD via the runtime ' +
            'environment before first startup in production.'
          );
        }
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword || 'admin123', salt);
      
      await runQuery(db, `
        INSERT INTO Users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `, ['admin', process.env.ADMIN_EMAIL || 'admin@integriting.com', passwordHash, 'admin']);
      
      console.log('Default admin user created');
    } else {
      // For existing databases, check if ServiceLogos table exists
      const serviceLogosTableCheck = await getQuery(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='ServiceLogos'");

      if (!serviceLogosTableCheck) {
        console.log('Adding ServiceLogos table to existing database...');
        await runQuery(db, `
          CREATE TABLE ServiceLogos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id INTEGER NOT NULL,
            client_name TEXT,
            logo_url TEXT NOT NULL,
            order_number INTEGER,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (service_id) REFERENCES Services(id) ON DELETE CASCADE
          )
        `);
        console.log('ServiceLogos table created successfully');
      }

      const publicationColumns = await getAllQuery(db, 'PRAGMA table_info(Publications)');
      const hasPublicationCoverImage = publicationColumns.some(column => column.name === 'cover_image_path');

      if (!hasPublicationCoverImage) {
        console.log('Adding cover_image_path column to Publications...');
        await runQuery(db, 'ALTER TABLE Publications ADD COLUMN cover_image_path TEXT');
        console.log('Publications cover_image_path column added successfully');
      }
    }

    console.log('Database initialization complete');
    db.close();
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
};

// Create a transaction
const beginTransaction = async (db) => {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Commit a transaction
const commitTransaction = async (db) => {
  return new Promise((resolve, reject) => {
    db.run('COMMIT', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Rollback a transaction
const rollbackTransaction = async (db) => {
  return new Promise((resolve, reject) => {
    db.run('ROLLBACK', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = {
  getConnection,
  runQuery,
  getAllQuery,
  getQuery,
  initializeDatabase,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};
