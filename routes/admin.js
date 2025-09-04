// routes/admin.js
const express = require('express');
const router = express.Router();
const { getConnection, getAllQuery, getQuery } = require('../config/database');

// Health check endpoints
router.get('/health', async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      backend: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      },
      database: {
        status: 'checking',
        error: null
      }
    }
  };

  // Test database connection
  let db;
  try {
    db = await getConnection();
    await getQuery(db, 'SELECT 1 as test');
    healthStatus.services.database.status = 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    healthStatus.services.database.status = 'unhealthy';
    healthStatus.services.database.error = error.message;
    healthStatus.status = 'degraded';
  } finally {
    if (db) {
      db.close();
    }
  }

  // Set HTTP status based on overall health
  const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;
  res.status(httpStatus).json(healthStatus);
});

// Database-specific health check
router.get('/health/database', async (req, res) => {
  const dbHealth = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    database: {
      type: 'sqlite3',
      path: process.env.DB_PATH || 'default',
      connection: 'checking',
      tables: {},
      error: null
    }
  };

  let db;
  try {
    // Test connection
    db = await getConnection();
    dbHealth.database.connection = 'healthy';

    // Check if main tables exist and get row counts
    const tableNames = ['Users', 'Publications', 'Services', 'Seminars', 'Newspapers', 'WhistleblowerReports', 'Categories'];
    
    for (const tableName of tableNames) {
      try {
        const tableExists = await getQuery(db, 
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?", 
          [tableName]
        );
        
        if (tableExists) {
          const countResult = await getQuery(db, `SELECT COUNT(*) as count FROM ${tableName}`);
          dbHealth.database.tables[tableName] = {
            exists: true,
            rowCount: countResult.count
          };
        } else {
          dbHealth.database.tables[tableName] = {
            exists: false,
            rowCount: 0
          };
        }
      } catch (tableError) {
        dbHealth.database.tables[tableName] = {
          exists: false,
          error: tableError.message
        };
      }
    }

    dbHealth.status = 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    dbHealth.status = 'unhealthy';
    dbHealth.database.connection = 'failed';
    dbHealth.database.error = error.message;
  } finally {
    if (db) {
      db.close();
    }
  }

  const httpStatus = dbHealth.status === 'healthy' ? 200 : 503;
  res.status(httpStatus).json(dbHealth);
});

// Backend service health check
router.get('/health/backend', (req, res) => {
  const backendHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    backend: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      platform: process.platform,
      arch: process.arch
    }
  };

  res.status(200).json(backendHealth);
});

// Dashboard stats endpoint
router.get('/dashboard/stats', async (req, res) => {
  let db;
  try {
    db = await getConnection();
    
    // Get current counts for each table
    const publicationsResult = await getQuery(db, 'SELECT COUNT(*) as count FROM Publications');
    const servicesResult = await getQuery(db, 'SELECT COUNT(*) as count FROM Services');
    const seminarsResult = await getQuery(db, 'SELECT COUNT(*) as count FROM Seminars');
    const newspapersResult = await getQuery(db, 'SELECT COUNT(*) as count FROM Newspapers');
    const whistleblowerResult = await getQuery(db, 'SELECT COUNT(*) as count FROM WhistleblowerReports');

    const publicationsCount = publicationsResult.count;
    const servicesCount = servicesResult.count;
    const seminarsCount = seminarsResult.count;
    const newspapersCount = newspapersResult.count;
    const whistleblowerCount = whistleblowerResult.count;

    // Get recent activity from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Get recent publications
    const recentPublications = await getAllQuery(db, `
      SELECT id, title, created_at FROM Publications 
      WHERE created_at >= ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [sevenDaysAgo]);
    
    // Get recent seminars
    const recentSeminars = await getAllQuery(db, `
      SELECT id, title, created_at FROM Seminars 
      WHERE created_at >= ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [sevenDaysAgo]);
    
    // Get recent services
    const recentServices = await getAllQuery(db, `
      SELECT id, title, created_at FROM Services 
      WHERE created_at >= ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [sevenDaysAgo]);
    
    // Get recent whistleblower reports
    const recentReports = await getAllQuery(db, `
      SELECT id, name, is_anonymous, created_at FROM WhistleblowerReports 
      WHERE created_at >= ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [sevenDaysAgo]);

    // Combine all recent activities
    const recentActivity = [];
    
    recentPublications.forEach(pub => {
      recentActivity.push({
        id: pub.id,
        type: 'publication',
        action: 'created',
        item: pub.title,
        user: 'Admin',
        date: pub.created_at,
        icon: '📚'
      });
    });
    
    recentSeminars.forEach(sem => {
      recentActivity.push({
        id: sem.id,
        type: 'seminar',
        action: 'created',
        item: sem.title,
        user: 'Admin',
        date: sem.created_at,
        icon: '🎤'
      });
    });
    
    recentServices.forEach(svc => {
      recentActivity.push({
        id: svc.id,
        type: 'service',
        action: 'created',
        item: svc.title,
        user: 'Admin',
        date: svc.created_at,
        icon: '🛠️'
      });
    });
    
    recentReports.forEach(rep => {
      recentActivity.push({
        id: rep.id,
        type: 'whistleblower',
        action: 'received',
        item: rep.is_anonymous ? 'Anonymous Report' : `Report from ${rep.name}`,
        user: 'System',
        date: rep.created_at,
        icon: '🛡️'
      });
    });
    
    // Sort by date and take latest 10
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limitedActivity = recentActivity.slice(0, 10);

    const stats = {
      publications: publicationsCount,
      publicationsChange: 0, // Would need historical data to calculate changes
      services: servicesCount,
      servicesChange: 0,
      seminars: seminarsCount,
      seminarsChange: 0,
      newspapers: newspapersCount,
      newspapersChange: 0,
      whistleblowerReports: whistleblowerCount,
      reportsChange: 0,
      recentActivity: limitedActivity
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  } finally {
    if (db) {
      db.close();
    }
  }
});

module.exports = router;