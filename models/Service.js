// models/Service.js
class Service {
    constructor(id, title, description, icon, order_number, created_at, updated_at) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.icon = icon;
      this.order_number = order_number;
      this.created_at = created_at;
      this.updated_at = updated_at;
    }
  }
  
  module.exports = Service;
  