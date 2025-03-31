// controllers/newspaperController.js
const { getConnection, getQuery, getAllQuery, runQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Get all newspapers
exports.getAllNewspapers = async (req, res) => {
  const { year } = req.query;
  let db;
  
  try {
    db = await getConnection();
    
    let query = `
      SELECT * FROM Newspapers
      ORDER BY issue_date DESC
    `;
    
    let params = [];
    
    // If year is provided, filter by year
    if (year && year !== 'All') {
      query = `
        SELECT * FROM Newspapers
        WHERE strftime('%Y', issue_date) = ?
        ORDER BY issue_date DESC
      `;
      params = [year];
    }
    
    const newspapers = await getAllQuery(db, query, params);
    
    res.status(200).json(newspapers);
  } catch (err) {
    console.error('Error fetching newspapers:', err);
    res.status(500).json({ message: 'Failed to retrieve newspapers' });
  } finally {
    if (db) db.close();
  }
};

// Get latest newspaper
exports.getLatestNewspaper = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    const newspaper = await getQuery(db, `
      SELECT * FROM Newspapers
      ORDER BY issue_date DESC
      LIMIT 1
    `);
    
    if (!newspaper) {
      return res.status(404).json({ message: 'No newspapers found' });
    }
    
    res.status(200).json(newspaper);
  } catch (err) {
    console.error('Error fetching latest newspaper:', err);
    res.status(500).json({ message: 'Failed to retrieve latest newspaper' });
  } finally {
    if (db) db.close();
  }
};

// Get newspaper by ID
exports.getNewspaperById = async (req, res) => {
  const { id } = req.params;
  let db;
  
  try {
    db = await getConnection();
    const newspaper = await getQuery(db, 'SELECT * FROM Newspapers WHERE id = ?', [id]);
    
    if (!newspaper) {
      return res.status(404).json({ message: 'Newspaper not found' });
    }
    
    res.status(200).json(newspaper);
  } catch (err) {
    console.error(`Error fetching newspaper with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve newspaper' });
  } finally {
    if (db) db.close();
  }
};

// Create new newspaper
exports.createNewspaper = async (req, res) => {
  const { title, description, issue_date } = req.body;
  let db;
  
  // Check if required files are present
  if (!req.files || !req.files.pdf_file) {
    return res.status(400).json({ message: 'PDF file is required' });
  }
  
  // Get file paths
  const pdfFilePath = req.files.pdf_file[0].path.replace(/\\/g, '/');
  const coverImagePath = req.files.cover_image ? 
    req.files.cover_image[0].path.replace(/\\/g, '/') : null;
  
  try {
    db = await getConnection();
    const result = await runQuery(db, `
      INSERT INTO Newspapers (
        title, description, pdf_file_path, issue_date, cover_image_path
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      title, 
      description, 
      pdfFilePath, 
      issue_date, 
      coverImagePath
    ]);
    
    res.status(201).json({ 
      id: result.lastID, 
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
  } finally {
    if (db) db.close();
  }
};

// Update newspaper
exports.updateNewspaper = async (req, res) => {
  const { id } = req.params;
  const { title, description, issue_date } = req.body;
  let db;
  
  try {
    db = await getConnection();
    
    // Get current newspaper data
    const currentNewspaper = await getQuery(db, 
      'SELECT pdf_file_path, cover_image_path FROM Newspapers WHERE id = ?', 
      [id]
    );
    
    if (!currentNewspaper) {
      return res.status(404).json({ message: 'Newspaper not found' });
    }
    
    const oldPdfPath = currentNewspaper.pdf_file_path;
    const oldCoverPath = currentNewspaper.cover_image_path;
    
    // Determine file paths to use
    const pdfFilePath = req.files && req.files.pdf_file ? 
      req.files.pdf_file[0].path.replace(/\\/g, '/') : oldPdfPath;
    
    const coverImagePath = req.files && req.files.cover_image ? 
      req.files.cover_image[0].path.replace(/\\/g, '/') : oldCoverPath;
    
    await runQuery(db, `
      UPDATE Newspapers
      SET title = ?,
          description = ?,
          pdf_file_path = ?,
          issue_date = ?,
          cover_image_path = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title,
      description,
      pdfFilePath,
      issue_date,
      coverImagePath,
      id
    ]);
    
    // Delete old files if they were replaced
    if (req.files && req.files.pdf_file && oldPdfPath && oldPdfPath !== pdfFilePath) {
      fs.unlink(oldPdfPath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting old PDF file: ${unlinkErr}`);
      });
    }
    
    if (req.files && req.files.cover_image && oldCoverPath && oldCoverPath !== coverImagePath) {
      fs.unlink(oldCoverPath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting old cover image: ${unlinkErr}`);
      });
    }
    
    res.status(200).json({ 
      message: 'Newspaper updated successfully',
      pdf_file_path: req.files && req.files.pdf_file ? pdfFilePath : undefined,
      cover_image_path: req.files && req.files.cover_image ? coverImagePath : undefined
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
  } finally {
    if (db) db.close();
  }
};

// Delete newspaper
exports.deleteNewspaper = async (req, res) => {
  const { id } = req.params;
  let db;
  
  try {
    db = await getConnection();
    
    // First, get the newspaper to find file paths for deletion
    const newspaper = await getQuery(db, 
      'SELECT pdf_file_path, cover_image_path FROM Newspapers WHERE id = ?', 
      [id]
    );
    
    if (!newspaper) {
      return res.status(404).json({ message: 'Newspaper not found' });
    }
    
    // Delete the newspaper
    await runQuery(db, 'DELETE FROM Newspapers WHERE id = ?', [id]);
    
    // Delete associated files
    if (newspaper.pdf_file_path) {
      fs.unlink(newspaper.pdf_file_path, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting PDF file: ${unlinkErr}`);
      });
    }
    
    if (newspaper.cover_image_path) {
      fs.unlink(newspaper.cover_image_path, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting cover image: ${unlinkErr}`);
      });
    }
    
    res.status(200).json({ message: 'Newspaper deleted successfully' });
  } catch (err) {
    console.error(`Error deleting newspaper with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to delete newspaper' });
  } finally {
    if (db) db.close();
  }
};

// Get available years
exports.getAvailableYears = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    const years = await getAllQuery(db, `
      SELECT DISTINCT strftime('%Y', issue_date) as year
      FROM Newspapers
      ORDER BY year DESC
    `);
    
    res.status(200).json(years.map(item => item.year));
  } catch (err) {
    console.error('Error fetching newspaper years:', err);
    res.status(500).json({ message: 'Failed to retrieve newspaper years' });
  } finally {
    if (db) db.close();
  }
};