// routes/admin.js
const express = require('express');
const router = express.Router();
const { getConnection, getAllQuery, getQuery } = require('../config/database');

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