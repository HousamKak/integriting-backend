// controllers/seminarController.js
const sql = require('mssql');
const { getConnection } = require('../config/database.sqlserver');

// Get all seminars
exports.getAllSeminars = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT * FROM Seminars
        ORDER BY event_date DESC
      `);
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching seminars:', err);
    res.status(500).json({ message: 'Failed to retrieve seminars' });
  }
};

// Get upcoming seminars
exports.getUpcomingSeminars = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT * FROM Seminars
        WHERE event_date >= CAST(GETDATE() AS date) OR status = 'Upcoming'
        ORDER BY event_date ASC
      `);
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching upcoming seminars:', err);
    res.status(500).json({ message: 'Failed to retrieve upcoming seminars' });
  }
};

// Get past seminars
exports.getPastSeminars = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT * FROM Seminars
        WHERE event_date < CAST(GETDATE() AS date) OR status = 'Past'
        ORDER BY event_date DESC
      `);
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching past seminars:', err);
    res.status(500).json({ message: 'Failed to retrieve past seminars' });
  }
};

// Get seminar by ID
exports.getSeminarById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT * FROM Seminars
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Seminar not found' });
    }
    
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(`Error fetching seminar with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve seminar' });
  }
};

// Create new seminar
exports.createSeminar = async (req, res) => {
  const { title, description, event_date, status, seats_available, location } = req.body;
  
  // Get image path from file upload middleware
  const image_path = req.file ? req.file.path.replace(/\\/g, '/') : null;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('image_path', sql.NVarChar(255), image_path)
      .input('event_date', sql.Date, new Date(event_date))
      .input('status', sql.NVarChar(20), status)
      .input('seats_available', sql.Int, seats_available)
      .input('location', sql.NVarChar(255), location)
      .query(`
        INSERT INTO Seminars (title, description, image_path, event_date, status, seats_available, location)
        OUTPUT INSERTED.id
        VALUES (@title, @description, @image_path, @event_date, @status, @seats_available, @location)
      `);
    
    const id = result.recordset[0].id;
    res.status(201).json({ 
      id, 
      message: 'Seminar created successfully',
      image_path 
    });
  } catch (err) {
    console.error('Error creating seminar:', err);
    res.status(500).json({ message: 'Failed to create seminar' });
  }
};

// Update seminar
exports.updateSeminar = async (req, res) => {
  const { id } = req.params;
  const { title, description, event_date, status, seats_available, location } = req.body;
  
  try {
    const pool = await getConnection();
    
    // Prepare query parts
    let updateQuery = `
      UPDATE Seminars
      SET 
        title = @title,
        description = @description,
        event_date = @event_date,
        status = @status,
        seats_available = @seats_available,
        location = @location,
        updated_at = @updated_at
    `;
    
    // If there's a new image, update the image_path
    if (req.file) {
      updateQuery += `, image_path = @image_path`;
    }
    
    updateQuery += ` WHERE id = @id`;
    
    const request = pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('event_date', sql.Date, new Date(event_date))
      .input('status', sql.NVarChar(20), status)
      .input('seats_available', sql.Int, seats_available)
      .input('location', sql.NVarChar(255), location)
      .input('updated_at', sql.DateTime, new Date());
    
    if (req.file) {
      request.input('image_path', sql.NVarChar(255), req.file.path.replace(/\\/g, '/'));
    }
    
    await request.query(updateQuery);
    
    res.status(200).json({ 
      message: 'Seminar updated successfully',
      image_path: req.file ? req.file.path.replace(/\\/g, '/') : undefined
    });
  } catch (err) {
    console.error(`Error updating seminar with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to update seminar' });
  }
};

// Delete seminar
exports.deleteSeminar = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await getConnection();
    
    // First, get the seminar to find image path for deletion
    const getSeminar = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT image_path FROM Seminars WHERE id = @id');
    
    const imagePath = getSeminar.recordset[0]?.image_path;
    
    // Delete the seminar
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Seminars WHERE id = @id');
    
    // If image exists, delete it (handled by a file service in a real app)
    if (imagePath) {
      // In a real app, you would delete the file here
      // await fileService.deleteFile(imagePath);
      console.log(`File would be deleted: ${imagePath}`);
    }
    
    res.status(200).json({ message: 'Seminar deleted successfully' });
  } catch (err) {
    console.error(`Error deleting seminar with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to delete seminar' });
  }
};