// scripts/migrations/runMigrations.js
require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

// Database configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // For Azure
    trustServerCertificate: process.env.NODE_ENV !== 'production', // For local dev
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Migration functions
const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');
    
    // Connect to database
    const pool = await sql.connect(config);
    
    // Check if Migration table exists, if not, create it
    await setupMigrationTable(pool);
    
    // Get list of applied migrations
    const appliedMigrations = await getAppliedMigrations(pool);
    
    // Get list of migration files
    const migrationFiles = getMigrationFiles();
    
    // Determine which migrations need to be run
    const pendingMigrations = migrationFiles.filter(file => !appliedMigrations.includes(file));
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations to apply.');
      await pool.close();
      return;
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations to apply.`);
    
    // Sort migrations by filename (which should include version number)
    pendingMigrations.sort();
    
    // Run each migration
    for (const migrationFile of pendingMigrations) {
      await runMigration(pool, migrationFile);
    }
    
    logger.info('All migrations completed successfully.');
    
    // Close the connection
    await pool.close();
  } catch (err) {
    logger.error('Migration error:', err);
    process.exit(1);
  }
};

// Setup migration table if it doesn't exist
const setupMigrationTable = async (pool) => {
  try {
    // Check if Migrations table exists
    const result = await pool.request().query(`
      SELECT OBJECT_ID('dbo.Migrations') as TableExists
    `);
    
    // If Migrations table doesn't exist, create it
    if (!result.recordset[0].TableExists) {
      logger.info('Creating Migrations table...');
      
      await pool.request().query(`
        CREATE TABLE Migrations (
          id INT IDENTITY(1,1) PRIMARY KEY,
          filename NVARCHAR(255) NOT NULL,
          applied_at DATETIME NOT NULL DEFAULT GETDATE(),
          description NVARCHAR(500)
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
const getAppliedMigrations = async (pool) => {
  try {
    const result = await pool.request().query(`
      SELECT filename FROM Migrations ORDER BY id
    `);
    
    return result.recordset.map(record => record.filename);
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
const runMigration = async (pool, migrationFile) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    logger.info(`Running migration: ${migrationFile}`);
    
    // Read migration file content
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Start transaction
    await transaction.begin();
    
    // Execute migration SQL
    await transaction.request().query(migrationContent);
    
    // Record migration in Migrations table
    await transaction.request()
      .input('filename', sql.NVarChar(255), migrationFile)
      .input('description', sql.NVarChar(500), `Migration applied from file ${migrationFile}`)
      .query(`
        INSERT INTO Migrations (filename, description)
        VALUES (@filename, @description)
      `);
    
    // Commit transaction
    await transaction.commit();
    
    logger.info(`Migration ${migrationFile} applied successfully.`);
  } catch (err) {
    // Rollback transaction on error
    await transaction.rollback();
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

// Example migration file: migrations/001-initial-schema.sql
/*
-- Create Users Table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'editor',
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create Categories Table
CREATE TABLE Categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create Publications Table
CREATE TABLE Publications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX),
    summary NVARCHAR(500),
    category_id INT,
    pdf_file_path NVARCHAR(255),
    file_size INT,
    published_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES Categories(id)
);

-- Create Services Table
CREATE TABLE Services (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    icon NVARCHAR(100),
    order_number INT,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create Seminars Table
CREATE TABLE Seminars (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    image_path NVARCHAR(255),
    event_date DATE NOT NULL,
    status NVARCHAR(20) NOT NULL,
    seats_available INT,
    location NVARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create Newspapers Table
CREATE TABLE Newspapers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    pdf_file_path NVARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    cover_image_path NVARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create WhistleblowerReports Table
CREATE TABLE WhistleblowerReports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100),
    email NVARCHAR(100),
    message NVARCHAR(MAX) NOT NULL,
    is_anonymous BIT NOT NULL DEFAULT 1,
    reference_number NVARCHAR(20),
    status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    admin_notes NVARCHAR(MAX),
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);

-- Insert default categories
INSERT INTO Categories (name) VALUES 
('Governance'),
('Compliance'),
('Financial Crimes'),
('Policy');
*/