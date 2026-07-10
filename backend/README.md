# HealthSync backend

This folder contains a small Express backend that implements the API the React app expects. It mirrors the endpoints previously in the Next.js `frontend` API routes.

Available endpoints
- POST /api/auth/login
- POST /api/auth/signup
- GET  /api/auth/me
- POST /api/auth/logout
- GET  /api/organizations

Environment variables
- `MONGODB_URI` — (optional) MongoDB connection string. If omitted the server uses an in-memory store (useful for quick testing).
- `MONGODB_DB` — (optional) database name (default: healthsync).
- `JWT_SECRET` — secret used to sign JWT tokens (default is `change-this-secret` — change for production).
- `PORT` — port for the server (default 3000).

Run locally

```powershell
cd backend
npm install
npm run dev
```

Deploy
- Render (recommended for a full Node process): create a new Web Service and point it to this folder's start command `npm start`.
- Vercel: Vercel primarily uses serverless functions; this Express app can be deployed as a Docker service or you can port the routes into Vercel Serverless Functions if you prefer.
