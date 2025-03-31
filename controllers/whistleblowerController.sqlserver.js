// controllers/whistleblowerController.js
const sql = require('mssql');
const { getConnection } = require('../config/database.sqlserver');
const crypto = require('crypto');

// Submit whistleblower report
exports.submitReport = async (req, res) => {
  const { name, email, message, isAnonymous } = req.body;
  
  // Validate message
  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Report message is required' });
  }
  
  try {
    const pool = await getConnection();
    
    // Generate a unique reference number for the report
    const referenceNumber = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    const result = await pool.request()
      .input('name', sql.NVarChar(100), isAnonymous ? null : name)
      .input('email', sql.NVarChar(100), isAnonymous ? null : email)
      .input('message', sql.NVarChar(sql.MAX), message)
      .input('is_anonymous', sql.Bit, isAnonymous ? 1 : 0)
      .input('reference_number', sql.NVarChar(20), referenceNumber)
      .input('status', sql.NVarChar(20), 'Pending')
      .query(`
        INSERT INTO WhistleblowerReports (name, email, message, is_anonymous, reference_number, status)
        OUTPUT INSERTED.id
        VALUES (@name, @email, @message, @is_anonymous, @reference_number, @status)
      `);
    
    const id = result.recordset[0].id;
    
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
  }
};

// Get all whistleblower reports (Admin only)
exports.getAllReports = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
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
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching whistleblower reports:', err);
    res.status(500).json({ message: 'Failed to retrieve reports' });
  }
};

// Get report by ID (Admin only)
exports.getReportById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
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
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(`Error fetching report with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve report' });
  }
};

// Get report by reference number (for public tracking)
exports.getReportByReference = async (req, res) => {
  const { referenceNumber } = req.params;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('reference_number', sql.NVarChar(20), referenceNumber)
      .query(`
        SELECT 
          reference_number, 
          status, 
          created_at, 
          updated_at,
          is_anonymous
        FROM WhistleblowerReports
        WHERE reference_number = @reference_number
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(`Error fetching report with reference ${referenceNumber}:`, err);
    res.status(500).json({ message: 'Failed to retrieve report status' });
  }
};

// Update report status (Admin only)
exports.updateReportStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Validate status
  const validStatuses = ['Pending', 'In Progress', 'Resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: 'Invalid status. Status must be one of: Pending, In Progress, Resolved' 
    });
  }
  
  try {
    const pool = await getConnection();
    
    // Check if report exists
    const checkReport = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM WhistleblowerReports WHERE id = @id');
    
    if (checkReport.recordset.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Update the status
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar(20), status)
      .input('updated_at', sql.DateTime, new Date())
      .query(`
        UPDATE WhistleblowerReports
        SET 
          status = @status,
          updated_at = @updated_at
        WHERE id = @id
      `);
    
    res.status(200).json({ message: 'Report status updated successfully' });
  } catch (err) {
    console.error(`Error updating status for report with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to update report status' });
  }
};

// Add admin note to report (Admin only)
exports.addReportNote = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  
  if (!note || note.trim() === '') {
    return res.status(400).json({ message: 'Note cannot be empty' });
  }
  
  try {
    const pool = await getConnection();
    
    // Check if report exists
    const checkReport = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, admin_notes FROM WhistleblowerReports WHERE id = @id');
    
    if (checkReport.recordset.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Get existing notes and append new note
    const existingNotes = checkReport.recordset[0].admin_notes || '';
    const timestamp = new Date().toISOString();
    const formattedNote = `[${timestamp}] ${note}\n\n`;
    const updatedNotes = formattedNote + existingNotes;
    
    // Update the notes
    await pool.request()
      .input('id', sql.Int, id)
      .input('admin_notes', sql.NVarChar(sql.MAX), updatedNotes)
      .input('updated_at', sql.DateTime, new Date())
      .query(`
        UPDATE WhistleblowerReports
        SET 
          admin_notes = @admin_notes,
          updated_at = @updated_at
        WHERE id = @id
      `);
    
    res.status(200).json({ message: 'Note added successfully' });
  } catch (err) {
    console.error(`Error adding note to report with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to add note to report' });
  }
};

// Get report statistics (Admin only)
exports.getReportStatistics = async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Get counts by status
    const statusCounts = await pool.request()
      .query(`
        SELECT 
          status, 
          COUNT(*) as count
        FROM WhistleblowerReports
        GROUP BY status
      `);
    
    // Get counts by month for the last 6 months
    const monthlyCounts = await pool.request()
      .query(`
        SELECT 
          FORMAT(created_at, 'yyyy-MM') as month,
          COUNT(*) as count
        FROM WhistleblowerReports
        WHERE created_at >= DATEADD(month, -6, GETDATE())
        GROUP BY FORMAT(created_at, 'yyyy-MM')
        ORDER BY month
      `);
    
    // Get anonymous vs. identified counts
    const anonymousCounts = await pool.request()
      .query(`
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
    
    anonymousCounts.recordset.forEach(item => {
      if (item.is_anonymous) {
        anonymousData.anonymous = item.count;
      } else {
        anonymousData.identified = item.count;
      }
    });
    
    res.status(200).json({
      statusCounts: statusCounts.recordset,
      monthlyCounts: monthlyCounts.recordset,
      anonymousData
    });
  } catch (err) {
    console.error('Error fetching report statistics:', err);
    res.status(500).json({ message: 'Failed to retrieve report statistics' });
  }
};