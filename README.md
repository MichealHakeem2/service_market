# Service Market API

A comprehensive backend API for a multi-portal service marketplace where customers can find and book services from verified providers.

## 🚀 Features

### 👤 User Management & Auth
- **Multi-role Support**: Distinct portals for Admin, Provider, and Customer.
- **Secure Authentication**: JWT-based login and logout.
- **Registration**: Support for individual users and dedicated service providers (with business documentation and gallery).
- **Profile Management**: Profile picture uploads and password updates.

### 📁 Category & Catalog
- **Hierarchy**: Support for Categories and Subcategories.
- **Dynamic Browsing**: Fetch active categories and services.
- **Rich Media**: Service image galleries.

### 🛠️ Service Management
- **Provider Tools**: Create, update, and manage services.
- **Availability**: Flexible availability settings for providers (weekly schedules, always available).
- **Discovery**: Search services by details or provider.

### 📅 Booking System
- **Lifecycle Management**: Complete booking workflow from creation to completion.
- **Status Tracking**: Patch updates for booking progress.
- **History**: View booking history for both customers and providers.

### 🛡️ Admin Controls
- **Vetting Process**: Approve or reject pending providers and services.
- **User Moderation**: Change user status or delete accounts.
- **Content Management**: Full CRUD on categories and subcategories.

### 🔔 Notifications
- Real-time notification system for booking updates and account status changes.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (using Sequelize ORM)
- **Authentication**: JSON Web Tokens (JWT)
- **File Uploads**: Multer
- **Validation**: Express-validator

## 📡 API Endpoints (Highlights)

### Public / Auth
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/register/provider` - Provider registration (with files)

### Services & Categories
- `GET /api/category` - List all categories
- `GET /api/service/detail` - List active services
- `GET /api/service/provider/:id` - List services by provider

### Booking
- `POST /api/booking` - Create new booking
- `PATCH /api/booking/:id/status` - Update booking status

---

## 🏗️ Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`.
4. Run the server: `npm run dev`
