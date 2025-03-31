// controllers/serviceController.js
const { getConnection, getQuery, getAllQuery, runQuery, beginTransaction, commitTransaction, rollbackTransaction } = require('../config/database');

// Get all services
exports.getAllServices = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    const services = await getAllQuery(db, `
      SELECT * FROM Services
      ORDER BY order_number, id
    `);
    
    res.status(200).json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Failed to retrieve services' });
  } finally {
    if (db) db.close();
  }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
  const { id } = req.params;
  let db;
  
  try {
    db = await getConnection();
    const service = await getQuery(db, 'SELECT * FROM Services WHERE id = ?', [id]);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.status(200).json(service);
  } catch (err) {
    console.error(`Error fetching service with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve service' });
  } finally {
    if (db) db.close();
  }
};

// Create new service
exports.createService = async (req, res) => {
  const { title, description, icon, order_number } = req.body;
  let db;
  
  try {
    db = await getConnection();
    
    // Get the highest order_number if not provided
    let orderNum = order_number;
    if (!orderNum) {
      const maxOrderResult = await getQuery(db, 'SELECT MAX(order_number) as maxOrder FROM Services');
      orderNum = (maxOrderResult.maxOrder || 0) + 1;
    }
    
    const result = await runQuery(db, `
      INSERT INTO Services (title, description, icon, order_number)
      VALUES (?, ?, ?, ?)
    `, [title, description, icon, orderNum]);
    
    res.status(201).json({ 
      id: result.lastID, 
      message: 'Service created successfully' 
    });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ message: 'Failed to create service' });
  } finally {
    if (db) db.close();
  }
};

// Update service
exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { title, description, icon, order_number } = req.body;
  let db;
  
  try {
    db = await getConnection();
    
    // Check if service exists
    const service = await getQuery(db, 'SELECT id FROM Services WHERE id = ?', [id]);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    await runQuery(db, `
      UPDATE Services
      SET title = ?,
          description = ?,
          icon = ?,
          order_number = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, description, icon, order_number, id]);
    
    res.status(200).json({ message: 'Service updated successfully' });
  } catch (err) {
    console.error(`Error updating service with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to update service' });
  } finally {
    if (db) db.close();
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  const { id } = req.params;
  let db;
  
  try {
    db = await getConnection();
    
    // Check if service exists
    const service = await getQuery(db, 'SELECT id FROM Services WHERE id = ?', [id]);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    await runQuery(db, 'DELETE FROM Services WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error(`Error deleting service with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to delete service' });
  } finally {
    if (db) db.close();
  }
};

// Update service orders
exports.updateServiceOrders = async (req, res) => {
  const { services } = req.body;
  let db;
  
  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ message: 'Invalid service order data' });
  }
  
  try {
    db = await getConnection();
    
    // Use transaction to ensure all updates succeed or fail together
    await beginTransaction(db);
    
    try {
      for (const service of services) {
        await runQuery(db, `
          UPDATE Services
          SET order_number = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [service.order_number, service.id]);
      }
      
      await commitTransaction(db);
      res.status(200).json({ message: 'Service orders updated successfully' });
    } catch (err) {
      await rollbackTransaction(db);
      throw err;
    }
  } catch (err) {
    console.error('Error updating service orders:', err);
    res.status(500).json({ message: 'Failed to update service orders' });
  } finally {
    if (db) db.close();
  }
};