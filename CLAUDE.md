# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an image hosting service (图床系统) built with React, TypeScript, Express.js, and Prisma with MySQL. It provides image upload, storage, management, and sharing functionality with automatic generation of multiple image sizes.

## Key Commands

```bash
# Install dependencies
pnpm install

# Database setup
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Development
pnpm dev:full        # Run both frontend and backend concurrently
pnpm dev            # Run frontend only (default port: 5173, configurable via VITE_PORT)
pnpm dev:server     # Run backend only (default port: 3001, configurable via PORT)

# Type checking and linting
pnpm check          # TypeScript type checking
pnpm lint           # ESLint

# Build
pnpm build          # Build frontend for production

# Database management
npx prisma studio   # Open Prisma Studio GUI
npx prisma migrate dev --name <migration_name>  # Create new migration


```

## Architecture Overview

### Frontend (React + TypeScript)
- **Entry**: `src/main.tsx`
- **Routing**: React Router DOM v7
- **State Management**: Zustand stores in `src/store/`
- **API Client**: `src/lib/api.ts` handles all backend communication
- **UI Components**: Custom components in `src/components/` using TailwindCSS
- **Pages**: Main views in `src/pages/`

### Backend (Express + Prisma)
- **Entry**: `server/index.cjs` (CommonJS)
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT-based with bcrypt password hashing
- **File Storage**: Local storage in `server/uploads/` (gitignored)
- **Security**: Rate limiting, file validation, JWT authentication
- **Error Handling**: Centralized error handler with proper status codes
- **Configuration**: Environment-based config in `server/config/`
- **API Routes**:
  - `/api/auth/*` - Authentication endpoints (login, register, verify)
  - `/api/images/*` - Image management (upload, list, delete)
  - `/api/users/*` - User management (profile, update)
  - `/api/admin/*` - Admin endpoints (dashboard, user management)
  - `/api/settings/public` - Public system settings

### Key Features
1. **Multi-size Image Processing**: Automatically generates multiple versions (original, large, medium, small)
2. **User System**: Registration, login with JWT authentication
3. **Storage Limits**: Per-user storage quotas (default 1GB, configurable)
4. **Image Sharing**: Generate shareable links with optional expiration
5. **Role-based Access**: USER and ADMIN roles
6. **System Settings**: Dynamic configuration management (registration control, storage limits)
7. **Security Middleware**: Rate limiting, file validation, and CORS protection
8. **Protected Routes**: Authentication-based access control for pages

## Database Schema

The Prisma schema (`prisma/schema.prisma`) defines:
- **User**: Authentication, storage management, bio, and status (ACTIVE/SUSPENDED)
- **Image**: Core image metadata with user relationship
- **ImageVersion**: Different size versions of images (ORIGINAL, LARGE, MEDIUM, SMALL)
- **Tag**: Image categorization
- **Share**: Shareable link management with expiration
- **SystemSetting**: Dynamic system configuration storage

## Environment Configuration

Create `.env` file based on `.env.example`:
```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/assets_pool"

# Authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
SERVER_URL="http://localhost:3001"  # Used for generating image URLs

# CORS (comma-separated for multiple origins)
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174"

# Upload
MAX_FILE_SIZE="10485760" # 10MB in bytes
UPLOAD_DIR="./server/uploads"

# Storage Limits
DEFAULT_USER_STORAGE_LIMIT="1073741824" # 1GB in bytes
MAX_USER_STORAGE_LIMIT="10737418240" # 10GB in bytes

# Security
BCRYPT_ROUNDS="12"
RATE_LIMIT_WINDOW="900000" # 15 minutes in ms
RATE_LIMIT_MAX="100"

# Frontend
FRONTEND_URL="http://localhost:5173"
VITE_API_URL="http://localhost:3001/api"
VITE_PORT="5173"
```

### Port Configuration
- Backend API: `PORT` (default: 3001)
- Frontend Dev Server: `VITE_PORT` (default: 5173)
- Both ports can be customized in the `.env` file

## Development Workflow

1. **Adding New Features**: Check `docs/prd.md` for product requirements
2. **Database Changes**: Use Prisma migrations or update `prisma/init.sql` for fresh installs
3. **API Development**: Add routes in `server/routes/`
4. **Frontend Features**: Create components in `src/components/` and pages in `src/pages/`
5. **State Management**: Use Zustand stores in `src/store/`

## Recent Features Implemented

1. **User Profile Management**
   - Bio field added to user profiles
   - Profile editing functionality with real-time updates
   - Protected route authentication

2. **Registration Control**
   - System setting to enable/disable new user registration
   - Frontend dynamically hides registration UI when disabled
   - RegistrationGuard component for access control

3. **Enhanced Security**
   - Rate limiting middleware (general and auth-specific)
   - File upload validation
   - Environment-based CORS configuration

4. **Admin Dashboard**
   - Real-time storage usage calculation
   - User management capabilities
   - System statistics display

5. **UI/UX Improvements**
   - Custom logo implementation (image-logo.png)
   - Protected routes with login redirect
   - Loading states for authentication
   - Responsive design with TailwindCSS

## Important Notes

- The backend uses CommonJS (`.cjs`) while frontend uses ES modules
- Image processing with Sharp is configured in `server/utils/imageProcessor.cjs`
- Authentication middleware is in `server/index.cjs` (authenticateToken function)
- BigInt values from Prisma are converted to strings for JSON serialization
- CORS is configured via `ALLOWED_ORIGINS` environment variable
- Rate limiting is applied to all routes with stricter limits on auth endpoints
- Protected routes use `ProtectedRoute` component for access control
- System settings can control features like user registration
- All environment files (`.env*`) are gitignored for security