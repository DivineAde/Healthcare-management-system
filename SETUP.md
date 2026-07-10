# HealthSync Setup Guide

This guide explains how to set up and run the HealthSync application locally with all features working.

## Prerequisites

- Node.js 22.x or higher
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB instance)

## Environment Configuration

The application requires environment variables for both backend and frontend.

### Backend Environment Variables

A `.env` file needs to be created in the `backend/` directory with the following configuration:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<appName>
MONGODB_DB=healthsync
JWT_SECRET=<your-secure-random-secret-key>
PORT=4000
FRONTEND_URL=http://localhost:3000
ENABLE_SOCKETS=true
```

**Important:** 
- Replace `<username>`, `<password>`, `<cluster>`, and `<appName>` with your MongoDB Atlas credentials
- Generate a secure random string for `JWT_SECRET` (e.g., using `openssl rand -hex 32`)
- The `.env` file is gitignored for security. Never commit credentials to version control.

### Frontend Environment Variables

A `.env` file needs to be created in the `react/` directory for local development:

```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_API_BASE_URL=/api
```

These settings point the frontend to your local backend server.

## Installation Steps

### 1. Create Environment Files

**Backend .env file:**
```bash
cd backend
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<appName>
MONGODB_DB=healthsync
JWT_SECRET=<your-secure-random-secret-key>
PORT=4000
FRONTEND_URL=http://localhost:3000
ENABLE_SOCKETS=true
EOF
```

Replace the placeholders with your actual values.

**Frontend .env file:**
```bash
cd react
cat > .env << 'EOF'
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_API_BASE_URL=/api
EOF
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd react
npm install
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm start
```

The backend will start on `http://localhost:4000`

### Start Frontend Development Server

In a new terminal:

```bash
cd react
npm run dev
```

The frontend will start on `http://localhost:3000`

## Testing the Application

1. **Sign Up**: Navigate to `http://localhost:3000/signup` to create a new account
2. **Login**: Navigate to `http://localhost:3000/login` to sign in
3. **Dashboard**: Access the EMR dashboard after successful login
4. **Real-time Features**: Socket.IO connections for live notifications

## Troubleshooting

### MongoDB Connection Issues

If you see DNS resolution errors like `ENOTFOUND` or `querySrv EREFUSED`:
- Check your internet connection
- Verify the MongoDB URI is correct
- Ensure your IP address is whitelisted in MongoDB Atlas
- Check if your network allows connections to MongoDB Atlas
- Try using a standard connection string instead of SRV format if DNS issues persist

### Port Already in Use

If port 4000 or 3000 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Modify `server.port` in `react/vite.config.ts`

### Environment Variables Not Loading

Make sure:
- `.env` files are in the correct directories (`backend/.env` and `react/.env`)
- No typos in variable names
- Restart the servers after changing `.env` files

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique values for `JWT_SECRET` in production
- Regularly rotate database credentials
- Enable MongoDB Atlas IP whitelisting in production
