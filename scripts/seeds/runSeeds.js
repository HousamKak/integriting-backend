// scripts/seeds/runSeeds.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const logger = require('../../utils/logger');

// Ensure the data directory exists
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

// Create database schema
const createSchema = async (db) => {
  try {
    logger.info('Creating database schema...');
    
    // Enable foreign keys
    await runQuery(db, 'PRAGMA foreign_keys = ON');
    
    // Create Users table
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS Users (
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
      CREATE TABLE IF NOT EXISTS Categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create Publications table
    await runQuery(db, `
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
      )
    `);
    
    // Create Services table
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS Services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        order_number INTEGER,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create Seminars table
    await runQuery(db, `
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
      )
    `);
    
    // Create Newspapers table
    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS Newspapers (
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
      )
    `);
    
    logger.info('Database schema created successfully');
  } catch (err) {
    logger.error('Failed to create schema:', err);
    throw err;
  }
};

// Database seeding functions
const runSeeds = async () => {
  let db;
  
  try {
    logger.info('Starting database seeding...');
    
    // Connect to database
    db = await getConnection();
    
    // Create database tables
    await createSchema(db);
    
    // Run seeds in sequence
    await seedUsers(db);
    await seedCategories(db);
    await seedServices(db);
    await seedSeminars(db);
    await seedPublications(db);
    await seedNewspapers(db);
    
    logger.info('All seeds completed successfully.');
    
    // Close the connection
    db.close();
  } catch (err) {
    logger.error('Seeding error:', err);
    if (db) db.close();
    process.exit(1);
  }
};

// Seed users
const seedUsers = async (db) => {
  try {
    logger.info('Seeding users...');
    
    // Check if any users exist
    const userCount = await getQuery(db, 'SELECT COUNT(*) as count FROM Users');
    
    if (userCount && userCount.count > 0) {
      logger.info('Users already exist, skipping user seeding.');
      return;
    }
    
    // Create default admin user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123', salt);
    
    await runQuery(db, `
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, ['admin', process.env.ADMIN_EMAIL || 'admin@integriting.com', passwordHash, 'admin']);
    
    // Create default editor user
    const editorPasswordHash = await bcrypt.hash('editor123', salt);
    
    await runQuery(db, `
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, ['editor', 'editor@integriting.com', editorPasswordHash, 'editor']);
    
    logger.info('Users seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed users:', err);
    throw err;
  }
};

// Seed categories
const seedCategories = async (db) => {
  try {
    logger.info('Seeding categories...');
    
    // Check if any categories exist
    const categoryCount = await getQuery(db, 'SELECT COUNT(*) as count FROM Categories');
    
    if (categoryCount && categoryCount.count > 0) {
      logger.info('Categories already exist, skipping category seeding.');
      return;
    }
    
    // Default categories
    const categories = [
      'Governance',
      'Compliance',
      'Financial Crimes',
      'Policy'
    ];
    
    // Insert categories
    for (const category of categories) {
      await runQuery(db, `
        INSERT INTO Categories (name)
        VALUES (?)
      `, [category]);
    }
    
    logger.info('Categories seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed categories:', err);
    throw err;
  }
};

// Seed services
const seedServices = async (db) => {
  try {
    logger.info('Seeding services...');
    
    // Check if any services exist
    const serviceCount = await getQuery(db, 'SELECT COUNT(*) as count FROM Services');
    
    if (serviceCount && serviceCount.count > 0) {
      logger.info('Services already exist, skipping service seeding.');
      return;
    }
    
    // Default services
    const services = [
      {
        title: 'Governance Consulting',
        description: 'Comprehensive auditing and advisory services to help organizations establish robust governance frameworks, enhance transparency, and improve decision-making processes.',
        icon: 'governance',
        order_number: 1
      },
      {
        title: 'Intellectual Property Protection',
        description: 'Legal support for protecting intellectual property rights, including copyright, trademarks, and patents, along with strategies for managing and leveraging IP assets.',
        icon: 'intellectual-property',
        order_number: 2
      },
      {
        title: 'Contracts, MOUs and Agreements',
        description: 'Professional drafting, review, and negotiation of contracts, memorandums of understanding, and other legal agreements to protect your interests and ensure clarity.',
        icon: 'contracts',
        order_number: 3
      },
      {
        title: 'Compliance Advisory',
        description: 'Expert guidance on regulatory compliance, including risk assessment, policy development, and implementation of controls to ensure adherence to relevant laws and standards.',
        icon: 'compliance',
        order_number: 4
      },
      {
        title: 'Monitoring and Evaluation',
        description: 'Systematic tracking and assessment of organizational governance and compliance initiatives to measure effectiveness and identify areas for improvement.',
        icon: 'monitoring',
        order_number: 5
      },
      {
        title: 'Whistleblower Protection',
        description: 'Comprehensive programs and services to facilitate confidential reporting of misconduct and ensure legal protection for whistleblowers.',
        icon: 'whistleblower',
        order_number: 6
      }
    ];
    
    // Insert services
    for (const service of services) {
      await runQuery(db, `
        INSERT INTO Services (title, description, icon, order_number)
        VALUES (?, ?, ?, ?)
      `, [service.title, service.description, service.icon, service.order_number]);
    }
    
    logger.info('Services seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed services:', err);
    throw err;
  }
};

// Seed seminars
const seedSeminars = async (db) => {
  try {
    logger.info('Seeding seminars...');
    
    // Check if any seminars exist
    const seminarCount = await getQuery(db, 'SELECT COUNT(*) as count FROM Seminars');
    
    if (seminarCount && seminarCount.count > 0) {
      logger.info('Seminars already exist, skipping seminar seeding.');
      return;
    }
    
    // Create uploads directories if they don't exist
    const uploadsDir = path.join(__dirname, '../../uploads/images');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Default seminars
    const currentDate = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(currentDate.getMonth() + 1);
    
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(currentDate.getMonth() + 2);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
    
    const seminars = [
      {
        title: 'Enhancing Transparency in Governance',
        description: 'A comprehensive seminar on transparency principles, practices, and the benefits of transparent governance in organizations.',
        image_path: '/uploads/images/seminar-transparency.jpg',
        event_date: oneMonthFromNow.toISOString().split('T')[0],
        status: 'Upcoming',
        seats_available: 30,
        location: 'Business Center, Conference Hall A'
      },
      {
        title: 'Anti-Corruption Strategies Workshop',
        description: 'Learn effective strategies to prevent, detect, and address corruption risks in your organization.',
        image_path: '/uploads/images/seminar-anticorruption.jpg',
        event_date: twoMonthsFromNow.toISOString().split('T')[0],
        status: 'Upcoming',
        seats_available: 25,
        location: 'Virtual Event'
      },
      {
        title: 'Economic Crime Prevention Seminar',
        description: 'Expert guidance on identifying and mitigating financial crime risks, including fraud, money laundering, and embezzlement.',
        image_path: '/uploads/images/seminar-economiccrime.jpg',
        event_date: oneMonthAgo.toISOString().split('T')[0],
        status: 'Past',
        seats_available: 0,
        location: 'Financial District, Tower Plaza'
      },
      {
        title: 'Whistleblower Protection Laws: An Overview',
        description: 'A detailed examination of whistleblower protection laws and their application in various jurisdictions.',
        image_path: '/uploads/images/seminar-whistleblower.jpg',
        event_date: twoMonthsAgo.toISOString().split('T')[0],
        status: 'Past',
        seats_available: 0,
        location: 'Legal Center, Room 205'
      }
    ];
    
    // Insert seminars
    for (const seminar of seminars) {
      await runQuery(db, `
        INSERT INTO Seminars (title, description, image_path, event_date, status, seats_available, location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        seminar.title, 
        seminar.description, 
        seminar.image_path, 
        seminar.event_date, 
        seminar.status, 
        seminar.seats_available, 
        seminar.location
      ]);
    }
    
    logger.info('Seminars seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed seminars:', err);
    throw err;
  }
};

// Seed publications
const seedPublications = async (db) => {
  try {
    logger.info('Seeding publications...');
    
    // Check if any publications exist
    const publicationCount = await getQuery(db, 'SELECT COUNT(*) as count FROM Publications');
    
    if (publicationCount && publicationCount.count > 0) {
      logger.info('Publications already exist, skipping publication seeding.');
      return;
    }
    
    // Create uploads directories if they don't exist
    const uploadsDir = path.join(__dirname, '../../uploads/pdfs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Get category IDs
    const categories = await getAllQuery(db, 'SELECT id, name FROM Categories');
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    // Default publications
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
    
    const publications = [
      {
        title: 'The Role of Boards in Corporate Governance',
        summary: 'An analysis of how effective boards can enhance governance practices within corporations.',
        content: 'This publication explores the critical role of boards in establishing and maintaining effective corporate governance...',
        category_id: categoryMap['Governance'],
        pdf_file_path: '/uploads/pdfs/board-governance.pdf',
        file_size: 340000,
        published_date: currentDate.toISOString().split('T')[0]
      },
      {
        title: 'Recent Developments in Anti-Money Laundering',
        summary: 'A review of the latest changes to AML regulations and their implications for businesses.',
        content: 'This publication examines recent regulatory changes in anti-money laundering frameworks across major jurisdictions...',
        category_id: categoryMap['Compliance'],
        pdf_file_path: '/uploads/pdfs/aml-developments.pdf',
        file_size: 256000,
        published_date: oneMonthAgo.toISOString().split('T')[0]
      },
      {
        title: 'Challenges in Prosecuting White-Collar Crimes',
        summary: 'Examination of the obstacles faced in investigating and prosecuting financial crimes.',
        content: 'This publication delves into the complex challenges that prosecutors and investigators face when tackling sophisticated white-collar crimes...',
        category_id: categoryMap['Financial Crimes'],
        pdf_file_path: '/uploads/pdfs/white-collar-prosecution.pdf',
        file_size: 412000,
        published_date: twoMonthsAgo.toISOString().split('T')[0]
      },
      {
        title: 'Reforming Corporate Governance Policies',
        summary: 'Proposals for policy changes to improve corporate governance frameworks.',
        content: 'This publication presents a comprehensive set of policy reform proposals aimed at strengthening corporate governance standards...',
        category_id: categoryMap['Policy'],
        pdf_file_path: '/uploads/pdfs/governance-reform.pdf',
        file_size: 338000,
        published_date: threeMonthsAgo.toISOString().split('T')[0]
      }
    ];
    
    // Insert publications
    for (const pub of publications) {
      await runQuery(db, `
        INSERT INTO Publications (title, summary, content, category_id, pdf_file_path, file_size, published_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        pub.title, 
        pub.summary, 
        pub.content, 
        pub.category_id, 
        pub.pdf_file_path, 
        pub.file_size, 
        pub.published_date
      ]);
    }
    
    logger.info('Publications seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed publications:', err);
    throw err;
  }
};

// Seed newspapers
const seedNewspapers = async (db) => {
  try {
    logger.info('Seeding newspapers...');
    
    // Check if any newspapers exist
    const newspaperCount = await getQuery(db, 'SELECT COUNT(*) as count FROM Newspapers');
    
    if (newspaperCount && newspaperCount.count > 0) {
      logger.info('Newspapers already exist, skipping newspaper seeding.');
      return;
    }
    
    // Create uploads directories if they don't exist
    const newspapersDir = path.join(__dirname, '../../uploads/newspapers');
    const imagesDir = path.join(__dirname, '../../uploads/images');
    
    if (!fs.existsSync(newspapersDir)) {
      fs.mkdirSync(newspapersDir, { recursive: true });
    }
    
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    
    // Default newspapers
    const currentDate = new Date();
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
    
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(currentDate.getMonth() - 4);
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
    
    const newspapers = [
      {
        title: 'Governance Challenges of Tomorrow',
        description: 'An in-depth analysis of emerging governance challenges and strategies for addressing them effectively.',
        pdf_file_path: '/uploads/newspapers/governance-challenges-2023-03.pdf',
        issue_date: currentDate.toISOString().split('T')[0],
        cover_image_path: '/uploads/images/newspaper-cover-march.jpg'
      },
      {
        title: 'The Future of Compliance',
        description: 'Exploring trends and innovations in regulatory compliance and their impact on organizations.',
        pdf_file_path: '/uploads/newspapers/future-compliance-2023-01.pdf',
        issue_date: twoMonthsAgo.toISOString().split('T')[0],
        cover_image_path: '/uploads/images/newspaper-cover-january.jpg'
      },
      {
        title: 'Whistleblower Protections: A Global Perspective',
        description: 'A comprehensive review of whistleblower protection laws and practices across different countries.',
        pdf_file_path: '/uploads/newspapers/whistleblower-global-2022-11.pdf',
        issue_date: fourMonthsAgo.toISOString().split('T')[0],
        cover_image_path: '/uploads/images/newspaper-cover-november.jpg'
      },
      {
        title: 'Corporate Ethics in the Digital Age',
        description: 'Examining ethical challenges and considerations for organizations in an increasingly digital environment.',
        pdf_file_path: '/uploads/newspapers/corporate-ethics-2022-09.pdf',
        issue_date: sixMonthsAgo.toISOString().split('T')[0],
        cover_image_path: '/uploads/images/newspaper-cover-september.jpg'
      }
    ];
    
    // Insert newspapers
    for (const paper of newspapers) {
      await runQuery(db, `
        INSERT INTO Newspapers (title, description, pdf_file_path, issue_date, cover_image_path)
        VALUES (?, ?, ?, ?, ?)
      `, [
        paper.title, 
        paper.description, 
        paper.pdf_file_path, 
        paper.issue_date, 
        paper.cover_image_path
      ]);
    }
    
    logger.info('Newspapers seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed newspapers:', err);
    throw err;
  }
};

// Run seeds when script is executed directly
if (require.main === module) {
  runSeeds()
    .then(() => {
      logger.info('Seeding process completed.');
      process.exit(0);
    })
    .catch(err => {
      logger.error('Seeding process failed:', err);
      process.exit(1);
    });
}

module.exports = runSeeds;