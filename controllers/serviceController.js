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

    // Fetch logos for the service
    const logos = await getAllQuery(db, `
      SELECT * FROM ServiceLogos
      WHERE service_id = ?
      ORDER BY order_number, id
    `, [id]);

    // Add logos to service object
    service.logos = logos;

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

// Get all logos for a specific service
exports.getServiceLogos = async (req, res) => {
  const { id } = req.params;
  let db;

  try {
    db = await getConnection();

    // Check if service exists
    const service = await getQuery(db, 'SELECT id FROM Services WHERE id = ?', [id]);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const logos = await getAllQuery(db, `
      SELECT * FROM ServiceLogos
      WHERE service_id = ?
      ORDER BY order_number, id
    `, [id]);

    res.status(200).json(logos);
  } catch (err) {
    console.error(`Error fetching logos for service ${id}:`, err);
    res.status(500).json({ message: 'Failed to retrieve service logos' });
  } finally {
    if (db) db.close();
  }
};

// Add a new logo to a service
exports.addServiceLogo = async (req, res) => {
  const { id } = req.params;
  const { client_name, logo_url, order_number } = req.body;
  let db;

  if (!logo_url) {
    return res.status(400).json({ message: 'Logo URL is required' });
  }

  try {
    db = await getConnection();

    // Check if service exists
    const service = await getQuery(db, 'SELECT id FROM Services WHERE id = ?', [id]);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Get the highest order_number if not provided
    let orderNum = order_number;
    if (!orderNum) {
      const maxOrderResult = await getQuery(db,
        'SELECT MAX(order_number) as maxOrder FROM ServiceLogos WHERE service_id = ?',
        [id]
      );
      orderNum = (maxOrderResult.maxOrder || 0) + 1;
    }

    const result = await runQuery(db, `
      INSERT INTO ServiceLogos (service_id, client_name, logo_url, order_number)
      VALUES (?, ?, ?, ?)
    `, [id, client_name, logo_url, orderNum]);

    res.status(201).json({
      id: result.lastID,
      message: 'Logo added successfully'
    });
  } catch (err) {
    console.error(`Error adding logo to service ${id}:`, err);
    res.status(500).json({ message: 'Failed to add logo' });
  } finally {
    if (db) db.close();
  }
};

// Update a service logo
exports.updateServiceLogo = async (req, res) => {
  const { id, logoId } = req.params;
  const { client_name, logo_url, order_number } = req.body;
  let db;

  try {
    db = await getConnection();

    // Check if logo exists and belongs to the service
    const logo = await getQuery(db,
      'SELECT id FROM ServiceLogos WHERE id = ? AND service_id = ?',
      [logoId, id]
    );

    if (!logo) {
      return res.status(404).json({ message: 'Logo not found' });
    }

    await runQuery(db, `
      UPDATE ServiceLogos
      SET client_name = ?,
          logo_url = ?,
          order_number = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [client_name, logo_url, order_number, logoId]);

    res.status(200).json({ message: 'Logo updated successfully' });
  } catch (err) {
    console.error(`Error updating logo ${logoId}:`, err);
    res.status(500).json({ message: 'Failed to update logo' });
  } finally {
    if (db) db.close();
  }
};

// Delete a service logo
exports.deleteServiceLogo = async (req, res) => {
  const { id, logoId } = req.params;
  let db;

  try {
    db = await getConnection();

    // Check if logo exists and belongs to the service
    const logo = await getQuery(db,
      'SELECT id, logo_url FROM ServiceLogos WHERE id = ? AND service_id = ?',
      [logoId, id]
    );

    if (!logo) {
      return res.status(404).json({ message: 'Logo not found' });
    }

    await runQuery(db, 'DELETE FROM ServiceLogos WHERE id = ?', [logoId]);

    // Optionally delete the file from filesystem
    // This can be handled by the calling code if needed

    res.status(200).json({
      message: 'Logo deleted successfully',
      logo_url: logo.logo_url
    });
  } catch (err) {
    console.error(`Error deleting logo ${logoId}:`, err);
    res.status(500).json({ message: 'Failed to delete logo' });
  } finally {
    if (db) db.close();
  }
};

// Update service logo orders
exports.updateServiceLogoOrders = async (req, res) => {
  const { id } = req.params;
  const { logos } = req.body;
  let db;

  if (!Array.isArray(logos) || logos.length === 0) {
    return res.status(400).json({ message: 'Invalid logo order data' });
  }

  try {
    db = await getConnection();

    // Check if service exists
    const service = await getQuery(db, 'SELECT id FROM Services WHERE id = ?', [id]);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Use transaction to ensure all updates succeed or fail together
    await beginTransaction(db);

    try {
      for (const logo of logos) {
        await runQuery(db, `
          UPDATE ServiceLogos
          SET order_number = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND service_id = ?
        `, [logo.order_number, logo.id, id]);
      }

      await commitTransaction(db);
      res.status(200).json({ message: 'Logo orders updated successfully' });
    } catch (err) {
      await rollbackTransaction(db);
      throw err;
    }
  } catch (err) {
    console.error('Error updating logo orders:', err);
    res.status(500).json({ message: 'Failed to update logo orders' });
  } finally {
    if (db) db.close();
  }
};