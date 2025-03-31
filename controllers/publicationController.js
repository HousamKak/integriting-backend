// controllers/publicationController.js
const sql = require('mssql');
const { getConnection } = require('../config/database.sqlserver');

// Get all publications
exports.getAllPublications = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT p.*, c.name as category
        FROM Publications p
        LEFT JOIN Categories c ON p.category_id = c.id
        ORDER BY p.published_date DESC
      `);
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching publications:', err);
    res.status(500).json({ message: 'Failed to retrieve publications' });
  }
};

// Get publication by ID
exports.getPublicationById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*, c.name as category
        FROM Publications p
        LEFT JOIN Categories c ON p.category_id = c.id
        WHERE p.id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Publication not found' });
    }
    
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(`Error fetching publication with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve publication' });
  }
};

// Create new publication
exports.createPublication = async (req, res) => {
  const { title, content, summary, category_id, pdf_file_path, file_size, published_date } = req.body;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('summary', sql.NVarChar(500), summary)
      .input('category_id', sql.Int, category_id)
      .input('pdf_file_path', sql.NVarChar(255), pdf_file_path)
      .input('file_size', sql.Int, file_size)
      .input('published_date', sql.Date, new Date(published_date))
      .query(`
        INSERT INTO Publications (title, content, summary, category_id, pdf_file_path, file_size, published_date)
        OUTPUT INSERTED.id
        VALUES (@title, @content, @summary, @category_id, @pdf_file_path, @file_size, @published_date)
      `);
    
    const id = result.recordset[0].id;
    res.status(201).json({ id, message: 'Publication created successfully' });
  } catch (err) {
    console.error('Error creating publication:', err);
    res.status(500).json({ message: 'Failed to create publication' });
  }
};

// Update publication
exports.updatePublication = async (req, res) => {
  const { id } = req.params;
  const { title, content, summary, category_id, pdf_file_path, file_size, published_date } = req.body;
  
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(255), title)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('summary', sql.NVarChar(500), summary)
      .input('category_id', sql.Int, category_id)
      .input('pdf_file_path', sql.NVarChar(255), pdf_file_path)
      .input('file_size', sql.Int, file_size)
      .input('published_date', sql.Date, new Date(published_date))
      .input('updated_at', sql.DateTime, new Date())
      .query(`
        UPDATE Publications
        SET 
          title = @title,
          content = @content,
          summary = @summary,
          category_id = @category_id,
          pdf_file_path = @pdf_file_path,
          file_size = @file_size,
          published_date = @published_date,
          updated_at = @updated_at
        WHERE id = @id
      `);
    
    res.status(200).json({ message: 'Publication updated successfully' });
  } catch (err) {
    console.error(`Error updating publication with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to update publication' });
  }
};

// Delete publication
exports.deletePublication = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Publications WHERE id = @id');
    
    res.status(200).json({ message: 'Publication deleted successfully' });
  } catch (err) {
    console.error(`Error deleting publication with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to delete publication' });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM Categories ORDER BY name');
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to retrieve categories' });
  }
};