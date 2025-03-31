// config/database.js
const sql = require('mssql');

// SQL Server configuration
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

// Get connection pool
const getConnection = async () => {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('SQL Server connection error:', err);
    throw err;
  }
};

// Initialize database (create tables if they don't exist)
const initializeDatabase = async () => {
  try {
    const pool = await getConnection();
    
    // Check if Users table exists
    const usersTableCheck = await pool.request().query(`
      SELECT OBJECT_ID('dbo.Users') as TableExists
    `);
    
    // If Users table doesn't exist, create all tables
    if (!usersTableCheck.recordset[0].TableExists) {
      console.log('Initializing database tables...');
      
      // Create Users table
      await pool.request().query(`
        CREATE TABLE Users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(50) NOT NULL UNIQUE,
          email NVARCHAR(100) NOT NULL UNIQUE,
          password_hash NVARCHAR(255) NOT NULL,
          role NVARCHAR(20) NOT NULL DEFAULT 'editor',
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        )
      `);
      
      // Create Categories table
      await pool.request().query(`
        CREATE TABLE Categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(50) NOT NULL UNIQUE,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        )
      `);
      
      // Insert default categories
      await pool.request().query(`
        INSERT INTO Categories (name) VALUES 
        ('Governance'),
        ('Compliance'),
        ('Financial Crimes'),
        ('Policy')
      `);
      
      // Create Publications table
      await pool.request().query(`
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
        )
      `);
      
      // Create Services table
      await pool.request().query(`
        CREATE TABLE Services (
          id INT IDENTITY(1,1) PRIMARY KEY,
          title NVARCHAR(100) NOT NULL,
          description NVARCHAR(MAX),
          icon NVARCHAR(100),
          order_number INT,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        )
      `);
      
      // Create Seminars table
      await pool.request().query(`
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
        )
      `);
      
      // Create Newspapers table
      await pool.request().query(`
        CREATE TABLE Newspapers (
          id INT IDENTITY(1,1) PRIMARY KEY,
          title NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX),
          pdf_file_path NVARCHAR(255) NOT NULL,
          issue_date DATE NOT NULL,
          cover_image_path NVARCHAR(255),
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        )
      `);
      
      // Create WhistleblowerReports table
      await pool.request().query(`
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
        )
      `);
      
      console.log('Database tables created successfully');
      
      // Create default admin user
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123', salt);
      
      await pool.request()
        .input('username', sql.NVarChar(50), 'admin')
        .input('email', sql.NVarChar(100), process.env.ADMIN_EMAIL || 'admin@integriting.com')
        .input('password_hash', sql.NVarChar(255), passwordHash)
        .input('role', sql.NVarChar(20), 'admin')
        .query(`
          INSERT INTO Users (username, email, password_hash, role)
          VALUES (@username, @email, @password_hash, @role)
        `);
      
      console.log('Default admin user created');
    }
    
    console.log('Database initialization complete');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
};

module.exports = {
  getConnection,
  initializeDatabase
};