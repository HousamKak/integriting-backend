// models/User.js
class User {
    constructor(id, username, email, password_hash, role, created_at, updated_at) {
      this.id = id;
      this.username = username;
      this.email = email;
      this.password_hash = password_hash;
      this.role = role;
      this.created_at = created_at;
      this.updated_at = updated_at;
    }
  }
  
  module.exports = User;
  