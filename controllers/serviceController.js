// controllers/serviceController.js
const sql = require('mssql');
const { getConnection } = require('../config/database.sqlserver');

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT * FROM Services
        ORDER BY order_number, id
      `);
    
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Failed to retrieve services' });
  }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT * FROM Services
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error(`Error fetching service with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve service' });
  }
};

// Create new service
exports.createService = async (req, res) => {
  const { title, description, icon, order_number } = req.body;
  
  try {
    const pool = await getConnection();
    
    // Get the highest order_number if not provided
    let orderNum = order_number;
    if (!orderNum) {
      const maxOrderResult = await pool.request()
        .query('SELECT MAX(order_number) as maxOrder FROM Services');
      
      orderNum = (maxOrderResult.recordset[0].maxOrder || 0) + 1;
    }
    
    const result = await pool.request()
      .input('title', sql.NVarChar(100), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('icon', sql.NVarChar(100), icon)
      .input('order_number', sql.Int, orderNum)
      .query(`
        INSERT INTO Services (title, description, icon, order_number)
        OUTPUT INSERTED.id
        VALUES (@title, @description, @icon, @order_number)
      `);
    
    const id = result.recordset[0].id;
    res.status(201).json({ id, message: 'Service created successfully' });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ message: 'Failed to create service' });
  }
};

// Update service
exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { title, description, icon, order_number } = req.body;
  
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.NVarChar(100), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('icon', sql.NVarChar(100), icon)
      .input('order_number', sql.Int, order_number)
      .input('updated_at', sql.DateTime, new Date())
      .query(`
        UPDATE Services
        SET 
          title = @title,
          description = @description,
          icon = @icon,
          order_number = @order_number,
          updated_at = @updated_at
        WHERE id = @id
      `);
    
    res.status(200).json({ message: 'Service updated successfully' });
  } catch (err) {
    console.error(`Error updating service with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to update service' });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  const { id } = req.params;
  
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Services WHERE id = @id');
    
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error(`Error deleting service with ID ${id}:`, err);
    res.status(500).json({ message: 'Failed to delete service' });
  }
};

// Update service orders
exports.updateServiceOrders = async (req, res) => {
  const { services } = req.body;
  
  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ message: 'Invalid service order data' });
  }
  
  try {
    const pool = await getConnection();
    
    // Use a transaction to ensure all updates succeed or fail together
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      for (const service of services) {
        await transaction.request()
          .input('id', sql.Int, service.id)
          .input('order_number', sql.Int, service.order_number)
          .input('updated_at', sql.DateTime, new Date())
          .query(`
            UPDATE Services
            SET 
              order_number = @order_number,
              updated_at = @updated_at
            WHERE id = @id
          `);
      }
      
      await transaction.commit();
      res.status(200).json({ message: 'Service orders updated successfully' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating service orders:', err);
    res.status(500).json({ message: 'Failed to update service orders' });
  }
};