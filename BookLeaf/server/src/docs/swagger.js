const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'BookLeaf Publishing - Author Support & Communication Portal API',
    version: '1.0.0',
    description:
      'Production-ready REST API for BookLeaf author ticketing, catalog access, AI classification, priority assessment, and administrative workflow management.'
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Authenticate author or admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'priya.sharma@email.com' },
                  password: { type: 'string', example: 'author123' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated successfully with JWT token.' },
          401: { description: 'Invalid email or password.' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current logged in user profile',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'User profile retrieved.' } }
      }
    },
    '/api/auth/demo-users': {
      get: {
        summary: 'List pre-seeded demo accounts for one-click testing',
        responses: { 200: { description: 'List of demo authors and admins.' } }
      }
    },
    '/api/books/my-books': {
      get: {
        summary: 'Get books owned by the authenticated author with royalty metrics',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'List of author books and financial metrics.' } }
      }
    },
    '/api/tickets': {
      get: {
        summary: 'List tickets (Author: own tickets; Admin: all with status, category, priority filters and urgency sorting)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['urgency', 'aging', 'recent'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Filtered ticket queue.' } }
      },
      post: {
        summary: 'Submit a new support ticket (Triggers AI Auto-Classification & Response Drafting)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  subject: { type: 'string', example: 'I published my book 4 months ago and still haven’t received any royalty.' },
                  description: { type: 'string', example: 'What is going on with my quarterly payout?' },
                  bookId: { type: 'string', example: 'BK001' }
                },
                required: ['subject', 'description']
              }
            }
          }
        },
        responses: { 201: { description: 'Ticket created and AI auto-classified.' } }
      }
    },
    '/api/tickets/{id}': {
      get: {
        summary: 'Get single ticket details with thread and admin notes (if admin)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Ticket details.' } }
      }
    },
    '/api/tickets/{id}/messages': {
      post: {
        summary: 'Send response on ticket thread (Real-time broadcasted)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  statusChange: { type: 'string', enum: ['In Progress', 'Resolved', 'Closed'] }
                },
                required: ['content']
              }
            }
          }
        },
        responses: { 200: { description: 'Message sent and propagated.' } }
      }
    },
    '/api/tickets/{id}/status': {
      patch: {
        summary: 'Update ticket status (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['Open', 'In Progress', 'Resolved', 'Closed'] }
                },
                required: ['status']
              }
            }
          }
        },
        responses: { 200: { description: 'Status updated.' } }
      }
    },
    '/api/tickets/{id}/classification': {
      patch: {
        summary: 'Admin override of AI Category or Priority',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Classification updated.' } }
      }
    },
    '/api/tickets/{id}/notes': {
      post: {
        summary: 'Add internal admin note (Invisible to author)',
        security: [{ BearerAuth: [] }],
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
        responses: { 201: { description: 'Internal note saved.' } }
      }
    },
    '/api/tickets/{id}/regenerate-draft': {
      post: {
        summary: 'Regenerate AI response draft (Admin only)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'AI response regenerated.' } }
      }
    },
    '/api/stats/admin': {
      get: {
        summary: 'Get admin queue metrics, SLA aging, and category breakdowns',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Dashboard metrics.' } }
      }
    }
  }
};

module.exports = swaggerDocument;
