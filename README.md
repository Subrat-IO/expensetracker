# Expense Tracker

This repo contains two deployable apps:

- `frontend/`: Next.js 16 client app
- `backend/`: Express API backed by MongoDB Atlas

## Local Development

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` to your backend URL.

## Production Deployment

### Backend

Deploy `backend/` as a Node service.

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Required environment variables:

```bash
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense_tracker?appName=expense-tracker
MONGODB_DB_NAME=expense_tracker
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=12h
```

Health check:

```bash
/api/health
```

### Frontend

Deploy `frontend/` as a standard Next.js app.

Build command:

```bash
npm run build
```

Start command:

```bash
npm start
```

Required environment variables:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

## Deployment Notes

- The backend seeds a default login on startup: `admin / 1234`.
- Change the default user password after first login if this will be publicly reachable.
- In production, `JWT_SECRET` is mandatory and the backend will refuse to boot without it.
- The frontend uses `NEXT_PUBLIC_API_BASE_URL` at build time, so set it before running the production build.
