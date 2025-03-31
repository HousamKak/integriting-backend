// models/WhistleblowerReport.js
class WhistleblowerReport {
    constructor(id, name, email, message, is_anonymous, reference_number, status, admin_notes, created_at, updated_at) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.message = message;
      this.is_anonymous = is_anonymous;
      this.reference_number = reference_number;
      this.status = status;
      this.admin_notes = admin_notes;
      this.created_at = created_at;
      this.updated_at = updated_at;
    }
  }
  
  module.exports = WhistleblowerReport;
  