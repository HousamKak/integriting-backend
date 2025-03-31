// controllers/newspaperController.js
const sql = require('mssql');
const { getConnection } = require('../config/database.sqlserver');
const fs = require('fs');
const path = require('path');

// Get all newspapers
exports.getAllNewspapers = async (req, res) => {
  const { year } = req.query;
  
  try {
    const pool = await getConnection();
    let query = `
      SELECT * FROM Newspapers
      ORDER BY issue_date DESC
    `;
    
    // If year is provided, filter by year
    if (year && year !== 'All') {
      query = `
        SELECT * FROM Newspapers
        WHERE YEAR(issue_date) = @year
        ORDER BY issue_date DESC
      `;
    }
    
    const request = pool.request();
    
    if (year && year !== 'All') {
      request.input('year', sql.Int, parseInt(year));
    }
    
    const result = await request.query(query);
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching newspapers:', err);
    res.status(500).json({ message: 'Failed to retrieve newspapers' });
  }
};

// Get latest newspaper
exports.getLatestNewspaper = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT TOP 1 * FROM Newspapers
        ORDER BY issue_date DESC
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'No newspapers found' });
    }
    
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching latest newspaper:', err);
    res.status(500).json({ message: 'Failed to retrieve latest newspaper' });
  }
};

// Get newspaper by ID
exports.getNewspaperById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT * FROM Newspapers
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Newspaper not found' });
    }
    
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(`Error fetching newspaper with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve newspaper' });
  }
};

// Create new newspaper
exports.createNewspaper = async (req, res) => {
  const { title, description, issue_date } = req.body;
  
  // Check if required files are present
  if (!req.files || !req.files.pdf_file) {
    return res.status(400).json({ message: 'PDF file is required' });
  }
  
  // Get file paths
  const pdfFilePath = req.files.pdf_file[0].path.replace(/\\/g, '/');
  const coverImagePath = req.files.cover_image ? 
    req.files.cover_image[0].path.replace(/\\/g, '/') : null;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('pdf_file_path', sql.NVarChar(255), pdfFilePath)
      .input('issue_date', sql.Date, new Date(issue_date))
      .input('cover_image_path', sql.NVarChar(255), coverImagePath)
      .query(`
        INSERT INTO Newspapers (title, description, pdf_file_path, issue_date, cover_image_path)
        OUTPUT INSERTED.id
        VALUES (@title, @description, @pdf_file_path, @issue_date, @cover_image_path)
      `);
    
    const id = result.recordset[0].id;
    res.status(201).json({ 
      id, 
      message: 'Newspaper created successfully',
      pdf_file_path: pdfFilePath,
      cover_image_path: coverImagePath
    });
  } catch (err) {
    // Cleanup uploaded files on error
    if (pdfFilePath) {
      fs.unlink(pdfFilePath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting PDF file: ${unlinkErr}`);
      });
    }
    
    if (coverImagePath) {
      fs.unlink(coverImagePath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting cover image: ${unlinkErr}`);
      });
    }
    
    console.error('Error creating newspaper:', err);
    res.status(500).json({ message: 'Failed to create newspaper' });
  }
};

// Update newspaper
exports.updateNewspaper = async (req, res) => {
  const { id } = req.params;
  const { title, description, issue_date } = req.body;
  
  try {
    const pool = await getConnection();
    
    // Get current newspaper data
    const currentNewspaper = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT pdf_file_path, cover_image_path FROM Newspapers WHERE id = @id');
    
    if (currentNewspaper.recordset.length === 0) {
      return res.status(404).json({ message: 'Newspaper not found' });
    }
    
    const oldPdfPath = currentNewspaper.recordset[0].pdf_file_path;
    const oldCoverPath = currentNewspaper.recordset[0].cover_image_path;
    
    // Prepare query parts
    let updateQuery = `
      UPDATE Newspapers
      SET 
        title = @title,
        description = @description,
        issue_date = @issue_date,
        updated_at = @updated_at
    `;
    
    const request = pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('issue_date', sql.Date, new Date(issue_date))
      .input('updated_at', sql.DateTime, new Date());
    
    // If there's a new PDF file, update the pdf_file_path
    if (req.files && req.files.pdf_file) {
      updateQuery += `, pdf_file_path = @pdf_file_path`;
      request.input('pdf_file_path', sql.NVarChar(255), req.files.pdf_file[0].path.replace(/\\/g, '/'));
    }
    
    // If there's a new cover image, update the cover_image_path
    if (req.files && req.files.cover_image) {
      updateQuery += `, cover_image_path = @cover_image_path`;
      request.input('cover_image_path', sql.NVarChar(255), req.files.cover_image[0].path.replace(/\\/g, '/'));
    }
    
    updateQuery += ` WHERE id = @id`;
    
    await request.query(updateQuery);
    
    // Delete old files if they were replaced
    if (req.files && req.files.pdf_file && oldPdfPath) {
      fs.unlink(oldPdfPath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting old PDF file: ${unlinkErr}`);
      });
    }
    
    if (req.files && req.files.cover_image && oldCoverPath) {
      fs.unlink(oldCoverPath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting old cover image: ${unlinkErr}`);
      });
    }
    
    res.status(200).json({ 
      message: 'Newspaper updated successfully',
      pdf_file_path: req.files && req.files.pdf_file ? req.files.pdf_file[0].path.replace(/\\/g, '/') : undefined,
      cover_image_path: req.files && req.files.cover_image ? req.files.cover_image[0].path.replace(/\\/g, '/') : undefined
    });
  } catch (err) {
    // Cleanup any newly uploaded files on error
    if (req.files) {
      if (req.files.pdf_file) {
        fs.unlink(req.files.pdf_file[0].path, (unlinkErr) => {
          if (unlinkErr) console.error(`Error deleting PDF file: ${unlinkErr}`);
        });
      }
      
      if (req.files.cover_image) {
        fs.unlink(req.files.cover_image[0].path, (unlinkErr) => {
          if (unlinkErr) console.error(`Error deleting cover image: ${unlinkErr}`);
        });
      }
    }
    
    console.error(`Error updating newspaper with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to update newspaper' });
  }
};

// Delete newspaper
exports.deleteNewspaper = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await getConnection();
    
    // First, get the newspaper to find file paths for deletion
    const getNewspaper = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT pdf_file_path, cover_image_path FROM Newspapers WHERE id = @id');
    
    if (getNewspaper.recordset.length === 0) {
      return res.status(404).json({ message: 'Newspaper not found' });
    }
    
    const pdfFilePath = getNewspaper.recordset[0].pdf_file_path;
    const coverImagePath = getNewspaper.recordset[0].cover_image_path;
    
    // Delete the newspaper
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Newspapers WHERE id = @id');
    
    // Delete associated files
    if (pdfFilePath) {
      fs.unlink(pdfFilePath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting PDF file: ${unlinkErr}`);
      });
    }
    
    if (coverImagePath) {
      fs.unlink(coverImagePath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting cover image: ${unlinkErr}`);
      });
    }
    
    res.status(200).json({ message: 'Newspaper deleted successfully' });
  } catch (err) {
    console.error(`Error deleting newspaper with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to delete newspaper' });
  }
};

// Get available years
exports.getAvailableYears = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT DISTINCT YEAR(issue_date) as year
        FROM Newspapers
        ORDER BY year DESC
      `);
    
    const years = result.recordset.map(item => item.year);
    res.status(200).json(years);
  } catch (err) {
    console.error('Error fetching newspaper years:', err);
    res.status(500).json({ message: 'Failed to retrieve newspaper years' });
  }
};