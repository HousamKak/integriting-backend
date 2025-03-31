// config/auth.js
require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET',
  jwtExpiresIn: '8h'
};
