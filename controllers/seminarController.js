// controllers/seminarController.js
const { getConnection, getQuery, getAllQuery, runQuery } = require('../config/database');
const fs = require('fs');

// Get all seminars
exports.getAllSeminars = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    const seminars = await getAllQuery(db, `
      SELECT * FROM Seminars
      ORDER BY event_date DESC
    `);
    
    res.status(200).json(seminars);
  } catch (err) {
    console.error('Error fetching seminars:', err);
    res.status(500).json({ message: 'Failed to retrieve seminars' });
  } finally {
    if (db) db.close();
  }
};

// Get upcoming seminars
exports.getUpcomingSeminars = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    const seminars = await getAllQuery(db, `
      SELECT * FROM Seminars
      WHERE date(event_date) >= date('now') OR status = 'Upcoming'
      ORDER BY event_date ASC
    `);
    
    res.status(200).json(seminars);
  } catch (err) {
    console.error('Error fetching upcoming seminars:', err);
    res.status(500).json({ message: 'Failed to retrieve upcoming seminars' });
  } finally {
    if (db) db.close();
  }
};

// Get past seminars
exports.getPastSeminars = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    const seminars = await getAllQuery(db, `
      SELECT * FROM Seminars
      WHERE date(event_date) < date('now') OR status = 'Past'
      ORDER BY event_date DESC
    `);
    
    res.status(200).json(seminars);
  } catch (err) {
    console.error('Error fetching past seminars:', err);
    res.status(500).json({ message: 'Failed to retrieve past seminars' });
  } finally {
    if (db) db.close();
  }
};

// Get seminar by ID
exports.getSeminarById = async (req, res) => {
  const { id } = req.params;
  let db;
  
  try {
    db = await getConnection();
    const seminar = await getQuery(db, 'SELECT * FROM Seminars WHERE id = ?', [id]);
    
    if (!seminar) {
      return res.status(404).json({ message: 'Seminar not found' });
    }
    
    res.status(200).json(seminar);
  } catch (err) {
    console.error(`Error fetching seminar with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve seminar' });
  } finally {
    if (db) db.close();
  }
};

// Create new seminar
exports.createSeminar = async (req, res) => {
  const { title, description, event_date, status, seats_available, location } = req.body;
  let db;
  
  // Get image path from file upload middleware
  const image_path = req.file ? req.file.path.replace(/\\/g, '/') : null;
  
  try {
    db = await getConnection();
    const result = await runQuery(db, `
      INSERT INTO Seminars (
        title, description, image_path, event_date, 
        status, seats_available, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      title, 
      description, 
      image_path, 
      event_date, 
      status, 
      seats_available, 
      location
    ]);
    
    res.status(201).json({ 
      id: result.lastID, 
      message: 'Seminar created successfully',
      image_path 
    });
  } catch (err) {
    // Clean up uploaded file if there was an error
    if (image_path) {
      fs.unlink(image_path, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting image: ${unlinkErr}`);
      });
    }
    
    console.error('Error creating seminar:', err);
    res.status(500).json({ message: 'Failed to create seminar' });
  } finally {
    if (db) db.close();
  }
};

// Update seminar
exports.updateSeminar = async (req, res) => {
  const { id } = req.params;
  const { title, description, event_date, status, seats_available, location } = req.body;
  let db;
  
  try {
    db = await getConnection();
    
    // Get existing seminar details
    const existingSeminar = await getQuery(db, 'SELECT image_path FROM Seminars WHERE id = ?', [id]);
    
    if (!existingSeminar) {
      return res.status(404).json({ message: 'Seminar not found' });
    }
    
    // Get image path from file upload middleware or use existing path
    let image_path = existingSeminar.image_path;
    let oldImagePath = null;
    
    // If there's a new image, update the image_path and remember the old one
    if (req.file) {
      oldImagePath = image_path;
      image_path = req.file.path.replace(/\\/g, '/');
    }
    
    await runQuery(db, `
      UPDATE Seminars
      SET title = ?,
          description = ?,
          image_path = ?,
          event_date = ?,
          status = ?,
          seats_available = ?,
          location = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title, 
      description, 
      image_path,
      event_date, 
      status, 
      seats_available, 
      location,
      id
    ]);
    
    // Delete old image if it was replaced
    if (oldImagePath) {
      fs.unlink(oldImagePath, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting old image: ${unlinkErr}`);
      });
    }
    
    res.status(200).json({ 
      message: 'Seminar updated successfully',
      image_path: req.file ? image_path : undefined
    });
  } catch (err) {
    // Clean up newly uploaded file if there was an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting image: ${unlinkErr}`);
      });
    }
    
    console.error(`Error updating seminar with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to update seminar' });
  } finally {
    if (db) db.close();
  }
};

// Delete seminar
exports.deleteSeminar = async (req, res) => {
  const { id } = req.params;
  let db;
  
  try {
    db = await getConnection();
    
    // Get the seminar to find image path for deletion
    const seminar = await getQuery(db, 'SELECT image_path FROM Seminars WHERE id = ?', [id]);
    
    if (!seminar) {
      return res.status(404).json({ message: 'Seminar not found' });
    }
    
    // Delete the seminar
    await runQuery(db, 'DELETE FROM Seminars WHERE id = ?', [id]);
    
    // Delete the image file if it exists
    if (seminar.image_path) {
      fs.unlink(seminar.image_path, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting image: ${unlinkErr}`);
      });
    }
    
    res.status(200).json({ message: 'Seminar deleted successfully' });
  } catch (err) {
    console.error(`Error deleting seminar with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to delete seminar' });
  } finally {
    if (db) db.close();
  }
};