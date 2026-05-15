// controllers/publicationController.js
const { getConnection, getQuery, getAllQuery, runQuery } = require('../config/database');
const fs = require('fs');

const getUploadedFile = (req, fieldName) => {
  if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
    return req.files[fieldName][0];
  }

  if (fieldName === 'pdf_file' && req.file) {
    return req.file;
  }

  return null;
};

const normalizeUploadedPath = (file) => file ? file.path.replace(/\\/g, '/') : null;

const deleteFileIfPresent = (filePath) => {
  if (!filePath) return;

  fs.unlink(filePath, (unlinkErr) => {
    if (unlinkErr) console.error(`Error deleting file: ${unlinkErr}`);
  });
};

const resolveCategoryId = async (db, categoryId, categoryName) => {
  if (categoryId) {
    return categoryId;
  }

  if (!categoryName) {
    return null;
  }

  const category = await getQuery(db, 'SELECT id FROM Categories WHERE name = ?', [categoryName]);
  return category ? category.id : null;
};

// Get all publications
exports.getAllPublications = async (req, res) => {
  let db;
  const { category } = req.query;
  
  try {
    db = await getConnection();
    
    let query = `
      SELECT p.*, c.name as category
      FROM Publications p
      LEFT JOIN Categories c ON p.category_id = c.id
      ORDER BY p.published_date DESC
    `;
    
    let params = [];
    
    // If category filter is provided
    if (category) {
      query = `
        SELECT p.*, c.name as category
        FROM Publications p
        LEFT JOIN Categories c ON p.category_id = c.id
        WHERE c.name = ?
        ORDER BY p.published_date DESC
      `;
      params = [category];
    }
    
    const publications = await getAllQuery(db, query, params);
    
    res.status(200).json(publications);
  } catch (err) {
    console.error('Error fetching publications:', err);
    res.status(500).json({ message: 'Failed to retrieve publications' });
  } finally {
    if (db) db.close();
  }
};

// Get publication by ID
exports.getPublicationById = async (req, res) => {
  const { id } = req.params;
  let db;
  
  try {
    db = await getConnection();
    const publication = await getQuery(db, `
      SELECT p.*, c.name as category
      FROM Publications p
      LEFT JOIN Categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);
    
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }
    
    res.status(200).json(publication);
  } catch (err) {
    console.error(`Error fetching publication with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve publication' });
  } finally {
    if (db) db.close();
  }
};

// Create new publication
exports.createPublication = async (req, res) => {
  const { title, content, summary, category_id, category, published_date } = req.body;
  let db;
  const pdfFile = getUploadedFile(req, 'pdf_file');
  const coverImage = getUploadedFile(req, 'cover_image');
  
  try {
    db = await getConnection();
    
    // Get file information if provided
    const pdf_file_path = normalizeUploadedPath(pdfFile);
    const file_size = pdfFile ? pdfFile.size : null;
    const cover_image_path = normalizeUploadedPath(coverImage);
    const resolvedCategoryId = await resolveCategoryId(db, category_id, category);
    
    const result = await runQuery(db, `
      INSERT INTO Publications (
        title, content, summary, category_id, pdf_file_path, 
        file_size, cover_image_path, published_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, 
      content, 
      summary, 
      resolvedCategoryId, 
      pdf_file_path, 
      file_size, 
      cover_image_path,
      published_date
    ]);
    
    res.status(201).json({ 
      id: result.lastID, 
      message: 'Publication created successfully' 
    });
  } catch (err) {
    // Clean up uploaded file if there was an error
    deleteFileIfPresent(pdfFile?.path);
    deleteFileIfPresent(coverImage?.path);
    
    console.error('Error creating publication:', err);
    res.status(500).json({ message: 'Failed to create publication' });
  } finally {
    if (db) db.close();
  }
};

// Update publication
exports.updatePublication = async (req, res) => {
  const { id } = req.params;
  const { title, content, summary, category_id, category, published_date } = req.body;
  let db;
  const pdfFile = getUploadedFile(req, 'pdf_file');
  const coverImage = getUploadedFile(req, 'cover_image');
  
  try {
    db = await getConnection();
    
    // Check if publication exists
    const existingPublication = await getQuery(db, 'SELECT pdf_file_path, file_size, cover_image_path FROM Publications WHERE id = ?', [id]);
    
    if (!existingPublication) {
      return res.status(404).json({ message: 'Publication not found' });
    }
    
    // Get file information if provided
    const pdf_file_path = pdfFile ? normalizeUploadedPath(pdfFile) : existingPublication.pdf_file_path;
    const file_size = pdfFile ? pdfFile.size : null;
    const cover_image_path = coverImage ? normalizeUploadedPath(coverImage) : existingPublication.cover_image_path;
    const resolvedCategoryId = await resolveCategoryId(db, category_id, category);
    
    const oldFilePath = existingPublication.pdf_file_path;
    const oldCoverImagePath = existingPublication.cover_image_path;
    
    // Update the publication
    await runQuery(db, `
      UPDATE Publications SET
        title = ?,
        content = ?,
        summary = ?,
        category_id = ?,
        pdf_file_path = ?,
        file_size = ?,
        cover_image_path = ?,
        published_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title,
      content,
      summary,
      resolvedCategoryId,
      pdf_file_path,
      file_size !== null ? file_size : existingPublication.file_size,
      cover_image_path,
      published_date,
      id
    ]);
    
    // Delete old file if it was replaced
    if (pdfFile && oldFilePath && oldFilePath !== pdf_file_path) {
      deleteFileIfPresent(oldFilePath);
    }

    if (coverImage && oldCoverImagePath && oldCoverImagePath !== cover_image_path) {
      deleteFileIfPresent(oldCoverImagePath);
    }
    
    res.status(200).json({ message: 'Publication updated successfully' });
  } catch (err) {
    // Clean up newly uploaded file if there was an error
    deleteFileIfPresent(pdfFile?.path);
    deleteFileIfPresent(coverImage?.path);
    
    console.error(`Error updating publication with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to update publication' });
  } finally {
    if (db) db.close();
  }
};

// Delete publication
exports.deletePublication = async (req, res) => {
  const { id } = req.params;
  let db;
  
  try {
    db = await getConnection();
    
    // Get publication file path before deleting
    const publication = await getQuery(db, 'SELECT pdf_file_path, cover_image_path FROM Publications WHERE id = ?', [id]);
    
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }
    
    // Delete the publication
    await runQuery(db, 'DELETE FROM Publications WHERE id = ?', [id]);
    
    // Delete associated files if they exist
    deleteFileIfPresent(publication.pdf_file_path);
    deleteFileIfPresent(publication.cover_image_path);
    
    res.status(200).json({ message: 'Publication deleted successfully' });
  } catch (err) {
    console.error(`Error deleting publication with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to delete publication' });
  } finally {
    if (db) db.close();
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    const categories = await getAllQuery(db, 'SELECT * FROM Categories ORDER BY name');
    res.status(200).json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to retrieve categories' });
  } finally {
    if (db) db.close();
  }
};
