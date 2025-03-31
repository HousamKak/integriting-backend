// scripts/migrations/runMigrations.js
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, 'integriting.db');

// Get database connection
const getConnection = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('SQLite connection error:', err);
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

// Migration functions
const runMigrations = async () => {
  let db;
  
  try {
    logger.info('Starting database migrations...');
    
    // Connect to database
    db = await getConnection();
    
    // Check if Migration table exists, if not, create it
    await setupMigrationTable(db);
    
    // Get list of applied migrations
    const appliedMigrations = await getAppliedMigrations(db);
    
    // Get list of migration files
    const migrationFiles = getMigrationFiles();
    
    // Determine which migrations need to be run
    const pendingMigrations = migrationFiles.filter(file => !appliedMigrations.includes(file));
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations to apply.');
      db.close();
      return;
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations to apply.`);
    
    // Sort migrations by filename (which should include version number)
    pendingMigrations.sort();
    
    // Run each migration
    for (const migrationFile of pendingMigrations) {
      await runMigration(db, migrationFile);
    }
    
    logger.info('All migrations completed successfully.');
    
    // Close the connection
    db.close();
  } catch (err) {
    logger.error('Migration error:', err);
    if (db) db.close();
    process.exit(1);
  }
};

// Setup migration table if it doesn't exist
const setupMigrationTable = async (db) => {
  try {
    // Check if Migrations table exists
    const tables = await getAllQuery(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='Migrations'");
    
    // If Migrations table doesn't exist, create it
    if (tables.length === 0) {
      logger.info('Creating Migrations table...');
      
      await runQuery(db, `
        CREATE TABLE Migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          description TEXT
        )
      `);
      
      logger.info('Migrations table created successfully.');
    }
  } catch (err) {
    logger.error('Failed to setup migrations table:', err);
    throw err;
  }
};

// Get list of applied migrations
const getAppliedMigrations = async (db) => {
  try {
    const migrations = await getAllQuery(db, 'SELECT filename FROM Migrations ORDER BY id');
    return migrations.map(record => record.filename);
  } catch (err) {
    logger.error('Failed to get applied migrations:', err);
    throw err;
  }
};

// Get list of migration files from migrations directory
const getMigrationFiles = () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // Create migrations directory if it doesn't exist
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Get all .sql files in migrations directory
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'));
};

// Run a specific migration
const runMigration = async (db, migrationFile) => {
  try {
    logger.info(`Running migration: ${migrationFile}`);
    
    // Read migration file content
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Start transaction
    await runQuery(db, 'BEGIN TRANSACTION');
    
    // Execute migration SQL
    await runQuery(db, migrationContent);
    
    // Record migration in Migrations table
    await runQuery(db, 
      'INSERT INTO Migrations (filename, description) VALUES (?, ?)',
      [migrationFile, `Migration applied from file ${migrationFile}`]
    );
    
    // Commit transaction
    await runQuery(db, 'COMMIT');
    
    logger.info(`Migration ${migrationFile} applied successfully.`);
  } catch (err) {
    // Rollback transaction on error
    await runQuery(db, 'ROLLBACK');
    logger.error(`Failed to apply migration ${migrationFile}:`, err);
    throw err;
  }
};

// Run migrations when script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration process completed.');
      process.exit(0);
    })
    .catch(err => {
      logger.error('Migration process failed:', err);
      process.exit(1);
    });
}

module.exports = runMigrations;

// Example migration file for SQLite: migrations/001-initial-schema.sql
/*
-- Create Users Table
CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Categories Table
CREATE TABLE IF NOT EXISTS Categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Publications Table
CREATE TABLE IF NOT EXISTS Publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  category_id INTEGER,
  pdf_file_path TEXT,
  file_size INTEGER,
  published_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES Categories(id)
);

-- Create Services Table
CREATE TABLE IF NOT EXISTS Services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_number INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Seminars Table
CREATE TABLE IF NOT EXISTS Seminars (
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
);

-- Create Newspapers Table
CREATE TABLE IF NOT EXISTS Newspapers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  pdf_file_path TEXT NOT NULL,
  issue_date DATE NOT NULL,
  cover_image_path TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create WhistleblowerReports Table
CREATE TABLE IF NOT EXISTS WhistleblowerReports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 1,
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  admin_notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO Categories (name) VALUES 
('Governance'),
('Compliance'),
('Financial Crimes'),
('Policy');
*/