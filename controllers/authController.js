// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection, getQuery, runQuery } = require('../config/database');
const authConfig = require('../config/auth');

// User login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  let db;

  try {
    db = await getConnection();
    const user = await getQuery(db, 'SELECT * FROM Users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      authConfig.jwtSecret,
      { expiresIn: authConfig.jwtExpiresIn }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Authentication failed' });
  } finally {
    if (db) db.close();
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  let db;
  
  try {
    db = await getConnection();
    const user = await getQuery(db, 
      'SELECT id, username, email, role FROM Users WHERE id = ?', 
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ message: 'Failed to retrieve user information' });
  } finally {
    if (db) db.close();
  }
};

// Update user password
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  let db;

  try {
    db = await getConnection();
    
    // Get current user
    const user = await getQuery(db, 'SELECT * FROM Users WHERE id = ?', [req.userId]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update password
    const now = new Date().toISOString();
    await runQuery(db, 
      'UPDATE Users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [passwordHash, now, req.userId]
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ message: 'Failed to update password' });
  } finally {
    if (db) db.close();
  }
};