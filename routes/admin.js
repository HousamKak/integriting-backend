// routes/admin.js
const express = require('express');
const router = express.Router();

// Simple dashboard stats endpoint
router.get('/dashboard/stats', async (req, res) => {
  try {
    // For now, return mock data. In production, this would query the database
    const stats = {
      publications: 12,
      publicationsChange: +8,
      services: 6, 
      servicesChange: +2,
      seminars: 8,
      seminarsChange: +3,
      newspapers: 4,
      newspapersChange: +1,
      whistleblowerReports: 3,
      reportsChange: +1,
      recentActivity: [
        {
          id: 1,
          type: 'publication',
          title: 'New Corporate Governance Guide published',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          user: 'Administrator'
        },
        {
          id: 2,
          type: 'seminar', 
          title: 'Risk Management Seminar scheduled',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          user: 'Administrator'
        },
        {
          id: 3,
          type: 'report',
          title: 'New whistleblower report received',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          user: 'System'
        }
      ]
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;