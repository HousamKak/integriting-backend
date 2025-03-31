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
  admin_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO Categories (name) VALUES 
('Governance'),
('Compliance'),
('Financial Crimes'),
('Policy');