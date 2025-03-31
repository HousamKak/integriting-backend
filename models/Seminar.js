// models/Seminar.js
class Seminar {
    constructor(id, title, description, image_path, event_date, status, seats_available, location, created_at, updated_at) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.image_path = image_path;
      this.event_date = event_date;
      this.status = status;
      this.seats_available = seats_available;
      this.location = location;
      this.created_at = created_at;
      this.updated_at = updated_at;
    }
  }
  
  module.exports = Seminar;
  