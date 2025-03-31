// models/Publication.js
class Publication {
    constructor(id, title, content, summary, category_id, pdf_file_path, file_size, published_date, created_at, updated_at) {
      this.id = id;
      this.title = title;
      this.content = content;
      this.summary = summary;
      this.category_id = category_id;
      this.pdf_file_path = pdf_file_path;
      this.file_size = file_size;
      this.published_date = published_date;
      this.created_at = created_at;
      this.updated_at = updated_at;
    }
  }
  
  module.exports = Publication;
  