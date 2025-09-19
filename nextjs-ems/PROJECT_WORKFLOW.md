# Environmental Management System (EMS) - Complete Project Workflow

## System Overview
The EMS is a full-stack web application for Envirocare Labs that manages environmental testing services, visitor interactions, and lead generation through an AI-powered chatbot system.

## Technology Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Chart.js, React Hook Form
- **Backend**: Node.js, Express.js, MongoDB, Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Database**: MongoDB with Mongoose schemas
- **Deployment**: Separate frontend and backend servers

## Complete System Workflow

### 1. System Initialization Flow
```
START → Load Environment Variables → Connect MongoDB → Seed Default Users → Start Express Server → Start Next.js Server → System Ready
```

**Detailed Steps:**
1. **Environment Setup**: Load .env configuration files
2. **Database Connection**: Establish MongoDB connection with retry logic
3. **User Seeding**: Create default admin and executive accounts
4. **Server Startup**: Initialize Express.js backend server (Port 5000)
5. **Frontend Launch**: Start Next.js development server (Port 3000)
6. **Health Check**: Verify system readiness via /api/health endpoint

### 2. User Access Flow
```
User Visits Website → Landing Page → Authentication Decision → Login/Register → Role-Based Redirect → Dashboard Access
```

**Detailed Steps:**
1. **Landing Page**: User sees EMS homepage with services overview
2. **Authentication Check**: System checks for existing JWT token
3. **Login Process**: User enters credentials (username/password)
4. **Backend Validation**: Server validates credentials against database
5. **JWT Generation**: Create secure token with user role and permissions
6. **Role-Based Routing**: Redirect based on user role (admin/executive)
7. **Dashboard Access**: User lands on appropriate dashboard

### 3. Role-Based Access Control Flow
```
Authenticated User → Role Check → Permission Assignment → Feature Access → Dashboard Rendering
```

**User Roles:**
- **Admin**: Full system access (analytics, user management, settings)
- **Executive**: Limited access (visitor management, chat monitoring)
- **Public Visitor**: Chatbot access only

### 4. Visitor Interaction Flow (Chatbot System)
```
Visitor Opens Chat → Registration Form → Data Collection → AI Chat Session → Enquiry Creation → Lead Generation
```

**Detailed Steps:**
1. **Chat Initiation**: Visitor clicks floating chat button
2. **Registration**: Collect visitor information (name, email, phone)
3. **Service Selection**: Guide through service categories:
   - Water Testing (Drinking, FSSAI, Swimming Pool)
   - Food Testing (19 categories)
   - Environmental Testing (ETP, STP, Air, Noise, etc.)
   - Shelf-Life Study
   - Others
4. **AI Conversation**: Interactive chat with predefined responses
5. **Data Storage**: Save visitor and conversation data to MongoDB
6. **Lead Creation**: Generate enquiry record for follow-up

### 5. Data Management Flow
```
User Action → API Request → Route Handler → Database Operation → Response → Frontend Update
```

**API Endpoints:**
- `/api/auth/*` - Authentication routes
- `/api/visitors/*` - Visitor management
- `/api/chat/*` - Chat message handling
- `/api/faqs/*` - FAQ management
- `/api/articles/*` - Article management
- `/api/analytics/*` - Analytics data

### 6. Dashboard Analytics Flow
```
Database Query → Data Aggregation → Chart Generation → Real-time Display → User Interaction
```

**Analytics Features:**
- Daily visitor statistics
- Conversation ratios
- Lead conversion rates
- Recent conversations
- Daily analysis tables

### 7. Error Handling & Recovery Flow
```
Error Detection → Logging → User Notification → Fallback Data → Recovery Attempt → System Stability
```

**Error Scenarios:**
- Database connection failures
- Authentication errors
- API request failures
- Frontend rendering errors

### 8. Data Models & Relationships

**User Model:**
- username, email, password, role, name, apiKey
- Roles: admin, executive

**Visitor Model:**
- Personal info: name, email, phone, organization
- Service details: service, subservice, location
- Pipeline tracking: status, agent, priority
- History: pipelineHistory, leadScore

**ChatMessage Model:**
- visitorId, sender, message, timestamp
- Links to visitor records

**Enquiry Model:**
- visitorId, service, status, priority
- Assignment and tracking fields

### 9. Security Implementation Flow
```
Request → JWT Validation → Role Check → Permission Verification → Route Access → Response
```

**Security Features:**
- JWT token validation on all protected routes
- Role-based middleware protection
- Password hashing with bcryptjs
- CORS configuration
- Input validation and sanitization

### 10. Real-time Data Flow
```
Database Changes → API Updates → Frontend State Management → UI Re-rendering → User Experience
```

**Real-time Features:**
- Live chat updates
- Dashboard statistics refresh
- Visitor status changes
- Analytics data updates

### 11. Deployment & Maintenance Flow
```
Development → Testing → Build Process → Deployment → Monitoring → Updates
```

**Deployment Process:**
1. Frontend build (Next.js)
2. Backend deployment (Node.js)
3. Database migration
4. Environment configuration
5. Health monitoring

### 12. User Journey Examples

**Admin User Journey:**
1. Login with admin credentials
2. Access full dashboard with all features
3. View comprehensive analytics
4. Manage users and system settings
5. Monitor all visitor interactions

**Executive User Journey:**
1. Login with executive credentials
2. Access limited dashboard
3. View assigned visitors and enquiries
4. Monitor chat conversations
5. Update visitor status and notes

**Public Visitor Journey:**
1. Visit website landing page
2. Interact with chatbot widget
3. Provide contact information
4. Select service requirements
5. Generate enquiry for follow-up

## Key System Characteristics

**Scalability:**
- Modular architecture with separate frontend/backend
- Database indexing for performance
- Stateless API design

**Reliability:**
- Database connection retry logic
- Error handling and logging
- Fallback data for analytics

**Security:**
- JWT-based authentication
- Role-based access control
- Input validation and sanitization

**User Experience:**
- Responsive design with Tailwind CSS
- Real-time updates
- Interactive chatbot interface
- Comprehensive analytics dashboard

This workflow provides a complete picture of the EMS system's operation, from initial startup through all user interactions and data processing, suitable for generating a comprehensive flowchart.
