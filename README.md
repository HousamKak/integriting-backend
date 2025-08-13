# Integriting Backend

A robust Node.js backend API built with Express.js for the Integriting governance and compliance platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Docker (for containerized deployment)

### Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd integriting-backend
   npm install
   ```

2. **Environment Configuration:**
   Environment variables are managed centrally in the `integriting-deployment` folder. The backend gets its configuration from Docker containers. For development:
   
   ```bash
   cd ../integriting-deployment
   start-dev.bat
   ```

3. **Manual Development (without Docker):**
   ```bash
   npm run dev
   ```
   
   This starts the server on `http://localhost:5000`

## 📁 Project Structure

```
integriting-backend/
├── app.js                  # Express application setup
├── server.js              # Server entry point
├── package.json           # Project dependencies
├── Dockerfile             # Docker configuration
├── config/
│   ├── auth.js            # Authentication configuration
│   ├── database.js        # SQLite database configuration
│   ├── database.sqlserver.js  # SQL Server configuration
│   └── swagger.js         # API documentation setup
├── controllers/
│   ├── authController.js           # Authentication logic
│   ├── newspaperController.js      # E-journal management
│   ├── publicationController.js    # Publications management
│   ├── seminarController.js        # Seminars management
│   ├── serviceController.js        # Services management
│   ├── uploadController.js         # File upload handling
│   └── whistleblowerController.js  # Whistleblower reports
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── errorHandler.js    # Global error handling
│   └── fileUpload.js      # File upload middleware
├── models/
│   ├── Category.js        # Category data model
│   ├── Newspaper.js       # E-journal data model
│   ├── Publication.js     # Publication data model
│   ├── Seminar.js         # Seminar data model
│   ├── Service.js         # Service data model
│   ├── User.js            # User data model
│   └── WhistleblowerReport.js  # Whistleblower report model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── newspapers.js      # E-journal API endpoints
│   ├── publications.js    # Publications API endpoints
│   ├── seminars.js        # Seminars API endpoints
│   ├── services.js        # Services API endpoints
│   ├── uploads.js         # File upload endpoints
│   └── whistleblower.js   # Whistleblower reporting endpoints
├── scripts/
│   ├── migrations/        # Database migration scripts
│   └── seeds/            # Database seeding scripts
├── uploads/
│   ├── documents/        # Document uploads
│   ├── images/          # Image uploads
│   ├── newspapers/      # E-journal files
│   ├── pdfs/           # PDF uploads
│   └── temp/           # Temporary files
└── utils/
    ├── emailSender.js    # Email notification service
    ├── logger.js         # Logging configuration
    └── pdfProcessor.js   # PDF processing utilities
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `POST /api/auth/refresh` - Token refresh

### Publications
- `GET /api/publications` - Get all publications
- `POST /api/publications` - Create publication (admin)
- `PUT /api/publications/:id` - Update publication (admin)
- `DELETE /api/publications/:id` - Delete publication (admin)

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create service (admin)
- `PUT /api/services/:id` - Update service (admin)
- `DELETE /api/services/:id` - Delete service (admin)

### Seminars
- `GET /api/seminars` - Get all seminars
- `POST /api/seminars` - Create seminar (admin)
- `PUT /api/seminars/:id` - Update seminar (admin)
- `DELETE /api/seminars/:id` - Delete seminar (admin)

### E-Journals (Newspapers)
- `GET /api/newspapers` - Get all e-journals
- `POST /api/newspapers` - Upload e-journal (admin)
- `DELETE /api/newspapers/:id` - Delete e-journal (admin)

### Whistleblower Reports
- `POST /api/whistleblower/report` - Submit anonymous report
- `GET /api/whistleblower/reports` - Get all reports (admin)

### File Uploads
- `POST /api/uploads/image` - Upload image
- `POST /api/uploads/document` - Upload document
- `POST /api/uploads/pdf` - Upload PDF

## 📊 API Documentation

Interactive API documentation is available via Swagger UI:
- **Development**: http://localhost:5000/api-docs
- **Production**: https://your-domain.com/api-docs

## 🗄️ Database

The application supports both SQLite (development) and SQL Server (production):

### SQLite (Default)
- Database file: `data/integriting.db`
- Automatic schema creation and migrations
- Perfect for development and testing

### SQL Server (Production)
- Configure connection in environment variables
- Automatic schema creation and migrations
- Enterprise-ready for production use

### Database Management

```bash
# Run migrations
npm run migrate

# Seed database with initial data
npm run seed
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **CORS Protection** - Configurable cross-origin resource sharing
- **Helmet.js** - Security headers for protection
- **File Upload Validation** - Type and size restrictions
- **SQL Injection Protection** - Parameterized queries
- **Rate Limiting** - API endpoint protection
- **Input Validation** - Request data sanitization

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
cd ../integriting-deployment
start-prod.bat
```

### Manual Docker Build

```bash
# Build the image
docker build -t integriting-backend .

# Run the container
docker run -p 5000:5000 integriting-backend
```

## 📝 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data

## 🔧 Environment Variables

Environment variables are managed in the `integriting-deployment` folder:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/integriting.db

# SQL Server Configuration (if using)
DB_HOST=localhost
DB_PORT=1433
DB_NAME=integriting
DB_USER=sa
DB_PASSWORD=your-password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Performance Features

- **Connection Pooling** - Efficient database connections
- **Request Logging** - Morgan middleware for HTTP request logging
- **Error Handling** - Centralized error management
- **File Streaming** - Efficient large file handling
- **Compression** - Response compression middleware
- **Caching Headers** - Browser caching optimization

## 🧪 Testing

```bash
# Run tests (when available)
npm test

# Test API endpoints
curl http://localhost:5000/health
```

## 📈 Monitoring & Logging

- **Winston Logger** - Structured logging system
- **Health Check Endpoint** - `/health` for monitoring
- **Error Tracking** - Centralized error logging
- **Request Metrics** - HTTP request logging

## 🔄 Database Migration System

The application includes a comprehensive migration system:

```javascript
// Example migration
const migrations = [
  {
    version: 1,
    name: 'create_users_table',
    up: `CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  }
];
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the ISC License.

## 🙏 Acknowledgements

- [Express.js](https://expressjs.com/) - Fast, unopinionated web framework
- [JWT](https://jwt.io/) - JSON Web Token implementation
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Password hashing
- [Swagger](https://swagger.io/) - API documentation
- [Winston](https://github.com/winstonjs/winston) - Logging library
- [Multer](https://github.com/expressjs/multer) - File upload handling
