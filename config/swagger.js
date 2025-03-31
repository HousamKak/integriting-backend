// config/swagger.js
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

/**
 * This single file directly embeds ALL API endpoints, schemas,
 * and other metadata in the "definition" property below.
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Integriting API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Integriting website.',
      contact: {
        name: 'Integriting Support',
        email: 'support@integriting.com',
        url: 'https://integriting.com/contact'
      },
      license: {
        name: 'Private'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.integriting.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // ----------------------- AUTH & USERS -----------------------
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'editor'] }
          },
          example: {
            id: 1,
            username: 'admin',
            email: 'admin@integriting.com',
            role: 'admin'
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        PasswordChangeRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', format: 'password' },
            newPassword: { type: 'string', format: 'password' }
          }
        },

        // ----------------------- PUBLICATIONS & CATEGORIES -----------------------
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' }
          }
        },
        Publication: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            summary: { type: 'string' },
            category_id: { type: 'integer' },
            category: { type: 'string' },
            pdf_file_path: { type: 'string' },
            file_size: { type: 'integer' },
            published_date: { type: 'string', format: 'date' }
          }
        },
        PublicationInput: {
          type: 'object',
          required: ['title', 'summary', 'category_id', 'published_date'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            summary: { type: 'string' },
            category_id: { type: 'integer' },
            published_date: { type: 'string', format: 'date' }
          }
        },

        // ----------------------- SERVICES -----------------------
        Service: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            order_number: { type: 'integer' }
          }
        },
        ServiceInput: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            order_number: { type: 'integer' }
          }
        },

        // ----------------------- SEMINARS -----------------------
        Seminar: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            image_path: { type: 'string' },
            event_date: { type: 'string', format: 'date' },
            status: { type: 'string' },
            seats_available: { type: 'integer' },
            location: { type: 'string' }
          }
        },

        // ----------------------- NEWSPAPERS -----------------------
        Newspaper: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            pdf_file_path: { type: 'string' },
            issue_date: { type: 'string', format: 'date' },
            cover_image_path: { type: 'string' }
          }
        },

        // ----------------------- WHISTLEBLOWER -----------------------
        WhistleblowerReport: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            message: { type: 'string' },
            is_anonymous: { type: 'boolean' },
            reference_number: { type: 'string' },
            status: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      // --------------------------------
      // AUTH ROUTES
      // --------------------------------
      '/auth/login': {
        post: {
          summary: 'Login a user',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' }
                }
              }
            },
            401: { description: 'Invalid credentials' },
            500: { description: 'Server error' }
          }
        }
      },
      '/auth/me': {
        get: {
          summary: 'Get current user information',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'User info retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            401: { description: 'Unauthorized - Invalid or missing token' },
            404: { description: 'User not found' },
            500: { description: 'Server error' }
          }
        }
      },
      '/auth/password': {
        put: {
          summary: 'Change user password',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PasswordChangeRequest' }
              }
            }
          },
          responses: {
            200: { description: 'Password changed successfully' },
            401: { description: 'Current password is incorrect or invalid token' },
            500: { description: 'Server error' }
          }
        }
      },

      // --------------------------------
      // PUBLICATIONS
      // --------------------------------
      '/publications': {
        get: {
          summary: 'Get all publications',
          tags: ['Publications'],
          security: [],
          parameters: [
            {
              in: 'query',
              name: 'category',
              schema: { type: 'string' },
              description: 'Filter by category name'
            }
          ],
          responses: {
            200: {
              description: 'List of publications',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Publication' }
                  }
                }
              }
            },
            500: { description: 'Server error' }
          }
        },
        post: {
          summary: 'Create a new publication',
          tags: ['Publications'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    summary: { type: 'string' },
                    category_id: { type: 'integer' },
                    published_date: { type: 'string', format: 'date' },
                    pdf_file: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Publication created successfully' },
            400: { description: 'Invalid input' },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },
      '/publications/categories': {
        get: {
          summary: 'Get all publication categories',
          tags: ['Publications'],
          security: [],
          responses: {
            200: {
              description: 'List of categories',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' }
                  }
                }
              }
            },
            500: { description: 'Server error' }
          }
        }
      },
      '/publications/{id}': {
        get: {
          summary: 'Get publication by ID',
          tags: ['Publications'],
          security: [],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Publication ID'
            }
          ],
          responses: {
            200: {
              description: 'Publication details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Publication' }
                }
              }
            },
            404: { description: 'Publication not found' },
            500: { description: 'Server error' }
          }
        },
        put: {
          summary: 'Update a publication',
          tags: ['Publications'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Publication ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    summary: { type: 'string' },
                    category_id: { type: 'integer' },
                    published_date: { type: 'string', format: 'date' },
                    pdf_file: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Publication updated successfully' },
            400: { description: 'Invalid input' },
            401: { description: 'Unauthorized' },
            404: { description: 'Publication not found' },
            500: { description: 'Server error' }
          }
        },
        delete: {
          summary: 'Delete a publication',
          tags: ['Publications'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Publication ID'
            }
          ],
          responses: {
            200: { description: 'Publication deleted successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Publication not found' },
            500: { description: 'Server error' }
          }
        }
      },

      // --------------------------------
      // SERVICES
      // --------------------------------
      '/services': {
        get: {
          summary: 'Get all services',
          tags: ['Services'],
          security: [],
          responses: {
            200: {
              description: 'List of services',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Service' }
                  }
                }
              }
            },
            500: { description: 'Server error' }
          }
        },
        post: {
          summary: 'Create a new service',
          tags: ['Services'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ServiceInput' }
              }
            }
          },
          responses: {
            201: { description: 'Service created successfully' },
            400: { description: 'Invalid input' },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },
      '/services/{id}': {
        get: {
          summary: 'Get service by ID',
          tags: ['Services'],
          security: [],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Service ID'
            }
          ],
          responses: {
            200: {
              description: 'Service details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Service' }
                }
              }
            },
            404: { description: 'Service not found' },
            500: { description: 'Server error' }
          }
        },
        put: {
          summary: 'Update a service',
          tags: ['Services'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Service ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ServiceInput' }
              }
            }
          },
          responses: {
            200: { description: 'Service updated successfully' },
            400: { description: 'Invalid input' },
            401: { description: 'Unauthorized' },
            404: { description: 'Service not found' },
            500: { description: 'Server error' }
          }
        },
        delete: {
          summary: 'Delete a service',
          tags: ['Services'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Service ID'
            }
          ],
          responses: {
            200: { description: 'Service deleted successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Service not found' },
            500: { description: 'Server error' }
          }
        }
      },
      '/services/orders': {
        post: {
          summary: 'Update service orders',
          tags: ['Services'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['services'],
                  properties: {
                    services: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['id', 'order_number'],
                        properties: {
                          id: { type: 'integer' },
                          order_number: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Service orders updated successfully' },
            400: { description: 'Invalid input' },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },

      // --------------------------------
      // SEMINARS
      // --------------------------------
      '/seminars': {
        get: {
          summary: 'Get all seminars',
          tags: ['Seminars'],
          security: [],
          responses: {
            200: {
              description: 'List of seminars',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Seminar' }
                  }
                }
              }
            },
            500: { description: 'Server error' }
          }
        },
        post: {
          summary: 'Create a new seminar',
          tags: ['Seminars'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    event_date: { type: 'string', format: 'date' },
                    status: { type: 'string' },
                    seats_available: { type: 'integer' },
                    location: { type: 'string' },
                    image: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Seminar created successfully' },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },
      '/seminars/upcoming': {
        get: {
          summary: 'Get upcoming seminars',
          tags: ['Seminars'],
          security: [],
          responses: {
            200: {
              description: 'List of upcoming seminars',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Seminar' }
                  }
                }
              }
            },
            500: { description: 'Server error' }
          }
        }
      },
      '/seminars/past': {
        get: {
          summary: 'Get past seminars',
          tags: ['Seminars'],
          security: [],
          responses: {
            200: {
              description: 'List of past seminars',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Seminar' }
                  }
                }
              }
            },
            500: { description: 'Server error' }
          }
        }
      },
      '/seminars/{id}': {
        get: {
          summary: 'Get seminar by ID',
          tags: ['Seminars'],
          security: [],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Seminar ID'
            }
          ],
          responses: {
            200: {
              description: 'Seminar details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Seminar' }
                }
              }
            },
            404: { description: 'Seminar not found' },
            500: { description: 'Server error' }
          }
        },
        put: {
          summary: 'Update a seminar',
          tags: ['Seminars'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Seminar ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    event_date: { type: 'string', format: 'date' },
                    status: { type: 'string' },
                    seats_available: { type: 'integer' },
                    location: { type: 'string' },
                    image: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Seminar updated successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Seminar not found' },
            500: { description: 'Server error' }
          }
        },
        delete: {
          summary: 'Delete a seminar',
          tags: ['Seminars'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
              description: 'Seminar ID'
            }
          ],
          responses: {
            200: { description: 'Seminar deleted successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Seminar not found' },
            500: { description: 'Server error' }
          }
        }
      },

      // --------------------------------
      // NEWSPAPERS
      // --------------------------------
      '/newspapers': {
        get: {
          summary: 'Get all newspapers',
          tags: ['Newspapers'],
          security: [],
          parameters: [
            {
              in: 'query',
              name: 'year',
              schema: { type: 'string' },
              description: 'Filter newspapers by year'
            }
          ],
          responses: {
            200: {
              description: 'List of newspapers',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Newspaper' }
                  }
                }
              }
            },
            500: { description: 'Server error' }
          }
        },
        post: {
          summary: 'Create a new newspaper',
          tags: ['Newspapers'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    issue_date: { type: 'string', format: 'date' },
                    pdf_file: { type: 'string', format: 'binary' },
                    cover_image: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Newspaper created successfully' },
            400: { description: 'Invalid input' },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },
      '/newspapers/latest': {
        get: {
          summary: 'Get the latest newspaper',
          tags: ['Newspapers'],
          security: [],
          responses: {
            200: {
              description: 'Latest newspaper',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Newspaper' }
                }
              }
            },
            404: { description: 'No newspapers found' },
            500: { description: 'Server error' }
          }
        }
      },
      '/newspapers/years': {
        get: {
          summary: 'Get available newspaper years',
          tags: ['Newspapers'],
          security: [],
          responses: {
            200: {
              description: 'Array of years',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { type: 'integer' }
                  }
                }
              }
            },
            500: { description: 'Server error' }
          }
        }
      },
      '/newspapers/{id}': {
        get: {
          summary: 'Get newspaper by ID',
          tags: ['Newspapers'],
          security: [],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Newspaper details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Newspaper' }
                }
              }
            },
            404: { description: 'Newspaper not found' },
            500: { description: 'Server error' }
          }
        },
        put: {
          summary: 'Update a newspaper',
          tags: ['Newspapers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    issue_date: { type: 'string', format: 'date' },
                    pdf_file: { type: 'string', format: 'binary' },
                    cover_image: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Newspaper updated successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Newspaper not found' },
            500: { description: 'Server error' }
          }
        },
        delete: {
          summary: 'Delete a newspaper',
          tags: ['Newspapers'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: { description: 'Newspaper deleted successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Newspaper not found' },
            500: { description: 'Server error' }
          }
        }
      },

      // --------------------------------
      // WHISTLEBLOWER
      // --------------------------------
      '/whistleblower/report': {
        post: {
          summary: 'Submit whistleblower report',
          tags: ['Whistleblower'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    message: { type: 'string' },
                    isAnonymous: { type: 'boolean' }
                  },
                  required: ['message']
                }
              }
            }
          },
          responses: {
            201: { description: 'Report submitted successfully' },
            400: { description: 'Validation error (e.g., no message)' },
            500: { description: 'Server error' }
          }
        }
      },
      '/whistleblower/status/{referenceNumber}': {
        get: {
          summary: 'Get report by reference number (public tracking)',
          tags: ['Whistleblower'],
          security: [],
          parameters: [
            { in: 'path', name: 'referenceNumber', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'Report status retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      reference_number: { type: 'string' },
                      status: { type: 'string' },
                      created_at: { type: 'string', format: 'date-time' },
                      updated_at: { type: 'string', format: 'date-time' },
                      is_anonymous: { type: 'boolean' }
                    }
                  }
                }
              }
            },
            404: { description: 'Report not found' },
            500: { description: 'Server error' }
          }
        }
      },
      '/whistleblower/reports': {
        get: {
          summary: 'Get all whistleblower reports (Admin only)',
          tags: ['Whistleblower'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'List of whistleblower reports',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/WhistleblowerReport' }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },
      '/whistleblower/reports/{id}': {
        get: {
          summary: 'Get whistleblower report by ID (Admin only)',
          tags: ['Whistleblower'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            200: {
              description: 'Report details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/WhistleblowerReport' }
                }
              }
            },
            401: { description: 'Unauthorized' },
            404: { description: 'Report not found' },
            500: { description: 'Server error' }
          }
        }
      },
      '/whistleblower/reports/{id}/status': {
        put: {
          summary: 'Update whistleblower report status (Admin only)',
          tags: ['Whistleblower'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['Pending', 'In Progress', 'Resolved'] }
                  },
                  required: ['status']
                }
              }
            }
          },
          responses: {
            200: { description: 'Report status updated successfully' },
            400: { description: 'Invalid status' },
            401: { description: 'Unauthorized' },
            404: { description: 'Report not found' },
            500: { description: 'Server error' }
          }
        }
      },
      '/whistleblower/reports/{id}/notes': {
        post: {
          summary: 'Add admin note to whistleblower report (Admin only)',
          tags: ['Whistleblower'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    note: { type: 'string' }
                  },
                  required: ['note']
                }
              }
            }
          },
          responses: {
            200: { description: 'Note added successfully' },
            400: { description: 'Note cannot be empty' },
            401: { description: 'Unauthorized' },
            404: { description: 'Report not found' },
            500: { description: 'Server error' }
          }
        }
      },
      '/whistleblower/statistics': {
        get: {
          summary: 'Get whistleblower report statistics (Admin only)',
          tags: ['Whistleblower'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      statusCounts: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            status: { type: 'string' },
                            count: { type: 'integer' }
                          }
                        }
                      },
                      monthlyCounts: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string' },
                            count: { type: 'integer' }
                          }
                        }
                      },
                      anonymousData: {
                        type: 'object',
                        properties: {
                          anonymous: { type: 'integer' },
                          identified: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },

      // --------------------------------
      // UPLOADS
      // --------------------------------
      '/uploads/file': {
        post: {
          summary: 'Upload single file (Admin only)',
          tags: ['Uploads'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'File uploaded successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      file: {
                        type: 'object',
                        properties: {
                          originalName: { type: 'string' },
                          filename: { type: 'string' },
                          mimetype: { type: 'string' },
                          size: { type: 'integer' },
                          path: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: { description: 'No file uploaded' },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },
      '/uploads/files': {
        post: {
          summary: 'Upload multiple files (Admin only)',
          tags: ['Uploads'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    files: {
                      type: 'array',
                      items: { type: 'string', format: 'binary' }
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Files uploaded successfully' },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },
      '/uploads/file/{filename}': {
        delete: {
          summary: 'Delete file by filename (Admin only)',
          tags: ['Uploads'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'filename',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'File deleted successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'File not found' },
            500: { description: 'Server error' }
          }
        }
      },
      '/uploads/get-upload-url': {
        post: {
          summary: 'Generate direct upload URL (Admin only)',
          tags: ['Uploads'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    originalname: { type: 'string' },
                    fileType: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Upload URL generated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      uploadUrl: { type: 'string' },
                      filename: { type: 'string' },
                      filePath: { type: 'string' }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      },
      '/uploads/direct/{folder}/{filename}': {
        post: {
          summary: 'Direct file upload to a specific folder (Admin only)',
          tags: ['Uploads'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'folder', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'filename', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'File uploaded successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      file: {
                        type: 'object',
                        properties: {
                          originalName: { type: 'string' },
                          filename: { type: 'string' },
                          mimetype: { type: 'string' },
                          size: { type: 'integer' },
                          path: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            500: { description: 'Server error' }
          }
        }
      }
    }
  },

  // No need to specify apis property for scanning if you rely on the big "paths" above:
  apis: [], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Export the standard Swagger-UI middlewares
module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerDocs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Integriting API Documentation'
  }),
  swaggerDocs
};
