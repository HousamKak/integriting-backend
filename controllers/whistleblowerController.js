// controllers/whistleblowerController.js
const crypto = require('crypto');
const { getConnection, getQuery, getAllQuery, runQuery } = require('../config/database');

// Submit whistleblower report
exports.submitReport = async (req, res) => {
  const { name, email, message, isAnonymous } = req.body;
  let db;
  
  // Validate message
  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Report message is required' });
  }
  
  try {
    db = await getConnection();
    
    // Generate a unique reference number for the report
    const referenceNumber = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    const result = await runQuery(db, `
      INSERT INTO WhistleblowerReports (name, email, message, is_anonymous, reference_number, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      isAnonymous ? null : name,
      isAnonymous ? null : email,
      message,
      isAnonymous ? 1 : 0,
      referenceNumber,
      'Pending'
    ]);
    
    // Don't return sensitive information like email in the response
    res.status(201).json({ 
      message: 'Report submitted successfully',
      referenceNumber,
      isAnonymous
    });
    
    // In a real app, you would implement notification logic here
    // to alert administrators of a new report
  } catch (err) {
    console.error('Error submitting whistleblower report:', err);
    res.status(500).json({ message: 'Failed to submit report. Please try again later.' });
  } finally {
    if (db) db.close();
  }
};

// Get all whistleblower reports (Admin only)
exports.getAllReports = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    const reports = await getAllQuery(db, `
      SELECT 
        id, 
        name, 
        email, 
        message, 
        is_anonymous, 
        reference_number, 
        status, 
        created_at, 
        updated_at
      FROM WhistleblowerReports
      ORDER BY created_at DESC
    `);
    
    res.status(200).json(reports);
  } catch (err) {
    console.error('Error fetching whistleblower reports:', err);
    res.status(500).json({ message: 'Failed to retrieve reports' });
  } finally {
    if (db) db.close();
  }
};

// Get report by ID (Admin only)
exports.getReportById = async (req, res) => {
  const { id } = req.params;
  let db;
  
  try {
    db = await getConnection();
    const report = await getQuery(db, `
      SELECT 
        id, 
        name, 
        email, 
        message, 
        is_anonymous, 
        reference_number, 
        status, 
        created_at, 
        updated_at
      FROM WhistleblowerReports
      WHERE id = ?
    `, [id]);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.status(200).json(report);
  } catch (err) {
    console.error(`Error fetching report with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve report' });
  } finally {
    if (db) db.close();
  }
};

// Get report by reference number (for public tracking)
exports.getReportByReference = async (req, res) => {
  const { referenceNumber } = req.params;
  let db;
  
  try {
    db = await getConnection();
    const report = await getQuery(db, `
      SELECT 
        reference_number, 
        status, 
        created_at, 
        updated_at,
        is_anonymous
      FROM WhistleblowerReports
      WHERE reference_number = ?
    `, [referenceNumber]);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.status(200).json(report);
  } catch (err) {
    console.error(`Error fetching report with reference ${referenceNumber}:`, err);
    res.status(500).json({ message: 'Failed to retrieve report status' });
  } finally {
    if (db) db.close();
  }
};

// Update report status (Admin only)
exports.updateReportStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let db;
  
  // Validate status
  const validStatuses = ['Pending', 'In Progress', 'Resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: 'Invalid status. Status must be one of: Pending, In Progress, Resolved' 
    });
  }
  
  try {
    db = await getConnection();
    
    // Check if report exists
    const report = await getQuery(db, 'SELECT id FROM WhistleblowerReports WHERE id = ?', [id]);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update the status
    const now = new Date().toISOString();
    await runQuery(db, `
      UPDATE WhistleblowerReports
      SET status = ?, updated_at = ?
      WHERE id = ?
    `, [status, now, id]);
    
    res.status(200).json({ message: 'Report status updated successfully' });
  } catch (err) {
    console.error(`Error updating status for report with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to update report status' });
  } finally {
    if (db) db.close();
  }
};

// Add admin note to report (Admin only)
exports.addReportNote = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  let db;
  
  if (!note || note.trim() === '') {
    return res.status(400).json({ message: 'Note cannot be empty' });
  }
  
  try {
    db = await getConnection();
    
    // Check if report exists
    const report = await getQuery(db, 'SELECT id, admin_notes FROM WhistleblowerReports WHERE id = ?', [id]);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Get existing notes and append new note
    const existingNotes = report.admin_notes || '';
    const timestamp = new Date().toISOString();
    const formattedNote = `[${timestamp}] ${note}\n\n`;
    const updatedNotes = formattedNote + existingNotes;
    
    // Update the notes
    const now = new Date().toISOString();
    await runQuery(db, `
      UPDATE WhistleblowerReports
      SET admin_notes = ?, updated_at = ?
      WHERE id = ?
    `, [updatedNotes, now, id]);
    
    res.status(200).json({ message: 'Note added successfully' });
  } catch (err) {
    console.error(`Error adding note to report with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to add note to report' });
  } finally {
    if (db) db.close();
  }
};

// Get report statistics (Admin only)
exports.getReportStatistics = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    
    // Get counts by status
    const statusCounts = await getAllQuery(db, `
      SELECT 
        status, 
        COUNT(*) as count
      FROM WhistleblowerReports
      GROUP BY status
    `);
    
    // SQLite doesn't have DATEADD or FORMAT functions, so we need a different approach
    // for getting monthly counts. This is a simplified version for demonstration
    const monthlyCounts = await getAllQuery(db, `
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM WhistleblowerReports
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `);
    
    // Get anonymous vs. identified counts
    const anonymousCounts = await getAllQuery(db, `
      SELECT 
        is_anonymous, 
        COUNT(*) as count
      FROM WhistleblowerReports
      GROUP BY is_anonymous
    `);
    
    // Format the anonymous counts
    const anonymousData = {
      anonymous: 0,
      identified: 0
    };
    
    anonymousCounts.forEach(item => {
      if (item.is_anonymous) {
        anonymousData.anonymous = item.count;
      } else {
        anonymousData.identified = item.count;
      }
    });
    
    res.status(200).json({
      statusCounts,
      monthlyCounts,
      anonymousData
    });
  } catch (err) {
    console.error('Error fetching report statistics:', err);
    res.status(500).json({ message: 'Failed to retrieve report statistics' });
  } finally {
    if (db) db.close();
  }
};