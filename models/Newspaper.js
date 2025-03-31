// models/Newspaper.js
class Newspaper {
    constructor(id, title, description, pdf_file_path, issue_date, cover_image_path, created_at, updated_at) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.pdf_file_path = pdf_file_path;
      this.issue_date = issue_date;
      this.cover_image_path = cover_image_path;
      this.created_at = created_at;
      this.updated_at = updated_at;
    }
  }
  
  module.exports = Newspaper;
  