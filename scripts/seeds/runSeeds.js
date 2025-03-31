// scripts/seeds/runSeeds.js
require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcryptjs');
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

// Database seeding functions
const runSeeds = async () => {
  try {
    logger.info('Starting database seeding...');
    
    // Connect to database
    const pool = await sql.connect(config);
    
    // Run seeds in sequence
    await seedUsers(pool);
    await seedCategories(pool);
    await seedServices(pool);
    await seedSeminars(pool);
    await seedPublications(pool);
    await seedNewspapers(pool);
    
    logger.info('All seeds completed successfully.');
    
    // Close the connection
    await pool.close();
  } catch (err) {
    logger.error('Seeding error:', err);
    process.exit(1);
  }
};

// Seed users
const seedUsers = async (pool) => {
  try {
    logger.info('Seeding users...');
    
    // Check if any users exist
    const userCount = await pool.request().query('SELECT COUNT(*) as count FROM Users');
    
    if (userCount.recordset[0].count > 0) {
      logger.info('Users already exist, skipping user seeding.');
      return;
    }
    
    // Create default admin user
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
    
    // Create default editor user
    const editorPasswordHash = await bcrypt.hash('editor123', salt);
    
    await pool.request()
      .input('username', sql.NVarChar(50), 'editor')
      .input('email', sql.NVarChar(100), 'editor@integriting.com')
      .input('password_hash', sql.NVarChar(255), editorPasswordHash)
      .input('role', sql.NVarChar(20), 'editor')
      .query(`
        INSERT INTO Users (username, email, password_hash, role)
        VALUES (@username, @email, @password_hash, @role)
      `);
    
    logger.info('Users seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed users:', err);
    throw err;
  }
};

// Seed categories
const seedCategories = async (pool) => {
  try {
    logger.info('Seeding categories...');
    
    // Check if any categories exist
    const categoryCount = await pool.request().query('SELECT COUNT(*) as count FROM Categories');
    
    if (categoryCount.recordset[0].count > 0) {
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
      await pool.request()
        .input('name', sql.NVarChar(50), category)
        .query(`
          INSERT INTO Categories (name)
          VALUES (@name)
        `);
    }
    
    logger.info('Categories seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed categories:', err);
    throw err;
  }
};

// Seed services
const seedServices = async (pool) => {
  try {
    logger.info('Seeding services...');
    
    // Check if any services exist
    const serviceCount = await pool.request().query('SELECT COUNT(*) as count FROM Services');
    
    if (serviceCount.recordset[0].count > 0) {
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
      await pool.request()
        .input('title', sql.NVarChar(100), service.title)
        .input('description', sql.NVarChar(sql.MAX), service.description)
        .input('icon', sql.NVarChar(100), service.icon)
        .input('order_number', sql.Int, service.order_number)
        .query(`
          INSERT INTO Services (title, description, icon, order_number)
          VALUES (@title, @description, @icon, @order_number)
        `);
    }
    
    logger.info('Services seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed services:', err);
    throw err;
  }
};

// Seed seminars
const seedSeminars = async (pool) => {
  try {
    logger.info('Seeding seminars...');
    
    // Check if any seminars exist
    const seminarCount = await pool.request().query('SELECT COUNT(*) as count FROM Seminars');
    
    if (seminarCount.recordset[0].count > 0) {
      logger.info('Seminars already exist, skipping seminar seeding.');
      return;
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
      await pool.request()
        .input('title', sql.NVarChar(255), seminar.title)
        .input('description', sql.NVarChar(sql.MAX), seminar.description)
        .input('image_path', sql.NVarChar(255), seminar.image_path)
        .input('event_date', sql.Date, new Date(seminar.event_date))
        .input('status', sql.NVarChar(20), seminar.status)
        .input('seats_available', sql.Int, seminar.seats_available)
        .input('location', sql.NVarChar(255), seminar.location)
        .query(`
          INSERT INTO Seminars (title, description, image_path, event_date, status, seats_available, location)
          VALUES (@title, @description, @image_path, @event_date, @status, @seats_available, @location)
        `);
    }
    
    logger.info('Seminars seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed seminars:', err);
    throw err;
  }
};

// Seed publications
const seedPublications = async (pool) => {
  try {
    logger.info('Seeding publications...');
    
    // Check if any publications exist
    const publicationCount = await pool.request().query('SELECT COUNT(*) as count FROM Publications');
    
    if (publicationCount.recordset[0].count > 0) {
      logger.info('Publications already exist, skipping publication seeding.');
      return;
    }
    
    // Get category IDs
    const categories = await pool.request().query('SELECT id, name FROM Categories');
    const categoryMap = {};
    categories.recordset.forEach(cat => {
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
      await pool.request()
        .input('title', sql.NVarChar(255), pub.title)
        .input('summary', sql.NVarChar(500), pub.summary)
        .input('content', sql.NVarChar(sql.MAX), pub.content)
        .input('category_id', sql.Int, pub.category_id)
        .input('pdf_file_path', sql.NVarChar(255), pub.pdf_file_path)
        .input('file_size', sql.Int, pub.file_size)
        .input('published_date', sql.Date, new Date(pub.published_date))
        .query(`
          INSERT INTO Publications (title, summary, content, category_id, pdf_file_path, file_size, published_date)
          VALUES (@title, @summary, @content, @category_id, @pdf_file_path, @file_size, @published_date)
        `);
    }
    
    logger.info('Publications seeded successfully.');
  } catch (err) {
    logger.error('Failed to seed publications:', err);
    throw err;
  }
};

// Seed newspapers
const seedNewspapers = async (pool) => {
  try {
    logger.info('Seeding newspapers...');
    
    // Check if any newspapers exist
    const newspaperCount = await pool.request().query('SELECT COUNT(*) as count FROM Newspapers');
    
    if (newspaperCount.recordset[0].count > 0) {
      logger.info('Newspapers already exist, skipping newspaper seeding.');
      return;
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
      await pool.request()
        .input('title', sql.NVarChar(255), paper.title)
        .input('description', sql.NVarChar(sql.MAX), paper.description)
        .input('pdf_file_path', sql.NVarChar(255), paper.pdf_file_path)
        .input('issue_date', sql.Date, new Date(paper.issue_date))
        .input('cover_image_path', sql.NVarChar(255), paper.cover_image_path)
        .query(`
          INSERT INTO Newspapers (title, description, pdf_file_path, issue_date, cover_image_path)
          VALUES (@title, @description, @pdf_file_path, @issue_date, @cover_image_path)
        `);
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