# EMS (Enterprise Management System) - Chatbot Support Platform

A comprehensive customer support platform with an AI-powered chatbot, admin dashboard, and visitor management system built with Next.js and Node.js.

## 🚀 Features

### Frontend (Visitor Side)
- **Interactive Chatbot Widget**: Rule-based AI chatbot for instant customer support
- **Visitor Registration**: Collect visitor details (name, email, phone) before chat
- **FAQs Section**: Browse frequently asked questions
- **Articles Section**: Access helpful articles and guides
- **Chat History**: View previous conversations
- **Responsive Design**: Modern, mobile-friendly interface

### Backend (Admin & Customer Executives)
- **Role-based Authentication**: Admin and Customer Experience Executive roles
- **Admin Dashboard**: Complete system management
- **Executive Dashboard**: Limited access for customer support
- **Analytics**: Comprehensive reporting and insights
- **User Management**: Manage agents and permissions
- **Visitor Pipeline Management**: Track visitor journey from enquiry to conversion

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Headless UI** - Accessible UI components

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- MongoDB (local installation or MongoDB Atlas account)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nextjs-ems
```

### 2. Environment Setup
Create a `.env` file in the `backend` directory:
```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ems_database
# For MongoDB Atlas: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ems_database

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Backend Setup
```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:5000`

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend application will start on `http://localhost:3000`

## 🔐 Default Login Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@ems.com`

### Executive Accounts
- **Username**: `executive1` / `executive2`
- **Password**: `exec123`
- **Email**: `executive1@ems.com` / `executive2@ems.com`

## 📁 Complete Project Structure

```
nextjs-ems/
├── 📁 backend/                          # Backend Node.js application
│   ├── 📁 config/                       # Configuration files
│   │   ├── 📄 database.js              # MongoDB database configuration and models
│   │   └── 📄 mongo.js                 # MongoDB connection management
│   ├── 📁 middleware/                   # Express middleware
│   │   └── 📄 auth.js                  # JWT authentication middleware
│   ├── 📁 models/                       # Mongoose data models
│   │   ├── 📄 User.js                  # User schema (admin/executive)
│   │   ├── 📄 Visitor.js               # Visitor/lead schema
│   │   ├── 📄 ChatMessage.js           # Chat message schema
│   │   ├── 📄 Faq.js                   # FAQ schema
│   │   ├── 📄 Article.js               # Article schema
│   │   ├── 📄 Enquiry.js               # Enquiry schema
│   │   └── 📄 ExecutiveService.js      # Executive service schema
│   ├── 📁 routes/                       # API route handlers
│   │   ├── 📄 auth.js                  # Authentication routes
│   │   ├── 📄 visitors.js              # Visitor management routes
│   │   ├── 📄 chat.js                  # Chat functionality routes
│   │   ├── 📄 faqs.js                  # FAQ management routes
│   │   ├── 📄 articles.js              # Article management routes
│   │   ├── 📄 analytics.js             # Analytics and reporting routes
│   │   └── 📄 executive-services.js    # Executive services routes
│   ├── 📁 services/                     # Business logic services
│   │   ├── 📄 AssignmentService.js     # Visitor assignment logic
│   │   └── 📄 DataSyncService.js       # Data synchronization service
│   ├── 📁 utils/                        # Utility functions
│   │   └── 📄 serviceMapping.js        # Service mapping utilities
│   ├── 📄 server.js                     # Main Express server file
│   ├── 📄 package.json                  # Backend dependencies
│   ├── 📄 start-server.bat             # Windows batch file to start server
│   ├── 📄 seed-users.js                # Script to seed default users
│   ├── 📄 seed-enquiries.js            # Script to seed sample enquiries
│   ├── 📄 create-sample-enquiries.js   # Script to create sample data via API
│   ├── 📄 test-connection.js           # MongoDB connection test
│   ├── 📄 test-role-access.js          # Role-based access testing
│   └── 📄 test.js                      # General testing utilities
├── 📁 frontend/                         # Frontend Next.js application
│   ├── 📁 public/                       # Static assets
│   │   ├── 📄 envirocare-logo.png      # Company logo
│   │   ├── 📄 ems-flowchart.html       # System flowchart visualization
│   │   ├── 📄 ems-uml-diagrams.html    # UML diagrams
│   │   ├── 📄 workflow-visualization.html # Workflow visualization
│   │   └── 📄 activity-diagram.html    # Activity diagram
│   ├── 📁 src/                          # Source code
│   │   ├── 📁 app/                      # Next.js App Router
│   │   │   ├── 📄 layout.tsx           # Root layout component
│   │   │   ├── 📄 page.tsx             # Home page
│   │   │   ├── 📄 globals.css          # Global styles
│   │   │   ├── 📄 favicon.ico          # Site favicon
│   │   │   ├── 📁 login/               # Login page
│   │   │   │   └── 📄 page.tsx         # Login form component
│   │   │   ├── 📁 chatbot/             # Chatbot page
│   │   │   │   └── 📄 page.tsx         # Chatbot interface
│   │   │   └── 📁 dashboard/           # Dashboard pages
│   │   │       ├── 📁 admin/           # Admin dashboard
│   │   │       │   ├── 📄 page.tsx     # Admin dashboard home
│   │   │       │   ├── 📄 AdminDashboard.tsx # Admin dashboard component
│   │   │       │   ├── 📁 overview/    # Admin overview page
│   │   │       │   ├── 📁 agents/      # Agent management page
│   │   │       │   ├── 📁 visitors/    # Visitor management page
│   │   │       │   ├── 📁 enquiries/   # Enquiry management page
│   │   │       │   ├── 📁 chats/       # Chat management page
│   │   │       │   ├── 📁 analytics/   # Analytics page
│   │   │       │   ├── 📁 assignments/ # Assignment management page
│   │   │       │   └── 📁 settings/    # Admin settings page
│   │   │       └── 📁 executive/       # Executive dashboard
│   │   │           ├── 📄 page.tsx     # Executive dashboard home
│   │   │           ├── 📄 ExecutiveDashboard.tsx # Executive dashboard component
│   │   │           ├── 📁 profile/     # Executive profile page
│   │   │           ├── 📁 visitors/    # Executive visitor view
│   │   │           ├── 📁 enquiries/   # Executive enquiry view
│   │   │           ├── 📁 chats/       # Executive chat view
│   │   │           └── 📁 analytics/   # Executive analytics view
│   │   ├── 📁 components/               # Reusable React components
│   │   │   ├── 📄 ChatbotWidget.tsx    # Main chatbot widget component
│   │   │   ├── 📄 Header.tsx           # Navigation header component
│   │   │   ├── 📄 Hero.tsx             # Landing page hero section
│   │   │   ├── 📄 Features.tsx         # Features showcase component
│   │   │   ├── 📄 Footer.tsx           # Footer component
│   │   │   ├── 📄 Sidebar.tsx          # Dashboard sidebar component
│   │   │   ├── 📄 DashboardHeader.tsx  # Dashboard header component
│   │   │   ├── 📄 StatBox.tsx          # Statistics display component
│   │   │   ├── 📄 DailyVisitorsChart.tsx # Visitor analytics chart
│   │   │   ├── 📄 ConversationRatioChart.tsx # Conversation analytics chart
│   │   │   ├── 📄 DailyAnalysisTable.tsx # Daily analysis table
│   │   │   ├── 📄 RecentConversations.tsx # Recent conversations component
│   │   │   └── 📄 PipelineFlowchart.tsx # Pipeline visualization component
│   │   └── 📁 utils/                    # Frontend utilities
│   │       └── 📄 serviceMapping.ts    # Service mapping utilities
│   ├── 📄 package.json                  # Frontend dependencies
│   ├── 📄 next.config.ts               # Next.js configuration
│   ├── 📄 tsconfig.json                # TypeScript configuration
│   ├── 📄 postcss.config.mjs           # PostCSS configuration
│   ├── 📄 eslint.config.mjs            # ESLint configuration
│   └── 📄 README.md                    # Frontend-specific README
├── 📄 package.json                      # Root package.json
├── 📄 README.md                         # This file
├── 📄 PROJECT_WORKFLOW.md              # Project workflow documentation
├── 📄 ROLE_BASED_ACCESS.md             # Role-based access documentation
├── 📄 SRS_Document.md                  # Software Requirements Specification
├── 📄 PROJECT_REPORT.txt               # Project report
└── 📄 PIPELINE_UPDATE_SUMMARY.md       # Pipeline update summary
```

## 📄 File Descriptions

### Backend Files

#### Configuration Files
- **`config/database.js`**: MongoDB database configuration, model imports, and user seeding logic
- **`config/mongo.js`**: MongoDB connection management with error handling and connection state tracking

#### Models (Mongoose Schemas)
- **`models/User.js`**: User schema for admin and executive accounts with password hashing
- **`models/Visitor.js`**: Comprehensive visitor/lead schema with pipeline tracking and status management
- **`models/ChatMessage.js`**: Chat message schema linking visitors to conversations
- **`models/Faq.js`**: FAQ schema for knowledge base management
- **`models/Article.js`**: Article schema for content management
- **`models/Enquiry.js`**: Enquiry schema for customer inquiries
- **`models/ExecutiveService.js`**: Executive service schema for service management

#### Routes (API Endpoints)
- **`routes/auth.js`**: Authentication routes (login, register, profile, user management)
- **`routes/visitors.js`**: Visitor management routes (CRUD operations, assignment, pipeline updates)
- **`routes/chat.js`**: Chat functionality routes (send messages, get history, conversations)
- **`routes/faqs.js`**: FAQ management routes (CRUD operations for knowledge base)
- **`routes/articles.js`**: Article management routes (CRUD operations for content)
- **`routes/analytics.js`**: Analytics routes (dashboard data, reports, metrics)
- **`routes/executive-services.js`**: Executive services routes (service management)

#### Services (Business Logic)
- **`services/AssignmentService.js`**: Logic for assigning visitors to executives
- **`services/DataSyncService.js`**: Data synchronization and consistency services

#### Utilities
- **`utils/serviceMapping.js`**: Service mapping utilities for business logic

#### Scripts
- **`seed-users.js`**: Script to create default admin and executive users
- **`seed-enquiries.js`**: Script to create sample enquiry data
- **`create-sample-enquiries.js`**: Script to create sample data via API calls
- **`test-connection.js`**: MongoDB connection testing utility
- **`test-role-access.js`**: Role-based access testing utilities

### Frontend Files

#### App Router Pages
- **`app/layout.tsx`**: Root layout with global providers and metadata
- **`app/page.tsx`**: Home page with hero section and features
- **`app/login/page.tsx`**: Login form with authentication
- **`app/chatbot/page.tsx`**: Chatbot interface page

#### Dashboard Pages
- **`dashboard/admin/`**: Admin dashboard with full system access
  - **`AdminDashboard.tsx`**: Main admin dashboard component
  - **`overview/page.tsx`**: System overview and statistics
  - **`agents/page.tsx`**: Agent management interface
  - **`visitors/page.tsx`**: Visitor management interface
  - **`enquiries/page.tsx`**: Enquiry management interface
  - **`chats/page.tsx`**: Chat management interface
  - **`analytics/page.tsx`**: Analytics and reporting interface
  - **`assignments/page.tsx`**: Assignment management interface
  - **`settings/page.tsx`**: System settings interface

- **`dashboard/executive/`**: Executive dashboard with limited access
  - **`ExecutiveDashboard.tsx`**: Main executive dashboard component
  - **`profile/page.tsx`**: Executive profile management
  - **`visitors/page.tsx`**: Executive visitor view
  - **`enquiries/page.tsx`**: Executive enquiry view
  - **`chats/page.tsx`**: Executive chat view
  - **`analytics/page.tsx`**: Executive analytics view

#### Components
- **`ChatbotWidget.tsx`**: Interactive chatbot widget with rule-based responses
- **`Header.tsx`**: Navigation header with authentication state
- **`Hero.tsx`**: Landing page hero section with call-to-action
- **`Features.tsx`**: Features showcase section
- **`Footer.tsx`**: Footer with links and information
- **`Sidebar.tsx`**: Dashboard sidebar navigation
- **`DashboardHeader.tsx`**: Dashboard header with user info
- **`StatBox.tsx`**: Statistics display component
- **`DailyVisitorsChart.tsx`**: Visitor analytics chart using Recharts
- **`ConversationRatioChart.tsx`**: Conversation analytics chart
- **`DailyAnalysisTable.tsx`**: Daily analysis data table
- **`RecentConversations.tsx`**: Recent conversations display
- **`PipelineFlowchart.tsx`**: Pipeline visualization component

#### Static Assets
- **`public/envirocare-logo.png`**: Company logo
- **`public/ems-flowchart.html`**: System flowchart visualization
- **`public/ems-uml-diagrams.html`**: UML diagrams documentation
- **`public/workflow-visualization.html`**: Workflow visualization
- **`public/activity-diagram.html`**: Activity diagram documentation

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/users` - Get all users (admin only)
- `POST /api/auth/users` - Create new user (admin only)
- `PUT /api/auth/users/:id` - Update user (admin only)
- `DELETE /api/auth/users/:id` - Delete user (admin only)

### Visitors
- `POST /api/visitors/register` - Register new visitor
- `GET /api/visitors` - Get all visitors
- `GET /api/visitors/:id` - Get visitor by ID
- `PUT /api/visitors/:id` - Update visitor
- `PATCH /api/visitors/:id/activity` - Update visitor activity
- `PATCH /api/visitors/:id/status` - Update visitor status
- `POST /api/visitors/assign` - Assign visitor to executive
- `POST /api/visitors/force-assign-all` - Force assign all unassigned visitors

### Chat
- `POST /api/chat/send` - Send chat message
- `GET /api/chat/history/:visitorId` - Get chat history
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/conversation/:visitorId` - Get specific conversation

### FAQs
- `GET /api/faqs` - Get all FAQs
- `GET /api/faqs/:id` - Get FAQ by ID
- `POST /api/faqs` - Create new FAQ (admin only)
- `PUT /api/faqs/:id` - Update FAQ (admin only)
- `DELETE /api/faqs/:id` - Delete FAQ (admin only)

### Articles
- `GET /api/articles` - Get all articles
- `GET /api/articles/:id` - Get article by ID
- `POST /api/articles` - Create new article (admin only)
- `PUT /api/articles/:id` - Update article (admin only)
- `DELETE /api/articles/:id` - Delete article (admin only)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard overview data
- `GET /api/analytics/visitors/growth` - Visitor growth data
- `GET /api/analytics/messages/activity` - Message activity data
- `GET /api/analytics/chat/engagement` - Chat engagement metrics
- `POST /api/analytics/add-enquiry` - Add new enquiry

### Executive Services
- `GET /api/executive-services` - Get all executive services
- `POST /api/executive-services` - Create new service (admin only)
- `PUT /api/executive-services/:id` - Update service (admin only)
- `DELETE /api/executive-services/:id` - Delete service (admin only)

## 🤖 Chatbot Features

The chatbot uses a rule-based system that responds to:
- **Greetings**: "hello", "hi", "hey", "good morning"
- **Help requests**: "help", "assist", "support"
- **Contact information**: "contact", "email", "phone", "address"
- **Business hours**: "hours", "time", "open", "closed"
- **Pricing**: "price", "cost", "pricing", "quote"
- **Services**: "services", "what do you do", "offerings"
- **Default responses**: For unrecognized queries with fallback to human support

## 📊 Dashboard Features

### Admin Dashboard
- **Overview**: System statistics, visitor metrics, and performance indicators
- **User Management**: Add, edit, delete users with role assignment
- **Visitor Management**: View, filter, and manage all visitors with pipeline tracking
- **Enquiry Management**: Handle customer enquiries with assignment capabilities
- **Chat History**: Monitor all conversations with search and filtering
- **Analytics**: Comprehensive reporting with charts and data visualization
- **Assignment Management**: Assign visitors to executives and track assignments
- **Settings**: System configuration and preferences

### Executive Dashboard
- **Overview**: Limited statistics relevant to assigned visitors
- **Visitor View**: View assigned visitors with pipeline status
- **Enquiry View**: Handle assigned enquiries with status updates
- **Chat History**: Access conversation logs for assigned visitors
- **Analytics**: Basic reporting for assigned visitors
- **Profile**: Personal settings and preferences

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with expiration
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access Control**: Different permissions for admin and executives
- **CORS Protection**: Cross-origin request handling with whitelist
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Mongoose ODM provides built-in protection
- **XSS Protection**: Input sanitization and output encoding

## 🚀 Deployment

### Backend Deployment
1. Set environment variables:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ems_database
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   NODE_ENV=production
   ```

2. Install dependencies and start:
   ```bash
   npm install
   npm start
   ```

### Frontend Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### MongoDB Setup
- **Local MongoDB**: Install MongoDB locally and use `mongodb://localhost:27017/ems_database`
- **MongoDB Atlas**: Create a cluster and use the connection string provided
- **Database**: The application will automatically create collections and seed default users

## 🧪 Testing

### Backend Testing
- **Connection Test**: `node test-connection.js` - Test MongoDB connection
- **Role Access Test**: `node test-role-access.js` - Test role-based access
- **User Seeding**: `node seed-users.js` - Create default users
- **Sample Data**: `node create-sample-enquiries.js` - Create sample data

### Frontend Testing
- **Development**: `npm run dev` - Start development server
- **Build Test**: `npm run build` - Test production build
- **Linting**: `npm run lint` - Check code quality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Email**: support@envirocarelabs.com
- **Phone**: +1-555-0123
- **Hours**: Monday-Friday, 9AM-6PM EST
- **Documentation**: Check the project documentation files

## 🔄 Version History

- **v1.0.0**: Initial release with basic chatbot and admin functionality
- **v1.1.0**: Added MongoDB integration, removed SQLite dependency
- **v1.2.0**: Enhanced visitor pipeline management and analytics
- **Future**: Advanced AI features, enhanced analytics, and mobile app

## 📚 Additional Documentation

- **`PROJECT_WORKFLOW.md`**: Detailed project workflow and processes
- **`ROLE_BASED_ACCESS.md`**: Role-based access control documentation
- **`SRS_Document.md`**: Software Requirements Specification
- **`PROJECT_REPORT.txt`**: Comprehensive project report
- **`PIPELINE_UPDATE_SUMMARY.md`**: Pipeline management updates

---

**Built with ❤️ for Envirocare Labs**